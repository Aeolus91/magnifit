<script setup lang="ts">
import { useRouter } from '../lib/router'
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
</script>

<template>
  <div class="min-h-screen flex flex-col justify-between max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-16">
    <!-- Navbar -->
    <header class="flex items-center justify-between border-b border-slate-800/80 pb-5">
      <div class="flex items-center gap-2">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40">
          <Activity class="w-5 h-5 text-slate-950" />
        </div>
        <span class="text-xl font-bold tracking-tight text-slate-100">mFit</span>
      </div>
      <button 
        @click="navigate('/auth')" 
        class="px-4 py-2 text-sm font-medium rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white transition cursor-pointer"
      >
        Sign In
      </button>
    </header>

    <!-- Hero Banner -->
    <main class="space-y-16">
      <div class="text-center max-w-3xl mx-auto space-y-6 pt-4">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles class="w-3.5 h-3.5" /> High Performance Fitness PWA
        </div>

        <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100 leading-tight">
          Track workouts, nutrition, & health with <span class="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">zero bloat</span>.
        </h1>

        <p class="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Ultra-lightweight progressive web app built for instant logging, offline capability, and real-time syncing. No heavy dependencies, pure performance.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            @click="navigate('/auth')"
            class="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition shadow-xl shadow-emerald-950/50 cursor-pointer"
          >
            <span>Start Tracking Now</span>
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
          <h3 class="text-lg font-bold text-slate-200">Sub-50KB Bundle</h3>
          <p class="text-slate-400 text-sm leading-relaxed">
            Custom zero-dependency SDKs ensure instant startup, reduced network egress, and maximal responsiveness.
          </p>
        </div>

        <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
          <div class="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
            <Smartphone class="w-5 h-5" />
          </div>
          <h3 class="text-lg font-bold text-slate-200">Offline PWA Ready</h3>
          <p class="text-slate-400 text-sm leading-relaxed">
            Install directly on iOS or Android. Full offline logging support with automatic background sync.
          </p>
        </div>

        <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
          <div class="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800/50 flex items-center justify-center text-amber-400">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <h3 class="text-lg font-bold text-slate-200">Security & Privacy</h3>
          <p class="text-slate-400 text-sm leading-relaxed">
            Row-level security ensures your health biometrics and workout records are encrypted and isolated to you.
          </p>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="text-center text-slate-600 text-xs py-4 border-t border-slate-900">
      mFit Full-Stack Tracker • Minimal Footprint Architecture
    </footer>
  </div>
</template>
