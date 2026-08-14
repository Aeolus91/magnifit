<script setup lang="ts">
import StatCard from './StatCard.vue'
import { Flame, Droplets, Scale } from '@lucide/vue'
import { useI18n } from '../lib/i18n'

interface Props {
  totalActiveCalories: number
  totalWaterMl: number
  latestWeight: number | string
}

defineProps<Props>()
const { t } = useI18n()
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
    />
  </div>
</template>
