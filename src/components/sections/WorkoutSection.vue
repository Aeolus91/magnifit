<script setup lang="ts">
import { ref } from 'vue'
import { Dumbbell } from '@lucide/vue'
import { useI18n } from '../../lib/i18n'
import type { Workout } from '../../types/fitness'
import WorkoutModal from '../modals/dash/WorkoutModal.vue'
import WorkoutEntry from '../entries/WorkoutEntry.vue'
import SectionHeader from '../atoms/SectionHeader.vue'
import EmptySectionPlaceholder from '../atoms/EmptySectionPlaceholder.vue'

interface Props {
  workouts: Workout[]
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'add-workout', workout: Workout): void
  (e: 'edit-workout', workout: Workout): void
  (e: 'delete-workout', id: string): void
}>()

const { t } = useI18n()

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
    <!-- Section Header with Log Workout Action -->
    <SectionHeader
      :title="t('dash.workout.title')"
      :description="t('dash.workout.desc')"
      action-variant="emerald"
      @action="openCreateModal"
    />

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
      <EmptySectionPlaceholder
        v-if="workouts.length === 0"
        :title="t('dash.empty.workouts_title')"
        :description="t('dash.empty.workouts_desc')"
        :icon="Dumbbell"
        icon-color-class="text-emerald-400"
        icon-bg-class="bg-emerald-950/60 border border-emerald-800/60"
      />
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
