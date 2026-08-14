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

const getMeasurementDisplay = (b: Biometric) => {
  const meta = BIOMETRIC_TYPES[b.type]
  if (!meta) return { primary: `${b.val}`, sub: null }
  const formattedPrimary = (b.val / meta.scale).toFixed(meta.step < 1 ? 1 : 0)
  
  if (b.val_sec !== null && b.val_sec !== undefined) {
    const formattedSec = (b.val_sec / meta.scale).toFixed(meta.step < 1 ? 1 : 0)
    if (showAverageAggregate.value) {
      const avg = ((b.val + b.val_sec) / (2 * meta.scale)).toFixed(meta.step < 1 ? 1 : 0)
      return {
        primary: `Avg: ${avg} ${meta.unitLabel}`,
        sub: `(L: ${formattedPrimary} | R: ${formattedSec})`
      }
    }
    return {
      primary: `L: ${formattedPrimary} | R: ${formattedSec}`,
      sub: meta.unitLabel
    }
  }
  
  return {
    primary: `${formattedPrimary} ${meta.unitLabel}`,
    sub: null
  }
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
        class="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-3 text-sm group hover:border-slate-700 transition"
      >
        <!-- Col 1: Icon, Title, (Desktop/Standard Badges) & Category -->
        <div class="flex items-center gap-2.5 min-w-0 flex-1 text-left">
          <div class="p-1.5 rounded-lg bg-purple-950/50 border border-purple-800/40 text-purple-400 shrink-0">
            <Scale class="w-4 h-4" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 flex-wrap max-w-full">
              <span class="font-semibold text-slate-200 truncate">{{ getMetricName(b) }}</span>
              <!-- Badges shown on >=360px -->
              <div class="hidden min-[360px]:flex items-center gap-1.5 flex-wrap">
                <span
                  v-if="getLateralityBadge(b.flags)"
                  class="px-1.5 py-0.5 rounded text-[9px] min-[380px]:text-[10px] font-bold bg-purple-950/80 border border-purple-800/80 text-purple-300 shrink-0 whitespace-nowrap"
                >
                  {{ getLateralityBadge(b.flags) }}
                </span>
                <span
                  v-if="(b.flags || 0) & BiometricFlags.FASTED"
                  class="px-1.5 py-0.5 rounded text-[9px] min-[380px]:text-[10px] font-medium bg-slate-800 border border-slate-700/60 text-slate-300 shrink-0 whitespace-nowrap"
                >
                  Fasted
                </span>
                <span
                  v-if="(b.flags || 0) & BiometricFlags.POST_WORKOUT_PUMP"
                  class="px-1.5 py-0.5 rounded text-[9px] min-[380px]:text-[10px] font-bold bg-amber-950/80 border border-amber-800/80 text-amber-300 shrink-0 whitespace-nowrap"
                >
                  Pumped
                </span>
              </div>
            </div>
            <div class="text-xs text-slate-400 mt-0.5 truncate">{{ getCategoryLabel(b.cat) }}</div>
          </div>
        </div>

        <!-- Col 2: Value & Actions (with Badges placed beside buttons on <360px) -->
        <div class="flex flex-col min-[380px]:flex-row items-end min-[380px]:items-center gap-1.5 min-[380px]:gap-2.5 shrink-0 text-right">
          <div class="flex flex-col items-end">
            <span class="font-bold text-purple-400 text-sm whitespace-nowrap">
              {{ getMeasurementDisplay(b).primary }}
            </span>
            <span
              v-if="getMeasurementDisplay(b).sub && showAverageAggregate"
              class="text-[11px] text-slate-400 font-medium whitespace-nowrap"
            >
              {{ getMeasurementDisplay(b).sub }}
            </span>
          </div>

          <div class="flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
            <!-- Badges rendered beside action buttons on ultra-compact mobile (<360px) -->
            <div class="flex min-[360px]:hidden items-center gap-1">
              <span
                v-if="getLateralityBadge(b.flags)"
                class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-950/80 border border-purple-800/80 text-purple-300 shrink-0 whitespace-nowrap"
              >
                {{ getLateralityBadge(b.flags) }}
              </span>
              <span
                v-if="(b.flags || 0) & BiometricFlags.FASTED"
                class="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-800 border border-slate-700/60 text-slate-300 shrink-0 whitespace-nowrap"
              >
                Fasted
              </span>
              <span
                v-if="(b.flags || 0) & BiometricFlags.POST_WORKOUT_PUMP"
                class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950/80 border border-amber-800/80 text-amber-300 shrink-0 whitespace-nowrap"
              >
                Pumped
              </span>
            </div>

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
