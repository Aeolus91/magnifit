<script setup lang="ts">
import { ref, computed } from 'vue'
import { Sparkles, Scale } from '@lucide/vue'
import { ProfilePrefs } from '../../lib/bitmask'
import { useI18n } from '../../lib/i18n'
import type { Biometric } from '../../types/fitness'
import BiometricsModal from '../modals/dash/BiometricsModal.vue'
import BiometricEntry from '../entries/BiometricEntry.vue'
import SectionHeader from '../atoms/SectionHeader.vue'
import EmptySectionPlaceholder from '../atoms/EmptySectionPlaceholder.vue'

interface Props {
  biometrics: Biometric[]
  prefs?: number
}

const { t } = useI18n()

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
    <SectionHeader
      :title="t('dash.biometrics.title')"
      :description="t('dash.biometrics.desc')"
      :action-label="t('dash.biometrics.add_entry')"
      action-variant="purple"
      @action="openCreateModal"
    >
      <template #controls>
        <!-- Bilateral Aggregate Toggle (Persisted via ProfilePrefs bitmask) -->
        <button
          type="button"
          @click="toggleAverageAggregate"
          :class="[
            'px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0',
            showAverageAggregate
              ? 'bg-purple-950/70 border-purple-500 text-purple-300 shadow-sm'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
          ]"
          title="Toggle bilateral limb average display"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>{{ showAverageAggregate ? t('dash.biometrics.showing_avg') : t('dash.biometrics.show_avg') }}</span>
        </button>
      </template>
    </SectionHeader>

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
      <EmptySectionPlaceholder
        v-if="biometrics.length === 0"
        :title="t('dash.empty.biometrics_title')"
        :description="t('dash.empty.biometrics_desc')"
        :icon="Scale"
        icon-color-class="text-cyan-400"
        icon-bg-class="bg-cyan-950/60 border border-cyan-800/60"
      />
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
