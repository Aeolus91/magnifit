<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from '../lib/router'
import { useI18n } from '../lib/i18n'
import { ProfilePrefs, WORKOUT_CATEGORIES, encodeWorkoutFlags } from '../lib/bitmask'
import type { Workout, Biometric, Meal, WaterLog, Profile } from '../types/fitness'
import OnboardingModal from '../components/OnboardingModal.vue'
import QuickAddModal from '../components/QuickAddModal.vue'
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
const showProfileMenu = ref<boolean>(false)
const selectedDate = ref<string>(getTodayDateString())

const isOnboardingPending = computed(() => {
  if (showOnboardingModal.value) return true
  if (!userProfile.value) return false
  return (userProfile.value.prefs & ProfilePrefs.ONBOARDING_COMPLETED) === 0
})

const workouts = ref<Workout[]>([])
const biometrics = ref<Biometric[]>([])
const meals = ref<Meal[]>([])
const waterLogs = ref<WaterLog[]>([])
const loggedDates = ref<string[]>([])
const loading = ref(false)

const activeTab = ref<'workouts' | 'biometrics' | 'meals' | 'water'>('workouts')

// Date-scoped collections matching the selected target log_date in context
const filteredWorkouts = computed(() =>
  workouts.value.filter(w => (w.log_date || getLocalISODate(w.ts)) === selectedDate.value)
)
const filteredMeals = computed(() =>
  meals.value.filter(m => (m.log_date || getLocalISODate(m.ts)) === selectedDate.value)
)
const filteredWaterLogs = computed(() =>
  waterLogs.value.filter(w => (w.log_date || getLocalISODate(w.ts)) === selectedDate.value)
)

// Computed metrics scoped to selected date
const totalActiveCalories = computed(() =>
  filteredWorkouts.value.reduce((acc, w) => acc + (w.active_calories || 0), 0)
)
const totalCaloriesConsumed = computed(() =>
  filteredMeals.value.reduce((acc, m) => acc + (m.calories || 0), 0)
)
const totalWaterMl = computed(() =>
  filteredWaterLogs.value.reduce((acc, w) => acc + (w.amount_ml || 0), 0)
)

// Weight is an exception: always displays the user's latest most current weight
const latestWeight = computed(() => {
  const latest = biometrics.value[0]
  if (!latest) return 0
  if (latest.weight_dg !== undefined && latest.weight_dg !== null) {
    return Number((latest.weight_dg / 10).toFixed(1))
  }
  return latest.weight_kg || 0
})

