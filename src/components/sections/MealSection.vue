<script setup lang="ts">
import { computed } from 'vue'
import type { Meal } from '../../types/fitness'
import { MealFlags } from '../../lib/bitmask'
import { useI18n } from '../../lib/i18n'
import MealSlotCard from '../meals/MealSlotCard.vue'

interface Props {
  meals: Meal[]
  targetDate?: string
  isLoading?: boolean
  microsOpt?: number
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<{
  (e: 'log-meal', slotBit?: number): void
  (e: 'edit-meal', meal: Meal): void
  (e: 'delete-meal', id: string): void
  (e: 'update-micros', mealId: string, micros: Record<string, number>): void
}>()

const { t } = useI18n()

// Meal groupings by slot bitmask
const breakfastMeals = computed(() => props.meals.filter(m => ((m.flags || 0) & MealFlags.BREAKFAST) !== 0))
const lunchMeals = computed(() => props.meals.filter(m => ((m.flags || 0) & MealFlags.LUNCH) !== 0 || (!m.flags && (m.flags || 0) === 0)))
const dinnerMeals = computed(() => props.meals.filter(m => ((m.flags || 0) & MealFlags.DINNER) !== 0))
const snackMeals = computed(() => props.meals.filter(m => ((m.flags || 0) & MealFlags.SNACK) !== 0))
</script>

<template>
  <div class="space-y-4">
    <MealSlotCard
      :slot-title="t('meals.slot.breakfast')"
      :slot-bit="MealFlags.BREAKFAST"
      :meals="breakfastMeals"
      :is-loading="isLoading"
      :micros-opt="microsOpt"
      @add-item="emit('log-meal', $event)"
      @edit-meal="emit('edit-meal', $event)"
      @delete-meal="emit('delete-meal', $event)"
      @update-micros="(id, micros) => emit('update-micros', id, micros)"
    />

    <MealSlotCard
      :slot-title="t('meals.slot.lunch')"
      :slot-bit="MealFlags.LUNCH"
      :meals="lunchMeals"
      :is-loading="isLoading"
      :micros-opt="microsOpt"
      @add-item="emit('log-meal', $event)"
      @edit-meal="emit('edit-meal', $event)"
      @delete-meal="emit('delete-meal', $event)"
      @update-micros="(id, micros) => emit('update-micros', id, micros)"
    />

    <MealSlotCard
      :slot-title="t('meals.slot.dinner')"
      :slot-bit="MealFlags.DINNER"
      :meals="dinnerMeals"
      :is-loading="isLoading"
      :micros-opt="microsOpt"
      @add-item="emit('log-meal', $event)"
      @edit-meal="emit('edit-meal', $event)"
      @delete-meal="emit('delete-meal', $event)"
      @update-micros="(id, micros) => emit('update-micros', id, micros)"
    />

    <MealSlotCard
      :slot-title="t('meals.slot.snack')"
      :slot-bit="MealFlags.SNACK"
      :meals="snackMeals"
      :is-loading="isLoading"
      :micros-opt="microsOpt"
      @add-item="emit('log-meal', $event)"
      @edit-meal="emit('edit-meal', $event)"
      @delete-meal="emit('delete-meal', $event)"
      @update-micros="(id, micros) => emit('update-micros', id, micros)"
    />
  </div>
</template>
