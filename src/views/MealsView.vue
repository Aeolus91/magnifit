<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '../lib/router'
import { useAuthStore } from '../stores/authStore'
import { MealFlags } from '../lib/bitmask'
import { useMeals } from '../composables/useMeals'
import { useI18n } from '../lib/i18n'
import MacroNutrientBar from '../components/cards/MacroNutrientBar.vue'
import DatePickerPopover from '../components/atoms/DatePickerPopover.vue'
import NewMealEntryForm from '../components/meals/forms/NewMealEntryForm.vue'
import RecipeCatalogSection from '../components/meals/recipes/RecipeCatalogSection.vue'
import MealSlotCard from '../components/meals/MealSlotCard.vue'
import type { Meal, MealTemplate } from '../types/fitness'
import { ArrowLeft, Utensils, Plus, BookOpen, Clock, Sparkles } from '@lucide/vue'

const { navigate, routeState } = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

// Target date passed silently in router state or defaulted to today
const targetDate = ref<string>(routeState.value.logDate || new Date().toISOString().split('T')[0])
const loggedDates = ref<string[]>([])
const currentUserId = computed(() => authStore.user.value?.id)

const {
  filteredMeals: meals,
  templates,
  totalCaloriesConsumed: totalDailyCalories,
  totalProteinG: totalProtein,
  totalCarbsG: totalCarbs,
  totalFatG: totalFat,
  loading,
  fetchMeals,
  fetchTemplates,
  addMeal,
  editMeal,
  deleteMeal,
  addTemplate,
  deleteTemplate,
  logTemplateAsMeal
} = useMeals(currentUserId, targetDate, loggedDates)

const activeTab = ref<'new_entry' | 'recipes' | 'summary'>('new_entry')
const isSaving = ref<boolean>(false)
const selectedSlotForNewEntry = ref<number>(MealFlags.LUNCH)

// Meal groupings by slot bitmask
const breakfastMeals = computed(() => meals.value.filter(m => (m.flags || 0) === MealFlags.BREAKFAST))
const lunchMeals = computed(() => meals.value.filter(m => (m.flags || 0) === MealFlags.LUNCH || (!m.flags && (m.flags || 0) === 0)))
const dinnerMeals = computed(() => meals.value.filter(m => (m.flags || 0) === MealFlags.DINNER))
const snackMeals = computed(() => meals.value.filter(m => (m.flags || 0) === MealFlags.SNACK))

const handleAddMealFromForm = async (mealData: Meal) => {
  isSaving.value = true
  await addMeal({
    ...mealData,
    log_date: targetDate.value
  })
  activeTab.value = 'summary'
  isSaving.value = false
}

const handleQuickAddSlot = (slotBit: number) => {
  selectedSlotForNewEntry.value = slotBit
  activeTab.value = 'new_entry'
}

onMounted(() => {
  if (currentUserId.value) {
    fetchMeals(currentUserId.value)
    fetchTemplates(currentUserId.value)
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
            :title="t('meals.back_to_dashboard')"
          >
            <ArrowLeft class="w-4 h-4" />
          </button>
          <div>
            <div class="flex items-center gap-2">
              <Utensils class="w-4 h-4 text-amber-400" />
              <h1 class="text-xl font-bold text-slate-100">{{ t('meals.title') }}</h1>
            </div>
            <div class="text-xs text-slate-400 pt-0.5">
              <DatePickerPopover v-model="targetDate" :logged-dates="loggedDates" />
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="text-right">
            <div class="text-[11px] text-slate-400">Total Logged</div>
            <div class="text-base font-bold text-amber-400 font-mono">{{ totalDailyCalories }} kcal</div>
          </div>
        </div>
      </header>

      <!-- Macro Balance Summary Header Card -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <MacroNutrientBar
          :protein-g="totalProtein"
          :carbs-g="totalCarbs"
          :fat-g="totalFat"
        />
      </div>

      <!-- Navigation Tabs (New Entry, Recipes & Templates, Day Summary) -->
      <div class="flex border-b border-slate-800 space-x-2 sm:space-x-4">
        <button
          type="button"
          @click="activeTab = 'new_entry'"
          :class="[
            'pb-3 font-medium text-xs sm:text-sm transition cursor-pointer border-b-2 flex items-center gap-1.5',
            activeTab === 'new_entry'
              ? 'border-amber-500 text-amber-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          ]"
        >
          <Plus class="w-4 h-4" />
          <span>{{ t('meals.tab.new_entry') }}</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'recipes'"
          :class="[
            'pb-3 font-medium text-xs sm:text-sm transition cursor-pointer border-b-2 flex items-center gap-1.5',
            activeTab === 'recipes'
              ? 'border-amber-500 text-amber-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          ]"
        >
          <BookOpen class="w-4 h-4" />
          <span>{{ t('meals.tab.recipes') }} ({{ templates.length }})</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'summary'"
          :class="[
            'pb-3 font-medium text-xs sm:text-sm transition cursor-pointer border-b-2 flex items-center gap-1.5',
            activeTab === 'summary'
              ? 'border-amber-500 text-amber-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          ]"
        >
          <Clock class="w-4 h-4" />
          <span>{{ t('meals.tab.summary') }} ({{ meals.length }})</span>
        </button>
      </div>

      <!-- Tab 1: New Entry (Manual / Search / OCR Switcher) -->
      <div v-if="activeTab === 'new_entry'" class="space-y-6">
        <NewMealEntryForm
          :initial-slot="selectedSlotForNewEntry"
          :log-date="targetDate"
          :is-submitting="isSaving"
          @submit="handleAddMealFromForm"
        />
      </div>

      <!-- Tab 2: Recipes & Meal Templates Catalog -->
      <div v-else-if="activeTab === 'recipes'" class="space-y-6">
        <RecipeCatalogSection
          :templates="templates"
          @create-template="addTemplate"
          @delete-template="deleteTemplate"
          @log-template="(tmpl, slot, multiplier) => logTemplateAsMeal(tmpl, slot, targetDate, multiplier)"
        />
      </div>

      <!-- Tab 3: Grouped Slots Day Summary (Breakfast, Lunch, Dinner, Snack) -->
      <div v-else-if="activeTab === 'summary'" class="space-y-4">
        <MealSlotCard
          :slot-title="t('meals.slot.breakfast')"
          :slot-bit="MealFlags.BREAKFAST"
          :meals="breakfastMeals"
          @add-item="handleQuickAddSlot"
          @edit-meal="editMeal"
          @delete-meal="deleteMeal"
        />

        <MealSlotCard
          :slot-title="t('meals.slot.lunch')"
          :slot-bit="MealFlags.LUNCH"
          :meals="lunchMeals"
          @add-item="handleQuickAddSlot"
          @edit-meal="editMeal"
          @delete-meal="deleteMeal"
        />

        <MealSlotCard
          :slot-title="t('meals.slot.dinner')"
          :slot-bit="MealFlags.DINNER"
          :meals="dinnerMeals"
          @add-item="handleQuickAddSlot"
          @edit-meal="editMeal"
          @delete-meal="deleteMeal"
        />

        <MealSlotCard
          :slot-title="t('meals.slot.snack')"
          :slot-bit="MealFlags.SNACK"
          :meals="snackMeals"
          @add-item="handleQuickAddSlot"
          @edit-meal="editMeal"
          @delete-meal="deleteMeal"
        />
      </div>
    </div>
  </div>
</template>

