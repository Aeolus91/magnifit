<script setup lang="ts">
import { Droplets, Pencil, Trash2 } from '@lucide/vue'
import type { WaterLog } from '../../types/fitness'

interface Props {
  waterLog: WaterLog
  indexNumber: number
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'edit', log: WaterLog): void
  (e: 'delete', id: string): void
}>()
</script>

<template>
  <div class="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between text-sm group hover:border-slate-700 transition">
    <div class="flex items-center gap-3">
      <Droplets class="w-5 h-5 text-cyan-400 shrink-0" />
      <span class="font-medium text-slate-200">Water Log #{{ indexNumber }}</span>
    </div>

    <div class="flex items-center gap-3">
      <span class="font-bold text-cyan-400">+{{ waterLog.amount_ml }} ml</span>
      <div class="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          @click="emit('edit', waterLog)"
          class="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition cursor-pointer"
          title="Edit Water Log"
        >
          <Pencil class="w-3.5 h-3.5" />
        </button>
        <button
          v-if="waterLog.id"
          type="button"
          @click="emit('delete', waterLog.id)"
          class="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
          title="Delete Water Log"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
