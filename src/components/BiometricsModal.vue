<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Biometric } from '../types/fitness'
import Modal from './Modal.vue'
import { Scale, Check, Pencil } from '@lucide/vue'

const props = defineProps<{
  show: boolean
  initialBiometric?: Biometric | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', bio: { id?: string; weight_kg: number; waist_cm?: number; chest_cm?: number; hips_cm?: number; biceps_cm?: number }): void
}>()

const weightKg = ref<number>(72.5)
const waistCm = ref<number | null>(null)
const chestCm = ref<number | null>(null)
const hipsCm = ref<number | null>(null)
const bicepsCm = ref<number | null>(null)

const isEditing = computed(() => !!props.initialBiometric?.id)

watch(
  () => props.show,
  (open) => {
    if (open) {
      if (props.initialBiometric) {
        const b = props.initialBiometric
        weightKg.value = b.weight_dg ? Number((b.weight_dg / 10).toFixed(1)) : (b.weight_kg || 72.5)
        waistCm.value = b.waist_mm ? Number((b.waist_mm / 10).toFixed(1)) : (b.waist_cm || null)
        chestCm.value = b.chest_mm ? Number((b.chest_mm / 10).toFixed(1)) : (b.chest_cm || null)
        hipsCm.value = b.hips_mm ? Number((b.hips_mm / 10).toFixed(1)) : (b.hips_cm || null)
        bicepsCm.value = b.biceps_mm ? Number((b.biceps_mm / 10).toFixed(1)) : (b.biceps_cm || null)
      } else {
        weightKg.value = 72.5
        waistCm.value = null
        chestCm.value = null
        hipsCm.value = null
        bicepsCm.value = null
      }
    }
  }
)

const handleSubmit = () => {
  emit('submit', {
    id: props.initialBiometric?.id,
    weight_kg: weightKg.value,
    waist_cm: waistCm.value || undefined,
    chest_cm: chestCm.value || undefined,
    hips_cm: hipsCm.value || undefined,
    biceps_cm: bicepsCm.value || undefined
  })
  emit('close')
}
</script>

<template>
  <Modal
    v-if="show"
    :title="isEditing ? 'Edit Biometrics' : 'Log Biometrics'"
    :icon="isEditing ? Pencil : Scale"
    icon-color="text-purple-400"
    max-width-class="max-w-md"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Weight Input -->
      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-slate-300">Body Weight (kg)</label>
        <input
          type="number"
          step="0.1"
          v-model.number="weightKg"
          min="20"
          max="500"
          required
          class="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition"
        />
      </div>

      <!-- Circumference Measurements -->
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-300">Waist (cm)</label>
          <input
            type="number"
            step="0.5"
            v-model.number="waistCm"
            placeholder="Optional"
            class="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition"
          />
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-300">Chest (cm)</label>
          <input
            type="number"
            step="0.5"
            v-model.number="chestCm"
            placeholder="Optional"
            class="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-300">Hips (cm)</label>
          <input
            type="number"
            step="0.5"
            v-model.number="hipsCm"
            placeholder="Optional"
            class="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition"
          />
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-300">Biceps (cm)</label>
          <input
            type="number"
            step="0.5"
            v-model.number="bicepsCm"
            placeholder="Optional"
            class="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition"
          />
        </div>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        class="w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-400 active:scale-[0.98] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-purple-950/40"
      >
        <Check class="w-4 h-4 stroke-[3]" />
        <span>Save Biometrics</span>
      </button>
    </form>
  </Modal>
</template>
