<script setup lang="ts">
import { computed } from 'vue'
import type { Workout, Biometric, Meal, WaterLog } from '../../types/fitness'
import { useI18n } from '../../lib/i18n'
import TabbedView, { type TabItem } from '../layout/TabbedView.vue'
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
  microsOpt?: number
}

const props = defineProps<Props>()

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
  (e: 'log-meal', slotBit?: number): void
  (e: 'delete-meal', id: string): void
  (e: 'update-micros', mealId: string, micros: Record<string, number>): void
  (e: 'add-water', amount: number): void
  (e: 'edit-water', log: WaterLog): void
  (e: 'delete-water', id: string): void
}>()

const { t } = useI18n()

const dashboardTabs = computed<TabItem[]>(() => [
  { id: 'workouts', label: t('dash.nav.workouts') },
  { id: 'biometrics', label: t('dash.nav.biometrics') },
  { id: 'meals', label: t('dash.nav.meals') },
  { id: 'water', label: t('dash.nav.water') }
])
</script>

<template>
  <TabbedView
    :model-value="modelValue"
    :tabs="dashboardTabs"
    pill-color-class="bg-emerald-500"
    @update:model-value="(val) => emit('update:modelValue', val as 'workouts' | 'biometrics' | 'meals' | 'water')"
  >
    <!-- Workouts Pane -->
    <template #workouts>
      <WorkoutSection
        :workouts="workouts"
        :target-date="targetDate"
        @add-workout="(w) => emit('add-workout', w)"
        @edit-workout="(w) => emit('edit-workout', w)"
        @delete-workout="(id) => emit('delete-workout', id)"
      />
    </template>

    <!-- Biometrics Pane -->
    <template #biometrics>
      <BiometricsSection
        :biometrics="biometrics"
        @add-biometric="(b) => emit('add-biometric', b)"
        @edit-biometric="(b) => emit('edit-biometric', b)"
        @delete-biometric="(id) => emit('delete-biometric', id)"
      />
    </template>

    <!-- Meals Pane -->
    <template #meals>
      <MealSection
        :meals="meals"
        :target-date="targetDate"
        :micros-opt="microsOpt"
        @log-meal="(slot) => emit('log-meal', slot)"
        @edit-meal="(m) => emit('edit-meal', m)"
        @delete-meal="(id) => emit('delete-meal', id)"
        @update-micros="(id, micros) => emit('update-micros', id, micros)"
      />
    </template>

    <!-- Water Pane -->
    <template #water>
      <WaterSection
        :water-logs="waterLogs"
        @add-water="(amt) => emit('add-water', amt)"
        @edit-water="(log) => emit('edit-water', log)"
        @delete-water="(id) => emit('delete-water', id)"
      />
    </template>
  </TabbedView>
</template>
