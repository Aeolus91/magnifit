<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../../lib/i18n'
import { getActivityOptions } from '../../../lib/bitmask'
import DropdownPicker from '../../atoms/DropdownPicker.vue'
import FormInput from '../../atoms/FormInput.vue'
import ToggleSwitch from '../../atoms/ToggleSwitch.vue'
import { Activity, Target } from '@lucide/vue'

const activityLevel = defineModel<number | null>('activityLevel', { required: true })
const targetWeightKg = defineModel<number | null>('targetWeightKg', { required: true })
const trackMicros = defineModel<boolean>('trackMicros', { required: true })

defineProps<{
  isImperial: boolean
}>()

const { t } = useI18n()

const activityOptions = computed(() => getActivityOptions(t))
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <h2 class="text-xl font-bold text-slate-100">{{ t('onboarding.step3.title') }}</h2>
      <p class="text-slate-400 text-xs sm:text-sm">{{ t('onboarding.step3.desc') }}</p>
    </div>

    <div class="space-y-3 pt-2">
      <DropdownPicker
        v-model="activityLevel"
        :label="t('onboarding.step3.activity_label')"
        :options="activityOptions"
        :icon="Activity"
      />

      <FormInput
        v-model.number="targetWeightKg"
        type="number"
        :label="isImperial ? t('onboarding.step3.target_weight_imperial_label') : t('onboarding.step3.target_weight_metric_label')"
        :icon="Target"
        icon-position="field-left"
        icon-color="text-emerald-400"
        :placeholder="isImperial ? '155' : '70'"
        :suffix="isImperial ? 'lbs' : 'kg'"
        :min="isImperial ? 45 : 20"
        :max="isImperial ? 800 : 360"
        step="any"
      />
    </div>

    <!-- Micronutrients Tracking Opt-in Switch -->
    <ToggleSwitch
      v-model="trackMicros"
      :label="t('onboarding.step3.micros_toggle_label')"
      :description="t('onboarding.step3.micros_toggle_desc')"
    />
  </div>
</template>
