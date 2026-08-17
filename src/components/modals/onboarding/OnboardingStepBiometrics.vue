<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../../lib/i18n'
import { getSexOptions } from '../../../lib/bitmask'
import DropdownPicker from '../../atoms/DropdownPicker.vue'
import YearPicker from '../../atoms/YearPicker.vue'
import FormInput from '../../atoms/FormInput.vue'
import ToggleSwitch from '../../atoms/ToggleSwitch.vue'
import { Ruler, Scale } from '@lucide/vue'

const sex = defineModel<number | null>('sex', { required: true })
const birthYear = defineModel<number>('birthYear', { required: true })
const heightCm = defineModel<number | null>('heightCm', { required: true })
const weightKg = defineModel<number | null>('weightKg', { required: true })
const isImperial = defineModel<boolean>('isImperial', { required: true })

const { t } = useI18n()

const sexOptions = computed(() => getSexOptions(t))

const handleUnitToggle = (val: boolean) => {
  if (val === isImperial.value) return
  if (val) {
    if (heightCm.value !== null) heightCm.value = Number((heightCm.value / 2.54).toFixed(1))
    if (weightKg.value !== null) weightKg.value = Number((weightKg.value / 0.453592).toFixed(1))
  } else {
    if (heightCm.value !== null) heightCm.value = Number((heightCm.value * 2.54).toFixed(0))
    if (weightKg.value !== null) weightKg.value = Number((weightKg.value * 0.453592).toFixed(1))
  }
  isImperial.value = val
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <h2 class="text-xl font-bold text-slate-100">{{ t('onboarding.step2.title') }}</h2>
      <p class="text-slate-400 text-xs sm:text-sm">{{ t('onboarding.step2.desc') }}</p>
    </div>

    <div class="grid grid-cols-2 gap-4 pt-2">
      <DropdownPicker
        v-model="sex"
        :label="t('onboarding.step2.sex_label')"
        :options="sexOptions"
      />
      <YearPicker
        v-model="birthYear"
        :label="t('onboarding.step2.birth_year_label')"
      />
    </div>

    <!-- Metric vs Imperial System Picker -->
    <ToggleSwitch
      :model-value="isImperial"
      @update:model-value="handleUnitToggle"
      :label="t('onboarding.step2.units_toggle_label')"
      :description="t('onboarding.step2.units_toggle_desc')"
    />

    <div class="grid grid-cols-2 gap-4">
      <FormInput
        v-model.number="heightCm"
        type="number"
        :label="isImperial ? t('onboarding.step2.height_in_label') : t('onboarding.step2.height_cm_label')"
        :icon="Ruler"
        icon-position="field-left"
        icon-color="text-emerald-400"
        :placeholder="isImperial ? '68' : '175'"
        :suffix="isImperial ? 'in' : 'cm'"
        :min="isImperial ? 24 : 60"
        :max="isImperial ? 96 : 250"
        step="any"
        required
      />

      <FormInput
        v-model.number="weightKg"
        type="number"
        :label="isImperial ? t('onboarding.step2.weight_lbs_label') : t('onboarding.step2.weight_kg_label')"
        :icon="Scale"
        icon-position="field-left"
        icon-color="text-emerald-400"
        :placeholder="isImperial ? '160' : '72.5'"
        :suffix="isImperial ? 'lbs' : 'kg'"
        :min="isImperial ? 45 : 20"
        :max="isImperial ? 800 : 360"
        step="any"
        required
      />
    </div>
  </div>
</template>
