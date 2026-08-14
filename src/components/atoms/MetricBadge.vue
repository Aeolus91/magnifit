<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  label: string
  icon?: Component
  variant?: 'emerald' | 'rose' | 'amber' | 'purple' | 'cyan' | 'slate'
  size?: 'xs' | 'sm'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'slate',
  size: 'xs'
})

const variantClasses: Record<string, string> = {
  emerald: 'bg-emerald-950/80 border-emerald-800/80 text-emerald-300',
  rose: 'bg-rose-950/80 border-rose-800/80 text-rose-300',
  amber: 'bg-amber-950/80 border-amber-800/80 text-amber-300',
  purple: 'bg-purple-950/80 border-purple-800/80 text-purple-300',
  cyan: 'bg-cyan-950/80 border-cyan-800/80 text-cyan-300',
  slate: 'bg-slate-800/80 border-slate-700/80 text-slate-300'
}

const sizeClasses: Record<string, string> = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs'
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1 font-bold rounded-md border whitespace-nowrap shrink-0 transition-colors',
      variantClasses[props.variant] || variantClasses.slate,
      sizeClasses[props.size] || sizeClasses.xs
    ]"
  >
    <component :is="icon" v-if="icon" class="w-3 h-3 shrink-0" />
    <span>{{ label }}</span>
  </span>
</template>
