<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { supabase } from '../../lib/supabaseClient'
import { useAuthStore } from '../../stores/authStore'
import { useI18n } from '../../lib/i18n'
import { ProfilePrefs, MicroNutrientFlags } from '../../lib/bitmask'
import type { Profile, Biometric } from '../../types/fitness'
import YearPicker from '../atoms/YearPicker.vue'
import FormInput from '../atoms/FormInput.vue'
import ToggleSwitch from '../atoms/ToggleSwitch.vue'
import DropdownPicker from '../atoms/DropdownPicker.vue'
import Modal from './Modal.vue'
import {
  User,
  Sparkles,
  Ruler,
  Scale,
  Target,
  Activity,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  AtSign,
  Sliders,
  PieChart,
  X
} from '@lucide/vue'

const props = defineProps<{
  initialProfile?: Profile | null
  latestBiometric?: Biometric | null
}>()

const emit = defineEmits<{
  (e: 'completed', profile: Profile): void
  (e: 'dismiss'): void
}>()

const authStore = useAuthStore()
const { t } = useI18n()

const isOnboardingAlreadyCompleted = computed(() => {
  if (!props.initialProfile) return false
  return (props.initialProfile.prefs & ProfilePrefs.ONBOARDING_COMPLETED) !== 0
})

const currentStep = ref<number>(1)
const isSubmitting = ref<boolean>(false)
const errorMessage = ref<string | null>(null)

// Step 1: Identity
const fallbackUsername = computed(() => {
  if (props.initialProfile?.username) return props.initialProfile.username
  const metaUsername = authStore.user.value?.user_metadata?.username
  if (metaUsername) return metaUsername
  const email = authStore.user.value?.email
  if (email) return email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
  return ''
})

const fullName = ref<string>(
  props.initialProfile?.display_name ||
  authStore.user.value?.user_metadata?.display_name ||
  authStore.user.value?.user_metadata?.full_name ||
  ''
)
const username = ref<string>(fallbackUsername.value)

// Step 2: Physical Stats
const sex = ref<number | null>(
  typeof props.initialProfile?.sex === 'number' ? props.initialProfile.sex : null
)
const birthYear = ref<number>(props.initialProfile?.birth_year || 1995)

const isImperial = ref<boolean>(
  props.initialProfile ? (props.initialProfile.prefs & ProfilePrefs.IMPERIAL) !== 0 : false
)
const trackMicros = ref<boolean>(
  props.initialProfile ? (props.initialProfile.prefs & ProfilePrefs.TRACK_MICROS) !== 0 : false
)

// Step 4: Micronutrient Selection State
const selectedMicros = ref<number>(props.initialProfile?.micros_opt || 0)

const microList = Object.entries(MicroNutrientFlags).map(([key, item]) => ({
  key,
  bit: item.bit,
  col: item.col,
  label: key.replace(/_/g, ' ')
}))

const isAllMicrosSelected = computed(() => {
  const allBits = microList.reduce((acc, m) => acc | m.bit, 0)
  return (selectedMicros.value & allBits) === allBits
})

const selectedMicrosCount = computed(() => {
  return microList.filter(m => (selectedMicros.value & m.bit) !== 0).length
})

const toggleMicro = (bit: number) => {
  if ((selectedMicros.value & bit) !== 0) {
    selectedMicros.value &= ~bit
  } else {
    selectedMicros.value |= bit
  }
}

const selectAllMicros = () => {
  const allBits = microList.reduce((acc, m) => acc | m.bit, 0)
  selectedMicros.value = allBits
}

const deselectAllMicros = () => {
  selectedMicros.value = 0
}

// Height: if imperial, display in inches, otherwise cm
const heightCm = ref<number | null>(
  props.initialProfile?.height_cm
    ? (isImperial.value ? Number((props.initialProfile.height_cm / 2.54).toFixed(1)) : props.initialProfile.height_cm)
    : null
)

// Current Weight from latestBiometric (EAV type = 1 or legacy weight_dg)
const initialWeightKg = computed(() => {
  if (!props.latestBiometric) return null
  if (props.latestBiometric.type === 1 && props.latestBiometric.val) {
    return props.latestBiometric.val / 10
  }
  return null
})

