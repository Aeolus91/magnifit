<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from '../lib/router'
import { useI18n } from '../lib/i18n'
import {
  Activity,
  ArrowRight,
  Flame,
  Scale,
  Dumbbell,
  Utensils,
  Droplets,
  Plus,
  Zap,
  Search,
  Share2
} from '@lucide/vue'

import StatCard from '../components/atoms/StatCard.vue'
import MacroStatCard from '../components/atoms/MacroStatCard.vue'
import FluidGaugeCard from '../components/cards/FluidGaugeCard.vue'
import TabbedView from '../components/layout/TabbedView.vue'

const { navigate } = useRouter()
const { t } = useI18n()

// Interactive Live Dashboard Simulation State
const activeTab = ref('workouts')
const tabs = computed(() => [
  { id: 'workouts', label: t('dash.nav.workouts'), icon: Dumbbell },
  { id: 'meals', label: t('dash.nav.meals'), icon: Utensils },
  { id: 'water', label: t('dash.nav.water'), icon: Droplets }
])

const demoWorkouts = computed(() => [
  { id: '1', name: t('landing.demo.workout1_name'), duration: 35, cal: 320, category: t('landing.demo.workout1_cat') },
  { id: '2', name: t('landing.demo.workout2_name'), duration: 45, cal: 280, category: t('landing.demo.workout2_cat') }
])

const demoMeals = computed(() => [
  { id: 'm1', name: t('landing.demo.meal1_name'), cal: 340, prot: 28, carbs: 42, fat: 6, slot: t('meals.slot.breakfast') },
  { id: 'm2', name: t('landing.demo.meal2_name'), cal: 680, prot: 52, carbs: 64, fat: 22, slot: t('meals.slot.lunch') }
])

const demoWaterLogs = ref([500, 750, 500])

const totalActiveCalories = computed(() => demoWorkouts.value.reduce((acc, w) => acc + w.cal, 0))
const totalCaloriesConsumed = computed(() => demoMeals.value.reduce((acc, m) => acc + m.cal, 0))
const totalProteinG = computed(() => demoMeals.value.reduce((acc, m) => acc + m.prot, 0))
const totalCarbsG = computed(() => demoMeals.value.reduce((acc, m) => acc + m.carbs, 0))
const totalFatG = computed(() => demoMeals.value.reduce((acc, m) => acc + m.fat, 0))
const totalWaterMl = computed(() => demoWaterLogs.value.reduce((acc, w) => acc + w, 0))

const addQuickWater = (ml: number) => {
  demoWaterLogs.value.push(ml)
}
</script>

