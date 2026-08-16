<script setup lang="ts">
import { History, Star } from '@lucide/vue'
import type { QuickPickItem } from '../FoodSearchLookup.vue'

defineProps<{
  quickPickList: QuickPickItem[]
  isItemFavorited: (item: { template_id?: string; name: string }) => boolean
}>()

const emit = defineEmits<{
  (e: 'select-item', item: QuickPickItem): void
  (e: 'toggle-favorite', item: QuickPickItem): void
}>()
</script>

<template>
  <div v-if="quickPickList.length > 0" class="space-y-2.5 pt-1">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-slate-800/80 pb-2 px-1">
      <div class="flex items-center gap-1.5 text-xs font-bold text-slate-300">
        <History class="w-3.5 h-3.5 text-amber-400" />
        <span>Recently Logged Foods</span>
      </div>
      <span class="text-[10px] text-slate-500 font-mono">{{ quickPickList.length }} items</span>
    </div>

    <!-- Quick Picks Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div v-for="item in quickPickList" :key="item.id"
        class="group relative flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition">
        <button type="button" @click="emit('select-item', item)" class="flex-1 text-left min-w-0 pr-2 cursor-pointer">
          <div class="flex items-center gap-1.5 truncate">
            <span v-if="item.type === 'recipe'"
              class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-800/50">
              Recipe
            </span>
            <span class="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition truncate">
              {{ item.name }}
            </span>
          </div>
          <div class="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
            <span class="font-medium text-emerald-400">{{ item.cal }} kcal</span>
            <span>•</span>
            <span>P: {{ item.prot_g }}g</span>
            <span>C: {{ item.carb_g }}g</span>
            <span>F: {{ item.fat_g }}g</span>
          </div>
        </button>

        <!-- Favorite Star Button -->
        <button type="button" @click.stop="emit('toggle-favorite', item)"
          class="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 transition cursor-pointer"
          :title="isItemFavorited(item) ? 'Remove Favorite' : 'Save as Favorite'">
          <Star class="w-4 h-4 transition"
            :class="isItemFavorited(item) ? 'fill-amber-400 text-amber-400' : 'text-slate-500 hover:text-amber-400'" />
        </button>
      </div>
    </div>
  </div>
</template>
