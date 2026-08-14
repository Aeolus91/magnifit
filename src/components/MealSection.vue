<script setup lang="ts">
import type { Meal } from '../types/fitness'
import { useRouter } from '../lib/router'
import { Utensils, Plus, ArrowRight } from '@lucide/vue'

interface Props {
  meals: Meal[]
  targetDate?: string
}

const props = defineProps<Props>()
const { navigate } = useRouter()

const goToMealsRoute = () => {
  navigate('/meals', false, { logDate: props.targetDate })
}
</script>

<template>
  <div class="space-y-4">
    <!-- Action Trigger Row: Navigates to /meals with silent route state -->
    <button
      type="button"
      @click="goToMealsRoute"
      class="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 transition active:scale-[0.99] group cursor-pointer"
    >
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-400 group-hover:text-amber-300">
          <Utensils class="w-5 h-5" />
        </div>
        <div class="text-left">
          <div class="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition">Food, Meals & Recipes</div>
          <div class="text-xs text-slate-400">Search items, log macros & build recipe templates</div>
        </div>
      </div>
      <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition">
        <Plus class="w-4 h-4" />
        <span>Open Meals</span>
      </div>
    </button>

    <div class="space-y-2">
      <div v-if="meals.length === 0" class="text-sm text-slate-500 py-4 text-center">
        No meals recorded for this date.
      </div>
      <div v-for="m in meals" :key="m.id"
        class="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between text-sm">
        <div class="flex items-center gap-3">
          <Utensils class="w-5 h-5 text-amber-400" />
          <div>
            <div class="font-semibold text-slate-200">{{ m.meal_name }}</div>
            <div class="text-xs text-slate-400">
              <span>P: {{ m.protein_g }}g | </span>
              <span>C: {{ m.carbs_g }}g | </span>
              <span>F: {{ m.fat_g }}g</span>
            </div>
          </div>
        </div>
        <div class="text-right">
          <span class="font-bold text-amber-400">{{ m.calories }} kcal</span>
        </div>
      </div>
    </div>
  </div>
</template>
