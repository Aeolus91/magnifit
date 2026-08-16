<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Scale, Sparkles } from '@lucide/vue'
import { ProfilePrefs } from '../../lib/bitmask'
import type { Biometric } from '../../types/fitness'
import BiometricsModal from '../modals/dash/BiometricsModal.vue'
import BiometricEntry from '../entries/BiometricEntry.vue'

interface Props {
  biometrics: Biometric[]
  prefs?: number
}

const props = withDefaults(defineProps<Props>(), {
  prefs: ProfilePrefs.SHOW_BIO_AVERAGE
})

const emit = defineEmits<{
  (e: 'add-biometric', bio: Biometric): void
  (e: 'edit-biometric', bio: Biometric): void
  (e: 'delete-biometric', id: string): void
  (e: 'update-prefs', newPrefs: number): void
}>()

const showModal = ref(false)
const selectedBiometric = ref<Biometric | null>(null)

const showAverageAggregate = computed(() => {
  if (props.prefs === undefined) return true
  return (props.prefs & ProfilePrefs.SHOW_BIO_AVERAGE) !== 0
})

const toggleAverageAggregate = () => {
  const current = props.prefs !== undefined ? props.prefs : ProfilePrefs.SHOW_BIO_AVERAGE
  const next = current ^ ProfilePrefs.SHOW_BIO_AVERAGE
  emit('update-prefs', next)
}

const openCreateModal = () => {
  selectedBiometric.value = null
  showModal.value = true
}

const openEditModal = (bio: Biometric) => {
  selectedBiometric.value = { ...bio }
  showModal.value = true
}

const handleBioSubmit = (bio: Biometric) => {
  if (selectedBiometric.value?.id) {
    emit('edit-biometric', bio)
  } else {
    emit('add-biometric', bio)
  }
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

      <!-- Bilateral Aggregate Toggle (Persisted via ProfilePrefs bitmask) -->
      <button
        type="button"
        @click="toggleAverageAggregate"
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
      v-if="showModal"
      :show="showModal"
      :initial-biometric="selectedBiometric"
      @close="showModal = false"
      @submit="handleBioSubmit"
    />

    <!-- Biometrics List -->
    <div class="space-y-2">
      <div v-if="biometrics.length === 0" class="text-sm text-slate-500 py-4 text-center">
        No biometrics recorded for this date.
      </div>
      <BiometricEntry
        v-for="b in biometrics"
        :key="b.id"
        :biometric="b"
        :all-biometrics="biometrics"
        :show-average-aggregate="showAverageAggregate"
        @edit="openEditModal"
        @delete="emit('delete-biometric', $event)"
      />
    </div>
  </div>
</template>
