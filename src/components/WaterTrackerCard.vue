<script setup lang="ts">
import { computed } from 'vue'
import { Droplets, Plus, RotateCcw } from '@lucide/vue'
import FluidGaugeCard from './FluidGaugeCard.vue'

interface Props {
  currentMl: number
  targetMl?: number
  canUndo?: boolean
}

const emit = defineEmits<{
  (e: 'add-water', amount: number): void
  (e: 'undo'): void
}>()

const props = withDefaults(defineProps<Props>(), {
  targetMl: 2500,
  canUndo: false
})

const safeTarget = computed(() => (props.targetMl > 0 ? props.targetMl : 2500))
const remainingMl = computed(() => safeTarget.value - props.currentMl)
const subtitle = computed(() => {
  if (remainingMl.value <= 0) return 'Daily goal reached!'
  return `${remainingMl.value.toLocaleString()} ml remaining`
})
</script>

<template>
  <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
    <FluidGaugeCard
      title="Hydration Intake"
      :current="currentMl"
      :target="safeTarget"
      unit="ml"
      :icon="Droplets"
      variant="cyan"
      :subtitle="subtitle"
    >
      <!-- Quick Water Actions: 2x2 grid on micro/320px screens, single horizontal line on standard screens (>=380px) and desktop -->
      <div class="grid grid-cols-2 min-[380px]:flex min-[380px]:items-center min-[380px]:flex-nowrap gap-1.5 sm:gap-2 pt-1">
        <!-- +250ml -->
        <button
          type="button"
          @click="emit('add-water', 250)"
          class="flex items-center justify-center gap-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 text-xs font-semibold px-2 min-[380px]:px-2.5 py-1.5 rounded-lg transition active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <Plus class="w-3 h-3" /> 250 ml
        </button>
        
        <!-- +500ml -->
        <button
          type="button"
          @click="emit('add-water', 500)"
          class="flex items-center justify-center gap-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 text-xs font-semibold px-2 min-[380px]:px-2.5 py-1.5 rounded-lg transition active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <Plus class="w-3 h-3" /> 500 ml
        </button>

        <!-- +750ml -->
        <button
          type="button"
          @click="emit('add-water', 750)"
          class="flex items-center justify-center gap-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 text-xs font-semibold px-2 min-[380px]:px-2.5 py-1.5 rounded-lg transition active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <Plus class="w-3 h-3" /> 750 ml
        </button>

        <!-- Undo Button: 4th grid slot on 320px, inline 4th button on >=380px, right-aligned on desktop -->
        <button
          v-if="canUndo"
          type="button"
          @click="emit('undo')"
          class="flex items-center justify-center gap-1 bg-slate-900 hover:bg-rose-950/40 border border-slate-700/80 hover:border-rose-800/60 text-slate-300 hover:text-rose-300 text-xs font-medium px-2 min-[380px]:px-2.5 py-1.5 rounded-lg transition active:scale-95 cursor-pointer sm:ml-auto whitespace-nowrap"
        >
          <RotateCcw class="w-3 h-3" />
          <span>Undo</span>
        </button>
      </div>
    </FluidGaugeCard>
  </div>
</template>
