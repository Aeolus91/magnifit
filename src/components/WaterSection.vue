<script setup lang="ts">
import { ref } from 'vue'
import type { WaterLog } from '../types/fitness'
import { Droplets, Plus } from '@lucide/vue'

interface Props {
  waterLogs: WaterLog[]
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'add-water', amount: number): void
}>()

const customWaterAmount = ref<number>(250)

const handleSubmit = () => {
  if (customWaterAmount.value > 0) {
    emit('add-water', customWaterAmount.value)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Add Custom Amount Form Row -->
    <form @submit.prevent="handleSubmit"
      class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
      <div class="flex-1">
        <label class="text-xs text-slate-400 block mb-1 font-medium">Custom Water Amount (ml)</label>
        <div class="relative">
          <input
            type="number"
            v-model.number="customWaterAmount"
            min="10"
            max="5000"
            step="10"
            placeholder="e.g. 350"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            required
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">ml</span>
        </div>
      </div>
      <button
        type="submit"
        class="bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-2 px-5 rounded-xl text-sm flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-md shadow-cyan-950/30"
      >
        <Plus class="w-4 h-4" />
        <span>Add Custom Log</span>
      </button>
    </form>

    <div class="space-y-2">
      <div v-if="waterLogs.length === 0" class="text-sm text-slate-500 py-4 text-center">
        No water logs recorded for this date.
      </div>
      <div v-for="(w, idx) in waterLogs" :key="w.id"
        class="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between text-sm">
        <div class="flex items-center gap-3">
          <Droplets class="w-5 h-5 text-cyan-400" />
          <span class="font-medium text-slate-200">Water Log #{{ waterLogs.length - idx }}</span>
        </div>
        <span class="font-bold text-cyan-400">+{{ w.amount_ml }} ml</span>
      </div>
    </div>
  </div>
</template>
