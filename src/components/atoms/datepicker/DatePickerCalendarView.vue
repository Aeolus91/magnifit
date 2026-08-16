<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '@lucide/vue'

export interface CalendarDay {
  dateStr: string
  dayNumber: number
  isCurrentMonth: boolean
  isFuture: boolean
  isSelected: boolean
  isToday: boolean
  hasData?: boolean
}

defineProps<{
  viewMonthLabel: string
  calendarDays: CalendarDay[]
  canGoPrev: boolean
  canGoNext: boolean
}>()

const emit = defineEmits<{
  (e: 'prev-month'): void
  (e: 'next-month'): void
  (e: 'toggle-view-mode'): void
  (e: 'select-date', day: CalendarDay): void
  (e: 'select-today'): void
  (e: 'close'): void
}>()
</script>

<template>
  <div class="space-y-3">
    <!-- Month & Year Navigation Header -->
    <div class="flex items-center justify-between">
      <button
        type="button"
        @click="emit('prev-month')"
        :disabled="!canGoPrev"
        class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 disabled:opacity-20 disabled:pointer-events-none border border-slate-700/60 text-slate-300 hover:text-white transition cursor-pointer"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>

      <!-- Clickable Month/Year Button -->
      <button
        type="button"
        @click.stop="emit('toggle-view-mode')"
        class="px-3 py-1 rounded-lg hover:bg-slate-800 text-xs font-bold text-slate-200 hover:text-emerald-400 transition active:scale-95 cursor-pointer"
        title="Click to select month and year"
      >
        {{ viewMonthLabel }}
      </button>

      <button
        type="button"
        @click="emit('next-month')"
        :disabled="!canGoNext"
        class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 disabled:opacity-20 disabled:pointer-events-none border border-slate-700/60 text-slate-300 hover:text-white transition cursor-pointer"
      >
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>

    <!-- Days of Week Header -->
    <div class="grid grid-cols-7 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
      <span>Su</span>
      <span>Mo</span>
      <span>Tu</span>
      <span>We</span>
      <span>Th</span>
      <span>Fr</span>
      <span>Sa</span>
    </div>

    <!-- Days Grid -->
    <div class="grid grid-cols-7 gap-1 text-center">
      <template v-for="(day, idx) in calendarDays" :key="idx">
        <div v-if="!day.isCurrentMonth" class="h-8" />
        <button
          v-else
          type="button"
          @click="emit('select-date', day)"
          :disabled="day.isFuture"
          class="relative h-8 w-8 mx-auto rounded-lg text-xs font-medium flex items-center justify-center transition"
          :class="[
            day.isFuture
              ? 'opacity-20 text-slate-600 cursor-not-allowed'
              : day.isSelected
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold shadow-[0_0_8px_rgba(52,211,153,0.3)] cursor-pointer'
                : day.isToday
                  ? 'bg-slate-800 border border-slate-700 text-emerald-400 font-semibold hover:bg-slate-700 cursor-pointer'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer'
          ]"
        >
          <span class="leading-none">{{ day.dayNumber }}</span>
          <!-- Activity Dot for Logged Dates -->
          <span
            v-if="day.hasData"
            class="absolute bottom-1 w-1 h-1 rounded-full"
            :class="day.isSelected ? 'bg-emerald-300' : 'bg-emerald-400/80'"
          />
        </button>
      </template>
    </div>

    <!-- Quick Reset Footer -->
    <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
      <button
        type="button"
        @click="emit('select-today')"
        class="text-emerald-400 hover:text-emerald-300 font-semibold transition cursor-pointer"
      >
        Jump to Today
      </button>
      <button
        type="button"
        @click="emit('close')"
        class="text-slate-500 hover:text-slate-400 transition cursor-pointer"
      >
        Close
      </button>
    </div>
  </div>
</template>
