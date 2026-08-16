<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from '@lucide/vue'
import type { Workout } from '../../types/fitness'
import WorkoutModal from '../modals/dash/WorkoutModal.vue'
import WorkoutEntry from '../entries/WorkoutEntry.vue'

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
    <!-- Log Workout Action Button -->
    <button
      type="button"
      @click="openCreateModal"
      class="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 transition active:scale-[0.99] group cursor-pointer"
    >
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 group-hover:text-emerald-300">
          <Plus class="w-4 h-4" />
        </div>
        <div class="text-left">
          <div class="text-xs font-bold text-slate-100 group-hover:text-emerald-400 transition">Log Workout</div>
          <div class="text-[11px] text-slate-400">Record training sessions, duration, and calories</div>
        </div>
      </div>
      <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition">
        <Plus class="w-3.5 h-3.5" />
        <span>Add Entry</span>
      </div>
    </button>

    <!-- Workout Creation & Edit Modal -->
    <WorkoutModal
      v-if="showModal"
      :show="showModal"
      :initial-workout="selectedWorkout"
      @close="showModal = false"
      @submit="handleWorkoutSubmit"
    />

    <!-- Workouts List -->
    <div class="space-y-2">
      <div v-if="workouts.length === 0" class="text-sm text-slate-500 py-4 text-center">
        No workouts recorded for this date.
      </div>
      <WorkoutEntry
        v-for="w in workouts"
        :key="w.id"
        :workout="w"
        @edit="openEditModal"
        @delete="emit('delete-workout', $event)"
      />
    </div>
  </div>
</template>
