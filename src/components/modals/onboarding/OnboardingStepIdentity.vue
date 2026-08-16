<script setup lang="ts">
import { useI18n } from '../../../lib/i18n'
import FormInput from '../../atoms/FormInput.vue'
import { User, AtSign } from '@lucide/vue'

const fullName = defineModel<string>('fullName', { required: true })
const username = defineModel<string>('username', { required: true })

const { t } = useI18n()
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <h2 class="text-xl font-bold text-slate-100">{{ t('onboarding.step1.title') }}</h2>
      <p class="text-slate-400 text-xs sm:text-sm">{{ t('onboarding.step1.desc') }}</p>
    </div>

    <div class="space-y-3 pt-2">
      <FormInput
        v-model="fullName"
        :label="t('onboarding.step1.fullname_label')"
        :icon="User"
        icon-position="field-left"
        icon-color="text-emerald-400"
        :placeholder="t('onboarding.step1.fullname_placeholder')"
        required
      />

      <div>
        <FormInput
          v-model="username"
          :label="t('onboarding.step1.username_label')"
          :icon="AtSign"
          icon-position="field-left"
          icon-color="text-emerald-400"
          :placeholder="t('onboarding.step1.username_placeholder')"
          required
          input-class="font-mono"
        />
        <p class="text-[11px] text-slate-500 mt-1">{{ t('onboarding.step1.username_hint') }}</p>
      </div>
    </div>
  </div>
</template>
