<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  proteinG?: number
  carbsG?: number
  fatG?: number
}

const props = withDefaults(defineProps<Props>(), {
  proteinG: 0,
  carbsG: 0,
  fatG: 0
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
      <div
        class="bg-rose-500 transition-all duration-300"
        :style="{ width: `${proteinPct}%` }"
        :title="`Protein: ${proteinPct}%`"
      ></div>
      <div
        class="bg-amber-500 transition-all duration-300"
        :style="{ width: `${carbsPct}%` }"
        :title="`Carbs: ${carbsPct}%`"
      ></div>
      <div
        class="bg-cyan-500 transition-all duration-300"
        :style="{ width: `${fatPct}%` }"
        :title="`Fat: ${fatPct}%`"
      ></div>
    </div>

    <!-- Macro Labels & Grams -->
    <div class="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
      <div class="p-2 rounded-xl bg-rose-950/40 border border-rose-900/40 text-rose-300">
        <div class="text-[10px] uppercase text-rose-400 font-bold">Protein</div>
        <div class="text-sm font-bold text-slate-100">{{ proteinG }}g</div>
        <div class="text-[10px] text-slate-500">{{ proteinPct }}%</div>
      </div>
      <div class="p-2 rounded-xl bg-amber-950/40 border border-amber-900/40 text-amber-300">
        <div class="text-[10px] uppercase text-amber-400 font-bold">Carbs</div>
        <div class="text-sm font-bold text-slate-100">{{ carbsG }}g</div>
        <div class="text-[10px] text-slate-500">{{ carbsPct }}%</div>
      </div>
      <div class="p-2 rounded-xl bg-cyan-950/40 border border-cyan-900/40 text-cyan-300">
        <div class="text-[10px] uppercase text-cyan-400 font-bold">Fat</div>
        <div class="text-sm font-bold text-slate-100">{{ fatG }}g</div>
        <div class="text-[10px] text-slate-500">{{ fatPct }}%</div>
      </div>
    </div>
  </div>
</template>
