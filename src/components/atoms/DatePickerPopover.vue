<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Calendar as CalendarIcon, ChevronDown } from '@lucide/vue'
import { getTodayDateString, getLocalISODate } from '../../lib/dateUtils'
import Popover from './Popover.vue'
import DatePickerCalendarView, { type CalendarDay } from './datepicker/DatePickerCalendarView.vue'
import DatePickerWheelView from './datepicker/DatePickerWheelView.vue'

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

const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

const viewMode = ref<'calendar' | 'wheel'>('calendar')
const viewDate = ref<Date>(parseLocalDate(effectiveDate.value))

watch(effectiveDate, (val) => {
  viewDate.value = parseLocalDate(val)
})

const selectedDateObj = computed(() => parseLocalDate(effectiveDate.value))

const isCurrentDay = computed(() => effectiveDate.value === todayStr)

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

const monthsList = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

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

const loggedSet = computed(() => {
  if (!props.loggedDates) return new Set<string>()
  return props.loggedDates instanceof Set ? props.loggedDates : new Set(props.loggedDates)
})

const calendarDays = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()

  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate()

  const days: CalendarDay[] = []

  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({
      dateStr: '',
      dayNumber: 0,
      isCurrentMonth: false,
      isFuture: false,
      isSelected: false,
      isToday: false,
      hasData: false
    })
  }

  const now = new Date()
  const currentTodayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

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

const handleSelectDate = (day: CalendarDay, close: () => void) => {
  if (!day.isCurrentMonth || day.isFuture || !day.dateStr) return
  emit('update:modelValue', day.dateStr)
  close()
}

const handleSelectToday = (close: () => void) => {
  emit('update:modelValue', todayStr)
  viewDate.value = new Date()
  close()
}

const selectWheelMonth = (monthIndex: number) => {
  if (isMonthDisabledInWheel(monthIndex)) return
  viewDate.value = new Date(viewDate.value.getFullYear(), monthIndex, 1)
}

const selectWheelYear = (year: number) => {
  const now = new Date()
  let month = viewDate.value.getMonth()
  if (year === now.getFullYear() && month > now.getMonth()) {
    month = now.getMonth()
  }
  viewDate.value = new Date(year, month, 1)
}
</script>

<template>
  <Popover
    placement="bottom-start"
    :offset="8"
    trigger-class="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition active:scale-[0.98]"
  >
    <!-- Trigger Content -->
    <template #trigger="{ isOpen }">
      <CalendarIcon class="w-4 h-4 text-emerald-400 shrink-0" />
      <span class="text-xs font-semibold text-slate-200 group-hover:text-white transition sm:hidden">
        {{ formattedDateDisplayShort }}
      </span>
      <span class="text-sm font-semibold text-slate-200 group-hover:text-white transition hidden sm:inline">
        {{ formattedDateDisplay }}
      </span>
      <ChevronDown
        class="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ml-0.5"
        :class="{ 'rotate-180 text-emerald-400': isOpen }"
      />
    </template>

    <!-- Popover Body with Sub-Views -->
    <template #default="{ close }">
      <div class="w-76 min-h-75 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-3.5 max-w-[calc(100vw-24px)]">
        <Transition name="fade-slide" mode="out-in">
          <!-- Mode 1: Calendar View -->
          <DatePickerCalendarView
            v-if="viewMode === 'calendar'"
            key="calendar"
            :view-month-label="viewMonthLabel"
            :calendar-days="calendarDays"
            :can-go-prev="canGoPrev"
            :can-go-next="canGoNext"
            @prev-month="prevMonth"
            @next-month="nextMonth"
            @toggle-view-mode="viewMode = 'wheel'"
            @select-date="(day) => handleSelectDate(day, close)"
            @select-today="() => handleSelectToday(close)"
            @close="close"
          />

          <!-- Mode 2: Month/Year Wheel View -->
          <DatePickerWheelView
            v-else
            key="wheel"
            :view-date="viewDate"
            :current-real-year="currentRealYear"
            :months-list="monthsList"
            :years-list="yearsList"
            :is-month-disabled="isMonthDisabledInWheel"
            @select-month="selectWheelMonth"
            @select-year="selectWheelYear"
            @confirm="viewMode = 'calendar'"
          />
        </Transition>
      </div>
    </template>
  </Popover>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
