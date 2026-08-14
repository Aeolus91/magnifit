import { ref, computed, type Ref } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { uuidv7 } from '../lib/uuidv7'
import { getLocalISODate } from '../lib/dateUtils'
import type { WaterLog, Profile } from '../types/fitness'

export function useWater(
  userId: Ref<string | undefined>,
  userProfile: Ref<Profile | null>,
  selectedDate: Ref<string>,
  loggedDates: Ref<string[]>
) {
  const waterLogs = ref<WaterLog[]>([])
  const loading = ref(false)

  // Date-scoped water logs matching selectedDate
  const filteredWaterLogs = computed(() =>
    waterLogs.value.filter(w => (w.log_date || getLocalISODate(w.ts)) === selectedDate.value)
  )

  // Computed total water intake (ml) on selectedDate
  const totalWaterMl = computed(() =>
    filteredWaterLogs.value.reduce((acc, w) => acc + (w.amount_ml || 0), 0)
  )

  const fetchWater = async (uid?: string) => {
    const targetUid = uid || userId.value
    if (!targetUid) return
    loading.value = true
    const { data } = await supabase
      .from<WaterLog>('water_logs')
      .select()
      .eq('user_id', targetUid)
      .order('log_date', { ascending: false })
      .order('ts', { ascending: false })
      .get()

    if (data) {
      waterLogs.value = data
      data.forEach(w => {
        const d = w.log_date || getLocalISODate(w.ts)
        if (d && !loggedDates.value.includes(d)) {
          loggedDates.value.push(d)
        }
      })
    }
    loading.value = false
  }

  const addWater = async (amount: number) => {
    if (!userId.value || amount <= 0) return
    const id = uuidv7()
    const payload: WaterLog = {
      id,
      user_id: userId.value,
      amount_ml: amount,
      log_date: selectedDate.value
    }
    const { data, error } = await supabase.from<WaterLog>('water_logs').insert([payload])
    if (!error && data) {
      waterLogs.value.unshift(data[0] || payload)
      if (!loggedDates.value.includes(selectedDate.value)) {
        loggedDates.value.push(selectedDate.value)
      }
    }
  }

  const editWater = async (updatedLog: WaterLog) => {
    if (!userId.value || !updatedLog.id) return
    const { error } = await supabase
      .from('water_logs')
      .update({ amount_ml: updatedLog.amount_ml })
      .eq('id', updatedLog.id)

    if (!error) {
      const idx = waterLogs.value.findIndex(w => w.id === updatedLog.id)
      if (idx !== -1) {
        waterLogs.value[idx].amount_ml = updatedLog.amount_ml
      }
    }
  }

  const deleteWater = async (id: string) => {
    if (!userId.value || !id) return
    const { error } = await supabase.from('water_logs').delete().eq('id', id)
    if (!error) {
      const idx = waterLogs.value.findIndex(w => w.id === id)
      if (idx !== -1) {
        waterLogs.value.splice(idx, 1)
      }
    }
  }

  const undoLastWater = async () => {
    if (filteredWaterLogs.value.length === 0) return
    const lastLog = filteredWaterLogs.value[0]
    if (!lastLog?.id) return
    await deleteWater(lastLog.id)
  }

  const updateWaterTarget = async (targetMl: number) => {
    if (!userId.value || !userProfile.value) return
    const { error } = await supabase
      .from('profiles')
      .update({ target_water_ml: targetMl })
      .eq('id', userId.value)

    if (!error) {
      userProfile.value.target_water_ml = targetMl
    }
  }

  return {
    waterLogs,
    filteredWaterLogs,
    totalWaterMl,
    loading,
    fetchWater,
    addWater,
    editWater,
    deleteWater,
    undoLastWater,
    updateWaterTarget
  }
}
