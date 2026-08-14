<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from '../lib/router'
import { useI18n } from '../lib/i18n'
import { ProfilePrefs } from '../lib/bitmask'
import type { Meal, Profile } from '../types/fitness'
import { useWorkouts } from '../composables/useWorkouts'
import { useBiometrics } from '../composables/useBiometrics'
import { useWater } from '../composables/useWater'
import { useMeals } from '../composables/useMeals'
import OnboardingModal from '../components/OnboardingModal.vue'
import QuickAddModal from '../components/QuickAddModal.vue'
import WorkoutModal from '../components/WorkoutModal.vue'
import BiometricsModal from '../components/BiometricsModal.vue'
import DashboardHeader from '../components/DashboardHeader.vue'
import DashboardSummaryCards from '../components/DashboardSummaryCards.vue'
import DashboardTabSection from '../components/DashboardTabSection.vue'
import CalorieTrackerCard from '../components/CalorieTrackerCard.vue'
import WaterTrackerCard from '../components/WaterTrackerCard.vue'
import DatePickerPopover from '../components/DatePickerPopover.vue'
import { getTodayDateString, getLocalISODate, getUserTimezone } from '../lib/dateUtils'
import { uuidv7 } from '../lib/uuidv7'
import { Plus, RefreshCw, LogOut, User as UserIcon, ChevronDown, Sliders } from '@lucide/vue'

const authStore = useAuthStore()
const { navigate } = useRouter()
const { t } = useI18n()

const userProfile = ref<Profile | null>(null)
const showOnboardingModal = ref<boolean>(false)
const showAddModal = ref<boolean>(false)
const showWorkoutModal = ref<boolean>(false)
const showBiometricsModal = ref<boolean>(false)
const showProfileMenu = ref<boolean>(false)
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
  waterLogs,
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
  meals,
  filteredMeals,
  totalCaloriesConsumed,
  fetchMeals,
  addMeal,
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

const fetchProfile = async (userId: string) => {
  const { data } = await supabase.from<Profile>('profiles').select().eq('id', userId).get()
  if (data && data.length > 0) {
    userProfile.value = data[0]
  } else {
    userProfile.value = {
      id: userId,
      username: '',
      prefs: 0,
      micros_opt: 0
    }
  }
}

const onOnboardingCompleted = (updatedProfile: Profile) => {
  userProfile.value = updatedProfile
  showOnboardingModal.value = false
  fetchAll()
}

const fetchDailySummaries = async (userId: string) => {
  const { data } = await supabase
    .from<{ log_date: string }>('daily_summaries')
    .select('log_date')
    .eq('user_id', userId)
    .get()
  if (data) {
    data.forEach(s => {
      if (!loggedDates.value.includes(s.log_date)) loggedDates.value.push(s.log_date)
    })
  }
}

const fetchAll = async () => {
  if (!authStore.user.value?.id) return
  const userId = authStore.user.value.id
  loading.value = true
  await Promise.all([
    fetchProfile(userId),
    fetchWorkouts(userId),
    fetchBiometrics(userId),
    fetchMeals(userId),
    fetchWater(userId),
    fetchDailySummaries(userId)
  ])
  loading.value = false
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
    .on('INSERT', (payload) => {
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
        :total-water-ml="totalWaterMl"
        :latest-weight="latestWeight"
        :latest-bmi="latestBmi"
      />

    <!-- Main Metric Trackers: Animated Calories & Water Gauges -->
    <div class="space-y-4">
      <CalorieTrackerCard
        :consumed="totalCaloriesConsumed"
        :expenditure="totalActiveCalories"
        :target="2000"
      />
      <WaterTrackerCard
        :current-ml="totalWaterMl"
        :target-ml="userProfile?.target_water_ml || 2500"
        :can-undo="filteredWaterLogs.length > 0"
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
      @add-water="addWater"
      @edit-water="editWater"
      @delete-water="deleteWater"
    />
  </div>
  </div>
</template>
