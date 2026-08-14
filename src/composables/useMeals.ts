import { ref, computed, type Ref } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { uuidv7 } from '../lib/uuidv7'
import { getLocalISODate } from '../lib/dateUtils'
import { offlineSync } from '../lib/offlineSync'
import type { Meal } from '../types/fitness'

export function useMeals(userId: Ref<string | undefined>, selectedDate: Ref<string>, loggedDates: Ref<string[]>) {
  const meals = ref<Meal[]>([])
  const loading = ref(false)

  // Date-scoped meals matching selectedDate
  const filteredMeals = computed(() =>
    meals.value.filter(m => (m.log_date || getLocalISODate(m.ts)) === selectedDate.value)
  )

  // Computed total nutritional macros on selectedDate
  const totalCaloriesConsumed = computed(() =>
    filteredMeals.value.reduce((acc, m) => acc + (m.cal || m.calories || 0), 0)
  )
  const totalProteinG = computed(() =>
    filteredMeals.value.reduce((acc, m) => acc + (m.prot_g || m.protein_g || 0), 0)
  )
  const totalCarbsG = computed(() =>
    filteredMeals.value.reduce((acc, m) => acc + (m.carb_g || m.carbs_g || 0), 0)
  )
  const totalFatG = computed(() =>
    filteredMeals.value.reduce((acc, m) => acc + (m.fat_g || 0), 0)
  )

  const fetchMeals = async (uid?: string) => {
    const targetUid = uid || userId.value
    if (!targetUid) return
    loading.value = true
    const { data } = await supabase
      .from<Meal>('meals')
      .select()
      .eq('user_id', targetUid)
      .order('log_date', { ascending: false })
      .order('id', { ascending: false })
      .get()

    if (data) {
      meals.value = data
      data.forEach(m => {
        const d = m.log_date || getLocalISODate(m.ts)
        if (d && !loggedDates.value.includes(d)) {
          loggedDates.value.push(d)
        }
      })
    }
    loading.value = false
  }

  const addMeal = async (mealData: Meal) => {
    if (!userId.value) return
    const id = mealData.id || uuidv7()
    const payload: Meal = {
      ...mealData,
      id,
      user_id: userId.value,
      log_date: selectedDate.value
    }
    meals.value.unshift(payload)
    if (!loggedDates.value.includes(selectedDate.value)) {
      loggedDates.value.push(selectedDate.value)
    }

    try {
      const { error } = await supabase.from<Meal>('meals').insert([payload])
      if (error) {
        offlineSync.enqueue('meals', 'insert', payload)
      }
    } catch {
      offlineSync.enqueue('meals', 'insert', payload)
    }
  }

  const editMeal = async (mealData: Meal) => {
    if (!userId.value || !mealData.id) return
    const updatePayload = {
      meal_name: mealData.meal_name,
      cal: mealData.cal || mealData.calories,
      prot_g: mealData.prot_g || mealData.protein_g,
      carb_g: mealData.carb_g || mealData.carbs_g,
      fat_g: mealData.fat_g,
      flags: mealData.flags
    }

    const idx = meals.value.findIndex(m => m.id === mealData.id)
    if (idx !== -1) {
      meals.value[idx] = { ...meals.value[idx], ...mealData }
    }

    try {
      const { error } = await supabase
        .from<Meal>('meals')
        .update(updatePayload)
        .eq('id', mealData.id)

      if (error) {
        offlineSync.enqueue('meals', 'update', { id: mealData.id, ...updatePayload })
      }
    } catch {
      offlineSync.enqueue('meals', 'update', { id: mealData.id, ...updatePayload })
    }
  }

  const deleteMeal = async (id: string) => {
    if (!userId.value || !id) return
    const idx = meals.value.findIndex(m => m.id === id)
    if (idx !== -1) {
      meals.value.splice(idx, 1)
    }

    try {
      const { error } = await supabase.from('meals').delete().eq('id', id)
      if (error) {
        offlineSync.enqueue('meals', 'delete', { id })
      }
    } catch {
      offlineSync.enqueue('meals', 'delete', { id })
    }
  }

  return {
    meals,
    filteredMeals,
    totalCaloriesConsumed,
    totalProteinG,
    totalCarbsG,
    totalFatG,
    loading,
    fetchMeals,
    addMeal,
    editMeal,
    deleteMeal
  }
}
