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
      <div v-for="w in workouts" :key="w.id"
        class="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between text-sm group">
        <div class="flex items-center gap-3">
          <Activity class="w-5 h-5 text-emerald-400" />
          <div>
            <div class="font-semibold text-slate-200">{{ w.workout_type }}</div>
            <div class="text-xs text-slate-400">{{ w.duration_minutes }} min</div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="font-bold text-emerald-400">{{ w.active_calories }} kcal</span>
          <div class="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
</template>
