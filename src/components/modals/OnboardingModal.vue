<script setup lang="ts">
import { toRef } from 'vue'
import { useI18n } from '../../lib/i18n'
import { useOnboarding } from '../../composables/useOnboarding'
import type { Profile, Biometric } from '../../types/fitness'
import Modal from './Modal.vue'
import OnboardingStepIdentity from './onboarding/OnboardingStepIdentity.vue'
import OnboardingStepBiometrics from './onboarding/OnboardingStepBiometrics.vue'
import OnboardingStepGoals from './onboarding/OnboardingStepGoals.vue'
import OnboardingStepMicros from './onboarding/OnboardingStepMicros.vue'
import { Sparkles, ArrowRight, ArrowLeft, Check, AlertCircle, Loader2, X } from '@lucide/vue'

const props = defineProps<{
  initialProfile?: Profile | null
  latestBiometric?: Biometric | null
}>()

const emit = defineEmits<{
  (e: 'completed', profile: Profile): void
  (e: 'dismiss'): void
}>()

const { t } = useI18n()

const {
  currentStep,
  totalSteps,
  progressPercent,
  isSubmitting,
  errorMessage,
  isOnboardingAlreadyCompleted,
  fullName,
  username,
  isImperial,
  trackMicros,
  sex,
  birthYear,
  heightCm,
  weightKg,
  activityLevel,
  targetWeightKg,
  selectedMicros,
  microList,
  isAllMicrosSelected,
  selectedMicrosCount,
  toggleMicro,
  selectAllMicros,
  deselectAllMicros,
  completeOnboarding
} = useOnboarding(toRef(props, 'initialProfile'), toRef(props, 'latestBiometric'))

const nextStep = () => {
  errorMessage.value = null
  if (currentStep.value === 1) {
    if (!fullName.value.trim()) {
      errorMessage.value = t('onboarding.step1.error_name')
      return
    }
    if (!username.value.trim()) {
      errorMessage.value = t('onboarding.step1.error_username')
      return
    }
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username.value.trim())) {
      errorMessage.value = t('onboarding.step1.error_username_format')
      return
    }
  } else if (currentStep.value === 2) {
    if (heightCm.value === null || heightCm.value < 20 || heightCm.value > 260) {
      errorMessage.value = t('onboarding.step2.error_height')
      return
    }
    if (weightKg.value === null || weightKg.value < 20 || weightKg.value > 1100) {
      errorMessage.value = t('onboarding.step2.error_weight')
      return
    }
  }

  if (currentStep.value < totalSteps.value) {
    currentStep.value++
  }
}

const prevStep = () => {
  errorMessage.value = null
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleFinish = async () => {
  const result = await completeOnboarding()
  if (result) {
    emit('completed', result)
  }
}
</script>

<template>
  <Modal :show-close="false" max-width-class="max-w-lg" @close="isOnboardingAlreadyCompleted && emit('dismiss')">
    <template #header>
      <div class="space-y-4">
        <div class="flex items-center justify-between text-xs text-slate-400 font-semibold">
          <div class="flex items-center gap-1.5 text-emerald-400">
            <Sparkles class="w-4 h-4" />
            <span>{{ t('onboarding.title') }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span>{{ t('onboarding.step_counter', { step: currentStep, total: totalSteps, percent: progressPercent }) }}</span>
            <button
              v-if="isOnboardingAlreadyCompleted"
              type="button"
              @click="emit('dismiss')"
              class="p-1 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 hover:text-slate-200 text-slate-400 transition cursor-pointer"
              title="Close"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Segmented Progress Bar -->
        <div class="w-full bg-slate-950 border border-slate-800 rounded-full h-2 overflow-hidden">
          <div
            class="bg-linear-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300 ease-out"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
      </div>
    </template>

    <template #default>
      <!-- Error Message Banner -->
      <div
        v-if="errorMessage"
        class="bg-rose-950/60 border border-rose-900/80 rounded-xl p-3 flex items-start gap-2.5 text-rose-300 text-xs sm:text-sm mb-4"
      >
        <AlertCircle class="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Step 1: Identity -->
      <OnboardingStepIdentity
        v-if="currentStep === 1"
        v-model:full-name="fullName"
        v-model:username="username"
      />

      <!-- Step 2: Physical Biometrics -->
      <OnboardingStepBiometrics
        v-if="currentStep === 2"
        v-model:sex="sex"
        v-model:birth-year="birthYear"
        v-model:height-cm="heightCm"
        v-model:weight-kg="weightKg"
        v-model:is-imperial="isImperial"
      />

      <!-- Step 3: Goals & Activity -->
      <OnboardingStepGoals
        v-if="currentStep === 3"
        v-model:activity-level="activityLevel"
        v-model:target-weight-kg="targetWeightKg"
        v-model:track-micros="trackMicros"
        :is-imperial="isImperial"
      />

      <!-- Step 4: Micronutrient Selection Grid -->
      <OnboardingStepMicros
        v-if="currentStep === 4"
        :selected-micros="selectedMicros"
        :micro-list="microList"
        :is-all-micros-selected="isAllMicrosSelected"
        :selected-micros-count="selectedMicrosCount"
        @toggle="toggleMicro"
        @select-all="selectAllMicros"
        @deselect-all="deselectAllMicros"
      />
    </template>

    <!-- Navigation Footer Actions -->
    <template #footer>
      <div class="flex items-center justify-between pt-4 border-t border-slate-800/80 gap-3">
        <button
          type="button"
          v-if="currentStep > 1"
          @click="prevStep"
          class="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>{{ t('common.back') }}</span>
        </button>
        <div v-else></div>

        <button
          type="button"
          v-if="currentStep < totalSteps"
          @click="nextStep"
          class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition cursor-pointer"
        >
          <span>{{ t('common.continue') }}</span>
          <ArrowRight class="w-4 h-4" />
        </button>

        <button
          type="button"
          v-else
          :disabled="isSubmitting"
          @click="handleFinish"
          class="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 text-xs sm:text-sm font-bold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-emerald-950/40"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <template v-else>
            <Check class="w-4 h-4 stroke-3" />
            <span>{{ t('common.finish') }}</span>
          </template>
        </button>
      </div>
    </template>
  </Modal>
</template>
