<script setup lang="ts">
import { ref, computed } from 'vue'
import { Utensils, Flame, Target, TrendingUp, TrendingDown, Settings, Check } from '@lucide/vue'
import FluidGaugeCard from './FluidGaugeCard.vue'
import Modal from '../atoms/Modal.vue'

interface Props {
  consumed: number
  expenditure: number
  target?: number
  recommendedTarget?: number
  bmr?: number
  tdee?: number
  formulaUsed?: 'Katch-McArdle' | 'Mifflin-St Jeor'
  hasBodyFat?: boolean
  isLoading?: boolean
}

const emit = defineEmits<{
  (e: 'update-target', targetCal: number): void
  (e: 'navigate-meals'): void
}>()

const props = withDefaults(defineProps<Props>(), {
  target: 2000,
  recommendedTarget: 2000,
  bmr: 1650,
  tdee: 2250,
  formulaUsed: 'Mifflin-St Jeor',
  hasBodyFat: false,
  isLoading: false
})

const showTargetModal = ref(false)
const inputTargetCal = ref<number>(props.target)
const selectedGoalMode = ref<'deficit' | 'maintenance' | 'surplus' | 'custom'>('custom')

const openTargetModal = () => {
  inputTargetCal.value = safeTarget.value
  selectedGoalMode.value = 'custom'
  showTargetModal.value = true
}

const selectGoalPreset = (mode: 'deficit' | 'maintenance' | 'surplus') => {
  selectedGoalMode.value = mode
  if (mode === 'deficit') {
    inputTargetCal.value = Math.max(1200, props.tdee - 500)
  } else if (mode === 'maintenance') {
    inputTargetCal.value = props.tdee
  } else if (mode === 'surplus') {
    inputTargetCal.value = props.tdee + 300
  }
}

const handleSaveTarget = () => {
  if (inputTargetCal.value < 500 || inputTargetCal.value > 10000) return
  emit('update-target', inputTargetCal.value)
  showTargetModal.value = false
}

const safeTarget = computed(() => (props.target > 0 ? props.target : 2000))
const netCalories = computed(() => props.consumed - props.expenditure)
const isDeficit = computed(() => netCalories.value <= 0)
const remainingToTarget = computed(() => safeTarget.value - props.consumed)

const consumedSubtitle = computed(() => {
  const diff = remainingToTarget.value
  return diff >= 0 ? `${diff.toLocaleString()} kcal left` : `${Math.abs(diff).toLocaleString()} kcal over`
})
</script>

