<script setup lang="ts">
import { ref } from 'vue'
import type { Biometric } from '../types/fitness'
import BiometricsModal from './BiometricsModal.vue'
import {
  BIOMETRIC_TYPES,
  BIOMETRIC_CATEGORY_LABELS,
  BiometricFlags
} from '../lib/bitmask'
import { Scale, Plus, Pencil, Trash2, Activity, Heart, Zap, Sparkles } from '@lucide/vue'

interface Props {
  biometrics: Biometric[]
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'add-biometric', bio: Biometric): void
  (e: 'edit-biometric', bio: Biometric): void
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

const handleBioSubmit = (bio: Biometric) => {
  if (bio.id) {
    emit('edit-biometric', bio)
  } else {
    emit('add-biometric', bio)
  }
}

const showAverageAggregate = ref(false)

const formatDisplayVal = (b: Biometric) => {
  const meta = BIOMETRIC_TYPES[b.type]
  if (!meta) return `${b.val}`
  const formattedPrimary = (b.val / meta.scale).toFixed(meta.step < 1 ? 1 : 0)
  
  if (b.val_sec !== null && b.val_sec !== undefined) {
    const formattedSec = (b.val_sec / meta.scale).toFixed(meta.step < 1 ? 1 : 0)
    if (showAverageAggregate.value) {
      const avg = ((b.val + b.val_sec) / (2 * meta.scale)).toFixed(meta.step < 1 ? 1 : 0)
      return `Avg: ${avg} ${meta.unitLabel} (L: ${formattedPrimary} | R: ${formattedSec})`
    }
    return `L: ${formattedPrimary} | R: ${formattedSec} ${meta.unitLabel}`
  }
  
  return `${formattedPrimary} ${meta.unitLabel}`
}

const getMetricName = (b: Biometric) => {
  const meta = BIOMETRIC_TYPES[b.type]
  return meta ? meta.name : `Metric #${b.type}`
}

const getCategoryLabel = (cat: number) => {
  return BIOMETRIC_CATEGORY_LABELS[cat] || 'General'
}

const getLateralityBadge = (flags: number = 0) => {
  const hasLeft = (flags & BiometricFlags.UNILATERAL_LEFT) === BiometricFlags.UNILATERAL_LEFT
  const hasRight = (flags & BiometricFlags.UNILATERAL_RIGHT) === BiometricFlags.UNILATERAL_RIGHT
  if (hasLeft && hasRight) return 'L & R'
  if (hasLeft) return 'Left (L)'
  if (hasRight) return 'Right (R)'
  return null
}
</script>

<template>
  <div class="space-y-4">
    <!-- Action Trigger Row & View Settings -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
      <button
        type="button"
        @click="openCreateModal"
        class="flex-1 flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-850 transition active:scale-[0.99] group cursor-pointer"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-purple-950/60 border border-purple-800/60 text-purple-400 group-hover:text-purple-300">
            <Scale class="w-4 h-4" />
          </div>
          <div class="text-left">
            <div class="text-xs font-bold text-slate-100 group-hover:text-purple-400 transition">Log Biometrics</div>
            <div class="text-[11px] text-slate-400">Track body stats, circumferences, vitals</div>
          </div>
        </div>
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-slate-950 text-xs font-bold transition">
          <Plus class="w-3.5 h-3.5" />
          <span>Add Entry</span>
        </div>
      </button>

      <!-- Bilateral Aggregate Toggle -->
      <button
        type="button"
        @click="showAverageAggregate = !showAverageAggregate"
        :class="[
          'px-3 py-2 sm:py-3.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0',
          showAverageAggregate
            ? 'bg-purple-950/70 border-purple-500 text-purple-300 shadow-sm'
            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
        ]"
        title="Toggle bilateral limb average display"
      >
        <Sparkles class="w-3.5 h-3.5" />
        <span>{{ showAverageAggregate ? 'Showing Avg' : 'Show Avg' }}</span>
      </button>
    </div>

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
      <div
        v-for="b in biometrics"
        :key="b.id"
        class="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between text-sm group"
      >
        <div class="flex items-center gap-3">
          <Scale class="w-5 h-5 text-purple-400" />
          <div>
            <div class="flex items-center gap-2">
              <span class="font-semibold text-slate-200">{{ getMetricName(b) }}</span>
              <span
                v-if="getLateralityBadge(b.flags)"
                class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-950/80 border border-purple-800/80 text-purple-300"
              >
                {{ getLateralityBadge(b.flags) }}
              </span>
              <span
                v-if="(b.flags || 0) & BiometricFlags.FASTED"
                class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400"
              >
                Fasted
              </span>
              <span
                v-if="(b.flags || 0) & BiometricFlags.POST_WORKOUT_PUMP"
                class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/40"
              >
                Pumped
              </span>
            </div>
            <div class="text-xs text-slate-400">
              {{ getCategoryLabel(b.cat) }}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <span class="font-bold text-purple-400">{{ formatDisplayVal(b) }}</span>
          <div class="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              @click="openEditModal(b)"
              class="p-1 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-800 transition cursor-pointer"
              title="Edit Biometric"
            >
              <Pencil class="w-3.5 h-3.5" />
            </button>
            <button
              v-if="b.id"
              type="button"
              @click="emit('delete-biometric', b.id)"
              class="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
              title="Delete Biometric"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
