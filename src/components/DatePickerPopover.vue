<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, Check } from '@lucide/vue'
import { getTodayDateString, getLocalISODate } from '../lib/dateUtils'

interface Props {
  modelValue?: string
  loggedDates?: string[] | Set<string>
}

const emit = defineEmits<{
  (e: 'update:modelValue', dateStr: string): void
}>()

const props = defineProps<Props>()

const todayStr = getTodayDateString()
const effectiveDate = computed(() => props.modelValue || todayStr)

const isOpen = ref(false)
const viewMode = ref<'calendar' | 'wheel'>('calendar')
const containerRef = ref<HTMLElement | null>(null)
const monthWheelRef = ref<HTMLElement | null>(null)
const yearWheelRef = ref<HTMLElement | null>(null)

// Current view month/year cursor inside the calendar popover
const viewDate = ref<Date>(new Date(effectiveDate.value))

const selectedDateObj = computed(() => {
  const [y, m, d] = effectiveDate.value.split('-').map(Number)
  return new Date(y, m - 1, d)
})

const isCurrentDay = computed(() => effectiveDate.value === todayStr)

// Formatted Header String: e.g. "Friday, August 14 2026 (today)" vs "Fri, Aug 14 2026 (today)"
const formattedDateDisplay = computed(() => {
  const d = selectedDateObj.value
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' })
  const month = d.toLocaleDateString('en-US', { month: 'long' })
  const day = d.getDate()
  const year = d.getFullYear()

  const base = `${weekday}, ${month} ${day} ${year}`
  return isCurrentDay.value ? `${base} (today)` : base
})

const formattedDateDisplayShort = computed(() => {
  const d = selectedDateObj.value
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' })
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const day = d.getDate()
  const year = d.getFullYear()

  const base = `${weekday}, ${month} ${day} ${year}`
  return isCurrentDay.value ? `${base} (today)` : base
})

const viewMonthLabel = computed(() => {
  return viewDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

// Months list (0 to 11)
const monthsList = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Years dynamically bounded between fixed base 2025 and live current year
const BASE_YEAR = 2025
const currentRealYear = computed(() => new Date().getFullYear())

const yearsList = computed(() => {
  const maxYear = Math.max(BASE_YEAR, currentRealYear.value)
  const list: number[] = []
  for (let yr = maxYear; yr >= BASE_YEAR; yr--) {
    list.push(yr)
  }
  return list
})

const isMonthDisabledInWheel = (monthIndex: number) => {
  const now = new Date()
  if (viewDate.value.getFullYear() === now.getFullYear()) {
    return monthIndex > now.getMonth()
  }
  return false
}

// Generate calendar month grid days
const calendarDays = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()

  const firstDayOfWeek = new Date(year, month, 1).getDay() // 0 = Sun
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate()

  const days: Array<{
    dateStr: string
    dayNumber: number
    isCurrentMonth: boolean
    isFuture: boolean
    isSelected: boolean
    isToday: boolean
  }> = []

  // Fill preceding blanks
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({
      dateStr: '',
      dayNumber: 0,
      isCurrentMonth: false,
      isFuture: false,
      isSelected: false,
      isToday: false
    })
  }

  const now = new Date()
  const currentTodayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

  // Current month days
  const loggedSet = computed(() => {
    if (!props.loggedDates) return new Set<string>()
    return props.loggedDates instanceof Set ? props.loggedDates : new Set(props.loggedDates)
  })

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const cur = new Date(year, month, d)
    const curMidnight = new Date(year, month, d).getTime()
    const dateStr = getLocalISODate(cur)
    const isFuture = curMidnight > currentTodayMidnight
    const isSelected = dateStr === effectiveDate.value
    const isToday = curMidnight === currentTodayMidnight
    const hasData = loggedSet.value.has(dateStr)

    days.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isFuture,
      isSelected,
      isToday,
      hasData
    })
  }

  return days
})

const prevMonth = () => {
  const prevDate = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1)
  if (prevDate.getFullYear() < 2025) return
  viewDate.value = prevDate
}

const nextMonth = () => {
  const now = new Date()
  const currentMonthYear = now.getFullYear() * 12 + now.getMonth()
  const targetMonthYear = viewDate.value.getFullYear() * 12 + viewDate.value.getMonth() + 1
  if (targetMonthYear > currentMonthYear) return
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1)
}

const canGoPrev = computed(() => {
  return !(viewDate.value.getFullYear() === 2025 && viewDate.value.getMonth() === 0)
})

const canGoNext = computed(() => {
  const now = new Date()
  const currentMonthYear = now.getFullYear() * 12 + now.getMonth()
  const viewMonthYear = viewDate.value.getFullYear() * 12 + viewDate.value.getMonth()
  return viewMonthYear < currentMonthYear
})

const selectDate = (day: { dateStr: string; isFuture: boolean; isCurrentMonth: boolean }) => {
  if (!day.isCurrentMonth || day.isFuture || !day.dateStr) return
  emit('update:modelValue', day.dateStr)
  isOpen.value = false
}

const selectToday = () => {
  emit('update:modelValue', todayStr)
  viewDate.value = new Date()
  isOpen.value = false
}

