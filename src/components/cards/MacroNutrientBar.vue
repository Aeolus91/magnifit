<script setup lang="ts">
import { computed } from 'vue'

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

const proteinCal = computed(() => (props.proteinG || 0) * 4)
const carbsCal = computed(() => (props.carbsG || 0) * 4)
const fatCal = computed(() => (props.fatG || 0) * 9)
const totalMacroCal = computed(() => proteinCal.value + carbsCal.value + fatCal.value)

const proteinPct = computed(() =>
  totalMacroCal.value > 0 ? Math.round((proteinCal.value / totalMacroCal.value) * 100) : 0
)
const carbsPct = computed(() =>
  totalMacroCal.value > 0 ? Math.round((carbsCal.value / totalMacroCal.value) * 100) : 0
)
const fatPct = computed(() =>
  totalMacroCal.value > 0 ? Math.round((fatCal.value / totalMacroCal.value) * 100) : 0
)
</script>

<template>
  <div class="space-y-2">
    <!-- Macro Distribution Progress Bar -->
    <div class="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex gap-0.5 border border-slate-800">
      <div v-if="isLoading" class="w-full bg-slate-800 animate-pulse"></div>
      <template v-else>
        <div
          class="bg-emerald-500 transition-all duration-300"
          :style="{ width: `${proteinPct}%` }"
          :title="`Protein: ${proteinPct}%`"
        ></div>
        <div
          class="bg-yellow-400 transition-all duration-300"
          :style="{ width: `${carbsPct}%` }"
          :title="`Carbs: ${carbsPct}%`"
        ></div>
        <div
          class="bg-rose-500 transition-all duration-300"
          :style="{ width: `${fatPct}%` }"
          :title="`Fat: ${fatPct}%`"
        ></div>
      </template>
    </div>

    <!-- Macro Labels & Grams -->
    <div class="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
      <div class="p-2 rounded-xl bg-emerald-950/40 border border-emerald-900/40 text-emerald-300">
        <div class="text-[10px] uppercase text-emerald-400 font-bold">Protein</div>
        <div v-if="isLoading" class="h-5 w-12 bg-slate-800 rounded animate-pulse mx-auto my-0.5"></div>
        <div v-else class="text-sm font-bold text-slate-100">{{ proteinG }}g</div>
        <div class="text-[10px] text-slate-500">{{ isLoading ? '--' : `${proteinPct}%` }}</div>
      </div>
      <div class="p-2 rounded-xl bg-yellow-950/40 border border-yellow-900/40 text-yellow-300">
        <div class="text-[10px] uppercase text-yellow-400 font-bold">Carbs</div>
        <div v-if="isLoading" class="h-5 w-12 bg-slate-800 rounded animate-pulse mx-auto my-0.5"></div>
        <div v-else class="text-sm font-bold text-slate-100">{{ carbsG }}g</div>
        <div class="text-[10px] text-slate-500">{{ isLoading ? '--' : `${carbsPct}%` }}</div>
      </div>
      <div class="p-2 rounded-xl bg-rose-950/40 border border-rose-900/40 text-rose-300">
        <div class="text-[10px] uppercase text-rose-400 font-bold">Fat</div>
        <div v-if="isLoading" class="h-5 w-12 bg-slate-800 rounded animate-pulse mx-auto my-0.5"></div>
        <div v-else class="text-sm font-bold text-slate-100">{{ fatG }}g</div>
        <div class="text-[10px] text-slate-500">{{ isLoading ? '--' : `${fatPct}%` }}</div>
      </div>
    </div>
  </div>
</template>
