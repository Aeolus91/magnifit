<script setup lang="ts">
import { ref } from 'vue'
import type { Workout } from '../types/fitness'
import WorkoutModal from './WorkoutModal.vue'
import { Activity, Plus, Dumbbell, Pencil, Trash2 } from '@lucide/vue'

interface Props {
  workouts: Workout[]
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'add-workout', workout: Workout): void
  (e: 'edit-workout', workout: Workout): void
  (e: 'delete-workout', id: string): void
}>()

const showModal = ref(false)
const selectedWorkout = ref<Workout | null>(null)

const openCreateModal = () => {
  selectedWorkout.value = null
  showModal.value = true
}

const openEditModal = (workout: Workout) => {
  selectedWorkout.value = { ...workout }
  showModal.value = true
}

const handleWorkoutSubmit = (workout: Workout) => {
  if (selectedWorkout.value?.id) {
    emit('edit-workout', workout)
  } else {
    emit('add-workout', workout)
  }
}
const formatDuration = (sec: number = 0) => {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60

  const parts = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0 || h > 0) parts.push(`${m}m`)
  if (s > 0 || (h === 0 && m === 0)) parts.push(`${s}s`)

  return parts.join(' ')
}
</script>

<template>
  <div class="space-y-4">
    <!-- Action Trigger Row -->
    <button
      type="button"
      @click="openCreateModal"
      class="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 transition active:scale-[0.99] group cursor-pointer"
    >
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 group-hover:text-emerald-300">
          <Dumbbell class="w-5 h-5" />
        </div>
        <div class="text-left">
          <div class="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition">Log New Workout</div>
          <div class="text-xs text-slate-400">Choose from 65+ Apple Watch & custom activities</div>
        </div>
      </div>
      <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition">
        <Plus class="w-4 h-4" />
        <span>Add Entry</span>
      </div>
    </button>

    <!-- Dedicated Fullscreen Workout Modal -->
    <WorkoutModal
      :show="showModal"
      :initial-workout="selectedWorkout"
      @close="showModal = false"
      @submit="handleWorkoutSubmit"
    />

    <div class="space-y-2">
      <div v-if="workouts.length === 0" class="text-sm text-slate-500 py-4 text-center">
        No workouts recorded for this date.
      </div>
      <div
        v-for="w in workouts"
        :key="w.id"
        class="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-sm group hover:border-slate-700 transition"
      >
        <!-- MOBILE VIEW (<640px): 2-Row Stacked Layout -->
        <div class="flex flex-col gap-2 sm:hidden">
          <!-- Top Row: Icon, Title & Duration (Left) + Active Calories & Actions (Right) -->
          <div class="flex items-center justify-between gap-3 w-full">
            <div class="flex items-center gap-2.5 min-w-0 flex-1 text-left">
              <div class="p-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 shrink-0">
                <Activity class="w-4 h-4" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="font-semibold text-slate-200 truncate">{{ w.workout_type }}</div>
                <div class="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 max-w-full">
                  <span class="whitespace-nowrap">{{ formatDuration(w.duration_sec) }}</span>
                  <span v-if="w.total_cal && w.total_cal !== w.active_cal" class="whitespace-nowrap text-slate-500">
                    • Total {{ w.total_cal }} kcal
                  </span>
                </div>
              </div>
            </div>

            <div class="flex flex-col min-[380px]:flex-row items-end min-[380px]:items-center gap-1.5 min-[380px]:gap-2.5 shrink-0">
              <span class="font-bold text-emerald-400 text-sm whitespace-nowrap">{{ w.active_cal }} kcal</span>
              <div class="flex items-center gap-1 opacity-90 transition-opacity shrink-0">
                <button
                  type="button"
                  @click="openEditModal(w)"
                  class="p-1 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition cursor-pointer"
                  title="Edit Workout"
                >
                  <Pencil class="w-3.5 h-3.5" />
                </button>
                <button
                  v-if="w.id"
                  type="button"
                  @click="emit('delete-workout', w.id)"
                  class="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                  title="Delete Workout"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Bottom Row: Badges (No wrapping, side by side) -->
          <div v-if="w.avg_hr || w.effort" class="flex items-center gap-1.5 pt-0.5 pl-8">
            <span
              v-if="w.avg_hr"
              class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950/80 border border-rose-800/80 text-rose-300 flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              {{ w.avg_hr }} bpm
            </span>
            <span
              v-if="w.effort"
              class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-950/80 border border-amber-800/80 text-amber-300 shrink-0 whitespace-nowrap"
            >
              RPE {{ w.effort }}/10
            </span>
          </div>
        </div>

        <!-- DESKTOP VIEW (>=640px): 3-Column Sequential Inline Layout -->
        <div class="hidden sm:flex sm:items-center sm:justify-between sm:gap-4 w-full">
          <!-- Col 1: Icon, Title & Duration -->
          <div class="flex items-center gap-2.5 min-w-0 flex-1 text-left">
            <div class="p-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 shrink-0">
              <Activity class="w-4 h-4" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-semibold text-slate-200 truncate">{{ w.workout_type }}</div>
              <div class="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 max-w-full">
                <span class="whitespace-nowrap">{{ formatDuration(w.duration_sec) }}</span>
                <span v-if="w.total_cal && w.total_cal !== w.active_cal" class="whitespace-nowrap text-slate-500">
                  • Total {{ w.total_cal }} kcal
                </span>
              </div>
            </div>
          </div>

          <!-- Col 2: Badges (Middle Column) -->
          <div
            v-if="w.avg_hr || w.effort"
            class="flex items-center gap-1.5 shrink-0"
          >
            <span
              v-if="w.avg_hr"
              class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950/80 border border-rose-800/80 text-rose-300 flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              {{ w.avg_hr }} bpm
            </span>
            <span
              v-if="w.effort"
              class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-950/80 border border-amber-800/80 text-amber-300 shrink-0 whitespace-nowrap"
            >
              RPE {{ w.effort }}/10
            </span>
          </div>

          <!-- Col 3: Active Calories & Hover Actions (Right Column) -->
          <div class="flex items-center gap-2.5 shrink-0">
            <span class="font-bold text-emerald-400 text-sm whitespace-nowrap">{{ w.active_cal }} kcal</span>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                type="button"
                @click="openEditModal(w)"
                class="p-1 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition cursor-pointer"
                title="Edit Workout"
              >
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button
                v-if="w.id"
                type="button"
                @click="emit('delete-workout', w.id)"
                class="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                title="Delete Workout"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
