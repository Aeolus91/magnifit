<script setup lang="ts">
import type { Meal } from '../../types/fitness'
import MealEntry from '../entries/MealEntry.vue'
import { Plus } from '@lucide/vue'

interface Props {
  meals: Meal[]
  targetDate?: string
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'log-meal'): void
}>()
</script>

<template>
  <div class="space-y-4">
    <!-- Log Meal Action Button -->
    <button
      type="button"
      @click="emit('log-meal')"
      class="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 transition active:scale-[0.99] group cursor-pointer"
    >
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-400 group-hover:text-amber-300">
          <Plus class="w-4 h-4" />
        </div>
        <div class="text-left">
          <div class="text-xs font-bold text-slate-100 group-hover:text-amber-400 transition">Log Meal & Macros</div>
          <div class="text-[11px] text-slate-400">Track calories, protein, carbs, fat</div>
        </div>
      </div>
      <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition">
        <Plus class="w-3.5 h-3.5" />
        <span>Add Entry</span>
      </div>
    </button>

    <!-- Meals List -->
    <div class="space-y-2">
      <div v-if="meals.length === 0" class="text-sm text-slate-500 py-4 text-center">
        No meals recorded for this date.
      </div>
      <MealEntry
        v-for="m in meals"
        :key="m.id"
        :meal="m"
      />
    </div>
  </div>
</template>
