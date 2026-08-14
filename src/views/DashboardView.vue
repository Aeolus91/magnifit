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

const addMeal = async (mealData: Meal) => {
  if (!authStore.user.value?.id) return
  const id = uuidv7()
  const payload: Meal = {
    ...mealData,
    id,
    user_id: authStore.user.value.id,
    log_date: selectedDate.value
  }
  const { data, error } = await supabase.from<Meal>('meals').insert([payload])
  if (!error && data) {
    meals.value.unshift(data[0] || payload)
    if (!loggedDates.value.includes(selectedDate.value)) {
      loggedDates.value.push(selectedDate.value)
    }
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
    <header class="flex items-center justify-between border-b border-slate-800 pb-4">
      <div>
        <h1 class="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
          {{ t('brand.name') }}
        </h1>
      </div>
      <div class="flex items-center gap-3">
        <button @click="fetchAll" :title="t('dash.actions.refresh')"
          class="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 transition cursor-pointer">
          <RefreshCw class="w-4 h-4 text-slate-300" :class="{ 'animate-spin': loading }" />
        </button>

        <!-- Profile Button & Dropdown Menu -->
        <div class="relative"
          @focusout="(e) => { const ct = e.currentTarget as HTMLElement; if (ct && !ct.contains(e.relatedTarget as Node)) showProfileMenu = false }">
          <button @click="showProfileMenu = !showProfileMenu"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition cursor-pointer">
            <div
              class="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <UserIcon class="w-3 h-3" />
            </div>
            <span class="font-medium max-w-[140px] truncate">
              {{ userProfile?.display_name || userProfile?.username || authStore.user.value?.user_metadata?.display_name || authStore.user.value?.email }}
            </span>
            <ChevronDown class="w-3.5 h-3.5 text-slate-400 transition-transform"
              :class="{ 'rotate-180': showProfileMenu }" />
          </button>

          <!-- Dropdown Popover Backdrop for Mobile / Outside Click -->
          <div v-if="showProfileMenu" @click="showProfileMenu = false" class="fixed inset-0 z-30 bg-transparent"></div>

          <!-- Dropdown Popover -->
          <div v-if="showProfileMenu" @click="showProfileMenu = false" tabindex="-1"
            class="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-40 space-y-1 animate-in fade-in zoom-in-95 duration-100 focus:outline-none">
            <!-- User metadata header -->
            <div class="px-3 py-2 border-b border-slate-800/80 mb-1">
              <div class="text-xs font-semibold text-slate-200 truncate">
                {{ userProfile?.display_name || authStore.user.value?.user_metadata?.display_name || 'My Profile' }}
              </div>
              <div class="text-[11px] text-slate-500 truncate">
                {{ userProfile?.username ? `@${userProfile.username}` : authStore.user.value?.email }}
              </div>
            </div>

            <!-- Onboarding / Biometrics Settings Option -->
            <button type="button" @click="showOnboardingModal = true"
              class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition cursor-pointer">
              <Sliders class="w-3.5 h-3.5" />
              <span>{{ t('dash.profile.redo_onboarding') }}</span>
            </button>

            <!-- Logout Option -->
            <button type="button" @click="handleSignOut"
              class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition cursor-pointer">
              <LogOut class="w-3.5 h-3.5" />
              <span>{{ t('dash.actions.signout') }}</span>
            </button>
          </div>
        </div>
      </div>
    </header>

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
