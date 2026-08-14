<script setup lang="ts">
import { computed } from 'vue'
import StatCard from '../atoms/StatCard.vue'
import { Flame, Droplets, Scale } from '@lucide/vue'
import { useI18n } from '../../lib/i18n'

interface Props {
  totalActiveCalories: number
  totalWaterMl: number
  latestWeight: number | string
  latestBmi?: number | string | null
}

const props = defineProps<Props>()
const { t } = useI18n()

const bmiCategory = computed(() => {
  if (!props.latestBmi) return null
  const bmi = Number(props.latestBmi)
  if (bmi < 18.5) return { label: 'Under', class: 'bg-amber-950/80 border-amber-800/80 text-amber-300' }
  if (bmi < 25.0) return { label: 'Normal', class: 'bg-emerald-950/80 border-emerald-800/80 text-emerald-300' }
  if (bmi < 30.0) return { label: 'Over', class: 'bg-amber-950/80 border-amber-800/80 text-amber-300' }
  return { label: 'Obese', class: 'bg-rose-950/80 border-rose-800/80 text-rose-300' }
})
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <StatCard
      :label="t('dash.stats.active_burn')"
      :value="totalActiveCalories"
      unit="kcal"
      :icon="Flame"
      variant="emerald"
    />
    <StatCard
      :label="t('dash.stats.water_intake')"
      :value="totalWaterMl"
      unit="ml"
      :icon="Droplets"
      variant="cyan"
    />
    <StatCard
      :label="t('dash.stats.latest_weight')"
      :value="latestWeight || '--'"
      unit="kg"
      :icon="Scale"
      variant="purple"
    >
      <template #badges v-if="latestBmi">
        <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-800/80 text-purple-300 whitespace-nowrap">
          BMI {{ latestBmi }}
        </span>
        <span
          v-if="bmiCategory"
          :class="[
            'text-xs font-bold px-2 py-0.5 rounded-md border whitespace-nowrap',
            bmiCategory.class
          ]"
        >
          {{ bmiCategory.label }}
        </span>
      </template>
    </StatCard>
  </div>
</template>