const fetchProfile = async (userId: string) => {
  const { data } = await supabase.from<Profile>('profiles').select().eq('id', userId).get()
  if (data && data.length > 0) {
    userProfile.value = data[0]
  } else {
    // If not existing yet, initialize placeholder to trigger onboarding
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

const fetchAll = async () => {
  if (!authStore.user.value?.id) return
  const userId = authStore.user.value.id
  loading.value = true

  await fetchProfile(userId)

  const [wRes, bRes, mRes, watRes, sumRes] = await Promise.all([
    supabase.from<Workout>('workouts').select().eq('user_id', userId).order('log_date', { ascending: false }).order('id', { ascending: false }).get(),
    supabase.from<Biometric>('biometrics').select().eq('user_id', userId).order('log_date', { ascending: false }).order('id', { ascending: false }).get(),
    supabase.from<Meal>('meals').select().eq('user_id', userId).order('log_date', { ascending: false }).order('id', { ascending: false }).get(),
    supabase.from<WaterLog>('water_logs').select().eq('user_id', userId).order('log_date', { ascending: false }).order('id', { ascending: false }).get(),
    supabase.from<{ log_date: string }>('daily_summaries').select('log_date').eq('user_id', userId).get()
  ])

  if (wRes.data) workouts.value = wRes.data
  if (bRes.data) biometrics.value = bRes.data
  if (mRes.data) meals.value = mRes.data
  if (watRes.data) waterLogs.value = watRes.data
  if (sumRes.data) loggedDates.value = sumRes.data.map(s => s.log_date)

  loading.value = false
}

const addWorkout = async (workoutData: Workout) => {
  if (!authStore.user.value?.id) return
  const id = uuidv7()
  const payload: Workout = {
    ...workoutData,
    id,
    user_id: authStore.user.value.id,
    log_date: selectedDate.value
  }
  const { data, error } = await supabase.from<Workout>('workouts').insert([payload])
  if (!error && data) {
    workouts.value.unshift(data[0] || payload)
    if (!loggedDates.value.includes(selectedDate.value)) {
      loggedDates.value.push(selectedDate.value)
    }
  }
}

const editWorkout = async (workoutData: Workout) => {
  if (!authStore.user.value?.id || !workoutData.id) return
  const { data, error } = await supabase
    .from<Workout>('workouts')
    .update({
      workout_type: workoutData.workout_type,
      active_calories: workoutData.active_calories,
      total_calories: workoutData.total_calories,
      duration_minutes: workoutData.duration_minutes
    })
    .eq('id', workoutData.id)

  if (!error) {
    const idx = workouts.value.findIndex(w => w.id === workoutData.id)
    if (idx !== -1) {
      workouts.value[idx] = { ...workouts.value[idx], ...workoutData }
    }
  }
}

const deleteWorkout = async (id: string) => {
  if (!authStore.user.value?.id || !id) return
  const { error } = await supabase.from('workouts').delete().eq('id', id)
  if (!error) {
    const idx = workouts.value.findIndex(w => w.id === id)
    if (idx !== -1) {
      workouts.value.splice(idx, 1)
    }
  }
}

const addBiometric = async (bioData: { weight_kg: number; waist_cm?: number; chest_cm?: number; hips_cm?: number; biceps_cm?: number }) => {
  if (!authStore.user.value?.id) return
  const id = uuidv7()
  const weightKgVal = bioData.weight_kg || 0
  const payload: Biometric = {
    id,
    user_id: authStore.user.value.id,
    weight_dg: Math.round(weightKgVal * 10),
    waist_mm: bioData.waist_cm ? Math.round(bioData.waist_cm * 10) : null,
    chest_mm: bioData.chest_cm ? Math.round(bioData.chest_cm * 10) : null,
    hips_mm: bioData.hips_cm ? Math.round(bioData.hips_cm * 10) : null,
    biceps_mm: bioData.biceps_cm ? Math.round(bioData.biceps_cm * 10) : null,
    log_date: selectedDate.value
  }
  const { data, error } = await supabase.from('biometrics').insert([payload])
  if (!error && data) {
    biometrics.value.unshift(data[0] || payload)
    if (!loggedDates.value.includes(selectedDate.value)) {
      loggedDates.value.push(selectedDate.value)
    }
  }
}

const editBiometric = async (bioData: { id: string; weight_kg: number; waist_cm?: number; chest_cm?: number; hips_cm?: number; biceps_cm?: number }) => {
  if (!authStore.user.value?.id || !bioData.id) return
  const weightKgVal = bioData.weight_kg || 0
  const updatePayload = {
    weight_dg: Math.round(weightKgVal * 10),
    waist_mm: bioData.waist_cm ? Math.round(bioData.waist_cm * 10) : null,
    chest_mm: bioData.chest_cm ? Math.round(bioData.chest_cm * 10) : null,
    hips_mm: bioData.hips_cm ? Math.round(bioData.hips_cm * 10) : null,
    biceps_mm: bioData.biceps_cm ? Math.round(bioData.biceps_cm * 10) : null
  }
  const { error } = await supabase
    .from('biometrics')
    .update(updatePayload)
    .eq('id', bioData.id)

  if (!error) {
    const idx = biometrics.value.findIndex(b => b.id === bioData.id)
    if (idx !== -1) {
      biometrics.value[idx] = {
        ...biometrics.value[idx],
        ...updatePayload,
        weight_kg: bioData.weight_kg
      }
    }
  }
}

const deleteBiometric = async (id: string) => {
  if (!authStore.user.value?.id || !id) return
  const { error } = await supabase.from('biometrics').delete().eq('id', id)
  if (!error) {
    const idx = biometrics.value.findIndex(b => b.id === id)
    if (idx !== -1) {
      biometrics.value.splice(idx, 1)
    }
  }
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

const addWater = async (amount: number) => {
  if (!authStore.user.value?.id) return
  const id = uuidv7()
  const payload: WaterLog = {
    id,
    amount_ml: amount,
    user_id: authStore.user.value.id,
    log_date: selectedDate.value
  }
  const { data, error } = await supabase.from<WaterLog>('water_logs').insert([payload])
  if (!error && data) {
    waterLogs.value.unshift(data[0] || payload)
    if (!loggedDates.value.includes(selectedDate.value)) {
      loggedDates.value.push(selectedDate.value)
    }
  }
}

const undoLastWater = async () => {
  if (!authStore.user.value?.id || filteredWaterLogs.value.length === 0) return
  const lastLog = filteredWaterLogs.value[0]
  if (!lastLog.id) return

  const { error } = await supabase.from('water_logs').delete().eq('id', lastLog.id)
  if (error) {
    console.error('Failed to delete water log:', error)
    return
  }
  
  // Remove from master waterLogs collection
  const idx = waterLogs.value.findIndex(w => w.id === lastLog.id)
  if (idx !== -1) {
    waterLogs.value.splice(idx, 1)
  }
}

const updateWaterTarget = async (targetMl: number) => {
  if (!authStore.user.value?.id) return
  if (userProfile.value) {
    userProfile.value.target_water_ml = targetMl
  }
  await supabase.from('profiles').update({
    target_water_ml: targetMl,
    updated_at: new Date().toISOString()
  }).eq('id', authStore.user.value.id)
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
        if (tab === 'meals') {
          navigate('/meals', false, { logDate: selectedDate })
        } else {
          activeTab = tab
        }
      }"
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
              {{ authStore.user.value?.user_metadata?.display_name || authStore.user.value?.email }}
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
                {{ authStore.user.value?.user_metadata?.display_name || 'My Profile' }}
              </div>
              <div class="text-[11px] text-slate-500 truncate">
                {{ authStore.user.value?.email }}
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

    <!-- 3 Summary Metrics Component -->
    <DashboardSummaryCards
      :total-active-calories="totalActiveCalories"
      :total-water-ml="totalWaterMl"
      :latest-weight="latestWeight"
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
    />
  </div>
  </div>
</template>
