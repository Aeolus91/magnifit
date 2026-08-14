<script setup lang="ts">
import { computed } from 'vue'
import { Pencil, Trash2, Scale, Activity, Heart, Sparkles, Zap, HeartPulse } from '@lucide/vue'
import {
  BIOMETRIC_TYPES,
  BIOMETRIC_CATEGORY_LABELS,
  BIOMETRIC_UNITS,
  BiometricFlags,
  hasFlag
} from '../../lib/bitmask'
import type { Biometric } from '../../types/fitness'

interface Props {
  biometric: Biometric
  allBiometrics?: Biometric[]
  showAverageAggregate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  allBiometrics: () => [],
  showAverageAggregate: false
})

const emit = defineEmits<{
  (e: 'edit', biometric: Biometric): void
  (e: 'delete', id: string): void
}>()

const getCategoryIcon = (cat: number) => {
  switch (cat) {
    case 1: return Scale
    case 2: return Activity
    case 3: return Heart
    case 4: return Sparkles
    case 5: return Zap
    default: return HeartPulse
  }
}

const getCategoryColor = (cat: number) => {
  switch (cat) {
    case 1: return 'text-purple-400 bg-purple-950/60 border-purple-800/60'
    case 2: return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60'
    case 3: return 'text-rose-400 bg-rose-950/60 border-rose-800/60'
    case 4: return 'text-amber-400 bg-amber-950/60 border-amber-800/60'
    case 5: return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60'
    default: return 'text-slate-400 bg-slate-900 border-slate-800'
  }
}

const getMeasurementDisplay = (b: Biometric): { primary: string; sub: string | null } => {
  const meta = BIOMETRIC_TYPES[b.type]
  const valPrimary = b.val / (meta?.scale || 1)
  const unit = meta?.unitLabel || ''

  if (b.type === 32 && b.val_sec !== undefined && b.val_sec !== null) {
    return { primary: `${b.val}/${b.val_sec} ${unit}`, sub: null }
  }

  const isLeft = hasFlag(b.flags || 0, BiometricFlags.UNILATERAL_LEFT)
  const isRight = hasFlag(b.flags || 0, BiometricFlags.UNILATERAL_RIGHT)

  if (meta?.isUnilateral && props.showAverageAggregate && (isLeft || isRight)) {
    const pair = props.allBiometrics.find(
      other => other.type === b.type &&
      other.id !== b.id &&
      ((isLeft && hasFlag(other.flags || 0, BiometricFlags.UNILATERAL_RIGHT)) ||
       (isRight && hasFlag(other.flags || 0, BiometricFlags.UNILATERAL_LEFT)))
    )

    if (pair) {
      const valPair = pair.val / (meta?.scale || 1)
      const avg = ((valPrimary + valPair) / 2).toFixed(1)
      const leftVal = isLeft ? valPrimary : valPair
      const rightVal = isRight ? valPrimary : valPair
      return {
        primary: `Avg: ${avg} ${unit}`,
        sub: `(L: ${leftVal.toFixed(1)} | R: ${rightVal.toFixed(1)})`
      }
    }
  }

  return {
    primary: `${meta?.step && meta.step < 1 ? valPrimary.toFixed(1) : valPrimary} ${unit}`,
    sub: null
  }
}

const measurement = computed(() => getMeasurementDisplay(props.biometric))
const meta = computed(() => BIOMETRIC_TYPES[props.biometric.type])
</script>

<template>
  <div class="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-sm group hover:border-slate-700 transition">
    <div class="flex items-center justify-between gap-3 w-full">
      <!-- Left Column: Icon, Title, Category and Floating Badges -->
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <div class="p-2 rounded-lg border shrink-0" :class="getCategoryColor(biometric.cat)">
          <component :is="getCategoryIcon(biometric.cat)" class="w-4 h-4" />
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-semibold text-slate-200 truncate">
              {{ meta?.name || `Biometric #${biometric.type}` }}
            </span>

            <!-- Floating Badges on >=360px -->
            <div class="hidden min-[360px]:flex items-center gap-1.5 flex-wrap">
              <span
                v-if="hasFlag(biometric.flags || 0, BiometricFlags.UNILATERAL_LEFT)"
                class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 whitespace-nowrap"
              >
                Left
              </span>
              <span
                v-if="hasFlag(biometric.flags || 0, BiometricFlags.UNILATERAL_RIGHT)"
                class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 whitespace-nowrap"
              >
                Right
              </span>
              <span
                v-if="hasFlag(biometric.flags || 0, BiometricFlags.FASTED)"
                class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 border border-amber-800/80 text-amber-300 whitespace-nowrap"
              >
                Fasted
              </span>
              <span
                v-if="hasFlag(biometric.flags || 0, BiometricFlags.POST_WORKOUT_PUMP)"
                class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-950/80 border border-purple-800/80 text-purple-300 whitespace-nowrap"
              >
                Pumped
              </span>
              <span
                v-if="hasFlag(biometric.flags || 0, BiometricFlags.RESTING)"
                class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 border border-rose-800/80 text-rose-300 whitespace-nowrap"
              >
                Resting
              </span>
            </div>
          </div>

          <div class="text-xs text-slate-400 mt-0.5">
            {{ BIOMETRIC_CATEGORY_LABELS[biometric.cat] || 'General' }}
          </div>
        </div>
      </div>

      <!-- Right Column: Measurement Values & Actions -->
      <div class="flex flex-col items-end gap-1 shrink-0">
        <div class="flex flex-col items-end text-right">
          <span class="font-bold text-purple-400 text-sm whitespace-nowrap">
            {{ measurement.primary }}
          </span>
          <span v-if="measurement.sub" class="text-[11px] text-slate-400 whitespace-nowrap">
            {{ measurement.sub }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <!-- Badges for screens <360px -->
          <div class="flex min-[360px]:hidden items-center gap-1">
            <span
              v-if="hasFlag(biometric.flags || 0, BiometricFlags.UNILATERAL_LEFT)"
              class="px-1 py-0.2 text-[9px] font-bold bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 rounded"
            >
              L
            </span>
            <span
              v-if="hasFlag(biometric.flags || 0, BiometricFlags.UNILATERAL_RIGHT)"
              class="px-1 py-0.2 text-[9px] font-bold bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 rounded"
            >
              R
            </span>
          </div>

          <!-- Edit / Delete Actions -->
          <div class="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
            <button
              type="button"
              @click="emit('edit', biometric)"
              class="p-1 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-800 transition cursor-pointer"
              title="Edit Biometric"
            >
              <Pencil class="w-3.5 h-3.5" />
            </button>
            <button
              v-if="biometric.id"
              type="button"
              @click="emit('delete', biometric.id)"
              class="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
              title="Delete Biometric"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
