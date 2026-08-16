import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from '../lib/router'
import { ProfilePrefs } from '../lib/bitmask'
import type { Profile } from '../types/fitness'
import { useWorkouts } from './useWorkouts'
import { useBiometrics } from './useBiometrics'
import { useWater } from './useWater'
import { useMeals } from './useMeals'
import { useEnergyExpenditure } from './useEnergyExpenditure'
import { getTodayDateString, getUserTimezone } from '../lib/dateUtils'
import { offlineSync } from '../lib/offlineSync'

export function useDashboard() {
  const authStore = useAuthStore()
  const { navigate } = useRouter()

  const userProfile = ref<Profile | null>(null)
  const showOnboardingModal = ref<boolean>(false)
  const showAddModal = ref<boolean>(false)
  const showWorkoutModal = ref<boolean>(false)
  const showBiometricsModal = ref<boolean>(false)
  const selectedDate = ref<string>(getTodayDateString())
  const loggedDates = ref<string[]>([])
  const loading = ref<boolean>(false)
  const activeTab = ref<'workouts' | 'biometrics' | 'meals' | 'water'>('workouts')

  const currentUserId = computed(() => authStore.user.value?.id)

  // Sub-composables
  const {
    filteredWorkouts,
    totalActiveCalories,
    fetchWorkouts,
    addWorkout,
    editWorkout,
    deleteWorkout
  } = useWorkouts(currentUserId, selectedDate, loggedDates)

  const {
    biometrics,
    filteredBiometrics,
    latestWeight,
    latestBmi,
    fetchBiometrics,
    addBiometric,
    editBiometric,
    deleteBiometric
  } = useBiometrics(currentUserId, userProfile, selectedDate, loggedDates)

  const {
    formulaUsed,
    hasBodyFat,
    bmr,
    tdee,
    recommendedCalories
  } = useEnergyExpenditure(userProfile, biometrics)

  const {
    filteredWaterLogs,
    totalWaterMl,
    fetchWater,
    addWater,
    editWater,
    deleteWater,
    undoLastWater,
    updateWaterTarget
  } = useWater(currentUserId, userProfile, selectedDate, loggedDates)

  const {
    filteredMeals,
    totalCaloriesConsumed,
    totalProteinG,
    totalCarbsG,
    totalFatG,
    fetchMeals,
    editMeal,
    deleteMeal
  } = useMeals(currentUserId, selectedDate, loggedDates)

  const isOnboardingPending = computed(() => {
    if (showOnboardingModal.value) return true
    if (!userProfile.value) return false
    return (userProfile.value.prefs & ProfilePrefs.ONBOARDING_COMPLETED) === 0
  })

  const fetchUserProfile = async (uid: string) => {
    const { data } = await supabase
      .from<Profile>('profiles')
      .select()
      .eq('id', uid)
      .single()

    if (data) {
      userProfile.value = data
    }
  }

  const onOnboardingCompleted = async (updated: Profile) => {
    userProfile.value = updated
    showOnboardingModal.value = false
  }

  const handleUpdateProfilePrefs = async (newPrefs: number) => {
    if (!currentUserId.value) return
    if (userProfile.value) {
      userProfile.value = { ...userProfile.value, prefs: newPrefs }
    }
    try {
      await supabase
        .from('profiles')
        .update({ prefs: newPrefs })
        .eq('id', currentUserId.value)
    } catch { }
  }

  const fetchAll = async (invalidate = false) => {
    if (!currentUserId.value) return
    if (invalidate) {
      try {
        localStorage.removeItem('mfit_recent_foods')
      } catch { }
    }
    loading.value = true
    await Promise.allSettled([
      fetchUserProfile(currentUserId.value),
      fetchWorkouts(currentUserId.value),
      fetchBiometrics(currentUserId.value),
      fetchMeals(currentUserId.value),
      fetchWater(currentUserId.value)
    ])
    loading.value = false
  }

  const refreshFetchers = computed(() => {
    const uid = currentUserId.value
    if (!uid) return []
    return [
      () => fetchUserProfile(uid),
      () => fetchWorkouts(uid),
      () => fetchBiometrics(uid),
      () => fetchMeals(uid),
      () => fetchWater(uid)
    ]
  })

  const updateCalorieTarget = async (targetCal: number) => {
    if (!currentUserId.value || !userProfile.value) return
    userProfile.value.target_cal = targetCal
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ target_cal: targetCal })
        .eq('id', currentUserId.value)

      if (error) {
        offlineSync.enqueue('profiles', 'update', { id: currentUserId.value, target_cal: targetCal })
      }
    } catch {
      offlineSync.enqueue('profiles', 'update', { id: currentUserId.value, target_cal: targetCal })
    }
  }

  const handleSignOut = async () => {
    await authStore.signOut()
    navigate('/')
  }

  onMounted(async () => {
    const userTimezone = getUserTimezone()
    await fetchAll()

    if (userProfile.value && userProfile.value.tz !== userTimezone) {
      try {
        await supabase
          .from('profiles')
          .update({ tz: userTimezone })
          .eq('id', currentUserId.value)
        userProfile.value.tz = userTimezone
      } catch { }
    }

    supabase.channel('public:workouts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workouts' }, () => {
        if (currentUserId.value) fetchWorkouts(currentUserId.value)
      })
      .subscribe()

    supabase.channel('public:biometrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'biometrics' }, () => {
        if (currentUserId.value) fetchBiometrics(currentUserId.value)
      })
      .subscribe()

    supabase.channel('public:meals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, () => {
        if (currentUserId.value) fetchMeals(currentUserId.value)
      })
      .subscribe()

    supabase.channel('public:water_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'water_logs' }, () => {
        if (currentUserId.value) fetchWater(currentUserId.value)
      })
      .subscribe()
  })

  return {
    userProfile,
    authStore,
    showOnboardingModal,
    showAddModal,
    showWorkoutModal,
    showBiometricsModal,
    selectedDate,
    loggedDates,
    loading,
    activeTab,
    isOnboardingPending,
    filteredWorkouts,
    totalActiveCalories,
    biometrics,
    filteredBiometrics,
    latestWeight,
    latestBmi,
    formulaUsed,
    hasBodyFat,
    bmr,
    tdee,
    recommendedCalories,
    filteredWaterLogs,
    totalWaterMl,
    filteredMeals,
    totalCaloriesConsumed,
    totalProteinG,
    totalCarbsG,
    totalFatG,
    refreshFetchers,
    navigate,
    onOnboardingCompleted,
    handleUpdateProfilePrefs,
    updateCalorieTarget,
    handleSignOut,
    addWorkout,
    editWorkout,
    deleteWorkout,
    addBiometric,
    editBiometric,
    deleteBiometric,
    addWater,
    editWater,
    deleteWater,
    undoLastWater,
    updateWaterTarget,
    editMeal,
    deleteMeal
  }
}
