<script setup lang="ts">
import { ref } from 'vue'
import type { WaterLog } from '../../types/fitness'
import Modal from '../modals/Modal.vue'
import WaterEntry from '../entries/WaterEntry.vue'
import { Droplets, Plus, Check } from '@lucide/vue'

interface Props {
  waterLogs: WaterLog[]
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'add-water', amount: number): void
  (e: 'edit-water', log: WaterLog): void
  (e: 'delete-water', id: string): void
}>()

const customWaterAmount = ref<number>(250)
const editingLog = ref<WaterLog | null>(null)
const editAmount = ref<number>(250)

const handleSubmit = () => {
  if (customWaterAmount.value > 0) {
    emit('add-water', customWaterAmount.value)
  }
}

const openEditModal = (log: WaterLog) => {
  editingLog.value = { ...log }
  editAmount.value = log.amount_ml
}

const handleSaveEdit = () => {
  if (editingLog.value && editAmount.value > 0) {
    emit('edit-water', {
      ...editingLog.value,
      amount_ml: editAmount.value
    })
    editingLog.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Add Custom Amount Form Row -->
    <form @submit.prevent="handleSubmit"
      class="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col sm:flex-row items-center sm:items-end justify-between gap-3 w-full">
      <div class="w-full max-w-[220px] sm:max-w-none sm:w-44 text-center sm:text-left">
        <label class="text-[11px] text-slate-400 block mb-1 font-medium">Custom Water Amount (ml)</label>
        <div class="relative">
          <input
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            v-model.number="customWaterAmount"
            placeholder="e.g. 350"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-center sm:text-left text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            required
          />
          <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 pointer-events-none">ml</span>
        </div>
      </div>
      <button
        type="submit"
        class="bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-1.5 px-4 rounded-lg text-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer shadow-sm shadow-cyan-950/30 whitespace-nowrap w-full max-w-[220px] sm:max-w-none sm:w-auto self-center sm:self-end"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>Add Custom Log</span>
      </button>
    </form>

    <!-- Water Logs List -->
    <div class="space-y-2">
      <div v-if="waterLogs.length === 0" class="text-sm text-slate-500 py-4 text-center">
        No water logs recorded for this date.
      </div>
      <WaterEntry
        v-for="(w, idx) in waterLogs"
        :key="w.id"
        :water-log="w"
        :index-number="waterLogs.length - idx"
        @edit="openEditModal"
        @delete="emit('delete-water', $event)"
      />
    </div>

    <!-- Edit Water Log Modal -->
    <Modal
      v-if="editingLog"
      title="Edit Water Log"
      :icon="Droplets"
      icon-color="text-cyan-400"
      max-width-class="max-w-xs"
      @close="editingLog = null"
    >
      <form @submit.prevent="handleSaveEdit" class="space-y-3.5">
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-slate-300">Intake Amount (ml)</label>
          <div class="relative">
            <input
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              v-model.number="editAmount"
              required
              class="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 pointer-events-none">ml</span>
          </div>
        </div>

        <button
          type="submit"
          class="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 active:scale-[0.98] text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-cyan-950/40"
        >
          <Check class="w-3.5 h-3.5 stroke-[3]" />
          <span>Save Changes</span>
        </button>
      </form>
    </Modal>
  </div>
</template>
