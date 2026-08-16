<script setup lang="ts">
import { ref, computed } from 'vue'
import { Info, ChevronDown } from '@lucide/vue'
import { filterTrackedMicroLabels } from '../../lib/bitmask'
import { useI18n } from '../../lib/i18n'

const { t } = useI18n()

interface Props {
  microsOpt?: number
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: ''
})

const micros = defineModel<Record<string, number | undefined>>({
  default: () => ({})
})

const isOpen = ref(false)

const allMicroLabels: Record<string, { label: string; unit: string }> = {
  sugar_g: { label: t('meals.micros.sugar'), unit: 'g' },
  added_sugar_g: { label: t('meals.micros.added_sugar'), unit: 'g' },
  sat_fat_g: { label: t('meals.micros.sat_fat'), unit: 'g' },
  trans_fat_g: { label: t('meals.micros.trans_fat'), unit: 'g' },
  mono_fat_g: { label: t('meals.micros.mono_fat'), unit: 'g' },
  poly_fat_g: { label: t('meals.micros.poly_fat'), unit: 'g' },
  omega_3_mg: { label: t('meals.micros.omega_3'), unit: 'mg' },
  omega_6_mg: { label: t('meals.micros.omega_6'), unit: 'mg' },
  caffeine_mg: { label: t('meals.micros.caffeine'), unit: 'mg' },
  sodium_mg: { label: t('meals.micros.sodium'), unit: 'mg' },
  potassium_mg: { label: t('meals.micros.potassium'), unit: 'mg' },
  cholesterol_mg: { label: t('meals.micros.cholesterol'), unit: 'mg' },
  hdl_mg: { label: t('meals.micros.hdl'), unit: 'mg' },
  ldl_mg: { label: t('meals.micros.ldl'), unit: 'mg' },
  iron_mg: { label: t('meals.micros.iron'), unit: 'mg' },
  calcium_mg: { label: t('meals.micros.calcium'), unit: 'mg' },
  magnesium_mg: { label: t('meals.micros.magnesium'), unit: 'mg' },
  zinc_mg: { label: t('meals.micros.zinc'), unit: 'mg' },
  vit_a_mcg: { label: t('meals.micros.vit_a'), unit: 'mcg' },
  vit_c_mg: { label: t('meals.micros.vit_c'), unit: 'mg' },
  vit_d_mcg: { label: t('meals.micros.vit_d'), unit: 'mcg' },
  vit_b12_mcg: { label: t('meals.micros.vit_b12'), unit: 'mcg' }
}

const activeMicroLabels = computed(() => {
  return filterTrackedMicroLabels(allMicroLabels, props.microsOpt)
})

const filledCount = computed(() => {
  if (!micros.value) return 0
  return Object.values(micros.value).filter(v => v !== undefined && v !== null && v > 0).length
})
</script>

<template>
  <div class="space-y-2 pt-1">
    <button type="button" @click="isOpen = !isOpen"
      class="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition cursor-pointer text-left group">
      <div class="flex items-center gap-2">
        <Info class="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span class="text-xs font-semibold text-slate-300 group-hover:text-slate-100 transition">
          {{ title || t('meals.micros.optional_title') }}
        </span>
        <span v-if="filledCount > 0"
          class="px-1.5 py-0.2 rounded-md bg-amber-950/80 border border-amber-800/60 text-[10px] font-mono text-amber-300 font-bold">
          {{ t('meals.micros.set_count', { count: filledCount }) }}
        </span>
      </div>
      <ChevronDown :class="[
        'w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200',
        isOpen ? 'rotate-180 text-amber-400' : ''
      ]" />
    </button>

    <div v-if="isOpen"
      class="max-h-60 overflow-y-auto space-y-2 pr-1 border border-slate-800/80 rounded-xl p-3 bg-slate-950/80 animate-in fade-in slide-in-from-top-1 duration-200">
      <div v-for="(meta, key) in activeMicroLabels" :key="key"
        class="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs">
        <label class="text-slate-300 truncate text-[11px]">{{ meta.label }} ({{ meta.unit }})</label>
        <input type="number" step="any" min="0" v-model.number="micros[key]" placeholder="0"
          class="w-24 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-2 py-1 text-xs font-mono text-amber-300 text-right focus:outline-none" />
      </div>
    </div>
  </div>
</template>
