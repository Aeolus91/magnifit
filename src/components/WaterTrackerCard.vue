<script setup lang="ts">
import { ref, computed } from 'vue'
import { Droplets, Plus, RotateCcw, Settings, Check, Loader2 } from '@lucide/vue'
import FluidGaugeCard from './FluidGaugeCard.vue'
import Modal from './Modal.vue'

interface Props {
  currentMl: number
  targetMl?: number
  canUndo?: boolean
}

const emit = defineEmits<{
  (e: 'add-water', amount: number): void
  (e: 'undo'): void
  (e: 'update-target', targetMl: number): void
}>()

const props = withDefaults(defineProps<Props>(), {
  targetMl: 2500,
  canUndo: false
})

const showTargetModal = ref(false)
const inputTargetMl = ref<number>(props.targetMl)
const isSaving = ref(false)

const openTargetModal = () => {
  inputTargetMl.value = props.targetMl || 2500
  showTargetModal.value = true
}

const handleSaveTarget = () => {
  if (inputTargetMl.value < 500 || inputTargetMl.value > 10000) return
  emit('update-target', inputTargetMl.value)
  showTargetModal.value = false
}

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
      <template #header-actions>
        <button
          type="button"
          @click="openTargetModal"
          class="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition active:scale-95 cursor-pointer"
          title="Set Water Goal"
        >
          <Settings class="w-3.5 h-3.5" />
        </button>
      </template>

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

    <!-- Set Daily Water Goal Modal -->
    <Modal
      v-if="showTargetModal"
      title="Daily Water Goal"
      :icon="Droplets"
      icon-color="text-cyan-400"
      max-width-class="max-w-xs"
      @close="showTargetModal = false"
    >
      <form @submit.prevent="handleSaveTarget" class="space-y-4">
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-300">Target Intake (ml)</label>
          <input
            type="number"
            v-model.number="inputTargetMl"
            min="500"
            max="10000"
            step="50"
            required
            class="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition"
          />
          <div class="text-[11px] text-slate-400">Recommended: 2,000 – 3,500 ml</div>
        </div>

        <button
          type="submit"
          class="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.98] text-slate-950 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-cyan-950/40"
        >
          <Check class="w-4 h-4 stroke-[3]" />
          <span>Save Goal</span>
        </button>
      </form>
    </Modal>
  </div>
</template>
