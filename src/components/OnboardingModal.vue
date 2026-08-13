<script setup lang="ts">
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from '../stores/authStore'
import { ProfilePrefs } from '../lib/bitmask'
import type { Profile, Biometric } from '../types/fitness'
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
  Loader2 
} from '@lucide/vue'

const props = defineProps<{
  initialProfile?: Profile | null
}>()

const emit = defineEmits<{
  (e: 'completed', profile: Profile): void
}>()

const authStore = useAuthStore()

const currentStep = ref<number>(1)
const totalSteps = 3
const isSubmitting = ref<boolean>(false)
const errorMessage = ref<string | null>(null)

// Step 1: Identity
const username = ref<string>(props.initialProfile?.username || '')

// Step 2: Physical Stats
const sex = ref<'male' | 'female' | 'other' | 'unspecified'>('unspecified')
const birthYear = ref<number>(2000)
const heightCm = ref<number>(175)
const weightKg = ref<number>(75.0)

// Step 3: Goals & Activity
const activityLevel = ref<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'>('moderate')
const targetWeightKg = ref<number>(72.0)
const isImperial = ref<boolean>(false)
const trackMicros = ref<boolean>(false)

const progressPercent = computed(() => {
  return Math.round((currentStep.value / totalSteps) * 100)
})

