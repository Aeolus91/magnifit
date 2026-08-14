import { ref, computed, type Ref } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { uuidv7 } from '../lib/uuidv7'
import { getLocalISODate } from '../lib/dateUtils'
import { offlineSync } from '../lib/offlineSync'
import type { Workout } from '../types/fitness'

export function useWorkouts(userId: Ref<string | undefined>, selectedDate: Ref<string>, loggedDates: Ref<string[]>) {
  const workouts = ref<Workout[]>([])
  const loading = ref(false)

  // Date-scoped workouts matching selectedDate
  const filteredWorkouts = computed(() =>
    workouts.value.filter(w => (w.log_date || getLocalISODate(w.ts)) === selectedDate.value)
  )

  // Computed total active calories burned on selectedDate
  const totalActiveCalories = computed(() =>
    filteredWorkouts.value.reduce((acc, w) => acc + (w.active_cal || 0), 0)
  )

  const fetchWorkouts = async (uid?: string) => {
    const targetUid = uid || userId.value
    if (!targetUid) return
    loading.value = true
    const { data } = await supabase
      .from<Workout>('workouts')
      .select()
      .eq('user_id', targetUid)
      .order('log_date', { ascending: false })
      .order('ts', { ascending: false })
      .get()

    if (data) {
      workouts.value = data
      data.forEach((w: Workout) => {
        const d = w.log_date || getLocalISODate(w.ts)
        if (d && !loggedDates.value.includes(d)) {
          loggedDates.value.push(d)
        }
      })
    }
    loading.value = false
  }

  const addWorkout = async (workoutData: Workout) => {
    if (!userId.value) return
    const id = workoutData.id || uuidv7()
    const payload: Workout = {
      ...workoutData,
      id,
      user_id: userId.value,
      log_date: selectedDate.value
    }
    workouts.value.unshift(payload)
    if (!loggedDates.value.includes(selectedDate.value)) {
      loggedDates.value.push(selectedDate.value)
    }

    try {
      const { error } = await supabase.from<Workout>('workouts').insert([payload])
      if (error) {
        offlineSync.enqueue('workouts', 'insert', payload)
      }
    } catch {
      offlineSync.enqueue('workouts', 'insert', payload)
    }
  }

  const editWorkout = async (workoutData: Workout) => {
    if (!userId.value || !workoutData.id) return
    const updatePayload = {
      workout_type: workoutData.workout_type,
      active_cal: workoutData.active_cal,
      total_cal: workoutData.total_cal || workoutData.active_cal,
      duration_sec: workoutData.duration_sec,
      avg_hr: workoutData.avg_hr || null,
      effort: workoutData.effort || null
    }

    const idx = workouts.value.findIndex(w => w.id === workoutData.id)
    if (idx !== -1) {
      workouts.value[idx] = { ...workouts.value[idx], ...workoutData }
    }

    try {
      const { error } = await supabase
        .from<Workout>('workouts')
        .update(updatePayload)
        .eq('id', workoutData.id)

      if (error) {
        offlineSync.enqueue('workouts', 'update', { id: workoutData.id, ...updatePayload })
      }
    } catch {
      offlineSync.enqueue('workouts', 'update', { id: workoutData.id, ...updatePayload })
    }
  }

  const deleteWorkout = async (id: string) => {
    if (!userId.value || !id) return
    const idx = workouts.value.findIndex(w => w.id === id)
    if (idx !== -1) {
      workouts.value.splice(idx, 1)
    }

    try {
      const { error } = await supabase.from('workouts').delete().eq('id', id)
      if (error) {
        offlineSync.enqueue('workouts', 'delete', { id })
      }
    } catch {
      offlineSync.enqueue('workouts', 'delete', { id })
    }
  }

  return {
    workouts,
    filteredWorkouts,
    totalActiveCalories,
    loading,
    fetchWorkouts,
    addWorkout,
    editWorkout,
    deleteWorkout
  }
}
