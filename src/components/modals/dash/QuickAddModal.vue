<script setup lang="ts">
import Modal from '../../atoms/Modal.vue'
import { Plus, Dumbbell, Scale, Utensils, ChevronRight } from '@lucide/vue'

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', tab: 'workouts' | 'biometrics' | 'meals'): void
}>()

const selectTab = (tab: 'workouts' | 'biometrics' | 'meals') => {
  emit('select', tab)
  emit('close')
}
</script>

<template>
  <Modal
    v-if="show"
    title="Quick Add Entry"
    :icon="Plus"
    icon-color="text-emerald-400"
    max-width-class="max-w-md"
    @close="emit('close')"
  >
    <div class="space-y-3">
      <!-- Option 1: Workout -->
      <button
        type="button"
        @click="selectTab('workouts')"
        class="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-emerald-500/50 hover:bg-slate-850 transition active:scale-[0.98] group cursor-pointer text-left"
      >
        <div class="flex items-center gap-3.5">
          <div class="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 group-hover:text-emerald-300">
            <Dumbbell class="w-5 h-5" />
          </div>
          <div>
            <div class="text-sm font-semibold text-slate-100 group-hover:text-emerald-400 transition">Workout</div>
            <div class="text-xs text-slate-400">Log training session & calories</div>
          </div>
        </div>
        <ChevronRight class="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
      </button>

      <!-- Option 2: Biometrics -->
      <button
        type="button"
        @click="selectTab('biometrics')"
        class="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-purple-500/50 hover:bg-slate-850 transition active:scale-[0.98] group cursor-pointer text-left"
      >
        <div class="flex items-center gap-3.5">
          <div class="p-2.5 rounded-lg bg-purple-950/60 border border-purple-800/60 text-purple-400 group-hover:text-purple-300">
            <Scale class="w-5 h-5" />
          </div>
          <div>
            <div class="text-sm font-semibold text-slate-100 group-hover:text-purple-400 transition">Biometrics</div>
            <div class="text-xs text-slate-400">Record weight & measurements</div>
          </div>
        </div>
        <ChevronRight class="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition" />
      </button>

      <!-- Option 3: Food / Meals -->
      <button
        type="button"
        @click="selectTab('meals')"
        class="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-amber-500/50 hover:bg-slate-850 transition active:scale-[0.98] group cursor-pointer text-left"
      >
        <div class="flex items-center gap-3.5">
          <div class="p-2.5 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-400 group-hover:text-amber-300">
            <Utensils class="w-5 h-5" />
          </div>
          <div>
            <div class="text-sm font-semibold text-slate-100 group-hover:text-amber-400 transition">Food & Meals</div>
            <div class="text-xs text-slate-400">Track meals, macros & calories</div>
          </div>
        </div>
        <ChevronRight class="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
      </button>
    </div>
  </Modal>
</template>
