<script setup lang="ts">
import { computed } from 'vue'
import StatCard from '../atoms/StatCard.vue'
import MacroStatCard from '../atoms/MacroStatCard.vue'
import { Flame, Scale } from '@lucide/vue'
import { useI18n } from '../../lib/i18n'

interface Props {
  totalActiveCalories: number
  latestWeight: number | string
  latestBmi?: number | string | null
  proteinG?: number
  carbsG?: number
  fatG?: number
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  isLoading: false
})
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
  <div class="grid grid-cols-1 min-[360px]:grid-cols-3 gap-2 min-[360px]:gap-2 sm:gap-4 w-full">
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
      :is-loading="isLoading"
    >
      <template #popover v-if="latestBmi">
        <div class="space-y-1.5">
          <div class="text-[9px] uppercase font-bold tracking-wider text-slate-400">Body Mass Index</div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-800/80 text-purple-300 whitespace-nowrap">
              BMI {{ latestBmi }}
            </span>
            <span
              v-if="bmiCategory"
              :class="[
                'text-[10px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap',
                bmiCategory.class
              ]"
            >
              {{ bmiCategory.label }}
            </span>
          </div>
        </div>
      </template>
    </StatCard>
    <MacroStatCard
      :protein-g="proteinG"
      :carbs-g="carbsG"
      :fat-g="fatG"
      :is-loading="isLoading"
    />
  </div>
</template>
