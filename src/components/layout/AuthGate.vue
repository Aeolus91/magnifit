<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { Mail, Lock, LogIn, UserPlus, AlertCircle, Loader2 } from '@lucide/vue'

const authStore = useAuthStore()
const mode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const localError = ref<string | null>(null)

const handleSubmit = async () => {
  localError.value = null
  if (!email.value || !password.value) {
    localError.value = 'Please fill in both email and password.'
    return
  }

  try {
    if (mode.value === 'signin') {
      await authStore.signIn(email.value, password.value)
    } else {
      await authStore.signUp(email.value, password.value)
    }
  } catch (err: any) {
    localError.value = err.message || 'Authentication request failed'
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div
      class="w-full max-w-md bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">

      <!-- Brand Header -->
      <div class="text-center space-y-2">
        <h1 class="text-3xl font-extrabold bg-linear-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
          mFit Tracker
        </h1>
        <p class="text-slate-400 text-sm">
          {{ mode === 'signin' ? 'Sign in to access your dashboard' : 'Create your account to start tracking' }}
        </p>
      </div>

      <!-- Mode Switcher Tabs -->
      <div class="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium">
        <button type="button" @click="mode = 'signin'; localError = null" :class="[
          'py-2 rounded-lg transition-all',
          mode === 'signin'
            ? 'bg-slate-800 text-emerald-400 shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        ]">
          Sign In
        </button>
        <button type="button" @click="mode = 'signup'; localError = null" :class="[
          'py-2 rounded-lg transition-all',
          mode === 'signup'
            ? 'bg-slate-800 text-emerald-400 shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        ]">
          Sign Up
        </button>
      </div>

      <!-- Error Message Banner -->
      <div v-if="localError || authStore.error.value"
        class="bg-rose-950/50 border border-rose-900/60 rounded-xl p-3 flex items-start gap-2.5 text-rose-300 text-xs sm:text-sm">
        <AlertCircle class="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
        <span>{{ localError || authStore.error.value }}</span>
      </div>

      <!-- Auth Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-300">Email Address</label>
          <div class="relative">
            <Mail class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="email" v-model="email" required autocomplete="email" placeholder="user@example.com"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-300">Password</label>
          <div class="relative">
            <Lock class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="password" v-model="password" required autocomplete="current-password" placeholder="••••••••"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" />
          </div>
        </div>

        <button type="submit" :disabled="authStore.loading.value"
          class="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
          <Loader2 v-if="authStore.loading.value" class="w-4 h-4 animate-spin" />
          <template v-else>
            <LogIn v-if="mode === 'signin'" class="w-4 h-4" />
            <UserPlus v-else class="w-4 h-4" />
            <span>{{ mode === 'signin' ? 'Sign In' : 'Create Account' }}</span>
          </template>
        </button>
      </form>
    </div>
  </div>
</template>
