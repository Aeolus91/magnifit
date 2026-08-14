<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from '../../lib/i18n'
import type { Biometric } from '../../types/fitness'
import Modal from './Modal.vue'
import DropdownPicker from '../atoms/DropdownPicker.vue'
import FormInput from '../atoms/FormInput.vue'
import ToggleSwitch from '../atoms/ToggleSwitch.vue'
import {
  BIOMETRIC_CATEGORY_LABELS,
  BIOMETRIC_TYPES,
  BiometricFlags,
  type BiometricTypeMeta
} from '../../lib/bitmask'
import { Scale, Check, Pencil } from '@lucide/vue'

const props = defineProps<{
  show: boolean
  initialBiometric?: Biometric | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', bio: Biometric): void
}>()

const { t } = useI18n()

// Category selection
const categoryOptions = Object.entries(BIOMETRIC_CATEGORY_LABELS).map(([catId, label]) => ({
  value: catId,
  label: label
}))

const selectedCatId = ref<string>('')
const selectedTypeId = ref<string>('')
const inputVal = ref<number | null>(null)
const inputValLeft = ref<number | null>(null)
const inputValRight = ref<number | null>(null)
const activeSide = ref<'left' | 'right'>('left')

// Types filtered by selected category
const filteredTypeOptions = computed(() => {
  if (!selectedCatId.value) return []
  const catNum = Number(selectedCatId.value)
  return Object.entries(BIOMETRIC_TYPES)
    .filter(([_, meta]) => meta.cat === catNum)
    .map(([id, meta]) => ({
      value: id,
      label: meta.name
    }))
})

// Flags
const isFasted = ref<boolean>(false)
const isPostWorkout = ref<boolean>(false)

const currentMeta = computed<BiometricTypeMeta | null>(() => {
  if (!selectedTypeId.value) return null
  return BIOMETRIC_TYPES[Number(selectedTypeId.value)] || null
})

const isEditing = computed(() => !!props.initialBiometric?.id)

watch(
  () => props.show,
  (open) => {
    if (open) {
      if (props.initialBiometric) {
        const b = props.initialBiometric
        selectedCatId.value = String(b.cat)
        selectedTypeId.value = String(b.type)
        const meta = BIOMETRIC_TYPES[b.type] || BIOMETRIC_TYPES[1]
        
        const f = b.flags || 0
        const hasLeft = (f & BiometricFlags.UNILATERAL_LEFT) === BiometricFlags.UNILATERAL_LEFT
        const hasRight = (f & BiometricFlags.UNILATERAL_RIGHT) === BiometricFlags.UNILATERAL_RIGHT

        if (meta.isUnilateral) {
          if (hasLeft && hasRight) {
            inputValLeft.value = Number((b.val / meta.scale).toFixed(1))
            inputValRight.value = b.val_sec !== null && b.val_sec !== undefined ? Number((b.val_sec / meta.scale).toFixed(1)) : null
            activeSide.value = 'left'
          } else if (hasRight) {
            inputValLeft.value = null
            inputValRight.value = Number((b.val / meta.scale).toFixed(1))
            activeSide.value = 'right'
          } else {
            inputValLeft.value = Number((b.val / meta.scale).toFixed(1))
            inputValRight.value = null
            activeSide.value = 'left'
          }
          inputVal.value = null
        } else {
          inputVal.value = Number((b.val / meta.scale).toFixed(1))
          inputValLeft.value = null
          inputValRight.value = null
        }
        
        isFasted.value = (f & BiometricFlags.FASTED) === BiometricFlags.FASTED
        isPostWorkout.value = (f & BiometricFlags.POST_WORKOUT_PUMP) === BiometricFlags.POST_WORKOUT_PUMP
      } else {
        selectedCatId.value = ''
        selectedTypeId.value = ''
        inputVal.value = null
        inputValLeft.value = null
        inputValRight.value = null
        activeSide.value = 'left'
        isFasted.value = false
        isPostWorkout.value = false
      }
    }
  }
)

// When category changes in create mode, reset type
watch(selectedCatId, (_, oldCat) => {
  if (!props.initialBiometric && oldCat !== undefined && oldCat !== '') {
    selectedTypeId.value = ''
    inputVal.value = null
    inputValLeft.value = null
    inputValRight.value = null
  }
})

// When metric type is selected, reset input values
watch(selectedTypeId, (newId) => {
  if (!props.initialBiometric && newId) {
    inputVal.value = null
    inputValLeft.value = null
    inputValRight.value = null
    activeSide.value = 'left'
  }
})

