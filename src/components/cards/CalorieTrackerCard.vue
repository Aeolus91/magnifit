<script setup lang="ts">
import { computed } from 'vue'
import { Utensils, Flame, Target, TrendingUp, TrendingDown } from '@lucide/vue'
import FluidGaugeCard from './FluidGaugeCard.vue'

interface Props {
  consumed: number
  expenditure: number
  target?: number
}

const props = withDefaults(defineProps<Props>(), {
  target: 2000
})

const safeTarget = computed(() => (props.target > 0 ? props.target : 2000))
const netCalories = computed(() => props.consumed - props.expenditure)
const isDeficit = computed(() => netCalories.value <= 0)
const remainingToTarget = computed(() => safeTarget.value - props.consumed)

const consumedSubtitle = computed(() => {
  const diff = remainingToTarget.value
  return diff >= 0 ? `${diff.toLocaleString()} kcal left` : `${Math.abs(diff).toLocaleString()} kcal over`
})
</script>

<template>
  <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
    <!-- Header: Target Goal & Net Balance Badge -->
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div class="flex items-center gap-2">
        <div class="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-300">
          <Target class="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">Daily Calorie Target</div>
          <div class="text-lg font-bold text-slate-100">
            {{ safeTarget.toLocaleString() }}
            <span class="text-xs text-slate-400 font-normal">kcal</span>
          </div>
        </div>
      </div>

      <!-- Net Delta Badge -->
      <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide"
        :class="[
          isDeficit
            ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400'
            : 'bg-amber-950/60 border-amber-800/60 text-amber-400'
        ]">
        <component :is="isDeficit ? TrendingDown : TrendingUp" class="w-3.5 h-3.5" />
        <span>
          {{ Math.abs(netCalories).toLocaleString() }} kcal {{ isDeficit ? 'Deficit' : 'Surplus' }}
        </span>
      </div>
    </div>

    <!-- Composed Dual Fluid Gauges -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FluidGaugeCard
        title="Consumed"
        :current="consumed"
        :target="safeTarget"
        unit="kcal"
        :icon="Utensils"
        variant="amber"
        :subtitle="consumedSubtitle"
      />

      <FluidGaugeCard
        title="Expenditure"
        :current="expenditure"
        :target="safeTarget"
        unit="kcal"
        :icon="Flame"
        variant="emerald"
        subtitle="Formula + Active"
      />
    </div>
  </div>
</template>
