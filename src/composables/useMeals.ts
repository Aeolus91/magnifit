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

  // Recipes & Coupled Meal Templates State
  const recipes = ref<Recipe[]>([])

  const fetchRecipes = async (uid?: string) => {
    const targetUid = uid || userId.value
    if (!targetUid) return
    const { data } = await supabase
      .from<Recipe>('recipes')
      .select()
      .eq('user_id', targetUid)
      .order('name', { ascending: true })
      .get()

    if (data) {
      recipes.value = data
    }
  }

  const addRecipe = async (recipeData: Partial<Recipe>) => {
    if (!userId.value) return
    const id = recipeData.id || uuidv7()
    const payload: Recipe = {
      id,
      user_id: userId.value,
      name: recipeData.name || 'Custom Meal Combo',
      description: recipeData.description || null,
      cal: recipeData.cal || 0,
      prot_g: recipeData.prot_g || 0,
      carb_g: recipeData.carb_g || 0,
      fat_g: recipeData.fat_g || 0,
      servings: recipeData.servings || 1,
      flags: recipeData.flags || 0,
      is_public: recipeData.is_public || false
    }

    recipes.value.unshift(payload)

    try {
      const { error } = await supabase.from('recipes').insert(payload)
      if (error) {
        offlineSync.enqueue('recipes', 'insert', payload)
      }

      // Insert constituent items if present
      if (recipeData.items && recipeData.items.length > 0) {
        for (const item of recipeData.items) {
          const itemPayload: RecipeItem = {
            id: item.id || uuidv7(),
            recipe_id: id,
            item_name: item.item_name,
            amount: item.amount || 1,
            unit: item.unit || 'serving',
            cal: item.cal || 0,
            prot_g: item.prot_g || 0,
            carb_g: item.carb_g || 0,
            fat_g: item.fat_g || 0
          }
          await supabase.from('recipe_items').insert(itemPayload)
        }
      }

      // Persist opt-in recipe micronutrients if provided
      if (recipeData.micros && Object.keys(recipeData.micros).length > 0) {
        await supabase.from('recipe_micronutrients').insert({
          recipe_id: id,
          ...recipeData.micros
        })
      }
    } catch {
      offlineSync.enqueue('recipes', 'insert', payload)
    }
    return payload
  }

  const deleteRecipe = async (recipeId: string) => {
    if (!userId.value || !recipeId) return
    const idx = recipes.value.findIndex(r => r.id === recipeId)
    if (idx !== -1) {
      recipes.value.splice(idx, 1)
    }

    try {
      const { error } = await supabase.from('recipes').delete().eq('id', recipeId)
      if (error) {
        offlineSync.enqueue('recipes', 'delete', { id: recipeId })
      }
    } catch {
      offlineSync.enqueue('recipes', 'delete', { id: recipeId })
    }
  }

  const logRecipeAsMeal = async (recipe: Recipe, targetSlot: number, dateStr?: string, multiplier: number = 1) => {
    if (!userId.value) return
    const mealPayload: Meal = {
      user_id: userId.value,
      meal_name: multiplier !== 1 ? `${recipe.name} (${multiplier}x)` : recipe.name,
      cal: Math.round(recipe.cal * multiplier),
      prot_g: Math.round(recipe.prot_g * multiplier),
      carb_g: Math.round(recipe.carb_g * multiplier),
      fat_g: Math.round(recipe.fat_g * multiplier),
      flags: targetSlot,
      log_date: dateStr || selectedDate.value
    }
    await addMeal(mealPayload)
  }

  return {
    meals,
    filteredMeals,
    recipes,
    templates: recipes, // Backwards compatible alias
    totalCaloriesConsumed,
    totalProteinG,
    totalCarbsG,
    totalFatG,
    loading,
    fetchMeals,
    fetchRecipes,
    fetchTemplates: fetchRecipes,
    addMeal,
    editMeal,
    deleteMeal,
    addRecipe,
    addTemplate: addRecipe,
    deleteRecipe,
    deleteTemplate: deleteRecipe,
    logRecipeAsMeal,
    logTemplateAsMeal: logRecipeAsMeal
  }
}
