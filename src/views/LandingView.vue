<script setup lang="ts">
import { useRouter } from '../lib/router'
import { useI18n } from '../lib/i18n'
import { 
  Flame, 
  Activity, 
  Droplets, 
  ShieldCheck, 
  Zap, 
  Smartphone, 
  ArrowRight,
  Sparkles
} from '@lucide/vue'

const { navigate } = useRouter()
const { t } = useI18n()
</script>

<template>
  <div class="min-h-screen flex flex-col justify-between max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-16">
    <!-- Navbar -->
    <header class="flex items-center justify-between border-b border-slate-800/80 pb-5">
      <div class="flex items-center gap-2">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40">
          <Activity class="w-5 h-5 text-slate-950" />
        </div>
        <span class="text-xl font-bold tracking-tight text-slate-100">{{ t('brand.name') }}</span>
      </div>
      <button 
        @click="navigate('/auth')" 
        class="px-4 py-2 text-sm font-medium rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white transition cursor-pointer"
      >
        {{ t('auth.signin_tab') }}
      </button>
    </header>

    <!-- Hero Banner -->
    <main class="space-y-16">
      <div class="text-center max-w-3xl mx-auto space-y-6 pt-4">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles class="w-3.5 h-3.5" /> {{ t('landing.badge') }}
        </div>

        <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100 leading-tight">
          {{ t('landing.hero.title_pre') }} <span class="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">{{ t('landing.hero.highlight') }}</span>.
        </h1>

        <p class="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          {{ t('landing.hero.desc') }}
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            @click="navigate('/auth')"
            class="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition shadow-xl shadow-emerald-950/50 cursor-pointer"
          >
            <span>{{ t('landing.cta') }}</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Feature Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <Zap class="w-5 h-5" />
          </div>
          <h3 class="text-lg font-bold text-slate-200">{{ t('landing.feature.bundle.title') }}</h3>
          <p class="text-slate-400 text-sm leading-relaxed">
            {{ t('landing.feature.bundle.desc') }}
          </p>
        </div>

        <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
          <div class="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
            <Smartphone class="w-5 h-5" />
          </div>
          <h3 class="text-lg font-bold text-slate-200">{{ t('landing.feature.pwa.title') }}</h3>
          <p class="text-slate-400 text-sm leading-relaxed">
            {{ t('landing.feature.pwa.desc') }}
          </p>
        </div>

        <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
          <div class="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800/50 flex items-center justify-center text-amber-400">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <h3 class="text-lg font-bold text-slate-200">{{ t('landing.feature.security.title') }}</h3>
          <p class="text-slate-400 text-sm leading-relaxed">
            {{ t('landing.feature.security.desc') }}
          </p>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="text-center text-slate-600 text-xs py-4 border-t border-slate-900">
      {{ t('landing.footer') }}
    </footer>
  </div>
</template>
