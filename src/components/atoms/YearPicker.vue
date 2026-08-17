<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Calendar, ChevronDown, Check } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    label?: string
    minYear?: number
    maxYear?: number
  }>(),
  {
    label: '',
    minYear: 1930,
    maxYear: () => new Date().getFullYear() - 12
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const listContainerRef = ref<HTMLElement | null>(null)

// Feasible year range descending (e.g. 2014 down to 1930)
const years = Array.from(
  { length: props.maxYear - props.minYear + 1 },
  (_, i) => props.maxYear - i
)

const togglePicker = async () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await nextTick()
    scrollToSelected()
  }
}

const selectYear = (yr: number) => {
  emit('update:modelValue', yr)
  isOpen.value = false
}

const scrollToSelected = () => {
  if (!listContainerRef.value) return
  const selectedEl = listContainerRef.value.querySelector(`[data-year="${props.modelValue}"]`) as HTMLElement
  if (selectedEl) {
    selectedEl.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
}

const handleFocusOut = (e: FocusEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.relatedTarget as Node)) {
    isOpen.value = false
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
  <div ref="containerRef" @focusout="handleFocusOut" class="space-y-1.5 w-full relative">
    <!-- Optional Label -->
    <label v-if="label" class="text-xs font-semibold text-slate-300 block">
      {{ label }}
    </label>

    <!-- Trigger Input Button -->
    <button
      type="button"
      @click="togglePicker"
      class="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl pl-3.5 pr-4 py-2.5 text-base sm:text-sm text-slate-100 flex items-center justify-between transition cursor-pointer focus:outline-none focus:border-emerald-500"
    >
      <div class="flex items-center gap-2">
        <Calendar class="w-4 h-4 text-emerald-400 shrink-0" />
        <span class="font-medium">{{ modelValue }}</span>
      </div>
      <ChevronDown
        class="w-4 h-4 text-slate-400 transition-transform duration-200 ml-2"
        :class="{ 'rotate-180 text-emerald-400': isOpen }"
      />
    </button>

    <!-- iOS-style Scrollable Popover Dropdown -->
    <div
      v-if="isOpen"
      class="absolute z-50 left-0 top-full mt-2 w-full max-w-xs bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-2.5 space-y-1.5 animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="px-2 py-1 flex items-center justify-between border-b border-slate-800/80 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
        <span>Select Birth Year</span>
        <span>{{ minYear }} - {{ maxYear }}</span>
      </div>

      <!-- Smooth Scrollable Year List (Wheel/Touch Parity) -->
      <div
        ref="listContainerRef"
        class="max-h-48 overflow-y-auto overscroll-contain space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
      >
        <button
          v-for="yr in years"
          :key="yr"
          :data-year="yr"
          type="button"
          @click="selectYear(yr)"
          :class="[
            'w-full px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-between transition cursor-pointer',
            yr === modelValue
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold'
              : 'hover:bg-slate-800 text-slate-300 hover:text-white'
          ]"
        >
          <span>{{ yr }}</span>
          <Check v-if="yr === modelValue" class="w-4 h-4 text-emerald-400 stroke-[2.5]" />
        </button>
      </div>
    </div>
  </div>
</template>
