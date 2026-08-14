<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from '../lib/router'
import { ProfilePrefs } from '../lib/bitmask'
import type { Profile } from '../types/fitness'
import { useWorkouts } from '../composables/useWorkouts'
import { useBiometrics } from '../composables/useBiometrics'
import { useWater } from '../composables/useWater'
import { useMeals } from '../composables/useMeals'
import { useEnergyExpenditure } from '../composables/useEnergyExpenditure'
import OnboardingModal from '../components/modals/OnboardingModal.vue'
import QuickAddModal from '../components/modals/QuickAddModal.vue'
import WorkoutModal from '../components/modals/WorkoutModal.vue'
import BiometricsModal from '../components/modals/BiometricsModal.vue'
import DashboardHeader from '../components/layout/DashboardHeader.vue'
import DashboardSummaryCards from '../components/cards/DashboardSummaryCards.vue'
import DashboardTabSection from '../components/sections/DashboardTabSection.vue'
import CalorieTrackerCard from '../components/cards/CalorieTrackerCard.vue'
import WaterTrackerCard from '../components/cards/WaterTrackerCard.vue'
import DatePickerPopover from '../components/atoms/DatePickerPopover.vue'
import { getTodayDateString, getUserTimezone } from '../lib/dateUtils'
import { offlineSync } from '../lib/offlineSync'
import { Plus } from '@lucide/vue'

const authStore = useAuthStore()
const { navigate } = useRouter()

const userProfile = ref<Profile | null>(null)
const showOnboardingModal = ref<boolean>(false)
const showAddModal = ref<boolean>(false)
const showWorkoutModal = ref<boolean>(false)
const showBiometricsModal = ref<boolean>(false)
const selectedDate = ref<string>(getTodayDateString())
const loggedDates = ref<string[]>([])

const currentUserId = computed(() => authStore.user.value?.id)

// Composables Architecture
const {
  workouts,
  filteredWorkouts,
  totalActiveCalories,
  fetchWorkouts,
  addWorkout,
  editWorkout,
  deleteWorkout
} = useWorkouts(currentUserId, selectedDate, loggedDates)

const {
  biometrics,
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
  fetchMeals,
  editMeal,
  deleteMeal
} = useMeals(currentUserId, selectedDate, loggedDates)

const loading = ref(false)
const activeTab = ref<'workouts' | 'biometrics' | 'meals' | 'water'>('workouts')

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
  if (currentUserId.value) {
    await fetchUserProfile(currentUserId.value)
    await fetchBiometrics(currentUserId.value)
  }
}

const fetchAll = async () => {
  if (!currentUserId.value) return
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

  // Auto-sync client timezone to user profile in background
  if (authStore.user.value?.id && userProfile.value && userProfile.value.tz !== userTimezone) {
    supabase.from('profiles').update({ tz: userTimezone }).eq('id', authStore.user.value.id)
      .then(() => {
        if (userProfile.value) userProfile.value.tz = userTimezone
      })
  }

  supabase.channel('public:workouts')
    .on('INSERT', (payload: any) => {
      if (payload.new && payload.new.user_id === authStore.user.value?.id) {
        workouts.value.unshift(payload.new)
      }
    })
    .subscribe()
})
</script>

<template>
  <div class="w-full">
    <!-- Progressive Onboarding Gate -->
    <OnboardingModal v-if="isOnboardingPending" :initial-profile="userProfile" :latest-biometric="biometrics[0] || null"
      @completed="onOnboardingCompleted" @dismiss="showOnboardingModal = false" />

    <!-- Quick Add Modal -->
    <QuickAddModal
      :show="showAddModal"
      @close="showAddModal = false"
      @select="(tab) => {
        showAddModal = false
        if (tab === 'meals') {
          navigate('/meals', false, { logDate: selectedDate })
        } else if (tab === 'workouts') {
          activeTab = 'workouts'
          showWorkoutModal = true
        } else if (tab === 'biometrics') {
          activeTab = 'biometrics'
          showBiometricsModal = true
        }
      }"
    />

    <!-- Standalone Workout Modal triggered via Quick Add -->
    <WorkoutModal
      :show="showWorkoutModal"
      @close="showWorkoutModal = false"
      @submit="addWorkout"
    />

    <!-- Standalone Biometrics Modal triggered via Quick Add -->
    <BiometricsModal
      :show="showBiometricsModal"
      @close="showBiometricsModal = false"
      @submit="addBiometric"
    />

    <div class="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <!-- App Header & Profile Menu Component -->
      <DashboardHeader
        :user-profile="userProfile"
        :user-email="authStore.user.value?.email"
        :loading="loading"
        @refresh="fetchAll"
        @open-onboarding="showOnboardingModal = true"
        @sign-out="handleSignOut"
      />

    <!-- Date Navigation Popover & Add Quick Action -->
    <div class="flex items-center justify-between gap-3">
      <DatePickerPopover v-model="selectedDate" :logged-dates="loggedDates" />
      <button
        type="button"
        @click="showAddModal = true"
        class="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition active:scale-95 shadow-md shadow-emerald-950/40 cursor-pointer"
        title="Quick Log"
      >
        <Plus class="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>

      <!-- Summary Cards Grid (Scoped to selected date) -->
      <DashboardSummaryCards
        :total-active-calories="totalActiveCalories"
        :latest-weight="latestWeight"
        :latest-bmi="latestBmi"
        :is-loading="loading"
      />

      <!-- Main Metric Trackers: Animated Calories & Water Gauges -->
      <div class="space-y-4">
        <CalorieTrackerCard
          :consumed="totalCaloriesConsumed"
          :expenditure="totalActiveCalories"
          :target="userProfile?.target_cal || 2000"
          :recommended-target="recommendedCalories"
          :bmr="bmr"
          :tdee="tdee"
          :formula-used="formulaUsed"
          :has-body-fat="hasBodyFat"
          :is-loading="loading"
          @update-target="updateCalorieTarget"
          @navigate-meals="navigate('/meals', false, { logDate: selectedDate, tab: 'summary' })"
        />
        <WaterTrackerCard
          :current-ml="totalWaterMl"
          :target-ml="userProfile?.target_water_ml || 2500"
          :can-undo="filteredWaterLogs.length > 0"
          :is-loading="loading"
          @add-water="addWater"
          @undo="undoLastWater"
          @update-target="updateWaterTarget"
        />
      </div>

    <!-- Granular Tabbed Feature Sections Component -->
    <DashboardTabSection
      v-model="activeTab"
      :target-date="selectedDate"
      :workouts="filteredWorkouts"
      :biometrics="biometrics"
      :meals="filteredMeals"
      :water-logs="filteredWaterLogs"
      @add-workout="addWorkout"
      @edit-workout="editWorkout"
      @delete-workout="deleteWorkout"
      @add-biometric="addBiometric"
      @edit-biometric="editBiometric"
      @delete-biometric="deleteBiometric"
      @log-meal="navigate('/meals', false, { logDate: selectedDate })"
      @edit-meal="editMeal"
      @delete-meal="deleteMeal"
      @update-micros="(id, newMicros) => {
        const m = filteredMeals.find(item => item.id === id)
        if (m) editMeal({ ...m, micros: newMicros })
      }"
      @add-water="addWater"
      @edit-water="editWater"
      @delete-water="deleteWater"
    />
  </div>
  </div>
</template>
