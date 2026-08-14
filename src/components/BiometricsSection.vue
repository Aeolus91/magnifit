<script setup lang="ts">
import { ref } from 'vue'
import type { Biometric } from '../types/fitness'
import BiometricsModal from './BiometricsModal.vue'
import { Scale, Plus, Pencil, Trash2 } from '@lucide/vue'

interface Props {
  biometrics: Biometric[]
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'add-biometric', bio: { weight_kg: number; waist_cm?: number; chest_cm?: number; hips_cm?: number; biceps_cm?: number }): void
  (e: 'edit-biometric', bio: { id: string; weight_kg: number; waist_cm?: number; chest_cm?: number; hips_cm?: number; biceps_cm?: number }): void
  (e: 'delete-biometric', id: string): void
}>()

const showModal = ref(false)
const selectedBiometric = ref<Biometric | null>(null)

const openCreateModal = () => {
  selectedBiometric.value = null
  showModal.value = true
}

const openEditModal = (bio: Biometric) => {
  selectedBiometric.value = { ...bio }
  showModal.value = true
}

const handleBioSubmit = (bio: { id?: string; weight_kg: number; waist_cm?: number; chest_cm?: number; hips_cm?: number; biceps_cm?: number }) => {
  if (bio.id) {
    emit('edit-biometric', bio as { id: string; weight_kg: number; waist_cm?: number; chest_cm?: number; hips_cm?: number; biceps_cm?: number })
  } else {
    emit('add-biometric', bio)
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Action Trigger Row -->
    <button
      type="button"
      @click="openCreateModal"
      class="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-850 transition active:scale-[0.99] group cursor-pointer"
    >
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-400 group-hover:text-purple-300">
          <Scale class="w-5 h-5" />
        </div>
        <div class="text-left">
          <div class="text-sm font-bold text-slate-100 group-hover:text-purple-400 transition">Log Biometrics</div>
          <div class="text-xs text-slate-400">Record weight and body circumference stats</div>
        </div>
      </div>
      <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 text-xs font-bold transition">
        <Plus class="w-4 h-4" />
        <span>Add Entry</span>
      </div>
    </button>

    <!-- Dedicated Fullscreen Biometrics Modal -->
    <BiometricsModal
      :show="showModal"
      :initial-biometric="selectedBiometric"
      @close="showModal = false"
      @submit="handleBioSubmit"
    />

    <div class="space-y-2">
      <div v-if="biometrics.length === 0" class="text-sm text-slate-500 py-4 text-center">
        No biometric logs recorded for this date.
      </div>
      <div v-for="b in biometrics" :key="b.id"
        class="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between text-sm group">
        <div class="flex items-center gap-3">
          <Scale class="w-5 h-5 text-purple-400" />
          <div>
            <div class="font-semibold text-slate-200">
              {{ b.weight_dg ? (b.weight_dg / 10).toFixed(1) : b.weight_kg }} kg
            </div>
            <div class="text-xs text-slate-400 flex flex-wrap gap-x-2">
              <span v-if="b.waist_mm || b.waist_cm">Waist: {{ b.waist_mm ? b.waist_mm / 10 : b.waist_cm }}cm</span>
              <span v-if="b.chest_mm || b.chest_cm">Chest: {{ b.chest_mm ? b.chest_mm / 10 : b.chest_cm }}cm</span>
              <span v-if="b.hips_mm || b.hips_cm">Hips: {{ b.hips_mm ? b.hips_mm / 10 : b.hips_cm }}cm</span>
              <span v-if="b.biceps_mm || b.biceps_cm">Biceps: {{ b.biceps_mm ? b.biceps_mm / 10 : b.biceps_cm }}cm</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            @click="openEditModal(b)"
            class="p-1 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-800 transition cursor-pointer"
            title="Edit Biometrics"
          >
            <Pencil class="w-3.5 h-3.5" />
          </button>
          <button
            v-if="b.id"
            type="button"
            @click="emit('delete-biometric', b.id)"
            class="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
            title="Delete Biometrics"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
