<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  label: string
  value: string | number
  unit?: string
  subText?: string
  icon: Component
  variant?: 'emerald' | 'cyan' | 'purple' | 'amber' | 'slate'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'emerald'
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
  <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
    <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" :class="colorMap[props.variant]">
      <component :is="icon" class="w-4 h-4" />
      <span>{{ label }}</span>
    </div>
    <div class="flex items-baseline gap-1.5 flex-wrap">
      <div class="text-2xl font-bold text-slate-100">
        {{ value }}
        <span v-if="unit" class="text-xs text-slate-400 font-normal ml-1">{{ unit }}</span>
      </div>
      <slot name="badges">
        <div v-if="subText" class="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-800/80 text-purple-300">
          {{ subText }}
        </div>
      </slot>
    </div>
  </div>
</template>
