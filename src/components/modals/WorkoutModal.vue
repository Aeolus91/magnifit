<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from '../../lib/i18n'
import type { Workout } from '../../types/fitness'
import Modal from './Modal.vue'
import DropdownPicker from '../atoms/DropdownPicker.vue'
import FormInput from '../atoms/FormInput.vue'
import ToggleSwitch from '../atoms/ToggleSwitch.vue'
import { WORKOUT_CATEGORIES, encodeWorkoutFlags } from '../../lib/bitmask'
import { Dumbbell, Check, Trees, Navigation, Flame, Timer, Pencil, Heart, Zap } from '@lucide/vue'

const props = defineProps<{
  show: boolean
  initialWorkout?: Workout | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', workout: Workout): void
}>()

const { t } = useI18n()

const workoutCategoryOptions = Object.entries(WORKOUT_CATEGORIES).map(([id, label]) => ({
  value: label,
  label: label,
  description: `Category #${id}`
}))

const workoutType = ref<string>('Traditional Strength')
const activeCalories = ref<number | null>(null)
const totalCalories = ref<number | null>(null)
const avgHeartRate = ref<number | null>(null)
const effortLevel = ref<number | null>(null)

// Duration HH:MM:SS State
const durationHours = ref<number | null>(null)
const durationMins = ref<number | null>(null)
const durationSecs = ref<number | null>(null)

const isOutdoor = ref<boolean>(false)
const isGpsTracked = ref<boolean>(false)

const isEditing = computed(() => !!props.initialWorkout?.id)

watch(
  () => props.show,
  (open) => {
    if (open) {
      if (props.initialWorkout) {
        workoutType.value = props.initialWorkout.workout_type || 'Traditional Strength'
        activeCalories.value = props.initialWorkout.active_cal ?? null
        totalCalories.value = props.initialWorkout.total_cal ?? null
        avgHeartRate.value = props.initialWorkout.avg_hr ?? null
        effortLevel.value = props.initialWorkout.effort ?? null
        
        const totalSec = props.initialWorkout.duration_sec || 0
        durationHours.value = Math.floor(totalSec / 3600) || null
        durationMins.value = Math.floor((totalSec % 3600) / 60) || null
        durationSecs.value = totalSec % 60 || null
      } else {
        workoutType.value = 'Traditional Strength'
        activeCalories.value = null
        totalCalories.value = null
        avgHeartRate.value = null
        effortLevel.value = null
        durationHours.value = null
        durationMins.value = null
        durationSecs.value = null
        isOutdoor.value = false
        isGpsTracked.value = false
      }
    }
  }
)

const handleSubmit = () => {
  if (activeCalories.value === null) return
  
  const totalDurationSec =
    (Number(durationHours.value || 0) * 3600) +
    (Number(durationMins.value || 0) * 60) +
    Number(durationSecs.value || 0)

  if (totalDurationSec <= 0) return

  const catEntry = Object.entries(WORKOUT_CATEGORIES).find(([_, name]) => name === workoutType.value)
  const catId = catEntry ? Number(catEntry[0]) : 0

  const flags = encodeWorkoutFlags(catId, {
    outdoor: isOutdoor.value,
    gps: isGpsTracked.value
  })

  emit('submit', {
    ...props.initialWorkout,
    workout_type: workoutType.value,
    active_cal: activeCalories.value,
    total_cal: totalCalories.value || activeCalories.value,
    duration_sec: totalDurationSec,
    avg_hr: avgHeartRate.value || null,
    effort: effortLevel.value || null,
    flags
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
          :label="t('dash.workout.type_label')"
          :searchable="true"
          :search-placeholder="t('dash.workout.type_search_placeholder')"
          :placeholder="t('dash.workout.type_placeholder')"
          :disabled="isEditing"
        />
      </div>

      <!-- Active Calories & Total Calories (Stacked on <360px, 2-col on >=360px) -->
      <div class="flex flex-col min-[360px]:grid min-[360px]:grid-cols-2 gap-3">
        <FormInput
          v-model="activeCalories"
          type="number"
          :label="`${t('dash.workout.active_cal_label')} (kcal)`"
          :placeholder="t('dash.workout.active_cal_placeholder')"
          :min="0"
          :max="5000"
          :required="true"
          :icon="Flame"
          icon-position="field-left"
          icon-color="text-emerald-400"
        />
        <FormInput
          v-model="totalCalories"
          type="number"
          label="Total Cal (Optional)"
          placeholder="e.g. 380"
          :min="0"
          :max="10000"
          :icon="Flame"
          icon-position="field-left"
          icon-color="text-amber-400"
        />
      </div>

      <!-- Duration (HH : MM : SS) Segmented Input -->
      <div class="space-y-1.5">
        <label class="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Timer class="w-3.5 h-3.5 text-emerald-400" />
          <span>{{ t('dash.workout.duration_label') }}</span>
        </label>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <FormInput
              v-model="durationHours"
              type="number"
              placeholder="00"
              :min="0"
              :max="24"
              input-class="text-center font-mono"
            />
            <span class="text-[10px] text-slate-500 block text-center mt-1">Hours</span>
          </div>
          <div>
            <FormInput
              v-model="durationMins"
              type="number"
              placeholder="00"
              :min="0"
              :max="59"
              input-class="text-center font-mono"
            />
            <span class="text-[10px] text-slate-500 block text-center mt-1">Minutes</span>
          </div>
          <div>
            <FormInput
              v-model="durationSecs"
              type="number"
              placeholder="00"
              :min="0"
              :max="59"
              input-class="text-center font-mono"
            />
            <span class="text-[10px] text-slate-500 block text-center mt-1">Seconds</span>
          </div>
        </div>
      </div>

      <!-- Avg Heart Rate & Perceived Effort (RPE) (Stacked on <360px, 2-col on >=360px) -->
      <div class="space-y-3 pt-1 border-t border-slate-800/80">
        <div class="flex flex-col min-[360px]:grid min-[360px]:grid-cols-2 gap-3">
          <FormInput
            v-model="avgHeartRate"
            type="number"
            label="Avg Heart Rate (bpm)"
            placeholder="e.g. 142"
            :min="30"
            :max="260"
            :icon="Heart"
            icon-position="field-left"
            icon-color="text-rose-400"
          />
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Zap class="w-3.5 h-3.5 text-amber-400" />
              <span>Effort (RPE 1-10)</span>
            </label>
            <div class="relative">
              <input
                type="number"
                v-model.number="effortLevel"
                min="1"
                max="10"
                placeholder="e.g. 7"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-base sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
              />
              <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 pointer-events-none">/ 10</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Attributes 2-Column ToggleSwitch Layout (Stacked on <360px, 2-col on >=360px) -->
      <div class="flex flex-col min-[360px]:grid min-[360px]:grid-cols-2 gap-3 pt-1">
        <ToggleSwitch
          v-model="isOutdoor"
          label="Outdoor"
          :icon="Trees"
          active-color="text-emerald-400"
        />
        <ToggleSwitch
          v-model="isGpsTracked"
          label="GPS Tracked"
          :icon="Navigation"
          active-color="text-emerald-400"
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
