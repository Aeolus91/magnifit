import { ref, computed, watch, type Ref } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { offlineSync } from '../lib/offlineSync'
import { useAuthStore } from '../stores/authStore'
import { ProfilePrefs, MicroNutrientFlags } from '../lib/bitmask'
import type { Profile, Biometric } from '../types/fitness'

export function useOnboarding(
  initialProfile: Ref<Profile | null | undefined>,
  latestBiometric: Ref<Biometric | null | undefined>
) {
  const authStore = useAuthStore()

  const isOnboardingAlreadyCompleted = computed(() => {
    if (!initialProfile.value) return false
    return (initialProfile.value.prefs & ProfilePrefs.ONBOARDING_COMPLETED) !== 0
  })

  const currentStep = ref<number>(1)
  const isSubmitting = ref<boolean>(false)
  const errorMessage = ref<string | null>(null)

  // Step 1: Identity
  const fallbackUsername = computed(() => {
    if (initialProfile.value?.username) return initialProfile.value.username
    const metaUsername = authStore.user.value?.user_metadata?.username
    if (metaUsername) return metaUsername
    const email = authStore.user.value?.email
    if (email) return email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
    return ''
  })

  const fullName = ref<string>(
    initialProfile.value?.display_name ||
    authStore.user.value?.user_metadata?.display_name ||
    authStore.user.value?.user_metadata?.full_name ||
    ''
  )
  const username = ref<string>(fallbackUsername.value)

  // Step 2: Physical Stats & Units
  const isImperial = ref<boolean>(
    initialProfile.value ? (initialProfile.value.prefs & ProfilePrefs.IMPERIAL) !== 0 : false
  )
  const trackMicros = ref<boolean>(
    initialProfile.value ? (initialProfile.value.prefs & ProfilePrefs.TRACK_MICROS) !== 0 : false
  )

  const sex = ref<number | null>(
    typeof initialProfile.value?.sex === 'number' ? initialProfile.value.sex : null
  )
  const birthYear = ref<number>(initialProfile.value?.birth_year || 1995)

  const heightCm = ref<number | null>(
    initialProfile.value?.height_cm
      ? (isImperial.value ? Number((initialProfile.value.height_cm / 2.54).toFixed(1)) : initialProfile.value.height_cm)
      : null
  )

  const initialWeightKg = computed(() => {
    if (!latestBiometric.value) return null
    if (latestBiometric.value.type === 1 && latestBiometric.value.val) {
      return latestBiometric.value.val / 10
    }
    return null
  })

  const weightKg = ref<number | null>(
    initialWeightKg.value !== null
      ? (isImperial.value ? Number((initialWeightKg.value / 0.453592).toFixed(1)) : Number(initialWeightKg.value.toFixed(1)))
      : null
  )

  // Step 3: Goals & Activity
  const activityLevel = ref<number | null>(
    typeof initialProfile.value?.activity_level === 'number' ? initialProfile.value.activity_level : null
  )

  const targetWeightKg = ref<number | null>(
    initialProfile.value?.target_weight_dg
      ? (isImperial.value
        ? Number(((initialProfile.value.target_weight_dg / 10) / 0.453592).toFixed(1))
        : Number((initialProfile.value.target_weight_dg / 10).toFixed(1)))
      : null
  )

  // Step 4: Micronutrient Selection
  const selectedMicros = ref<number>(initialProfile.value?.micros_opt || 0)

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

  // Dynamic step counter based on trackMicros toggle
  const totalSteps = computed(() => (trackMicros.value ? 4 : 3))

  const progressPercent = computed(() => {
    return Math.round((currentStep.value / totalSteps.value) * 100)
  })

  // Watch initialProfile changes
  watch(initialProfile, (p) => {
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

  // Complete Onboarding with Atomic Persistence
  const completeOnboarding = async (): Promise<Profile | null> => {
    if (!authStore.user.value?.id) return null
    if (heightCm.value === null || weightKg.value === null) {
      return null
    }

    isSubmitting.value = true
    errorMessage.value = null

    try {
      const userId = authStore.user.value.id

      // Compute updated prefs and seal ONBOARDING_COMPLETED
      let bitmask = (initialProfile.value?.prefs || 0) | ProfilePrefs.ONBOARDING_COMPLETED
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

      // Compute baseline caloric target quietly in the background (Mifflin-St Jeor)
      const finalHeightCm = isImperial.value ? Math.round(heightCm.value * 2.54) : Math.round(heightCm.value)
      const finalWeightRawKg = isImperial.value ? weightKg.value * 0.453592 : weightKg.value
      const userAge = Math.max(15, new Date().getFullYear() - birthYear.value)

      // Sex offset: 1 = Male (+5), 0 = Female (-161), default = -78
      const sexDiff = sex.value === 1 ? 5 : (sex.value === 0 ? -161 : -78)
      const baselineBmr = Math.round((10 * finalWeightRawKg) + (6.25 * finalHeightCm) - (5 * userAge) + sexDiff)

      // Activity level multiplier
      let actMultiplier = 1.375
      if (activityLevel.value === 1) actMultiplier = 1.2
      else if (activityLevel.value === 2) actMultiplier = 1.375
      else if (activityLevel.value === 3) actMultiplier = 1.55
      else if (activityLevel.value === 4) actMultiplier = 1.725
      else if (activityLevel.value === 5) actMultiplier = 1.9

      const maintenanceTdee = Math.round(baselineBmr * actMultiplier)
      let calculatedCaloricTarget = maintenanceTdee

      if (finalTargetWeightKg !== null) {
        const weightDiff = finalTargetWeightKg - finalWeightRawKg
        if (weightDiff <= -1.5) {
          calculatedCaloricTarget = Math.max(1200, maintenanceTdee - 500)
        } else if (weightDiff >= 1.5) {
          calculatedCaloricTarget = maintenanceTdee + 300
        }
      }

      const finalWeightDg = Math.round(finalWeightRawKg * 10)
      const initialWeightDg = latestBiometric.value?.val || null

      const effectiveUsername = username.value.trim().toLowerCase() || initialProfile.value?.username || fallbackUsername.value
      const effectiveDisplayName = fullName.value.trim() || undefined

      const isAuthDirty = (fullName.value.trim() !== (initialProfile.value?.display_name || '')) ||
        (username.value.trim().toLowerCase() !== (initialProfile.value?.username || ''))

      const isProfileDirty = !isOnboardingAlreadyCompleted.value ||
        isAuthDirty ||
        finalHeightCm !== (initialProfile.value?.height_cm || null) ||
        birthYear.value !== (initialProfile.value?.birth_year || null) ||
        sex.value !== (typeof initialProfile.value?.sex === 'number' ? initialProfile.value.sex : null) ||
        activityLevel.value !== (typeof initialProfile.value?.activity_level === 'number' ? initialProfile.value.activity_level : null) ||
        targetWeightDg !== (initialProfile.value?.target_weight_dg || null) ||
        bitmask !== (initialProfile.value?.prefs || 0) ||
        (trackMicros.value ? selectedMicros.value : 0) !== (initialProfile.value?.micros_opt || 0)

      // 1. Sync auth user metadata in auth.users only if dirty
      if (isAuthDirty) {
        try {
          await supabase.auth.updateUser({
            data: {
              display_name: effectiveDisplayName,
              username: effectiveUsername
            }
          })
        } catch {}
      }

      // 2. Insert initial weight into biometrics if not previously logged or modified
      if (initialWeightDg === null || finalWeightDg !== initialWeightDg) {
        const bioPayload = {
          user_id: userId,
          cat: 1,
          type: 1,
          val: finalWeightDg,
          unit: 1,
          flags: 0,
          ts: new Date().toISOString()
        }
        const { error: bioErr } = await supabase.from('biometrics').insert([bioPayload])
        if (bioErr) {
          offlineSync.enqueue('biometrics', 'insert', bioPayload)
        }
      }

      // 3. Update profile only if fields changed or first-time setup
      const profilePayload: Partial<Profile> = {
        id: userId,
        username: effectiveUsername,
        display_name: effectiveDisplayName,
        height_cm: finalHeightCm,
        birth_year: birthYear.value,
        sex: typeof sex.value === 'number' ? sex.value : null,
        activity_level: typeof activityLevel.value === 'number' ? activityLevel.value : null,
        target_weight_dg: targetWeightDg,
        target_cal: calculatedCaloricTarget,
        prefs: bitmask,
        micros_opt: trackMicros.value ? selectedMicros.value : 0,
        updated_at: new Date().toISOString()
      }

      if (isProfileDirty) {
        const { error: profileErr } = await supabase
          .from('profiles')
          .upsert(profilePayload, { onConflict: 'id' })

        if (profileErr) {
          offlineSync.enqueue('profiles', 'update', profilePayload)
        }
      }

      return {
        id: userId,
        username: effectiveUsername,
        ...profilePayload
      } as Profile
    } catch (err: any) {
      console.error('[Onboarding] Completion failed:', err)
      errorMessage.value = err.message || 'Failed to complete onboarding.'
      return null
    } finally {
      isSubmitting.value = false
    }
  }

  return {
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
  }
}
