<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  label: string
  value: string | number
  unit?: string
  subText?: string
  icon: Component
  variant?: 'emerald' | 'cyan' | 'purple' | 'amber' | 'slate'
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'emerald',
  isLoading: false
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
  <div class="bg-slate-900 border border-slate-800 p-2.5 sm:p-4 rounded-xl space-y-1 overflow-hidden transition-all duration-300">
    <div class="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate" :class="colorMap[props.variant]">
      <component :is="icon" class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
      <div v-if="isLoading" class="h-3 w-16 bg-slate-800 rounded animate-pulse"></div>
      <span v-else class="truncate">{{ label }}</span>
    </div>
    <div class="flex items-baseline gap-1 sm:gap-1.5 flex-nowrap min-[380px]:flex-wrap overflow-hidden">
      <div v-if="isLoading" class="h-7 w-20 bg-slate-800 rounded animate-pulse my-0.5"></div>
      <div v-else class="text-base min-[380px]:text-lg sm:text-2xl font-bold text-slate-100 whitespace-nowrap shrink-0">
        {{ value }}
        <span v-if="unit" class="text-[10px] sm:text-xs text-slate-400 font-normal ml-0.5">{{ unit }}</span>
      </div>
      <slot name="badges">
        <div v-if="isLoading" class="h-5 w-12 bg-slate-800/80 rounded-md animate-pulse"></div>
        <div v-else-if="subText" class="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-800/80 text-purple-300 whitespace-nowrap">
          {{ subText }}
        </div>
      </slot>
    </div>
  </div>
</template>