const toggleViewMode = async () => {
  viewMode.value = viewMode.value === 'calendar' ? 'wheel' : 'calendar'
  if (viewMode.value === 'wheel') {
    await nextTick()
    scrollToWheelSelection()
  }
}

const selectWheelMonth = (monthIndex: number) => {
  if (isMonthDisabledInWheel(monthIndex)) return
  viewDate.value = new Date(viewDate.value.getFullYear(), monthIndex, 1)
}

const selectWheelYear = (year: number) => {
  const now = new Date()
  let targetMonth = viewDate.value.getMonth()
  if (year === now.getFullYear() && targetMonth > now.getMonth()) {
    targetMonth = now.getMonth()
  }
  viewDate.value = new Date(year, targetMonth, 1)
}

const scrollToWheelSelection = () => {
  const alignWheel = (container: HTMLElement | null, selector: string) => {
    if (!container) return
    const target = container.querySelector(selector) as HTMLElement
    if (!target) return
    const targetTop = target.offsetTop - (container.clientHeight / 2) + (target.clientHeight / 2)
    container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
  }

  const runAlignment = () => {
    alignWheel(monthWheelRef.value, `[data-month="${viewDate.value.getMonth()}"]`)
    alignWheel(yearWheelRef.value, `[data-year="${viewDate.value.getFullYear()}"]`)
  }

  // Multi-frame alignment to guarantee exact positioning post-transition
  nextTick(runAlignment)
  setTimeout(runAlignment, 40)
  setTimeout(runAlignment, 120)
  setTimeout(runAlignment, 240)
}

const togglePopover = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    viewMode.value = 'calendar'
    viewDate.value = new Date(effectiveDate.value)
  }
}

const handleClickOutside = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="containerRef" class="relative inline-block">
    <!-- Date Picker Trigger Button -->
    <button
      type="button"
      @click="togglePopover"
      class="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition active:scale-[0.98] cursor-pointer"
    >
      <CalendarIcon class="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition" />
      <span class="text-sm font-semibold text-slate-200 group-hover:text-white transition sm:hidden">
        {{ formattedDateDisplayShort }}
      </span>
      <span class="text-sm font-semibold text-slate-200 group-hover:text-white transition hidden sm:inline">
        {{ formattedDateDisplay }}
      </span>
      <ChevronDown
        class="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ml-0.5"
        :class="{ 'rotate-180 text-emerald-400': isOpen }"
      />
    </button>

    <!-- Calendar / Scroll Wheels Popover Menu -->
    <div
      v-if="isOpen"
      class="absolute left-0 top-full mt-2 z-50 w-76 min-h-[300px] bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-3.5 animate-in fade-in zoom-in-95 duration-150"
    >
      <Transition name="fade-slide" mode="out-in">
        <!-- Mode 1: Calendar Day View -->
        <div v-if="viewMode === 'calendar'" key="calendar" class="space-y-3">
          <!-- Month & Year Navigation Header -->
          <div class="flex items-center justify-between">
            <button
              type="button"
              @click="prevMonth"
              :disabled="!canGoPrev"
              class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 disabled:opacity-20 disabled:pointer-events-none border border-slate-700/60 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>

            <!-- Clickable Month/Year Button (Caret Removed) -->
            <button
              type="button"
              @click.stop="toggleViewMode"
              class="px-3 py-1 rounded-lg hover:bg-slate-800 text-xs font-bold text-slate-200 hover:text-emerald-400 transition active:scale-95 cursor-pointer"
              title="Click to select month and year"
            >
              {{ viewMonthLabel }}
            </button>

            <button
              type="button"
              @click="nextMonth"
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
                @click="selectDate(day)"
                :disabled="day.isFuture"
                class="h-8 w-8 mx-auto rounded-lg text-xs font-medium flex items-center justify-center transition"
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
              @click="selectToday"
              class="text-emerald-400 hover:text-emerald-300 font-semibold transition cursor-pointer"
            >
              Jump to Today
            </button>
            <button
              type="button"
              @click="isOpen = false"
              class="text-slate-500 hover:text-slate-400 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        <!-- Mode 2: iOS-Style Dual Scroll Wheels (Month & Year) -->
        <div v-else key="wheel" class="space-y-3">
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
                @click="selectWheelMonth(mIdx)"
                :disabled="isMonthDisabledInWheel(mIdx)"
                class="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition"
                :class="[
                  isMonthDisabledInWheel(mIdx)
                    ? 'opacity-20 text-slate-600 cursor-not-allowed'
                    : viewDate.getMonth() === mIdx
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer'
                ]"
              >
                <span>{{ mName }}</span>
                <Check v-if="viewDate.getMonth() === mIdx" class="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
              </button>
            </div>

            <!-- Year Scroll Wheel (2025 to Current Year) -->
            <div
              ref="yearWheelRef"
              class="h-full overflow-y-auto overscroll-contain space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
            >
              <button
                v-for="yr in yearsList"
                :key="yr"
                :data-year="yr"
                type="button"
                @click="selectWheelYear(yr)"
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

          <!-- Wheel Confirmation Footer -->
          <div class="pt-2 border-t border-slate-800/80 flex items-center justify-end">
            <button
              type="button"
              @click.stop="viewMode = 'calendar'"
              class="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer shadow-lg shadow-emerald-950/50"
            >
              <span>Okay</span>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: scale(0.97);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
