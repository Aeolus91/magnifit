<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { Check } from '@lucide/vue'

const props = defineProps<{
  viewDate: Date
  currentRealYear: number
  monthsList: string[]
  yearsList: number[]
  isMonthDisabled: (mIdx: number) => boolean
}>()

const emit = defineEmits<{
  (e: 'select-month', monthIndex: number): void
  (e: 'select-year', year: number): void
  (e: 'confirm'): void
}>()

const monthWheelRef = ref<HTMLElement | null>(null)
const yearWheelRef = ref<HTMLElement | null>(null)

const scrollToWheelSelection = () => {
  const selectedMonthBtn = monthWheelRef.value?.querySelector(`[data-month="${props.viewDate.getMonth()}"]`) as HTMLElement
  if (selectedMonthBtn && monthWheelRef.value) {
    monthWheelRef.value.scrollTop = selectedMonthBtn.offsetTop - 60
  }

  const selectedYearBtn = yearWheelRef.value?.querySelector(`[data-year="${props.viewDate.getFullYear()}"]`) as HTMLElement
  if (selectedYearBtn && yearWheelRef.value) {
    yearWheelRef.value.scrollTop = selectedYearBtn.offsetTop - 60
  }
}

onMounted(async () => {
  await nextTick()
  scrollToWheelSelection()
})

defineExpose({
  scrollToWheelSelection
})
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
      <span class="text-xs font-bold text-slate-300">Select Month & Year</span>
      <span class="text-[11px] text-slate-500 font-medium">2025 – {{ currentRealYear }}</span>
    </div>

    <div class="grid grid-cols-2 gap-2 h-48 py-1">
      <!-- Month Scroll Wheel -->
      <div
        ref="monthWheelRef"
        class="h-full overflow-y-auto overscroll-contain space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
      >
        <button
          v-for="(mName, mIdx) in monthsList"
          :key="mIdx"
          :data-month="mIdx"
          type="button"
          @click="emit('select-month', mIdx)"
          :disabled="isMonthDisabled(mIdx)"
          class="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition cursor-pointer"
          :class="[
            isMonthDisabled(mIdx)
              ? 'opacity-20 text-slate-600 cursor-not-allowed'
              : viewDate.getMonth() === mIdx
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          ]"
        >
          <span>{{ mName }}</span>
          <Check v-if="viewDate.getMonth() === mIdx" class="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
        </button>
      </div>

      <!-- Year Scroll Wheel -->
      <div
        ref="yearWheelRef"
        class="h-full overflow-y-auto overscroll-contain space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
      >
        <button
          v-for="yr in yearsList"
          :key="yr"
          :data-year="yr"
          type="button"
          @click="emit('select-year', yr)"
          class="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition cursor-pointer"
          :class="[
            viewDate.getFullYear() === yr
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          ]"
        >
          <span>{{ yr }}</span>
          <Check v-if="viewDate.getFullYear() === yr" class="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
        </button>
      </div>
    </div>

    <!-- Confirmation Footer -->
    <div class="pt-2 border-t border-slate-800/80 flex items-center justify-end">
      <button
        type="button"
        @click="emit('confirm')"
        class="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer shadow-lg shadow-emerald-950/50"
      >
        <span>Okay</span>
      </button>
    </div>
  </div>
</template>
