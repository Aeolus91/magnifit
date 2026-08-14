<script setup lang="ts">
import type { Component } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    label?: string
    description?: string
    leftLabel?: string
    rightLabel?: string
    icon?: Component
    iconColor?: string
    disabled?: boolean
  }>(),
  {
    modelValue: false,
    disabled: false,
    iconColor: 'text-emerald-400'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const toggle = () => {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <div 
    @click="toggle"
    :class="[
      'flex items-center justify-between px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl transition cursor-pointer select-none',
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-700'
    ]"
  >
    <!-- Label & Description Side -->
    <div class="flex items-center gap-2.5">
      <div 
        v-if="icon" 
        :class="['flex items-center justify-center shrink-0', iconColor]"
      >
        <component :is="icon" class="w-4 h-4" />
      </div>
      <div>
        <div v-if="label" class="text-xs sm:text-sm font-semibold text-slate-200">
          {{ label }}
        </div>
        <div v-if="description" class="text-[11px] text-slate-500 mt-0.5 leading-tight">
          {{ description }}
        </div>
      </div>
    </div>

    <!-- Switch & Closely-Coupled Options -->
    <div class="flex items-center gap-2">
      <!-- Left/Right Segmented Label with Subtitle Wrap -->
      <div v-if="leftLabel || rightLabel" class="flex items-center text-xs font-semibold text-right">
        <!-- Left Label -->
        <div class="flex flex-col items-center">
          <span :class="!modelValue ? 'text-emerald-400' : 'text-slate-500'">
            {{ leftLabel?.split('(')[0]?.trim() }}
          </span>
          <span v-if="leftLabel?.includes('(')" class="text-[10px] font-normal" :class="!modelValue ? 'text-emerald-400/70' : 'text-slate-600'">
            ({{ leftLabel.split('(')[1] }}
          </span>
        </div>

        <span class="text-slate-700 mx-1.5 self-center">/</span>

        <!-- Right Label -->
        <div class="flex flex-col items-center">
          <span :class="modelValue ? 'text-emerald-400' : 'text-slate-500'">
            {{ rightLabel?.split('(')[0]?.trim() }}
          </span>
          <span v-if="rightLabel?.includes('(')" class="text-[10px] font-normal" :class="modelValue ? 'text-emerald-400/70' : 'text-slate-600'">
            ({{ rightLabel.split('(')[1] }}
          </span>
        </div>
      </div>

      <!-- Compact Toggle Switch -->
      <button
        type="button"
        role="switch"
        :aria-checked="modelValue"
        :disabled="disabled"
        class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
        :class="modelValue ? 'bg-emerald-500' : 'bg-slate-800'"
      >
        <span
          class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out mt-[1px] ml-[1px]"
          :class="modelValue ? 'translate-x-4' : 'translate-x-0'"
        />
      </button>
    </div>
  </div>
</template>
