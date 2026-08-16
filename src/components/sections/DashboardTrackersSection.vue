<script setup lang="ts">
import CalorieTrackerCard from '../cards/CalorieTrackerCard.vue'
import WaterTrackerCard from '../cards/WaterTrackerCard.vue'

defineProps<{
  consumed: number
  expenditure: number
  targetCal: number
  recommendedTarget: number
  bmr: number
  tdee: number
  formulaUsed?: 'Katch-McArdle' | 'Mifflin-St Jeor'
  hasBodyFat: boolean
  currentWaterMl: number
  targetWaterMl: number
  canUndoWater: boolean
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'update-calorie-target', target: number): void
  (e: 'navigate-meals'): void
  (e: 'add-water', ml: number): void
  (e: 'undo-water'): void
  (e: 'update-water-target', target: number): void
}>()
</script>

<template>
  <div class="space-y-4">
    <CalorieTrackerCard
      :consumed="consumed"
      :expenditure="expenditure"
      :target="targetCal"
      :recommended-target="recommendedTarget"
      :bmr="bmr"
      :tdee="tdee"
      :formula-used="formulaUsed"
      :has-body-fat="hasBodyFat"
      :is-loading="isLoading"
      @update-target="(target) => emit('update-calorie-target', target)"
      @navigate-meals="emit('navigate-meals')"
    />
    <WaterTrackerCard
      :current-ml="currentWaterMl"
      :target-ml="targetWaterMl"
      :can-undo="canUndoWater"
      :is-loading="isLoading"
      @add-water="(ml) => emit('add-water', ml)"
      @undo="emit('undo-water')"
      @update-target="(target) => emit('update-water-target', target)"
    />
  </div>
</template>
