<script setup lang="ts">
import type { Component } from 'vue'
import { Plus } from '@lucide/vue'

interface Props {
  title: string
  description?: string
  actionLabel?: string
  actionIcon?: Component
  actionVariant?: 'emerald' | 'amber' | 'cyan' | 'purple' | 'rose'
  showAction?: boolean
}

withDefaults(defineProps<Props>(), {
  description: '',
  actionLabel: 'Add',
  actionIcon: () => Plus,
  actionVariant: 'emerald',
  showAction: true
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
  <div class="grid grid-cols-4 sm:flex sm:items-center sm:justify-between gap-3 items-center">
    <!-- Title & Description (3/4 ratio on mobile, auto on sm+) -->
    <div class="col-span-3 space-y-0.5 min-w-0">
      <h2 class="text-base sm:text-lg font-bold text-slate-100 truncate">{{ title }}</h2>
      <p v-if="description" class="text-xs text-slate-400 leading-relaxed line-clamp-2 sm:line-clamp-none">{{ description }}</p>
    </div>

    <!-- Actions Container (1/4 ratio flex on mobile, auto on sm+) -->
    <div class="col-span-1 flex flex-col sm:flex-row items-end sm:items-center justify-center sm:justify-end gap-1.5 sm:gap-2 shrink-0">
      <!-- Dedicated wrapper for custom auxiliary controls (e.g. toggles, filters, custom inputs) -->
      <div class="flex items-center justify-end w-full sm:w-auto shrink-0 [&>*]:w-full sm:[&>*]:w-auto">
        <slot name="controls" />
      </div>

      <!-- Built-in primary action button (defaults to 'Add' and Plus icon) -->
      <button
        v-if="showAction && actionLabel"
        type="button"
        @click="emit('action')"
        :class="[
          'p-2 min-[360px]:px-3.5 min-[360px]:py-2 rounded-xl active:scale-95 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md whitespace-nowrap w-full sm:w-auto',
          variantClasses[actionVariant] || variantClasses.emerald
        ]"
        :title="actionLabel"
      >
        <component :is="actionIcon" class="w-4 h-4 min-[360px]:w-3.5 min-[360px]:h-3.5 stroke-[2.5] shrink-0" />
        <span class="hidden min-[360px]:inline truncate">{{ actionLabel }}</span>
      </button>
    </div>
  </div>
</template>