<template>
  <div class="relative bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
    <!-- Header Area: Stacked on Mobile, 2-Column Split on Tablet/Desktop -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:pr-20">
      <!-- Main Header: Target Goal & Value -->
      <div class="flex items-center gap-2.5">
        <div
          class="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center shrink-0">
          <Target class="w-4 h-4 text-emerald-400" />
        </div>
        <div class="truncate">
          <div class="text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Daily Calorie Target</div>
          <div v-if="isLoading" class="h-6 w-24 bg-slate-800 rounded animate-pulse my-0.5"></div>
          <div v-else class="text-lg font-bold text-slate-100">
            {{ safeTarget.toLocaleString() }}
            <span class="text-xs text-slate-400 font-normal">kcal</span>
          </div>
        </div>
      </div>

      <!-- Net Delta Badge & Sub-360px Inline Buttons -->
      <div class="flex items-center justify-between min-[360px]:justify-start sm:justify-end gap-2 min-w-0 flex-wrap">
        <div v-if="isLoading" class="h-7 w-32 bg-slate-800 rounded-full animate-pulse shrink-0"></div>
        <div v-else
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide min-w-0 max-w-full text-center leading-tight transition"
          :class="[
            isDeficit
              ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400'
              : 'bg-amber-950/60 border-amber-800/60 text-amber-400'
          ]">
          <component :is="isDeficit ? TrendingDown : TrendingUp" class="w-3.5 h-3.5 shrink-0" />
          <span class="truncate whitespace-nowrap">
            {{ Math.abs(netCalories).toLocaleString() }} kcal {{ isDeficit ? 'Deficit' : 'Surplus' }}
          </span>
        </div>

        <!-- Inline Action Buttons when screen is below 360px (<360px) -->
        <div class="flex min-[360px]:hidden items-center gap-1 shrink-0">
          <button type="button" @click="emit('navigate-meals')"
            class="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-slate-400 hover:text-amber-400 transition active:scale-95 cursor-pointer shadow-sm flex items-center justify-center"
            title="View Meals Day Summary">
            <Utensils class="w-4 h-4" />
          </button>

          <button type="button" @click="openTargetModal"
            class="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-slate-400 hover:text-emerald-300 transition active:scale-95 cursor-pointer shadow-sm flex items-center justify-center"
            title="Configure Calorie Target">
            <Settings class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Floating Action Buttons (Top-Right on >=360px) -->
    <div class="hidden min-[360px]:flex items-center gap-1.5 absolute top-5 sm:top-6 right-5 sm:right-6 z-10">
      <button type="button" @click="emit('navigate-meals')"
        class="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-slate-400 hover:text-amber-400 transition active:scale-95 cursor-pointer shadow-sm flex items-center justify-center"
        title="View Meals Day Summary">
        <Utensils class="w-4 h-4" />
      </button>

      <button type="button" @click="openTargetModal"
        class="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-slate-400 hover:text-emerald-300 transition active:scale-95 cursor-pointer shadow-sm flex items-center justify-center"
        title="Configure Calorie Target">
        <Settings class="w-4 h-4" />
      </button>
    </div>

    <!-- Composed Dual Fluid Gauges -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FluidGaugeCard title="Consumed" :current="consumed" :target="safeTarget" unit="kcal" :icon="Utensils"
        variant="amber" :subtitle="consumedSubtitle" :is-loading="isLoading" />

      <FluidGaugeCard title="Expenditure" :current="expenditure" :target="safeTarget" unit="kcal" :icon="Flame"
        variant="emerald" subtitle="Formula + Active" :is-loading="isLoading" />
    </div>

    <!-- Set Daily Calorie Goal Modal -->
    <Modal v-if="showTargetModal" title="Calorie Expenditure & Target" :icon="Flame" icon-color="text-emerald-400"
      max-width-class="max-w-md" @close="showTargetModal = false">
      <form @submit.prevent="handleSaveTarget" class="space-y-4">
        <!-- Biometric Formula & Expenditure Insights -->
        <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400 font-medium">Calculation Engine</span>
            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border" :class="hasBodyFat
              ? 'bg-purple-950/70 border-purple-800/80 text-purple-300'
              : 'bg-teal-950/70 border-teal-800/80 text-teal-300'">
              {{ formulaUsed }} {{ hasBodyFat ? '(with Body Fat %)' : '' }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900">
            <div class="bg-slate-900/60 border border-slate-800/60 rounded-lg p-2 text-center">
              <div class="text-[10px] text-slate-500 font-medium uppercase">Basal BMR</div>
              <div class="text-sm font-bold text-slate-200 mt-0.5">{{ bmr.toLocaleString() }} kcal</div>
            </div>
            <div class="bg-slate-900/60 border border-slate-800/60 rounded-lg p-2 text-center">
              <div class="text-[10px] text-slate-500 font-medium uppercase">Maintenance TDEE</div>
              <div class="text-sm font-bold text-emerald-400 mt-0.5">{{ tdee.toLocaleString() }} kcal</div>
            </div>
          </div>
        </div>

        <!-- Quick Goal Presets -->
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-300">Goal Presets</label>
          <div class="grid grid-cols-3 gap-2">
            <button type="button" @click="selectGoalPreset('deficit')" :class="[
              'p-2 rounded-xl border text-center transition cursor-pointer text-xs font-medium',
              selectedGoalMode === 'deficit'
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            ]">
              <div class="font-bold text-[11px]">Deficit (-500)</div>
              <div class="text-[10px] opacity-75 mt-0.5">{{ Math.max(1200, tdee - 500) }} kcal</div>
            </button>

            <button type="button" @click="selectGoalPreset('maintenance')" :class="[
              'p-2 rounded-xl border text-center transition cursor-pointer text-xs font-medium',
              selectedGoalMode === 'maintenance'
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            ]">
              <div class="font-bold text-[11px]">Maintenance</div>
              <div class="text-[10px] opacity-75 mt-0.5">{{ tdee }} kcal</div>
            </button>

            <button type="button" @click="selectGoalPreset('surplus')" :class="[
              'p-2 rounded-xl border text-center transition cursor-pointer text-xs font-medium',
              selectedGoalMode === 'surplus'
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            ]">
              <div class="font-bold text-[11px]">Surplus (+300)</div>
              <div class="text-[10px] opacity-75 mt-0.5">{{ tdee + 300 }} kcal</div>
            </button>
          </div>
        </div>

        <!-- Custom / Explicit Target Input -->
        <div class="space-y-1.5 pt-1">
          <label class="block text-xs font-semibold text-slate-300">Daily Target (kcal)</label>
          <input type="text" inputmode="numeric" pattern="[0-9]*" v-model.number="inputTargetCal"
            @input="selectedGoalMode = 'custom'" required
            class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono" />
          <div class="text-[10px] text-slate-400">Min 500 – Max 10,000 kcal</div>
        </div>

        <button type="submit"
          class="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-950/40">
          <Check class="w-3.5 h-3.5 stroke-3" />
          <span>Save Calorie Target</span>
        </button>
      </form>
    </Modal>
  </div>
</template>
