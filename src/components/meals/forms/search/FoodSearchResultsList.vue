<script setup lang="ts">
import { Info, Plus, Star } from '@lucide/vue'
import type { FoodSearchResult } from '../FoodSearchLookup.vue'

defineProps<{
  searchResults: FoodSearchResult[]
  displayedResults: FoodSearchResult[]
  showAllResults: boolean
  isItemFavorited: (item: { template_id?: string; name: string }) => boolean
}>()

const emit = defineEmits<{
  (e: 'select-food', item: FoodSearchResult): void
  (e: 'inspect-food', item: FoodSearchResult): void
  (e: 'toggle-favorite', item: FoodSearchResult): void
  (e: 'toggle-show-all'): void
}>()
</script>

<template>
  <div class="space-y-2 pt-2">
    <div class="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
      <span>Database Results ({{ searchResults.length }})</span>
      <button v-if="searchResults.length > 6" type="button" @click="emit('toggle-show-all')"
        class="text-emerald-400 hover:text-emerald-300 transition cursor-pointer">
        {{ showAllResults ? 'Show Less' : `View All (${searchResults.length})` }}
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div v-for="(item, idx) in displayedResults" :key="idx"
        class="group relative flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition">
        <button type="button" @click="emit('select-food', item)" class="flex-1 text-left min-w-0 pr-2 cursor-pointer">
          <div class="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition truncate">
            {{ item.name }}
          </div>
          <div v-if="item.brand" class="text-[11px] text-slate-400 truncate">
            {{ item.brand }}
          </div>
          <div class="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
            <span class="font-semibold text-emerald-400">{{ item.cal_100g }} kcal <span
                class="text-[10px] text-slate-400 font-normal">/100g</span></span>
            <span>•</span>
            <span>P: {{ item.prot_100g }}g</span>
            <span>C: {{ item.carb_100g }}g</span>
            <span>F: {{ item.fat_100g }}g</span>
          </div>
        </button>

        <div class="flex items-center gap-1">
          <!-- Inspect Nutrition Info -->
          <button type="button" @click.stop="emit('inspect-food', item)"
            class="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            title="Inspect Nutritional Details">
            <Info class="w-4 h-4" />
          </button>

          <!-- Favorite Star Button -->
          <button type="button" @click.stop="emit('toggle-favorite', item)"
            class="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition cursor-pointer"
            :title="isItemFavorited(item) ? 'Favorited' : 'Save Favorite'">
            <Star class="w-4 h-4 transition"
              :class="isItemFavorited(item) ? 'fill-amber-400 text-amber-400' : 'text-slate-500 hover:text-amber-400'" />
          </button>

          <!-- Add Button -->
          <button type="button" @click.stop="emit('select-food', item)"
            class="p-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition cursor-pointer"
            title="Add to Meal">
            <Plus class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