const weightKg = ref<number | null>(
  initialWeightKg.value !== null
    ? (isImperial.value ? Number((initialWeightKg.value / 0.453592).toFixed(1)) : Number(initialWeightKg.value.toFixed(1)))
    : null
)

const sexOptions = computed(() => [
  { value: 1, label: t('onboarding.step2.sex_male') },
  { value: 0, label: t('onboarding.step2.sex_female') },
  { value: 2, label: t('onboarding.step2.sex_other') }
])

const activityOptions = computed(() => [
  { value: 1, label: t('onboarding.step3.activity_sedentary') },
  { value: 2, label: t('onboarding.step3.activity_light') },
  { value: 3, label: t('onboarding.step3.activity_moderate') },
  { value: 4, label: t('onboarding.step3.activity_active') },
  { value: 5, label: t('onboarding.step3.activity_very_active') }
])

// Step 3: Goals & Activity
const activityLevel = ref<number | null>(
  typeof props.initialProfile?.activity_level === 'number' ? props.initialProfile.activity_level : null
)

const targetWeightKg = ref<number | null>(
  props.initialProfile?.target_weight_dg
    ? (isImperial.value
        ? Number(((props.initialProfile.target_weight_dg / 10) / 0.453592).toFixed(1))
        : Number((props.initialProfile.target_weight_dg / 10).toFixed(1)))
    : null
)

// Dynamic step counter based on trackMicros toggle
const totalSteps = computed(() => (trackMicros.value ? 4 : 3))

// Watch initialProfile props changes and populate reactive form state
watch(() => props.initialProfile, (p) => {
  if (!p) return
  if (p.username) {
    username.value = p.username
  } else if (!username.value && fallbackUsername.value) {
    username.value = fallbackUsername.value
  }
  if (p.display_name) fullName.value = p.display_name
  if (typeof p.sex === 'number' && sex.value === null) sex.value = p.sex
  if (p.birth_year) birthYear.value = p.birth_year
  if (p.prefs !== undefined) {
    isImperial.value = (p.prefs & ProfilePrefs.IMPERIAL) !== 0
    trackMicros.value = (p.prefs & ProfilePrefs.TRACK_MICROS) !== 0
  }
  if (typeof p.activity_level === 'number' && activityLevel.value === null) activityLevel.value = p.activity_level
  if (p.micros_opt !== undefined) selectedMicros.value = p.micros_opt
}, { immediate: true, deep: true })

const progressPercent = computed(() => {
  return Math.round((currentStep.value / totalSteps.value) * 100)
})

const isSavingStep = ref<boolean>(false)

const saveStep1 = async (): Promise<boolean> => {
  if (!authStore.user.value?.id) return false
  isSavingStep.value = true
  try {
    const userId = authStore.user.value.id
    const payload = {
      id: userId,
      username: username.value.trim().toLowerCase(),
      display_name: fullName.value.trim(),
      updated_at: new Date().toISOString()
    }
    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' })
    if (error) throw error
    return true
  } catch (err: any) {
    errorMessage.value = err.message || 'Failed to save profile identity.'
    return false
  } finally {
    isSavingStep.value = false
  }
}

const saveStep2 = async (): Promise<boolean> => {
  if (!authStore.user.value?.id) return false
  isSavingStep.value = true
  try {
    const userId = authStore.user.value.id
    const finalHeightCm = heightCm.value !== null
      ? (isImperial.value ? Math.round(heightCm.value * 2.54) : Math.round(heightCm.value))
      : null

    const finalWeightKg = weightKg.value !== null
      ? (isImperial.value ? weightKg.value * 0.453592 : weightKg.value)
      : 70

    const currentWeightDg = Math.round(finalWeightKg * 10)

    let bitmask = props.initialProfile?.prefs || 0
    if (isImperial.value) {
      bitmask |= ProfilePrefs.IMPERIAL
    } else {
      bitmask &= ~ProfilePrefs.IMPERIAL
    }

    const payload = {
      height_cm: finalHeightCm,
      birth_year: birthYear.value,
      sex: typeof sex.value === 'number' ? sex.value : null,
      prefs: bitmask,
      updated_at: new Date().toISOString()
    }
    const { error: profileErr } = await supabase.from('profiles').update(payload).eq('id', userId)
    if (profileErr) throw profileErr

    // Save initial weight into EAV biometrics table (cat: 1 = Body Comp, type: 1 = Body Weight, unit: 1 = dg)
    const { error: bioErr } = await supabase.from('biometrics').insert([{
      user_id: userId,
      cat: 1,
      type: 1,
      val: currentWeightDg,
      unit: 1,
      flags: 0,
      ts: new Date().toISOString()
    }])
    if (bioErr) throw bioErr

    return true
  } catch (err: any) {
    errorMessage.value = err.message || 'Failed to save biometrics.'
    return false
  } finally {
    isSavingStep.value = false
  }
}

