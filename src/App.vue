<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from './lib/supabaseClient'
import type { Workout, Biometric, Meal, WaterLog } from './types/fitness'
import { Activity, Flame, Droplets, Utensils, Scale, Plus, RefreshCw } from '@lucide/vue'

const workouts = ref<Workout[]>([])
const biometrics = ref<Biometric[]>([])
const meals = ref<Meal[]>([])
const waterLogs = ref<WaterLog[]>([])
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

const totalActiveCalories = computed(() => workouts.value.reduce((acc, w) => acc + (w.active_calories || 0), 0))
const totalCaloriesConsumed = computed(() => meals.value.reduce((acc, m) => acc + (m.calories || 0), 0))
const totalWaterMl = computed(() => waterLogs.value.reduce((acc, w) => acc + (w.amount_ml || 0), 0))
const latestWeight = computed(() => biometrics.value[0]?.weight_kg || 0)

const fetchAll = async () => {
  loading.value = true
  const [wRes, bRes, mRes, watRes] = await Promise.all([
    supabase.from<Workout>('workouts').select().order('date', { ascending: false }).get(),
    supabase.from<Biometric>('biometrics').select().order('date', { ascending: false }).get(),
    supabase.from<Meal>('meals').select().order('date', { ascending: false }).get(),
    supabase.from<WaterLog>('water_logs').select().order('date', { ascending: false }).get()
  ])

  if (wRes.data) workouts.value = wRes.data
  if (bRes.data) biometrics.value = bRes.data
  if (mRes.data) meals.value = mRes.data
  if (watRes.data) waterLogs.value = watRes.data

  loading.value = false
}

const addWorkout = async () => {
  const { data, error } = await supabase.from<Workout>('workouts').insert([{
    ...newWorkout.value,
    date: new Date().toISOString()
  }])
  if (!error && data) {
    workouts.value.unshift(data[0])
  }
}

const addBiometric = async () => {
  const { data, error } = await supabase.from<Biometric>('biometrics').insert([{
    ...newBiometric.value,
    date: new Date().toISOString()
  }])
  if (!error && data) {
    biometrics.value.unshift(data[0])
  }
}

const addMeal = async () => {
  const { data, error } = await supabase.from<Meal>('meals').insert([{
    ...newMeal.value,
    date: new Date().toISOString()
  }])
  if (!error && data) {
    meals.value.unshift(data[0])
  }
}

const addWater = async (amount: number) => {
  const { data, error } = await supabase.from<WaterLog>('water_logs').insert([{
    amount_ml: amount,
    date: new Date().toISOString()
  }])
  if (!error && data) {
    waterLogs.value.unshift(data[0])
  }
}

onMounted(() => {
  fetchAll()
  supabase.channel('public:workouts')
    .on('INSERT', (payload) => {
      if (payload.new) workouts.value.unshift(payload.new)
    })
    .subscribe()
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8 space-y-8">
    <header class="flex items-center justify-between border-b border-slate-800 pb-4">
      <div>
        <h1 class="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
          mFit Tracker
        </h1>
        <p class="text-slate-400 text-sm mt-1">Lightweight PWA • Offline Ready</p>
      </div>
      <button @click="fetchAll" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition">
        <RefreshCw class="w-5 h-5 text-slate-300" :class="{ 'animate-spin': loading }" />
      </button>
    </header>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
        <div class="flex items-center text-emerald-400 gap-2 text-xs font-semibold uppercase tracking-wider">
          <Flame class="w-4 h-4" /> Active Burn
        </div>
        <div class="text-2xl font-bold text-slate-100">{{ totalActiveCalories }} <span class="text-xs text-slate-400 font-normal">kcal</span></div>
      </div>

      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
        <div class="flex items-center text-amber-400 gap-2 text-xs font-semibold uppercase tracking-wider">
          <Utensils class="w-4 h-4" /> Consumed
        </div>
        <div class="text-2xl font-bold text-slate-100">{{ totalCaloriesConsumed }} <span class="text-xs text-slate-400 font-normal">kcal</span></div>
      </div>

      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
        <div class="flex items-center text-cyan-400 gap-2 text-xs font-semibold uppercase tracking-wider">
          <Droplets class="w-4 h-4" /> Water Intake
        </div>
        <div class="text-2xl font-bold text-slate-100">{{ totalWaterMl }} <span class="text-xs text-slate-400 font-normal">ml</span></div>
      </div>

      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
        <div class="flex items-center text-purple-400 gap-2 text-xs font-semibold uppercase tracking-wider">
          <Scale class="w-4 h-4" /> Latest Weight
        </div>
        <div class="text-2xl font-bold text-slate-100">{{ latestWeight || '--' }} <span class="text-xs text-slate-400 font-normal">kg</span></div>
      </div>
    </div>

    <div class="flex border-b border-slate-800 space-x-4">
      <button 
        v-for="tab in (['workouts', 'biometrics', 'meals', 'water'] as const)" 
        :key="tab"
        @click="activeTab = tab"
        :class="[
          'pb-3 font-medium capitalize transition-colors border-b-2 text-sm',
          activeTab === tab 
            ? 'border-emerald-500 text-emerald-400' 
            : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
      >
        {{ tab }}
      </button>
    </div>

    <div v-if="activeTab === 'workouts'" class="space-y-6">
      <form @submit.prevent="addWorkout" class="bg-slate-900 border border-slate-800 p-4 rounded-xl grid sm:grid-cols-4 gap-4 items-end">
        <div>
          <label class="text-xs text-slate-400 block mb-1">Workout Type</label>
          <input v-model="newWorkout.workout_type" class="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" required />
        </div>
        <div>
          <label class="text-xs text-slate-400 block mb-1">Active Cal</label>
          <input type="number" v-model.number="newWorkout.active_calories" class="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" required />
        </div>
        <div>
          <label class="text-xs text-slate-400 block mb-1">Duration (min)</label>
          <input type="number" v-model.number="newWorkout.duration_minutes" class="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" required />
        </div>
        <button type="submit" class="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-4 rounded text-sm flex items-center justify-center gap-2">
          <Plus class="w-4 h-4" /> Log Workout
        </button>
      </form>

      <div class="space-y-2">
        <div v-for="w in workouts" :key="w.id" class="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between text-sm">
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
      <div class="bg-slate-900 border border-slate-800 p-6 rounded-xl text-center space-y-4">
        <h3 class="text-lg font-semibold text-slate-200">Quick Water Add</h3>
        <div class="flex justify-center gap-4">
          <button @click="addWater(250)" class="bg-cyan-950 border border-cyan-800 text-cyan-400 hover:bg-cyan-900 px-4 py-2 rounded-lg text-sm font-medium">
            + 250 ml
          </button>
          <button @click="addWater(500)" class="bg-cyan-950 border border-cyan-800 text-cyan-400 hover:bg-cyan-900 px-4 py-2 rounded-lg text-sm font-medium">
            + 500 ml
          </button>
          <button @click="addWater(750)" class="bg-cyan-950 border border-cyan-800 text-cyan-400 hover:bg-cyan-900 px-4 py-2 rounded-lg text-sm font-medium">
            + 750 ml
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
