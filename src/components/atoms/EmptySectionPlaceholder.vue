<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  title: string
  description?: string
  icon?: Component
  iconColorClass?: string
  iconBgClass?: string
}

withDefaults(defineProps<Props>(), {
  description: '',
  iconColorClass: 'text-amber-400',
  iconBgClass: 'bg-slate-950/60 border border-slate-800'
})
</script>

<template>
  <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center space-y-3 shadow-sm">
    <div
      v-if="icon"
      :class="[
        'w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-inner',
        iconBgClass,
        iconColorClass
      ]"
    >
      <component :is="icon" class="w-6 h-6 stroke-[1.75]" />
    </div>
    <div class="space-y-1">
      <h3 class="text-sm font-semibold text-slate-200">{{ title }}</h3>
      <p v-if="description" class="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
        {{ description }}
      </p>
      <slot />
    </div>
  </div>
</template>
