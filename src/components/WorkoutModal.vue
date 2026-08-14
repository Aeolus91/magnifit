<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Workout } from '../types/fitness'
import Modal from './Modal.vue'
import DropdownPicker from './DropdownPicker.vue'
import FormInput from './FormInput.vue'
import ToggleSwitch from './ToggleSwitch.vue'
import { WORKOUT_CATEGORIES, AttributeFlags, encodeWorkoutFlags, decodeWorkoutFlags } from '../lib/bitmask'
import { Dumbbell, Plus, Check, Trees, Navigation, Flame, Timer, Pencil } from '@lucide/vue'

const props = defineProps<{
  show: boolean
  initialWorkout?: Workout | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', workout: Workout): void
}>()

const workoutCategoryOptions = Object.entries(WORKOUT_CATEGORIES).map(([id, label]) => ({
  value: label,
  label: label,
  description: `Category #${id}`
}))

const workoutType = ref<string>('Traditional Strength')
const activeCalories = ref<number>(300)
const totalCalories = ref<number>(380)
const durationMinutes = ref<number>(45)
const isOutdoor = ref<boolean>(false)
const isGpsTracked = ref<boolean>(false)

const isEditing = computed(() => !!props.initialWorkout?.id)

watch(
  () => props.show,
  (open) => {
    if (open) {
      if (props.initialWorkout) {
        workoutType.value = props.initialWorkout.workout_type || 'Traditional Strength'
        activeCalories.value = props.initialWorkout.active_calories || 0
        totalCalories.value = props.initialWorkout.total_calories || props.initialWorkout.active_calories || 0
        durationMinutes.value = props.initialWorkout.duration_minutes || 0
      } else {
        workoutType.value = 'Traditional Strength'
        activeCalories.value = 300
        totalCalories.value = 380
        durationMinutes.value = 45
        isOutdoor.value = false
        isGpsTracked.value = false
      }
    }
  }
)

const handleSubmit = () => {
  const catEntry = Object.entries(WORKOUT_CATEGORIES).find(([_, name]) => name === workoutType.value)
  const catId = catEntry ? Number(catEntry[0]) : 0

  const flags = encodeWorkoutFlags(catId, {
    outdoor: isOutdoor.value,
    gps: isGpsTracked.value
  })

  emit('submit', {
    ...props.initialWorkout,
    workout_type: workoutType.value,
    active_calories: activeCalories.value,
    total_calories: totalCalories.value || activeCalories.value,
    duration_minutes: durationMinutes.value
  })
  emit('close')
}
</script>

<template>
  <Modal
    v-if="show"
    :title="isEditing ? 'Edit Workout' : 'Log New Workout'"
    :icon="isEditing ? Pencil : Dumbbell"
    icon-color="text-emerald-400"
    max-width-class="max-w-md"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Workout Type Searchable Dropdown -->
      <div>
        <DropdownPicker
          v-model="workoutType"
          :options="workoutCategoryOptions"
          label="Workout Type"
          :searchable="true"
          search-placeholder="Search 65+ activities..."
          placeholder="Select Activity"
        />
      </div>

      <!-- Active Calories & Duration with field-left icons -->
      <div class="grid grid-cols-2 gap-3">
        <FormInput
          v-model="activeCalories"
          type="number"
          label="Active Calories (kcal)"
          placeholder="300"
          :min="0"
          :max="5000"
          :required="true"
          :icon="Flame"
          icon-position="field-left"
          icon-color="text-emerald-400"
        />
        <FormInput
          v-model="durationMinutes"
          type="number"
          label="Duration (min)"
          placeholder="45"
          :min="1"
          :max="1440"
          :required="true"
          :icon="Timer"
          icon-position="field-left"
          icon-color="text-emerald-400"
        />
      </div>

      <!-- Attributes 2-Column ToggleSwitch Layout (Left / Right) -->
      <div class="grid grid-cols-2 gap-3 pt-1">
        <ToggleSwitch
          v-model="isOutdoor"
          label="Outdoor"
          :icon="Trees"
          icon-color="text-emerald-400"
        />
        <ToggleSwitch
          v-model="isGpsTracked"
          label="GPS Tracked"
          :icon="Navigation"
          icon-color="text-cyan-400"
        />
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        class="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-950/40"
      >
        <Check class="w-4 h-4 stroke-[3]" />
        <span>Save Workout</span>
      </button>
    </form>
  </Modal>
</template>
