<script setup lang="ts">
import { computed } from 'vue'
import StatCard from '../atoms/StatCard.vue'
import { Flame, Scale } from '@lucide/vue'
import { useI18n } from '../../lib/i18n'

interface Props {
  totalActiveCalories: number
  latestWeight: number | string
  latestBmi?: number | string | null
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})
const { t } = useI18n()

const bmiCategory = computed(() => {
  if (!props.latestBmi) return null
  const bmi = Number(props.latestBmi)
  if (bmi < 18.5) return { label: 'Underweight' }
  if (bmi < 25.0) return { label: 'Normal' }
  if (bmi < 30.0) return { label: 'Overweight' }
  return { label: 'Obese' }
})

const bmiTooltip = computed(() => {
  if (!props.latestBmi) return undefined
  return `BMI: ${props.latestBmi} (${bmiCategory.value?.label || 'Normal'})`
})
</script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:gap-4 md:max-w-xl md:mx-auto w-full">
    <StatCard
      :label="t('dash.stats.active_burn')"
      :value="totalActiveCalories"
      unit="kcal"
      :icon="Flame"
      variant="emerald"
      :is-loading="isLoading"
    />
    <StatCard
      :label="t('dash.stats.latest_weight')"
      :value="latestWeight || '--'"
      unit="kg"
      :icon="Scale"
      variant="purple"
      :tooltip="bmiTooltip"
      :is-loading="isLoading"
    />
  </div>
</template>
