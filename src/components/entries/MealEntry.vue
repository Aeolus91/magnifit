<script setup lang="ts">
import { Utensils } from '@lucide/vue'
import type { Meal } from '../../types/fitness'

interface Props {
  meal: Meal
}

defineProps<Props>()
</script>

<template>
  <div class="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between text-sm group hover:border-slate-700 transition">
    <div class="flex items-center gap-3">
      <div class="p-2 rounded-lg bg-amber-950/50 border border-amber-800/40 text-amber-400 shrink-0">
        <Utensils class="w-4 h-4" />
      </div>
      <div>
        <div class="font-semibold text-slate-200">{{ meal.meal_name }}</div>
        <div class="text-xs text-slate-400 mt-0.5">
          <span>P: {{ meal.protein_g || meal.prot_g || 0 }}g | </span>
          <span>C: {{ meal.carbs_g || meal.carb_g || 0 }}g | </span>
          <span>F: {{ meal.fat_g || 0 }}g</span>
        </div>
      </div>
    </div>
    <div class="text-right">
      <span class="font-bold text-amber-400">{{ meal.calories || meal.cal || 0 }} kcal</span>
    </div>
  </div>
</template>