<template>
  <div
    class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
    <header class="border-b border-slate-900 px-6 py-4 max-w-7xl mx-auto w-full flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
          <Activity class="w-4 h-4 stroke-[2.5]" />
        </div>
        <div class="flex flex-col">
          <span class="hidden min-[360px]:inline text-base font-bold tracking-tight text-white leading-none">{{ t('brand.name') }}</span>
          <span class="hidden sm:block text-[10px] font-mono tracking-wider text-slate-400 mt-0.5">{{ t('brand.tagline') }}</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button @click="navigate('/auth', false, { mode: 'signin' })"
          class="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white transition cursor-pointer">
          {{ t('auth.signin_tab') }}
        </button>
        <button @click="navigate('/auth', false, { mode: 'signup' })"
          class="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition cursor-pointer">
          {{ t('auth.signup_tab') }}
        </button>
      </div>
    </header>

    <main class="max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 lg:py-16 space-y-16">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
        <div class="lg:col-span-5 space-y-6 pt-2">
          <div class="space-y-3">
            <div
              class="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {{ t('landing.badge') }}
            </div>

            <h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.12]">
              {{ t('landing.hero.title_pre') }} {{ t('landing.hero.highlight') }}.
            </h1>
          </div>

          <p class="text-slate-400 text-base leading-relaxed">
            {{ t('landing.hero.desc') }}
          </p>

          <div class="flex flex-col sm:flex-row gap-3 pt-2">
            <button @click="navigate('/auth')"
              class="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/10 cursor-pointer">
              <span>{{ t('landing.cta') }}</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>

          <!-- Quick Specs Badges -->
          <div class="grid grid-cols-3 gap-3 pt-4 border-t border-slate-900">
            <div>
              <div class="text-base sm:text-lg font-bold font-sans text-white">{{ t('landing.stats.instant_val') }}
              </div>
              <div class="text-xs text-slate-400">{{ t('landing.stats.instant_label') }}</div>
            </div>
            <div>
              <div class="text-base sm:text-lg font-bold font-sans text-white">{{ t('landing.stats.offline_val') }}
              </div>
              <div class="text-xs text-slate-400">{{ t('landing.stats.offline_label') }}</div>
            </div>
            <div>
              <div class="text-base sm:text-lg font-bold font-sans text-white">{{ t('landing.stats.free_val') }}</div>
              <div class="text-xs text-slate-400">{{ t('landing.stats.free_label') }}</div>
            </div>
          </div>
        </div>

        <!-- Dashboard Sample -->
        <div class="lg:col-span-7">
          <div
            class="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl p-4 sm:p-6 space-y-4 max-w-xl mx-auto backdrop-blur-xl">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <span class="text-xs font-semibold text-slate-200">Today, Aug 15</span>
              <span
                class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                {{ t('landing.demo.simulated_badge') }}
              </span>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <StatCard :label="t('dash.stats.active_burn')" :value="totalActiveCalories" unit="kcal" :icon="Flame"
                variant="emerald" />
              <StatCard :label="t('dash.stats.latest_weight')" value="74.2" unit="kg" :icon="Scale" variant="purple" />
              <MacroStatCard label="Macros" :protein-g="totalProteinG" :carbs-g="totalCarbsG" :fat-g="totalFatG"
                variant="cyan" />
            </div>

            <FluidGaugeCard :title="t('dash.stats.consumed')" :current="totalCaloriesConsumed" :target="2200"
              unit="kcal" :icon="Utensils" variant="emerald"
              :subtitle="`${2200 - totalCaloriesConsumed} kcal remaining • +${totalActiveCalories} kcal active burn`" />

            <div class="space-y-3 pt-2">
              <TabbedView v-model="activeTab" :tabs="tabs" />

              <div v-if="activeTab === 'workouts'" class="space-y-2">
                <div v-for="w in demoWorkouts" :key="w.id"
                  class="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                      <Dumbbell class="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div class="font-semibold text-slate-200">{{ w.name }}</div>
                      <div class="text-[11px] text-slate-400">{{ w.duration }} mins • {{ w.category }}</div>
                    </div>
                  </div>
                  <span class="font-mono font-bold text-amber-400">{{ w.cal }} kcal</span>
                </div>
              </div>

              <div v-else-if="activeTab === 'meals'" class="space-y-2">
                <div v-for="m in demoMeals" :key="m.id"
                  class="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                  <div>
                    <div class="font-semibold text-slate-200">{{ m.name }}</div>
                    <div class="text-[11px] text-slate-400 font-mono">{{ m.prot }}g P • {{ m.carbs }}g C • {{ m.fat }}g
                      F</div>
                  </div>
                  <span class="font-mono font-bold text-slate-300">{{ m.cal }} kcal</span>
                </div>
              </div>

              <div v-else-if="activeTab === 'water'"
                class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-300">{{ t('dash.stats.water_intake') }}: <strong
                      class="font-mono text-cyan-400">{{ totalWaterMl }} ml</strong> / 2500 ml</span>
                  <div class="flex gap-1.5">
                    <button @click="addQuickWater(250)"
                      class="px-2 py-1 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-[11px] font-mono cursor-pointer hover:bg-cyan-900 transition flex items-center gap-1">
                      <Plus class="w-3 h-3" /> 250ml
                    </button>
                    <button @click="addQuickWater(500)"
                      class="px-2 py-1 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-[11px] font-mono cursor-pointer hover:bg-cyan-900 transition flex items-center gap-1">
                      <Plus class="w-3 h-3" /> 500ml
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Grid -->
      <div class="pt-8 border-t border-slate-900 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
          <div class="flex items-center gap-2 text-slate-200 font-semibold text-sm">
            <Zap class="w-4 h-4 text-emerald-400" />
            <span>{{ t('landing.feature.bundle.title') }}</span>
          </div>
          <p class="text-slate-400 text-xs leading-relaxed">
            {{ t('landing.feature.bundle.desc') }}
          </p>
        </div>

        <div class="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
          <div class="flex items-center gap-2 text-slate-200 font-semibold text-sm">
            <Search class="w-4 h-4 text-emerald-400" />
            <span>{{ t('landing.feature.food_db.title') }}</span>
          </div>
          <p class="text-slate-400 text-xs leading-relaxed">
            {{ t('landing.feature.food_db.desc') }}
          </p>
        </div>

        <div class="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
          <div class="flex items-center gap-2 text-slate-200 font-semibold text-sm">
            <Share2 class="w-4 h-4 text-emerald-400" />
            <span>{{ t('landing.feature.recipes.title') }}</span>
          </div>
          <p class="text-slate-400 text-xs leading-relaxed">
            {{ t('landing.feature.recipes.desc') }}
          </p>
        </div>
      </div>
    </main>

    <footer class="border-t border-slate-900 px-6 py-6 text-center text-xs text-slate-400 font-mono">
      {{ t('landing.footer') }}
    </footer>
  </div>
</template>
