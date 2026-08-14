<script setup lang="ts">
import type { Workout, Biometric, Meal, WaterLog } from '../../types/fitness'
import { useI18n } from '../../lib/i18n'
import WorkoutSection from './WorkoutSection.vue'
import BiometricsSection from './BiometricsSection.vue'
import MealSection from './MealSection.vue'
import WaterSection from './WaterSection.vue'

interface Props {
  modelValue: 'workouts' | 'biometrics' | 'meals' | 'water'
  targetDate?: string
  workouts: Workout[]
  biometrics: Biometric[]
  meals: Meal[]
  waterLogs: WaterLog[]
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', tab: 'workouts' | 'biometrics' | 'meals' | 'water'): void
  (e: 'add-workout', workout: Workout): void
  (e: 'edit-workout', workout: Workout): void
  (e: 'delete-workout', id: string): void
  (e: 'add-biometric', bio: Biometric): void
  (e: 'edit-biometric', bio: Biometric): void
  (e: 'delete-biometric', id: string): void
  (e: 'add-meal', meal: Meal): void
  (e: 'edit-meal', meal: Meal): void
  (e: 'log-meal'): void
  (e: 'delete-meal', id: string): void
  (e: 'update-micros', mealId: string, micros: Record<string, number>): void
  (e: 'add-water', amount: number): void
  (e: 'edit-water', log: WaterLog): void
  (e: 'delete-water', id: string): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="space-y-6">
    <!-- Category Tabs Navigation -->
    <div class="flex items-center justify-between border-b border-slate-800">
      <div class="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-1">
        <button
          v-for="tab in (['workouts', 'biometrics', 'meals', 'water'] as const)"
          :key="tab"
          type="button"
          @click="emit('update:modelValue', tab)"
          :class="[
            'px-2.5 min-[380px]:px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] min-[380px]:text-xs sm:text-sm font-semibold capitalize transition flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0',
            modelValue === tab
              ? 'bg-slate-800 text-slate-100 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          ]"
        >
          {{ t(`dash.nav.${tab}`) }}
        </button>
      </div>
    </div>

    <!-- Active Tab Component -->
    <WorkoutSection
      v-if="modelValue === 'workouts'"
      :workouts="workouts"
      :target-date="targetDate"
      @add-workout="(w) => emit('add-workout', w)"
      @edit-workout="(w) => emit('edit-workout', w)"
      @delete-workout="(id) => emit('delete-workout', id)"
    />

    <BiometricsSection
      v-if="modelValue === 'biometrics'"
      :biometrics="biometrics"
      @add-biometric="(b) => emit('add-biometric', b)"
      @edit-biometric="(b) => emit('edit-biometric', b)"
      @delete-biometric="(id) => emit('delete-biometric', id)"
    />

    <MealSection
      v-if="modelValue === 'meals'"
      :meals="meals"
      :target-date="targetDate"
      @log-meal="emit('log-meal')"
      @edit-meal="(m) => emit('edit-meal', m)"
      @delete-meal="(id) => emit('delete-meal', id)"
      @update-micros="(id, micros) => emit('update-micros', id, micros)"
    />

    <WaterSection
      v-if="modelValue === 'water'"
      :water-logs="waterLogs"
      @add-water="(amt) => emit('add-water', amt)"
      @edit-water="(log) => emit('edit-water', log)"
      @delete-water="(id) => emit('delete-water', id)"
    />
  </div>
</template>
