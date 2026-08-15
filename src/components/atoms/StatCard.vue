<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Component } from 'vue'
import { Info } from '@lucide/vue'

interface Props {
  label: string
  value: string | number
  unit?: string
  subText?: string
  tooltip?: string
  icon: Component
  variant?: 'emerald' | 'cyan' | 'purple' | 'amber' | 'slate'
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'emerald',
  isLoading: false
})

const isPopoverOpen = ref(false)
const cardRef = ref<HTMLElement | null>(null)

const handleClickOutside = (e: MouseEvent) => {
  if (cardRef.value && !cardRef.value.contains(e.target as Node)) {
    isPopoverOpen.value = false
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    isPopoverOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})

const colorMap = {
  emerald: 'text-emerald-400',
  cyan: 'text-cyan-400',
  purple: 'text-purple-400',
  amber: 'text-amber-400',
  slate: 'text-slate-400'
}
</script>

<template>
  <div
    ref="cardRef"
    class="relative bg-slate-900 border border-slate-800 p-2 min-[360px]:p-2.5 sm:p-4 rounded-xl space-y-1 overflow-visible transition-all duration-300 active:scale-[0.99]"
  >
    <!-- Header with Info Button -->
    <div class="flex items-center justify-between text-[10px] min-[360px]:text-[11px] sm:text-xs font-semibold uppercase tracking-wider" :class="colorMap[props.variant]">
      <div class="flex items-center gap-1 sm:gap-2 truncate">
        <component :is="icon" class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
        <div v-if="isLoading" class="h-3 w-14 bg-slate-800 rounded animate-pulse"></div>
        <span v-else class="truncate">{{ label }}</span>
      </div>

      <!-- Top Right Info Trigger -->
      <button
        v-if="!isLoading && ($slots.popover || tooltip)"
        type="button"
        @click.stop="isPopoverOpen = !isPopoverOpen"
        class="p-0.5 -mr-1 rounded-md text-slate-500 hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
        :aria-expanded="isPopoverOpen"
        title="Details"
      >
        <Info class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Click Popover -->
    <div
      v-if="isPopoverOpen && !isLoading && ($slots.popover || tooltip)"
      class="absolute right-2 top-8 z-40 p-2.5 rounded-xl bg-slate-950/95 border border-slate-700 shadow-2xl backdrop-blur-md text-xs text-slate-200 min-w-[150px] max-w-[220px]"
    >
      <slot name="popover">
        <div class="font-medium leading-tight text-slate-300">
          {{ tooltip }}
        </div>
      </slot>
    </div>

    <div class="flex items-baseline gap-0.5 sm:gap-1.5 flex-nowrap overflow-hidden">
      <div v-if="isLoading" class="h-6 w-16 bg-slate-800 rounded animate-pulse my-0.5"></div>
      <div v-else class="text-sm min-[360px]:text-base min-[400px]:text-lg sm:text-2xl font-bold text-slate-100 whitespace-nowrap shrink-0">
        {{ value }}
        <span v-if="unit" class="text-[9px] sm:text-xs text-slate-400 font-normal ml-0.5">{{ unit }}</span>
      </div>
      <div v-if="subText && !isLoading" class="text-[9px] sm:text-xs font-semibold text-slate-400">
        {{ subText }}
      </div>
    </div>
  </div>
</template>