const handleSubmit = () => {
  const meta = currentMeta.value
  if (!meta) return

  let flags = 0
  if (isFasted.value) flags |= BiometricFlags.FASTED
  if (isPostWorkout.value) flags |= BiometricFlags.POST_WORKOUT_PUMP

  if (meta.isUnilateral) {
    const hasLeftVal = inputValLeft.value !== null
    const hasRightVal = inputValRight.value !== null
    if (!hasLeftVal && !hasRightVal) return

    // Strict column mapping: val = Left side, val_sec = Right side
    const primaryVal = hasLeftVal ? Math.round(inputValLeft.value! * meta.scale) : 0
    const secVal = hasRightVal ? Math.round(inputValRight.value! * meta.scale) : null

    if (hasLeftVal) flags |= BiometricFlags.UNILATERAL_LEFT
    if (hasRightVal) flags |= BiometricFlags.UNILATERAL_RIGHT

    emit('submit', {
      id: props.initialBiometric?.id,
      cat: meta.cat,
      type: Number(selectedTypeId.value),
      val: primaryVal,
      val_sec: secVal,
      unit: meta.unit,
      flags
    })
  } else {
    if (inputVal.value === null) return
    const scaledVal = Math.round(inputVal.value * meta.scale)

    emit('submit', {
      id: props.initialBiometric?.id,
      cat: meta.cat,
      type: Number(selectedTypeId.value),
      val: scaledVal,
      val_sec: null,
      unit: meta.unit,
      flags
    })
  }

  emit('close')
}
</script>

<template>
  <Modal
    v-if="show"
    :title="isEditing ? 'Edit Biometric Log' : 'Log Biometrics'"
    :icon="isEditing ? Pencil : Scale"
    icon-color="text-purple-400"
    max-width-class="max-w-md"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- 1. Category Dropdown Picker -->
      <div>
        <DropdownPicker
          v-model="selectedCatId"
          :options="categoryOptions"
          label="Category"
          :placeholder="t('dash.biometrics.category_placeholder')"
          :disabled="isEditing"
        />
      </div>

      <!-- 2. Type Dropdown Picker (Revealed only when Category is selected) -->
      <div v-if="selectedCatId">
        <DropdownPicker
          v-model="selectedTypeId"
          :options="filteredTypeOptions"
          label="Biometric Type"
          :placeholder="t('dash.biometrics.type_placeholder')"
          :disabled="isEditing"
        />
      </div>

      <!-- 3. Measurement Fields (Revealed once Type is selected) -->
      <template v-if="currentMeta">
        <!-- Dual Left & Right Input Fields for Unilateral Metrics -->
        <div v-if="currentMeta.isUnilateral" class="space-y-2 pt-1">
          <label class="block text-xs font-semibold text-slate-300">
            {{ currentMeta.name }} Measurements ({{ currentMeta.unitLabel }})
          </label>
          <div class="grid grid-cols-2 gap-3">
            <FormInput
              v-model="inputValLeft"
              type="number"
              label="Left Side (L)"
              :placeholder="`e.g. ${currentMeta.defaultVal}`"
              :step="currentMeta.step"
              :icon="Scale"
              icon-position="field-left"
              icon-color="text-purple-400"
            />
            <FormInput
              v-model="inputValRight"
              type="number"
              label="Right Side (R)"
              :placeholder="`e.g. ${currentMeta.defaultVal}`"
              :step="currentMeta.step"
              :icon="Scale"
              icon-position="field-left"
              icon-color="text-purple-400"
            />
          </div>
          <p class="text-[11px] text-slate-500">
            Log Left, Right, or both simultaneously in a single entry.
          </p>
        </div>

        <!-- Dynamic Metric Value Input (Non-Unilateral) -->
        <div v-else class="space-y-1.5">
          <FormInput
            v-model="inputVal"
            type="number"
            :label="`${currentMeta.name} (${currentMeta.unitLabel})`"
            :placeholder="`e.g. ${currentMeta.defaultVal}`"
            :step="currentMeta.step"
            :required="true"
            :icon="Scale"
            icon-position="field-left"
            icon-color="text-purple-400"
          />
        </div>

        <!-- Context Condition Flags -->
        <div class="grid grid-cols-2 gap-3 pt-1">
          <ToggleSwitch
            v-model="isFasted"
            label="Fasted"
            description="Taken before food"
          />
          <ToggleSwitch
            v-model="isPostWorkout"
            label="Post-Workout"
            description="Measured pumped"
          />
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-400 active:scale-[0.98] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-purple-950/40"
        >
          <Check class="w-4 h-4 stroke-[3]" />
          <span>{{ isEditing ? 'Update Biometrics' : 'Save Biometrics' }}</span>
        </button>
      </template>
    </form>
  </Modal>
</template>
