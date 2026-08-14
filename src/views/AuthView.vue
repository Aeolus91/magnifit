<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from '../lib/router'
import { useI18n } from '../lib/i18n'
import FormInput from '../components/FormInput.vue'
import { Mail, Lock, LogIn, UserPlus, AlertCircle, Loader2, ArrowLeft } from '@lucide/vue'

const authStore = useAuthStore()
const { navigate } = useRouter()
const { t } = useI18n()

const mode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const localError = ref<string | null>(null)

const handleSubmit = async () => {
  localError.value = null
  if (!email.value || !password.value) {
    localError.value = t('auth.error_fill_both')
    return
  }

  try {
    if (mode.value === 'signin') {
      await authStore.signIn(email.value, password.value)
    } else {
      await authStore.signUp(email.value, password.value)
    }
    navigate('/dash')
  } catch (err: any) {
    localError.value = err.message || t('auth.error_generic')
  }
}
</script>

<template>
  <div class="fixed inset-0 w-full h-full flex items-center justify-center px-4 overflow-hidden overscroll-none touch-none bg-slate-950">
    <button
      @click="navigate('/')"
      class="absolute top-5 left-5 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer z-10"
    >
      <ArrowLeft class="w-4 h-4" />
      <span>{{ t('auth.back_home') }}</span>
    </button>

    <div class="w-full max-w-md bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
      <!-- Brand Header -->
      <div class="text-center space-y-2">
        <h1 class="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
          {{ t('brand.name') }}
        </h1>
        <p class="text-slate-400 text-sm transition-all duration-200">
          {{ mode === 'signin' ? t('auth.signin_desc') : t('auth.signup_desc') }}
        </p>
      </div>

      <!-- Mode Switcher Tabs with Sliding Highlight -->
      <div class="relative p-1 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium grid grid-cols-2">
        <!-- Sliding Highlight Background Pill -->
        <div
          class="absolute inset-y-1 w-[calc(50%-4px)] bg-slate-800/90 border border-emerald-500/30 rounded-lg shadow-md shadow-emerald-950/40 transition-all duration-300 ease-out pointer-events-none"
          :class="mode === 'signin' ? 'left-1' : 'left-[calc(50%+2px)]'"
        />

        <button
          type="button"
          @click="mode = 'signin'; localError = null"
          class="relative z-10 py-2 rounded-lg transition-colors duration-200 cursor-pointer text-center"
          :class="mode === 'signin' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'"
        >
          {{ t('auth.signin_tab') }}
        </button>

        <button
          type="button"
          @click="mode = 'signup'; localError = null"
          class="relative z-10 py-2 rounded-lg transition-colors duration-200 cursor-pointer text-center"
          :class="mode === 'signup' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'"
        >
          {{ t('auth.signup_tab') }}
        </button>
      </div>

      <!-- Error Banner -->
      <div
        v-if="localError || authStore.error.value"
        class="bg-rose-950/50 border border-rose-900/60 rounded-xl p-3 flex items-start gap-2.5 text-rose-300 text-xs sm:text-sm animate-in fade-in zoom-in-95 duration-150"
      >
        <AlertCircle class="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
        <span>{{ localError || authStore.error.value }}</span>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <FormInput
          v-model="email"
          :label="t('auth.email_label')"
          type="email"
          :icon="Mail"
          icon-position="field-left"
          icon-color="text-slate-500"
          :placeholder="t('auth.email_placeholder')"
          required
        />

        <FormInput
          v-model="password"
          :label="t('auth.password_label')"
          type="password"
          :icon="Lock"
          icon-position="field-left"
          icon-color="text-slate-500"
          :placeholder="t('auth.password_placeholder')"
          required
        />

        <button
          type="submit"
          :disabled="authStore.loading.value"
          class="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-emerald-950/40"
        >
          <Loader2 v-if="authStore.loading.value" class="w-4 h-4 animate-spin" />
          <template v-else>
            <LogIn v-if="mode === 'signin'" class="w-4 h-4" />
            <UserPlus v-else class="w-4 h-4" />
            <span>{{ mode === 'signin' ? t('auth.submit_signin') : t('auth.submit_signup') }}</span>
          </template>
        </button>
      </form>
    </div>
  </div>
</template>
