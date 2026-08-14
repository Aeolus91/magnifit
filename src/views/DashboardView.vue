<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from '../lib/router'
import { useI18n } from '../lib/i18n'
import { ProfilePrefs } from '../lib/bitmask'
import type { Workout, Biometric, Meal, WaterLog, Profile } from '../types/fitness'
import OnboardingModal from '../components/OnboardingModal.vue'
import StatCard from '../components/StatCard.vue'
import CalorieTrackerCard from '../components/CalorieTrackerCard.vue'
import WaterTrackerCard from '../components/WaterTrackerCard.vue'
import DatePickerPopover from '../components/DatePickerPopover.vue'
import { getTodayDateString, getLocalISODate, getUserTimezone } from '../lib/dateUtils'
import { uuidv7 } from '../lib/uuidv7'
import { Activity, Flame, Droplets, Scale, Plus, RefreshCw, LogOut, User as UserIcon, ChevronDown, Sliders } from '@lucide/vue'

const authStore = useAuthStore()
const { navigate } = useRouter()
const { t } = useI18n()

const userProfile = ref<Profile | null>(null)
const showOnboardingModal = ref<boolean>(false)
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

const newWorkout = ref<Workout>({
  workout_type: 'Strength Training',
  active_calories: 250,
  total_calories: 320,
  duration_minutes: 45
})

const newBiometric = ref<Biometric>({
  weight_kg: 70,
  waist_cm: 80,
  chest_cm: 95
})

const newMeal = ref<Meal>({
  meal_name: 'Chicken Rice Bowl',
  calories: 550,
  protein_g: 42,
  carbs_g: 60,
  fat_g: 12
})

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

const addWorkout = async () => {
  if (!authStore.user.value?.id) return
  const id = uuidv7()
  const payload: Workout = {
    ...newWorkout.value,
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

const addBiometric = async () => {
  if (!authStore.user.value?.id) return
  const id = uuidv7()
  const weightKgVal = newBiometric.value.weight_kg || 0
  const payload: Biometric = {
    id,
    user_id: authStore.user.value.id,
    weight_dg: Math.round(weightKgVal * 10),
    waist_mm: newBiometric.value.waist_cm ? Math.round(newBiometric.value.waist_cm * 10) : null,
    chest_mm: newBiometric.value.chest_cm ? Math.round(newBiometric.value.chest_cm * 10) : null,
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

const addMeal = async () => {
  if (!authStore.user.value?.id) return
  const id = uuidv7()
  const payload: Meal = {
    ...newMeal.value,
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

const handleSignOut = async () => {
  await authStore.signOut()
  navigate('/')
}

onMounted(async () => {
  const userTimezone = getUserTimezone()
  console.log(`[mfit] Client timezone detected: ${userTimezone}`)

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

    <!-- Date Navigation Popover -->
    <div class="flex items-center justify-between">
      <DatePickerPopover v-model="selectedDate" :logged-dates="loggedDates" />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        :label="t('dash.stats.active_burn')"
        :value="totalActiveCalories"
        unit="kcal"
        :icon="Flame"
        variant="emerald"
      />
      <StatCard
        :label="t('dash.stats.water_intake')"
        :value="totalWaterMl"
        unit="ml"
        :icon="Droplets"
        variant="cyan"
      />
      <StatCard
        :label="t('dash.stats.latest_weight')"
        :value="latestWeight || '--'"
        unit="kg"
        :icon="Scale"
        variant="purple"
      />
    </div>

    <!-- Main Metric Trackers: Animated Calories & Water Gauges -->
    <div class="space-y-4">
      <CalorieTrackerCard
        :consumed="totalCaloriesConsumed"
        :expenditure="totalActiveCalories"
        :target="2000"
      />
      <WaterTrackerCard
        :current-ml="totalWaterMl"
        :target-ml="2500"
        :can-undo="filteredWaterLogs.length > 0"
        @add-water="addWater"
        @undo="undoLastWater"
      />
    </div>

    <div class="flex border-b border-slate-800 space-x-4">
      <button v-for="tab in (['workouts', 'biometrics', 'meals', 'water'] as const)" :key="tab" @click="activeTab = tab"
        :class="[
          'pb-3 font-medium capitalize transition-colors border-b-2 text-sm cursor-pointer',
          activeTab === tab
            ? 'border-emerald-500 text-emerald-400'
            : 'border-transparent text-slate-400 hover:text-slate-200'
        ]">
        {{ t(`dash.nav.${tab}`) }}
      </button>
    </div>

    <div v-if="activeTab === 'workouts'" class="space-y-6">
      <form @submit.prevent="addWorkout"
        class="bg-slate-900 border border-slate-800 p-4 rounded-xl grid sm:grid-cols-4 gap-4 items-end">
        <div>
          <label class="text-xs text-slate-400 block mb-1">Workout Type</label>
          <input v-model="newWorkout.workout_type"
            class="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            required />
        </div>
        <div>
          <label class="text-xs text-slate-400 block mb-1">Active Cal</label>
          <input type="number" v-model.number="newWorkout.active_calories"
            class="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            required />
        </div>
        <div>
          <label class="text-xs text-slate-400 block mb-1">Duration (min)</label>
          <input type="number" v-model.number="newWorkout.duration_minutes"
            class="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            required />
        </div>
        <button type="submit"
          class="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-4 rounded text-sm flex items-center justify-center gap-2 cursor-pointer">
          <Plus class="w-4 h-4" /> Log Workout
        </button>
      </form>

      <div class="space-y-2">
        <div v-for="w in filteredWorkouts" :key="w.id"
          class="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between text-sm">
          <div class="flex items-center gap-3">
            <Activity class="w-5 h-5 text-emerald-400" />
            <div>
              <div class="font-semibold text-slate-200">{{ w.workout_type }}</div>
              <div class="text-xs text-slate-400">{{ w.duration_minutes }} min</div>
            </div>
          </div>
          <div class="text-right">
            <span class="font-bold text-emerald-400">{{ w.active_calories }} kcal</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'water'" class="space-y-6">
      <div class="space-y-2">
        <div v-if="filteredWaterLogs.length === 0" class="text-sm text-slate-500 py-4 text-center">
          No water logs recorded for this date.
        </div>
        <div v-for="(w, idx) in filteredWaterLogs" :key="w.id"
          class="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between text-sm">
          <div class="flex items-center gap-3">
            <Droplets class="w-5 h-5 text-cyan-400" />
            <span class="font-medium text-slate-200">Water Log #{{ filteredWaterLogs.length - idx }}</span>
          </div>
          <span class="font-bold text-cyan-400">+{{ w.amount_ml }} ml</span>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>