const saveStep3 = async (): Promise<boolean> => {
  if (!authStore.user.value?.id) return false
  isSavingStep.value = true
  try {
    const userId = authStore.user.value.id

    let bitmask = props.initialProfile?.prefs || 0
    if (isImperial.value) {
      bitmask |= ProfilePrefs.IMPERIAL
    } else {
      bitmask &= ~ProfilePrefs.IMPERIAL
    }
    if (trackMicros.value) {
      bitmask |= ProfilePrefs.TRACK_MICROS
    } else {
      bitmask &= ~ProfilePrefs.TRACK_MICROS
    }

    const finalTargetWeightKg = targetWeightKg.value !== null
      ? (isImperial.value ? targetWeightKg.value * 0.453592 : targetWeightKg.value)
      : null

    const targetWeightDg = finalTargetWeightKg !== null ? Math.round(finalTargetWeightKg * 10) : null

    const payload = {
      target_weight_dg: targetWeightDg,
      activity_level: typeof activityLevel.value === 'number' ? activityLevel.value : null,
      prefs: bitmask,
      updated_at: new Date().toISOString()
    }
    const { error } = await supabase.from('profiles').update(payload).eq('id', userId)
    if (error) throw error
    return true
  } catch (err: any) {
    errorMessage.value = err.message || 'Failed to save lifestyle goals.'
    return false
  } finally {
    isSavingStep.value = false
  }
}

