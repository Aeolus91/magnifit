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
  <div class="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-sm group hover:border-slate-700 transition">
    <!-- MOBILE VIEW (<640px): 2-Row Stacked Layout -->
    <div class="flex flex-col gap-2 sm:hidden">
      <!-- Top Row: Icon, Title & Duration (Left) + Active Calories & Actions (Right) -->
      <div class="flex items-center justify-between gap-3 w-full">
        <div class="flex items-center gap-2.5 min-w-0 flex-1 text-left">
          <div class="p-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 shrink-0">
            <Activity class="w-4 h-4" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-semibold text-slate-200 truncate">{{ workout.workout_type }}</div>
            <div class="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 max-w-full">
              <span class="whitespace-nowrap">{{ formatDuration(workout.duration_sec) }}</span>
              <span v-if="workout.total_cal && workout.total_cal !== workout.active_cal" class="whitespace-nowrap text-slate-500">
                • Total {{ workout.total_cal }} kcal
              </span>
            </div>
          </div>
        </div>

        <div class="flex flex-col min-[380px]:flex-row items-end min-[380px]:items-center gap-1.5 min-[380px]:gap-2.5 shrink-0">
          <span class="font-bold text-emerald-400 text-sm whitespace-nowrap">{{ workout.active_cal }} kcal</span>
          <div class="flex items-center gap-1 opacity-90 transition-opacity shrink-0">
            <button
              type="button"
              @click="emit('edit', workout)"
              class="p-1 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition cursor-pointer"
              title="Edit Workout"
            >
              <Pencil class="w-3.5 h-3.5" />
            </button>
            <button
              v-if="workout.id"
              type="button"
              @click="emit('delete', workout.id)"
              class="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
              title="Delete Workout"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom Row: Badges (Side by side) -->
      <div v-if="workout.avg_hr || workout.effort" class="flex items-center gap-1.5 pt-0.5 pl-8">
        <MetricBadge
          v-if="workout.avg_hr"
          :label="`${workout.avg_hr} bpm`"
          :icon="Heart"
          variant="rose"
        />
        <MetricBadge
          v-if="workout.effort"
          :label="`RPE ${workout.effort}`"
          :icon="Zap"
          variant="amber"
        />
      </div>
    </div>

    <!-- DESKTOP VIEW (>=640px): 3-Column Inline Layout -->
    <div class="hidden sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4 w-full">
      <!-- Col 1: Icon, Title & Duration -->
      <div class="flex items-center gap-3 min-w-0">
        <div class="p-2 rounded-lg bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 shrink-0">
          <Activity class="w-4 h-4" />
        </div>
        <div class="min-w-0">
          <div class="font-semibold text-slate-200 truncate">{{ workout.workout_type }}</div>
          <div class="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            <span class="whitespace-nowrap">{{ formatDuration(workout.duration_sec) }}</span>
            <span v-if="workout.total_cal && workout.total_cal !== workout.active_cal" class="text-slate-500 whitespace-nowrap">
              • Total {{ workout.total_cal }} kcal
            </span>
          </div>
        </div>
      </div>

      <!-- Col 2: Heart Rate & RPE Badges -->
      <div class="flex items-center gap-1.5 justify-center shrink-0">
        <MetricBadge
          v-if="workout.avg_hr"
          :label="`${workout.avg_hr} bpm`"
          :icon="Heart"
          variant="rose"
        />
        <MetricBadge
          v-if="workout.effort"
          :label="`RPE ${workout.effort}`"
          :icon="Zap"
          variant="amber"
        />
      </div>

      <!-- Col 3: Active Calories & Hover Actions -->
      <div class="flex items-center gap-4 justify-end shrink-0">
        <span class="font-bold text-emerald-400 whitespace-nowrap">{{ workout.active_cal }} kcal</span>
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            @click="emit('edit', workout)"
            class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition cursor-pointer"
            title="Edit Workout"
          >
            <Pencil class="w-4 h-4" />
          </button>
          <button
            v-if="workout.id"
            type="button"
            @click="emit('delete', workout.id)"
            class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
            title="Delete Workout"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
