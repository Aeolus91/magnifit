<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Search, Camera, PenTool, Check } from '@lucide/vue'
import { MealFlags } from '../../../lib/bitmask'
import { useI18n } from '../../../lib/i18n'
import FoodSearchLookup from './FoodSearchLookup.vue'
import NutritionLabelOcrModal from './NutritionLabelOcrModal.vue'
import type { Meal } from '../../../types/fitness'

const props = withDefaults(defineProps<{
  initialSlot?: number
  logDate?: string
  isSubmitting?: boolean
}>(), {
  initialSlot: MealFlags.LUNCH
})

const emit = defineEmits<{
  (e: 'submit', meal: Meal): void
}>()

const { t } = useI18n()

const activeMode = ref<'manual' | 'search' | 'ocr'>('manual')
const mealName = ref('')
const calories = ref<number | null>(null)
const proteinG = ref<number | null>(null)
const carbsG = ref<number | null>(null)
const fatG = ref<number | null>(null)
const selectedMealSlot = ref<number>(props.initialSlot)

const mealSlotOptions = [
  { bit: MealFlags.BREAKFAST, label: t('meals.slot.breakfast') },
  { bit: MealFlags.LUNCH, label: t('meals.slot.lunch') },
  { bit: MealFlags.DINNER, label: t('meals.slot.dinner') },
  { bit: MealFlags.SNACK, label: t('meals.slot.snack') }
]

const handleFoodSelected = (food: { meal_name: string; cal: number; prot_g: number; carb_g: number; fat_g: number }) => {
  mealName.value = food.meal_name
  calories.value = food.cal
  proteinG.value = food.prot_g
  carbsG.value = food.carb_g
  fatG.value = food.fat_g
  activeMode.value = 'manual'
}

const handleOcrAutofill = (data: { meal_name?: string; cal?: number; prot_g?: number; carb_g?: number; fat_g?: number }) => {
  if (data.meal_name) mealName.value = data.meal_name
  if (data.cal !== undefined) calories.value = data.cal
  if (data.prot_g !== undefined) proteinG.value = data.prot_g
  if (data.carb_g !== undefined) carbsG.value = data.carb_g
  if (data.fat_g !== undefined) fatG.value = data.fat_g
  activeMode.value = 'manual'
}

const handleSubmit = () => {
  if (!mealName.value.trim() || calories.value === null) return
  emit('submit', {
    meal_name: mealName.value.trim(),
    cal: calories.value || 0,
    prot_g: proteinG.value || 0,
    carb_g: carbsG.value || 0,
    fat_g: fatG.value || 0,
    flags: selectedMealSlot.value,
    log_date: props.logDate
  })

  // Reset form
  mealName.value = ''
  calories.value = null
  proteinG.value = null
  carbsG.value = null
  fatG.value = null
}
</script>

<template>
  <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
    <!-- Mode Switcher Pill Bar (Manual, Search, OCR) with Sliding Indicator -->
    <div class="relative grid grid-cols-3 p-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold gap-1 overflow-hidden">
      <!-- Animated Sliding Background Pill -->
      <div
        class="absolute top-1.5 bottom-1.5 rounded-lg bg-amber-500 shadow-md transition-all duration-300 ease-out pointer-events-none"
        :style="{
          width: 'calc((100% - 12px) / 3)',
          left: '6px',
          transform: activeMode === 'manual' ? 'translateX(0%)' : activeMode === 'search' ? 'translateX(calc(100% + 4px))' : 'translateX(calc(200% + 8px))'
        }"
      ></div>

      <button
        type="button"
        @click="activeMode = 'manual'"
        :class="[
          'relative z-10 py-2 px-1.5 sm:px-2 min-h-[52px] sm:min-h-[44px] rounded-lg transition-colors duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center leading-tight',
          activeMode === 'manual' ? 'text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
        ]"
      >
        <PenTool class="w-3.5 h-3.5 shrink-0" />
        <span class="text-[11px] sm:text-xs text-center line-clamp-2">{{ t('meals.mode.manual') }}</span>
      </button>

      <button
        type="button"
        @click="activeMode = 'search'"
        :class="[
          'relative z-10 py-2 px-1.5 sm:px-2 min-h-[52px] sm:min-h-[44px] rounded-lg transition-colors duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center leading-tight',
          activeMode === 'search' ? 'text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
        ]"
      >
        <Search class="w-3.5 h-3.5 shrink-0" />
        <span class="text-[11px] sm:text-xs text-center line-clamp-2">{{ t('meals.mode.search') }}</span>
      </button>

      <button
        type="button"
        @click="activeMode = 'ocr'"
        :class="[
          'relative z-10 py-2 px-1.5 sm:px-2 min-h-[52px] sm:min-h-[44px] rounded-lg transition-colors duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center leading-tight',
          activeMode === 'ocr' ? 'text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
        ]"
      >
        <Camera class="w-3.5 h-3.5 shrink-0" />
        <span class="text-[11px] sm:text-xs text-center line-clamp-2">{{ t('meals.mode.ocr') }}</span>
      </button>
    </div>

    <!-- Search Food Lookup View -->
    <div v-if="activeMode === 'search'">
      <FoodSearchLookup @select-food="handleFoodSelected" />
    </div>

    <!-- OCR Scanner View -->
    <div v-else-if="activeMode === 'ocr'">
      <NutritionLabelOcrModal @autofill="handleOcrAutofill" />
    </div>

    <!-- Manual / Finalized Entry Form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-5">
      <!-- Meal Timing Slot Buttons -->
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-slate-300">{{ t('meals.slot.label') }}</label>
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

      <!-- Item Name & Total Energy -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="sm:col-span-2 space-y-1.5">
          <label class="text-xs font-semibold text-slate-300">{{ t('meals.item_name_label') }}</label>
          <input
            type="text"
            v-model="mealName"
            :placeholder="t('meals.item_name_placeholder')"
            required
            class="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-300">{{ t('meals.cal_label') }}</label>
          <input
            type="number"
            v-model.number="calories"
            placeholder="550"
            min="0"
            max="10000"
            required
            class="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none transition"
          />
        </div>
      </div>

      <!-- Macronutrients Row (P/C/F) -->
      <div class="grid grid-cols-3 gap-3">
        <div class="space-y-1">
          <label class="text-xs font-medium text-slate-400">{{ t('meals.prot_label') }}</label>
          <input
            type="number"
            v-model.number="proteinG"
            placeholder="40"
            min="0"
            class="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none transition"
          />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium text-slate-400">{{ t('meals.carb_label') }}</label>
          <input
            type="number"
            v-model.number="carbsG"
            placeholder="55"
            min="0"
            class="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none transition"
          />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium text-slate-400">{{ t('meals.fat_label') }}</label>
          <input
            type="number"
            v-model.number="fatG"
            placeholder="15"
            min="0"
            class="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none transition"
          />
        </div>
      </div>

      <button
        type="submit"
        :disabled="isSubmitting"
        class="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-950/40 disabled:opacity-50"
      >
        <Plus class="w-4 h-4 stroke-[3]" />
        <span>{{ t('meals.submit_save') }}</span>
      </button>
    </form>
  </div>
</template>