const nextStep = async () => {
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
    const ok = await saveStep1()
    if (!ok) return
  } else if (currentStep.value === 2) {
    if (heightCm.value === null || heightCm.value < 20 || heightCm.value > 260) {
      errorMessage.value = t('onboarding.step2.error_height')
      return
    }
    if (weightKg.value === null || weightKg.value < 20 || weightKg.value > 1100) {
      errorMessage.value = t('onboarding.step2.error_weight')
      return
    }
    const ok = await saveStep2()
    if (!ok) return
  } else if (currentStep.value === 3) {
    const ok = await saveStep3()
    if (!ok) return
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

const handleCompleteOnboarding = async () => {
  if (!authStore.user.value?.id) return
  if (heightCm.value === null || weightKg.value === null) {
    errorMessage.value = t('onboarding.step2.error_height')
    return
  }
  isSubmitting.value = true
  errorMessage.value = null

  try {
    const userId = authStore.user.value.id

    // Compute updated prefs and seal ONBOARDING_COMPLETED
    let bitmask = (props.initialProfile?.prefs || 0) | ProfilePrefs.ONBOARDING_COMPLETED
    if (isImperial.value) {
      bitmask |= ProfilePrefs.IMPERIAL
    } else {
      bitmask &= ~ProfilePrefs.IMPERIAL
    }
    if (trackMicros.value) {
      bitmask |= ProfilePrefs.TRACK_MICROS
    } else {
      bitmask &= ~ProfilePrefs.TRACK_MICROS
    }

    const finalTargetWeightKg = targetWeightKg.value !== null
      ? (isImperial.value ? targetWeightKg.value * 0.453592 : targetWeightKg.value)
      : null

    const targetWeightDg = finalTargetWeightKg !== null ? Math.round(finalTargetWeightKg * 10) : null

    // Update final profile with all step values, goals, micros_opt, and ONBOARDING_COMPLETED flag
    const finalHeightCm = isImperial.value ? Math.round(heightCm.value * 2.54) : Math.round(heightCm.value)

    const profilePayload: Partial<Profile> = {
      id: userId,
      username: username.value.trim().toLowerCase() || props.initialProfile?.username || fallbackUsername.value,
      display_name: fullName.value.trim() || undefined,
      height_cm: finalHeightCm,
      birth_year: birthYear.value,
      sex: typeof sex.value === 'number' ? sex.value : null,
      activity_level: typeof activityLevel.value === 'number' ? activityLevel.value : null,
      target_weight_dg: targetWeightDg,
      prefs: bitmask,
      micros_opt: trackMicros.value ? selectedMicros.value : 0,
      updated_at: new Date().toISOString()
    }

    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })

    if (profileErr) {
      console.error('[Onboarding] Profile update error:', profileErr)
      throw profileErr
    }

    const completedProfile: Profile = {
      id: userId,
      username: username.value.trim().toLowerCase() || props.initialProfile?.username || '',
      ...profilePayload
    } as Profile

    emit('completed', completedProfile)
  } catch (err: any) {
    console.error('[Onboarding] Completion failed:', err)
    errorMessage.value = err.message || 'Failed to complete onboarding.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Modal
    :show-close="false"
    max-width-class="max-w-lg"
    @close="isOnboardingAlreadyCompleted && emit('dismiss')"
  >
    <template #header>
      <!-- Top Progress & Header -->
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
          <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300 ease-out"
            :style="{ width: `${progressPercent}%` }"></div>
        </div>
      </div>
    </template>

    <template #default>
      <!-- Error Message -->
      <div v-if="errorMessage"
        class="bg-rose-950/60 border border-rose-900/80 rounded-xl p-3 flex items-start gap-2.5 text-rose-300 text-xs sm:text-sm">
        <AlertCircle class="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Step 1: Identity -->
      <div v-if="currentStep === 1" class="space-y-4">
        <div class="space-y-1">
          <h2 class="text-xl font-bold text-slate-100">{{ t('onboarding.step1.title') }}</h2>
          <p class="text-slate-400 text-xs sm:text-sm">{{ t('onboarding.step1.desc') }}</p>
        </div>

        <div class="space-y-3 pt-2">
          <FormInput v-model="fullName" :label="t('onboarding.step1.fullname_label')" :icon="User"
            icon-position="field-left" icon-color="text-emerald-400"
            :placeholder="t('onboarding.step1.fullname_placeholder')" required />

          <div>
            <FormInput v-model="username" :label="t('onboarding.step1.username_label')" :icon="AtSign"
              icon-position="field-left" icon-color="text-emerald-400"
              :placeholder="t('onboarding.step1.username_placeholder')" required input-class="font-mono" />
            <p class="text-[11px] text-slate-500 mt-1">{{ t('onboarding.step1.username_hint') }}</p>
          </div>
        </div>
      </div>

      <!-- Step 2: Physical Biometrics -->
      <div v-if="currentStep === 2" class="space-y-4">
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

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-300">{{ t('onboarding.step2.birth_year_label') }}</label>
            <YearPicker v-model="birthYear" :min-year="1930" />
          </div>

          <FormInput v-model="heightCm"
            :label="isImperial ? t('onboarding.step2.height_imperial_label') : t('onboarding.step2.height_metric_label')"
            type="number" :min="isImperial ? 20 : 50" :max="isImperial ? 100 : 260" :icon="Ruler"
            icon-position="field-left" icon-color="text-teal-400" :placeholder="isImperial ? 'e.g. 69' : 'e.g. 175'"
            required />

          <FormInput v-model="weightKg"
            :label="isImperial ? t('onboarding.step2.weight_imperial_label') : t('onboarding.step2.weight_metric_label')"
            type="number" step="0.1" :min="isImperial ? 45 : 20" :max="isImperial ? 1100 : 500" :icon="Scale"
            icon-position="field-left" icon-color="text-emerald-400"
            :placeholder="isImperial ? 'e.g. 154.0' : 'e.g. 70.0'" required />
        </div>

        <!-- Centered Unit System Toggle below Height & Weight -->
        <div class="flex justify-center pt-2">
          <div class="w-full sm:w-4/5">
            <ToggleSwitch v-model="isImperial" :label="t('onboarding.step2.units_toggle_label')"
              :left-label="t('onboarding.step2.units_metric')" :right-label="t('onboarding.step2.units_imperial')"
              :icon="Sliders" icon-color="text-emerald-400" />
          </div>
        </div>
      </div>

      <!-- Step 3: Goals & Activity Level -->
      <div v-if="currentStep === 3" class="space-y-4">
        <div class="space-y-1">
          <h2 class="text-xl font-bold text-slate-100">{{ t('onboarding.step3.title') }}</h2>
          <p class="text-slate-400 text-xs sm:text-sm">{{ t('onboarding.step3.desc') }}</p>
        </div>

        <div class="space-y-4 pt-2">
          <DropdownPicker
            v-model="activityLevel"
            :label="t('onboarding.step3.activity_label')"
            :placeholder="t('onboarding.step3.activity_placeholder') || 'Select activity level'"
            :options="activityOptions"
            :icon="Activity"
            icon-position="label-left"
            icon-color="text-cyan-400"
          />

          <FormInput v-model="targetWeightKg"
            :label="isImperial ? t('onboarding.step3.target_weight_imperial_label') : t('onboarding.step3.target_weight_metric_label')"
            type="number" step="0.1" :min="isImperial ? 45 : 20" :max="isImperial ? 1100 : 500" :icon="Target"
            icon-position="field-left" icon-color="text-purple-400"
            :placeholder="isImperial ? 'e.g. 150.0' : 'e.g. 68.0'" />

          <!-- Micronutrients Tracking Toggle -->
          <ToggleSwitch v-model="trackMicros" :label="t('onboarding.step3.micros_toggle_label')"
            :description="t('onboarding.step3.micros_toggle_desc')" :icon="PieChart" icon-color="text-teal-400" />
        </div>
      </div>

      <!-- Step 4: Micronutrient Selection Grid (Shown only if trackMicros is enabled) -->
      <div v-if="currentStep === 4 && trackMicros" class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <h2 class="text-xl font-bold text-slate-100">{{ t('onboarding.step4.title') }}</h2>
            <p class="text-slate-400 text-xs">{{ t('onboarding.step4.desc') }}</p>
          </div>
        </div>

        <!-- Select / Deselect All Controls -->
        <div class="flex items-center justify-between px-1 text-xs">
          <span class="text-slate-400 font-medium">
            {{ t('onboarding.step4.selected_count', { count: selectedMicrosCount }) }}
          </span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="isAllMicrosSelected ? deselectAllMicros() : selectAllMicros()"
              class="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer select-none"
            >
              {{ isAllMicrosSelected ? t('onboarding.step4.deselect_all') : t('onboarding.step4.select_all') }}
            </button>
          </div>
        </div>

        <!-- 2-Column Compact Scrollable Checkbox Grid -->
        <div class="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto overscroll-contain pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          <div
            v-for="micro in microList"
            :key="micro.key"
            @click="toggleMicro(micro.bit)"
            :class="[
              'flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer select-none text-xs',
              (selectedMicros & micro.bit) !== 0
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300 font-semibold'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
            ]"
          >
            <span class="capitalize truncate mr-1.5">{{ micro.label }}</span>
            <div
              :class="[
                'w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition border',
                (selectedMicros & micro.bit) !== 0
                  ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                  : 'border-slate-700 bg-slate-900'
              ]"
            >
              <Check v-if="(selectedMicros & micro.bit) !== 0" class="w-3 h-3 stroke-[3]" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Navigation Buttons -->
    <template #footer>
      <div class="flex items-center justify-between pt-4 border-t border-slate-800/80 gap-3">
        <button type="button" v-if="currentStep > 1" @click="prevStep"
          class="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition cursor-pointer">
          <ArrowLeft class="w-4 h-4" />
          <span>{{ t('common.back') }}</span>
        </button>
        <div v-else></div>

        <button 
          type="button" 
          v-if="currentStep < totalSteps" 
          :disabled="isSavingStep"
          @click="nextStep"
          class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Loader2 v-if="isSavingStep" class="w-4 h-4 animate-spin" />
          <template v-else>
            <span>{{ t('common.continue') }}</span>
            <ArrowRight class="w-4 h-4" />
          </template>
        </button>

        <button type="button" v-else :disabled="isSubmitting" @click="handleCompleteOnboarding"
          class="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 text-xs sm:text-sm font-bold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-emerald-950/40">
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <template v-else>
            <Check class="w-4 h-4 stroke-[3]" />
            <span>{{ t('common.finish') }}</span>
          </template>
        </button>
      </div>
    </template>
  </Modal>
</template>
