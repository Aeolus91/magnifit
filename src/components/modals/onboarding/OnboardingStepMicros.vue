<script setup lang="ts">
import { useI18n } from '../../../lib/i18n'
import { Check } from '@lucide/vue'

defineProps<{
  selectedMicros: number
  microList: Array<{ key: string; bit: number; col: string; label: string }>
  isAllMicrosSelected: boolean
  selectedMicrosCount: number
}>()

const emit = defineEmits<{
  (e: 'toggle', bit: number): void
  (e: 'select-all'): void
  (e: 'deselect-all'): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-slate-100">{{ t('onboarding.step4.title') }}</h2>
        <span class="text-xs text-slate-400 font-medium">
          {{ t('onboarding.step4.selected_count', { count: selectedMicrosCount, total: microList.length }) }}
        </span>
      </div>
      <p class="text-slate-400 text-xs sm:text-sm">{{ t('onboarding.step4.desc') }}</p>
    </div>

    <!-- Quick Selection Actions -->
    <div class="flex items-center gap-2 pt-1">
      <button
        type="button"
        @click="emit('select-all')"
        class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition cursor-pointer"
      >
        {{ t('onboarding.step4.select_all') }}
      </button>
      <button
        type="button"
        @click="emit('deselect-all')"
        class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
      >
        {{ t('onboarding.step4.deselect_all') }}
      </button>
    </div>

    <!-- Micro Nutrient Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
      <div
        v-for="micro in microList"
        :key="micro.key"
        @click="emit('toggle', micro.bit)"
        :class="[
          'p-2 rounded-xl border flex items-center justify-between text-xs font-medium cursor-pointer select-none transition',
          (selectedMicros & micro.bit) !== 0
            ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
            : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
        ]"
      >
        <span class="capitalize truncate mr-1.5">{{ micro.label }}</span>
        <div :class="[
          'w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition border',
          (selectedMicros & micro.bit) !== 0
            ? 'bg-emerald-500 border-emerald-500 text-slate-950'
            : 'border-slate-700 bg-slate-900'
        ]">
          <Check v-if="(selectedMicros & micro.bit) !== 0" class="w-3 h-3 stroke-3" />
        </div>
      </div>
    </div>
  </div>
</template>
