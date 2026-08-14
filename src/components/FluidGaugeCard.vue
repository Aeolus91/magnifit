<script setup lang="ts">
import { computed, type Component } from 'vue'

interface Props {
  title: string
  current: number
  target?: number
  unit?: string
  icon: Component
  variant?: 'amber' | 'emerald' | 'cyan' | 'purple' | 'slate'
  subtitle?: string
  showPercentage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  target: 0,
  unit: '',
  variant: 'emerald',
  showPercentage: true
})

const safeTarget = computed(() => (props.target > 0 ? props.target : 0))

const fillPercent = computed(() => {
  if (safeTarget.value <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((props.current / safeTarget.value) * 100)))
})

const styles = computed(() => {
  switch (props.variant) {
    case 'amber':
      return {
        headerText: 'text-amber-400',
        badge: 'text-amber-300/90 bg-amber-950/40 border-amber-800/40',
        fillGrad: 'from-amber-500/25 via-amber-500/15 to-amber-500/5 border-amber-400/50',
        glowEdge: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]'
      }
    case 'cyan':
      return {
        headerText: 'text-cyan-400',
        badge: 'text-cyan-300/90 bg-cyan-950/40 border-cyan-800/40',
        fillGrad: 'from-cyan-500/25 via-cyan-500/15 to-cyan-500/5 border-cyan-400/50',
        glowEdge: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]'
      }
    case 'purple':
      return {
        headerText: 'text-purple-400',
        badge: 'text-purple-300/90 bg-purple-950/40 border-purple-800/40',
        fillGrad: 'from-purple-500/25 via-purple-500/15 to-purple-500/5 border-purple-400/50',
        glowEdge: 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.6)]'
      }
    case 'slate':
      return {
        headerText: 'text-slate-400',
        badge: 'text-slate-300/90 bg-slate-800/60 border-slate-700/40',
        fillGrad: 'from-slate-500/25 via-slate-500/15 to-slate-500/5 border-slate-400/50',
        glowEdge: 'bg-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.6)]'
      }
    case 'emerald':
    default:
      return {
        headerText: 'text-emerald-400',
        badge: 'text-emerald-300/90 bg-emerald-950/40 border-emerald-800/40',
        fillGrad: 'from-emerald-500/25 via-emerald-500/15 to-emerald-500/5 border-emerald-400/50',
        glowEdge: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
      }
  }
})
</script>

<template>
  <div class="relative overflow-hidden bg-slate-950/70 border border-slate-800/80 rounded-xl p-4.5 transition-all">
    <!-- Horizontal Animated Fluid Fill Layer -->
    <div
      class="absolute inset-y-0 left-0 bg-gradient-to-r border-r transition-all duration-700 ease-out pointer-events-none"
      :class="styles.fillGrad"
      :style="{ width: `${fillPercent}%` }"
    >
      <!-- Glowing leading edge accent -->
      <div class="absolute right-0 top-0 bottom-0 w-[2px]" :class="styles.glowEdge" />
    </div>

    <!-- Foreground Content -->
    <div class="relative z-10 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase" :class="styles.headerText">
          <component :is="icon" class="w-3.5 h-3.5" />
          <span>{{ title }}</span>
        </div>
        <span
          v-if="showPercentage && safeTarget > 0"
          class="text-xs font-medium px-2 py-0.5 rounded-full border"
          :class="styles.badge"
        >
          {{ fillPercent }}%
        </span>
      </div>

      <div class="flex items-baseline justify-between pt-1">
        <div>
          <div class="text-2xl font-bold text-slate-100">
            {{ current.toLocaleString() }}
            <span v-if="unit" class="text-xs text-slate-400 font-normal ml-0.5">{{ unit }}</span>
          </div>
        </div>
        <div v-if="subtitle" class="text-[11px] text-slate-400 font-medium truncate max-w-[150px] text-right">
          {{ subtitle }}
        </div>
      </div>

      <!-- Optional slot for actions or footer details -->
      <div v-if="$slots.default" class="pt-2">
        <slot />
      </div>
    </div>
  </div>
</template>
