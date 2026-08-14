<script setup lang="ts">
import type { Workout, Biometric, Meal, WaterLog } from '../types/fitness'
import { useI18n } from '../lib/i18n'
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
  (e: 'add-biometric', bio: { weight_kg: number; waist_cm?: number; chest_cm?: number; hips_cm?: number; biceps_cm?: number }): void
  (e: 'edit-biometric', bio: { id: string; weight_kg: number; waist_cm?: number; chest_cm?: number; hips_cm?: number; biceps_cm?: number }): void
  (e: 'delete-biometric', id: string): void
  (e: 'add-meal', meal: Meal): void
  (e: 'add-water', amount: number): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="space-y-6">
    <!-- Tab Navigation Bar -->
    <div class="flex border-b border-slate-800 space-x-4">
      <button
        v-for="tab in (['workouts', 'biometrics', 'meals', 'water'] as const)"
        :key="tab"
        type="button"
        @click="emit('update:modelValue', tab)"
        :class="[
          'pb-3 font-medium capitalize transition-colors border-b-2 text-sm cursor-pointer',
          modelValue === tab
            ? 'border-emerald-500 text-emerald-400 font-semibold'
            : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
      >
        {{ t(`dash.nav.${tab}`) }}
      </button>
    </div>

    <!-- Granular Capability Content Modules -->
    <WorkoutSection
      v-if="modelValue === 'workouts'"
      :workouts="workouts"
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
    />

    <WaterSection
      v-if="modelValue === 'water'"
      :water-logs="waterLogs"
      @add-water="(amt) => emit('add-water', amt)"
    />
  </div>
</template>
