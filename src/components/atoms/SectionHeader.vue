<script setup lang="ts">
import type { Component } from 'vue'
import { Plus } from '@lucide/vue'

interface Props {
  title: string
  description?: string
  actionLabel?: string
  actionIcon?: Component
  actionVariant?: 'emerald' | 'amber' | 'cyan' | 'purple' | 'rose'
}

withDefaults(defineProps<Props>(), {
  description: '',
  actionLabel: '',
  actionIcon: () => Plus,
  actionVariant: 'emerald'
})

const emit = defineEmits<{
  (e: 'action'): void
}>()

const variantClasses: Record<string, string> = {
  emerald: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/40',
  amber: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40',
  cyan: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-950/40',
  purple: 'bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-purple-950/40',
  rose: 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-950/40'
}
</script>

<template>
  <div class="grid grid-cols-3 sm:flex sm:items-center sm:justify-between gap-3 items-center">
    <!-- Title & Description (2/3 ratio on mobile, auto on sm+) -->
    <div class="col-span-2 space-y-0.5 min-w-0">
      <h2 class="text-base sm:text-lg font-bold text-slate-100 truncate">{{ title }}</h2>
      <p v-if="description" class="text-xs text-slate-400 leading-relaxed line-clamp-2 sm:line-clamp-none">{{ description }}</p>
    </div>

    <!-- Actions Container (1/3 ratio flex on mobile, auto on sm+) -->
    <div class="col-span-1 flex items-center justify-end gap-2 shrink-0 flex-wrap">
      <!-- Slot for custom auxiliary controls (e.g. toggles, filters, custom inputs) -->
      <slot name="controls" />

      <!-- Built-in primary action button (renders strictly if actionLabel is provided) -->
      <button
        v-if="actionLabel"
        type="button"
        @click="emit('action')"
        :class="[
          'px-3.5 py-2 rounded-xl active:scale-95 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md whitespace-nowrap w-full sm:w-auto',
          variantClasses[actionVariant] || variantClasses.emerald
        ]"
      >
        <component :is="actionIcon" class="w-3.5 h-3.5 stroke-[2.5]" />
        <span>{{ actionLabel }}</span>
      </button>
    </div>
  </div>
</template>