const nextStep = () => {
  errorMessage.value = null
  if (currentStep.value === 1) {
    if (!username.value.trim()) {
      errorMessage.value = 'Please enter a valid username.'
      return
    }
    // Check alphanumeric and underscore
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username.value.trim())) {
      errorMessage.value = 'Username must be 3-32 characters (letters, numbers, underscores).'
      return
    }
  } else if (currentStep.value === 2) {
    if (heightCm.value < 50 || heightCm.value > 260) {
      errorMessage.value = 'Height must be between 50 cm and 260 cm.'
      return
    }
    if (weightKg.value < 20 || weightKg.value > 500) {
      errorMessage.value = 'Weight must be between 20 kg and 500 kg.'
      return
    }
  }

  if (currentStep.value < totalSteps) {
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
  isSubmitting.value = true
  errorMessage.value = null

  try {
    const userId = authStore.user.value.id

    // Compute updated prefs
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

    const targetWeightDg = Math.round(targetWeightKg.value * 10)
    const currentWeightDg = Math.round(weightKg.value * 10)

    // 1. Update Profile row in database
    const profilePayload: Partial<Profile> = {
      username: username.value.trim().toLowerCase(),
      height_cm: heightCm.value,
      target_weight_dg: targetWeightDg,
      sex: sex.value,
      activity_level: activityLevel.value,
      birth_year: birthYear.value,
      prefs: bitmask,
      micros_opt: 0,
      updated_at: new Date().toISOString()
    }

    const { data: updatedProfileData, error: profileErr } = await supabase
      .from<Profile>('profiles')
      .insert([{
        id: userId,
        ...profilePayload
      }])

    if (profileErr) {
      // If profile already exists, do update
      const res = await fetch(`${(supabase as any).url}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: (supabase as any).getHeaders(),
        body: JSON.stringify(profilePayload)
      })
      if (!res.ok) throw new Error('Failed to update profile stats.')
    }

    // 2. Insert baseline initial weight into biometrics
    await supabase.from<Biometric>('biometrics').insert([{
      user_id: userId,
      weight_kg: weightKg.value,
      date: new Date().toISOString()
    }])

    emit('completed', {
      id: userId,
      ...profilePayload
    } as Profile)
  } catch (err: any) {
    errorMessage.value = err.message || 'Failed to save onboarding profile.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden overscroll-none touch-none">
    <div class="w-full max-w-lg bg-slate-900/95 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 flex flex-col justify-between">
      
      <!-- Top Progress & Header -->
      <div class="space-y-4">
        <div class="flex items-center justify-between text-xs text-slate-400 font-semibold">
          <div class="flex items-center gap-1.5 text-emerald-400">
            <Sparkles class="w-4 h-4" />
            <span>Profile Setup</span>
          </div>
          <span>Step {{ currentStep }} of {{ totalSteps }} ({{ progressPercent }}%)</span>
        </div>

        <!-- Segmented Progress Bar -->
        <div class="w-full bg-slate-950 border border-slate-800 rounded-full h-2 overflow-hidden">
          <div 
            class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300 ease-out"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="errorMessage"
        class="bg-rose-950/60 border border-rose-900/80 rounded-xl p-3 flex items-start gap-2.5 text-rose-300 text-xs sm:text-sm"
      >
        <AlertCircle class="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Step 1: Identity -->
      <div v-if="currentStep === 1" class="space-y-4">
        <div class="space-y-1">
          <h2 class="text-xl font-bold text-slate-100">Choose Your Handle</h2>
          <p class="text-slate-400 text-xs sm:text-sm">Set your unique username for sharing recipes and profile privacy.</p>
        </div>

        <div class="space-y-1.5 pt-2">
          <label class="text-xs font-semibold text-slate-300">Username</label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">@</span>
            <input
              type="text"
              v-model="username"
              required
              placeholder="alex_runner"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-base sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition font-mono"
            />
          </div>
          <p class="text-[11px] text-slate-500">Only letters, numbers, and underscores.</p>
        </div>
      </div>

      <!-- Step 2: Physical Biometrics -->
      <div v-if="currentStep === 2" class="space-y-4">
        <div class="space-y-1">
          <h2 class="text-xl font-bold text-slate-100">Baseline Biometrics</h2>
          <p class="text-slate-400 text-xs sm:text-sm">Used for energy expenditure & calorie burn calculations.</p>
        </div>

        <div class="grid grid-cols-2 gap-4 pt-2">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-300">Biological Sex</label>
            <select 
              v-model="sex"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="unspecified">Prefer not to say</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-300">Birth Year</label>
            <input
              type="number"
              v-model.number="birthYear"
              min="1920"
              max="2020"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Ruler class="w-3.5 h-3.5 text-teal-400" /> Height (cm)
            </label>
            <input
              type="number"
              v-model.number="heightCm"
              min="50"
              max="260"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Scale class="w-3.5 h-3.5 text-emerald-400" /> Current Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              v-model.number="weightKg"
              min="20"
              max="500"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>
      </div>

      <!-- Step 3: Goals & Activity Level -->
      <div v-if="currentStep === 3" class="space-y-4">
        <div class="space-y-1">
          <h2 class="text-xl font-bold text-slate-100">Goals & Lifestyle</h2>
          <p class="text-slate-400 text-xs sm:text-sm">Configure target milestones and tracking preferences.</p>
        </div>

        <div class="space-y-4 pt-2">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Activity class="w-3.5 h-3.5 text-cyan-400" /> Daily Activity Level
            </label>
            <select 
              v-model="activityLevel"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
            >
              <option value="sedentary">Sedentary (Desk job, minimal exercise)</option>
              <option value="light">Lightly Active (1-3 workouts / week)</option>
              <option value="moderate">Moderately Active (3-5 workouts / week)</option>
              <option value="active">Active (6-7 intense workouts / week)</option>
              <option value="very_active">Very Active (Athlete / Physical job)</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Target class="w-3.5 h-3.5 text-purple-400" /> Target Goal Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              v-model.number="targetWeightKg"
              min="20"
              max="500"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div class="flex items-center justify-between p-3 bg-slate-950 border border-slate-800/80 rounded-xl">
            <div>
              <div class="text-xs font-semibold text-slate-200">Track Micronutrients</div>
              <div class="text-[11px] text-slate-500">Enable detailed sugar, fiber & fat tracking</div>
            </div>
            <input 
              type="checkbox" 
              v-model="trackMicros" 
              class="w-4 h-4 accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="flex items-center justify-between pt-4 border-t border-slate-800/80 gap-3">
        <button
          type="button"
          v-if="currentStep > 1"
          @click="prevStep"
          class="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Back</span>
        </button>
        <div v-else></div>

        <button
          type="button"
          v-if="currentStep < totalSteps"
          @click="nextStep"
          class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition cursor-pointer"
        >
          <span>Continue</span>
          <ArrowRight class="w-4 h-4" />
        </button>

        <button
          type="button"
          v-else
          :disabled="isSubmitting"
          @click="handleCompleteOnboarding"
          class="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 text-xs sm:text-sm font-bold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-emerald-950/40"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <template v-else>
            <Check class="w-4 h-4 stroke-[3]" />
            <span>Finish Setup</span>
          </template>
        </button>
      </div>
    </div>
  </div>
</template>
