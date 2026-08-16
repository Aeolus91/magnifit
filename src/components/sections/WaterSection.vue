<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '../../lib/i18n'
import type { WaterLog } from '../../types/fitness'
import Modal from '../atoms/Modal.vue'
import WaterEntry from '../entries/WaterEntry.vue'
import SectionHeader from '../atoms/SectionHeader.vue'
import EmptySectionPlaceholder from '../atoms/EmptySectionPlaceholder.vue'
import { Droplets, Plus, Check } from '@lucide/vue'

const { t } = useI18n()

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
  <div class="space-y-4">
    <!-- Section Header with Embedded Custom Water Form -->
    <SectionHeader
      :title="t('dash.water.title')"
      :description="t('dash.water.desc')"
    >
      <template #controls>
        <form @submit.prevent="handleSubmit" class="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          <div class="relative w-28 sm:w-32">
            <input
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              v-model.number="customWaterAmount"
              :placeholder="t('dash.water.custom_placeholder')"
              class="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-3 pr-7 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
              required
            />
            <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 pointer-events-none">
              ml
            </span>
          </div>

          <button
            type="submit"
            class="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-cyan-950/40 whitespace-nowrap"
          >
            <Plus class="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{{ t('dash.water.custom_btn') }}</span>
          </button>
        </form>
      </template>
    </SectionHeader>

    <!-- Water Logs List -->
    <div class="space-y-2">
      <EmptySectionPlaceholder
        v-if="waterLogs.length === 0"
        :title="t('dash.empty.water_title')"
        :description="t('dash.empty.water_desc')"
        :icon="Droplets"
        icon-color-class="text-cyan-400"
        icon-bg-class="bg-cyan-950/60 border border-cyan-800/60"
      />
      <WaterEntry v-for="(w, idx) in waterLogs" :key="w.id" :water-log="w" :index-number="waterLogs.length - idx"
        @edit="openEditModal" @delete="emit('delete-water', $event)" />
    </div>

    <!-- Edit Water Log Modal -->
    <Modal v-if="editingLog" title="Edit Water Log" :icon="Droplets" icon-color="text-cyan-400"
      max-width-class="max-w-xs" @close="editingLog = null">
      <form @submit.prevent="handleSaveEdit" class="space-y-3.5">
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-slate-300">Intake Amount (ml)</label>
          <div class="relative">
            <input type="text" inputmode="numeric" pattern="[0-9]*" v-model.number="editAmount" required
              class="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            <span
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 pointer-events-none">ml</span>
          </div>
        </div>

        <button type="submit"
          class="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 active:scale-[0.98] text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-cyan-950/40">
          <Check class="w-3.5 h-3.5 stroke-3" />
          <span>Save Changes</span>
        </button>
      </form>
    </Modal>
  </div>
</template>
