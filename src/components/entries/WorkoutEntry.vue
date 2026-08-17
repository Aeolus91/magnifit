<script setup lang="ts">
import { Activity, Pencil, Trash2, Heart, Zap } from '@lucide/vue'
import MetricBadge from '../atoms/MetricBadge.vue'
import type { Workout } from '../../types/fitness'

interface Props {
  workout: Workout
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'edit', workout: Workout): void
  (e: 'delete', id: string): void
}>()

const formatDuration = (totalSecs?: number): string => {
  if (!totalSecs || totalSecs <= 0) return '0 min'
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60

  const parts: string[] = []
  if (h > 0) parts.push(`${h} hr`)
  if (m > 0) parts.push(`${m} min`)
  if (s > 0 && h === 0) parts.push(`${s} sec`)

  return parts.join(' ') || '0 min'
}
</script>

<template>
  <div class="bg-slate-900 border border-slate-800 p-3 sm:p-3.5 rounded-xl text-sm group hover:border-slate-700 transition w-full">
    <!-- Grid: 2-col on <360px with badges wrapped underneath, 3-col on >=360px -->
    <div class="grid grid-cols-[1fr_auto] min-[360px]:grid-cols-[1fr_auto_auto] items-center gap-x-2 gap-y-2 sm:gap-2.5 w-full">
      <!-- Column 1: Workout Icon + Title & Subtitle (Merged) -->
      <div class="flex items-center gap-2.5 sm:gap-3 min-w-0 text-left order-1">
        <div class="p-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 shrink-0 flex items-center justify-center">
          <Activity class="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div class="min-w-0 flex-1 flex flex-col justify-center space-y-0.5">
          <div class="font-semibold text-slate-200 text-xs sm:text-sm truncate w-full">
            {{ workout.workout_type }}
          </div>
          <div class="text-[11px] sm:text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5 max-w-full">
            <span class="whitespace-nowrap">{{ formatDuration(workout.duration_sec) }}</span>
            <template v-if="workout.total_cal && workout.total_cal !== workout.active_cal">
              <span class="hidden sm:inline text-slate-600 select-none">•</span>
              <span class="whitespace-nowrap text-slate-500 truncate">
                Total {{ workout.total_cal }} kcal
              </span>
            </template>
          </div>
        </div>
      </div>

      <!-- Column 2 (Badges): Telemetry Badges (Centered inline under Col 1 & 3 on <360px, between 1 & 3 on >=360px) -->
      <div v-if="workout.avg_hr || workout.effort" class="col-span-2 min-[360px]:col-span-1 order-3 min-[360px]:order-2 min-w-0 flex flex-row min-[360px]:flex-col sm:flex-row items-center justify-center min-[360px]:items-end sm:items-center gap-1.5 min-[360px]:gap-1 shrink-0 pt-1 min-[360px]:pt-0 border-t border-slate-800/60 min-[360px]:border-t-0">
        <MetricBadge
          v-if="workout.avg_hr"
          :label="`${workout.avg_hr} bpm`"
          :icon="Heart"
          variant="rose"
          size="xs"
        />
        <MetricBadge
          v-if="workout.effort"
          :label="`RPE ${workout.effort}`"
          :icon="Zap"
          variant="amber"
          size="xs"
        />
      </div>

      <!-- Column 3: Active Calories & Action Buttons (Top-Right on <360px, Right on >=360px) -->
      <div class="min-w-0 flex flex-col sm:flex-row items-end sm:items-center justify-center sm:justify-end text-right gap-1 sm:gap-2 shrink-0 order-2 min-[360px]:order-3">
        <span class="font-bold text-emerald-400 text-xs sm:text-sm whitespace-nowrap">
          {{ workout.active_cal }} kcal
        </span>

        <!-- Inline Action Buttons -->
        <div class="flex items-center justify-end gap-1">
          <button
            type="button"
            @click="emit('edit', workout)"
            class="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition cursor-pointer"
            title="Edit Workout"
          >
            <Pencil class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            v-if="workout.id"
            type="button"
            @click="emit('delete', workout.id)"
            class="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
            title="Delete Workout"
          >
            <Trash2 class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
