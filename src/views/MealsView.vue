<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '../lib/router'
import { useAuthStore } from '../stores/authStore'
import { MealFlags } from '../lib/bitmask'
import { useMeals } from '../composables/useMeals'
import MacroNutrientBar from '../components/cards/MacroNutrientBar.vue'
import MealEntry from '../components/entries/MealEntry.vue'
import type { Meal } from '../types/fitness'
import { ArrowLeft, Utensils, Plus, Sparkles, BookOpen, Clock, Check, Flame, ChevronRight } from '@lucide/vue'

const { navigate, routeState } = useRouter()
const authStore = useAuthStore()

// Target date passed silently in router state or defaulted to today
const targetDate = computed<string>(() => {
  return routeState.value.logDate || new Date().toISOString().split('T')[0]
})

const loggedDates = ref<string[]>([])
const currentUserId = computed(() => authStore.user.value?.id)

const {
  filteredMeals: meals,
  totalCaloriesConsumed: totalDailyCalories,
  totalProteinG: totalProtein,
  totalCarbsG: totalCarbs,
  totalFatG: totalFat,
  loading,
  fetchMeals,
  addMeal
} = useMeals(currentUserId, targetDate, loggedDates)

const activeTab = ref<'log' | 'recipes' | 'summary'>('log')
const isSaving = ref<boolean>(false)

// New Meal Form Model
const mealName = ref('')
const calories = ref<number | null>(null)
const proteinG = ref<number | null>(null)
const carbsG = ref<number | null>(null)
const fatG = ref<number | null>(null)
const fiberG = ref<number | null>(null)
const selectedMealSlot = ref<number>(MealFlags.LUNCH)

const mealSlotOptions = [
  { bit: MealFlags.BREAKFAST, label: 'Breakfast' },
  { bit: MealFlags.LUNCH, label: 'Lunch' },
  { bit: MealFlags.DINNER, label: 'Dinner' },
  { bit: MealFlags.SNACK, label: 'Snack' }
]

const handleLogMeal = async () => {
  if (!authStore.user.value?.id || !mealName.value.trim() || calories.value === null) return
  isSaving.value = true
  await addMeal({
    meal_name: mealName.value.trim(),
    cal: calories.value || 0,
    prot_g: proteinG.value || 0,
    carb_g: carbsG.value || 0,
    fat_g: fatG.value || 0,
    flags: selectedMealSlot.value,
    log_date: targetDate.value
  })

  mealName.value = ''
  calories.value = null
  proteinG.value = null
  carbsG.value = null
  fatG.value = null
  fiberG.value = null
  activeTab.value = 'summary'
  isSaving.value = false
}

onMounted(() => {
  if (currentUserId.value) {
    fetchMeals(currentUserId.value)
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
    <div class="max-w-3xl mx-auto space-y-6">
      <!-- Top Navigation & Header -->
      <header class="flex items-center justify-between border-b border-slate-800 pb-4">
        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="navigate('/dash')"
            class="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft class="w-4 h-4" />
          </button>
          <div>
            <div class="flex items-center gap-2">
              <Utensils class="w-4 h-4 text-amber-400" />
              <h1 class="text-xl font-bold text-slate-100">Meals & Nutrition</h1>
            </div>
            <div class="text-xs text-slate-400">Date: {{ targetDate }}</div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="text-right hidden sm:block">
            <div class="text-xs text-slate-400">Logged Today</div>
            <div class="text-sm font-bold text-amber-400">{{ totalDailyCalories }} kcal</div>
          </div>
        </div>
      </header>

      <!-- Sub Navigation Tabs -->
      <div class="flex border-b border-slate-800 space-x-4">
        <button
          type="button"
          @click="activeTab = 'log'"
          :class="[
            'pb-3 font-medium text-sm transition cursor-pointer border-b-2',
            activeTab === 'log'
              ? 'border-amber-500 text-amber-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          ]"
        >
          Quick Log
        </button>
        <button
          type="button"
          @click="activeTab = 'recipes'"
          :class="[
            'pb-3 font-medium text-sm transition cursor-pointer border-b-2',
            activeTab === 'recipes'
              ? 'border-amber-500 text-amber-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          ]"
        >
          Recipe Templates
        </button>
        <button
          type="button"
          @click="activeTab = 'summary'"
          :class="[
            'pb-3 font-medium text-sm transition cursor-pointer border-b-2',
            activeTab === 'summary'
              ? 'border-amber-500 text-amber-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          ]"
        >
          Day Summary ({{ meals.length }})
        </button>
      </div>

      <!-- Tab 1: Direct Meal Log Form -->
      <div v-if="activeTab === 'log'" class="space-y-6">
        <form @submit.prevent="handleLogMeal" class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
          <!-- Meal Timing Slots -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-300">Meal Slot</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                v-for="slot in mealSlotOptions"
                :key="slot.bit"
                type="button"
                @click="selectedMealSlot = slot.bit"
                :class="[
                  'py-2 px-3 rounded-xl border text-xs font-semibold transition active:scale-95 cursor-pointer text-center',
                  selectedMealSlot === slot.bit
                    ? 'bg-amber-950/70 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                ]"
              >
                {{ slot.label }}
              </button>
            </div>
          </div>

          <!-- Name & Calories -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="sm:col-span-2 space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Meal / Item Name</label>
              <input
                type="text"
                v-model="mealName"
                placeholder="e.g. Grilled Chicken Salad & Quinoa"
                required
                class="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition"
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Total Calories (kcal)</label>
              <input
                type="number"
                v-model.number="calories"
                placeholder="550"
                min="0"
                max="5000"
                required
                class="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition"
              />
            </div>
          </div>

          <!-- Macros (P/C/F) -->
          <div class="grid grid-cols-3 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-medium text-slate-400">Protein (g)</label>
              <input
                type="number"
                v-model.number="proteinG"
                placeholder="40"
                min="0"
                class="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-slate-400">Carbs (g)</label>
              <input
                type="number"
                v-model.number="carbsG"
                placeholder="55"
                min="0"
                class="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-slate-400">Fat (g)</label>
              <input
                type="number"
                v-model.number="fatG"
                placeholder="15"
                min="0"
                class="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="isSaving"
            class="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-950/40 disabled:opacity-50"
          >
            <Plus class="w-4 h-4 stroke-[3]" />
            <span>Save Meal Entry</span>
          </button>
        </form>
      </div>

      <!-- Tab 2: Recipe Templates -->
      <div v-if="activeTab === 'recipes'" class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
        <BookOpen class="w-8 h-8 text-amber-400 mx-auto" />
        <div class="text-sm font-semibold text-slate-200">Recipe Catalog & Share Hub</div>
        <p class="text-xs text-slate-400 max-w-sm mx-auto">
          Save high-frequency meal templates and import community recipes directly into your daily target logs.
        </p>
      </div>

      <!-- Tab 3: Summary of the Selected Day -->
      <div v-if="activeTab === 'summary'" class="space-y-4">
        <!-- Daily Macro Distribution Card -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <MacroNutrientBar
            :protein-g="totalProtein"
            :carbs-g="totalCarbs"
            :fat-g="totalFat"
          />
        </div>

        <!-- Meals List -->
        <div class="space-y-2">
          <div v-if="meals.length === 0" class="text-sm text-slate-500 py-6 text-center bg-slate-900 border border-slate-800 rounded-xl">
            No meals recorded for {{ targetDate }}.
          </div>
          <MealEntry
            v-for="m in meals"
            :key="m.id"
            :meal="m"
          />
        </div>
      </div>
    </div>
  </div>
</template>
