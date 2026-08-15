<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'

interface Props {
  proteinG?: number
  carbsG?: number
  fatG?: number
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  isLoading: false
})

const isActivated = ref(false)

const triggerAnimation = () => {
  if (!props.isLoading) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        isActivated.value = true
      })
    })
  } else {
    isActivated.value = false
  }
}

onMounted(() => {
  triggerAnimation()
})

watch(
  () => props.isLoading,
  (loading) => {
    if (!loading) triggerAnimation()
    else isActivated.value = false
  }
)

const proteinCal = computed(() => (props.proteinG || 0) * 4)
const carbsCal = computed(() => (props.carbsG || 0) * 4)
const fatCal = computed(() => (props.fatG || 0) * 9)
const totalMacroCal = computed(() => proteinCal.value + carbsCal.value + fatCal.value)

const proteinPct = computed(() =>
  totalMacroCal.value > 0 ? Math.min(100, Math.round((proteinCal.value / totalMacroCal.value) * 100)) : 0
)
const carbsPct = computed(() =>
  totalMacroCal.value > 0 ? Math.min(100, Math.round((carbsCal.value / totalMacroCal.value) * 100)) : 0
)
const fatPct = computed(() =>
  totalMacroCal.value > 0 ? Math.min(100, Math.round((fatCal.value / totalMacroCal.value) * 100)) : 0
)
</script>

<template>
  <div
    class="relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden grid grid-cols-3 divide-x divide-slate-800/80 h-full transition-all duration-300">
    <!-- Protein Column Pane -->
    <div
      class="relative flex flex-col justify-between items-center p-1.5 sm:p-2.5 overflow-hidden select-none active:scale-[0.98] transition-transform">
      <!-- Animated Fluid Layer (Upwards Fill) -->
      <div
        class="absolute inset-x-0 bottom-0 bg-linear-to-t from-emerald-500/25 via-emerald-500/15 to-emerald-500/5 border-t border-emerald-400/50 transition-all duration-700 ease-out pointer-events-none"
        :style="{ height: isActivated && !isLoading ? `${proteinPct}%` : '0%' }">
        <!-- Glowing surface edge -->
        <div class="absolute top-0 inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
      </div>

      <!-- Top Label -->
      <span
        class="relative z-10 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-400 leading-none">P</span>

      <!-- Center Grams Metric -->
      <div class="relative z-10 flex flex-col items-center justify-center my-auto leading-none">
        <span v-if="isLoading" class="text-[10px] text-slate-500 font-bold">--</span>
        <span v-else class="text-xs min-[360px]:text-sm sm:text-base font-black text-slate-100 drop-shadow">{{ proteinG
          }}g</span>
      </div>

      <!-- Bottom Calorie Share -->
      <span
        class="relative z-10 text-[8px] min-[360px]:text-[9px] sm:text-[10px] font-bold text-slate-400 leading-none">
        {{ isLoading ? '--' : `${proteinPct}%` }}
      </span>
    </div>

    <!-- Carbs Column Pane -->
    <div
      class="relative flex flex-col justify-between items-center p-1.5 sm:p-2.5 overflow-hidden select-none active:scale-[0.98] transition-transform">
      <div
        class="absolute inset-x-0 bottom-0 bg-linear-to-t from-amber-500/25 via-amber-500/15 to-amber-500/5 border-t border-amber-400/50 transition-all duration-700 ease-out pointer-events-none"
        :style="{ height: isActivated && !isLoading ? `${carbsPct}%` : '0%' }">
        <div class="absolute top-0 inset-x-0 h-0.5 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
      </div>

      <span
        class="relative z-10 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-400 leading-none">C</span>

      <div class="relative z-10 flex flex-col items-center justify-center my-auto leading-none">
        <span v-if="isLoading" class="text-[10px] text-slate-500 font-bold">--</span>
        <span v-else class="text-xs min-[360px]:text-sm sm:text-base font-black text-slate-100 drop-shadow">{{ carbsG
          }}g</span>
      </div>

      <span
        class="relative z-10 text-[8px] min-[360px]:text-[9px] sm:text-[10px] font-bold text-slate-400 leading-none">
        {{ isLoading ? '--' : `${carbsPct}%` }}
      </span>
    </div>

    <!-- Fat Column Pane -->
    <div
      class="relative flex flex-col justify-between items-center p-1.5 sm:p-2.5 overflow-hidden select-none active:scale-[0.98] transition-transform">
      <div
        class="absolute inset-x-0 bottom-0 bg-linear-to-t from-rose-500/25 via-rose-500/15 to-rose-500/5 border-t border-rose-400/50 transition-all duration-700 ease-out pointer-events-none"
        :style="{ height: isActivated && !isLoading ? `${fatPct}%` : '0%' }">
        <div class="absolute top-0 inset-x-0 h-0.5 bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
      </div>

      <span
        class="relative z-10 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-rose-400 leading-none">F</span>

      <div class="relative z-10 flex flex-col items-center justify-center my-auto leading-none">
        <span v-if="isLoading" class="text-[10px] text-slate-500 font-bold">--</span>
        <span v-else class="text-xs min-[360px]:text-sm sm:text-base font-black text-slate-100 drop-shadow">{{ fatG
          }}g</span>
      </div>

      <span
        class="relative z-10 text-[8px] min-[360px]:text-[9px] sm:text-[10px] font-bold text-slate-400 leading-none">
        {{ isLoading ? '--' : `${fatPct}%` }}
      </span>
    </div>
  </div>
</template>
