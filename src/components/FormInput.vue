<script setup lang="ts">
import type { Component } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    label?: string
    type?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    min?: number | string
    max?: number | string
    step?: number | string
    inputmode?: 'numeric' | 'decimal' | 'text' | 'email' | 'tel' | 'search' | 'url' | 'none'
    pattern?: string
    icon?: Component
    iconPosition?: 'field-left' | 'field-right' | 'label-left' | 'label-right'
    iconColor?: string
    inputClass?: string
  }>(),
  {
    type: 'text',
    required: false,
    disabled: false,
    iconPosition: 'field-left',
    iconColor: 'text-slate-500'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (props.type === 'number') {
    const val = target.value === '' ? null : Number(target.value)
    emit('update:modelValue', val)
  } else {
    emit('update:modelValue', target.value)
  }
}
</script>

<template>
  <div class="space-y-1.5 w-full">
    <!-- Label with Optional Icon -->
    <label v-if="label" class="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
      <component
        v-if="icon && iconPosition === 'label-left'"
        :is="icon"
        :class="['w-3.5 h-3.5 shrink-0', iconColor]"
      />
      <span>{{ label }}</span>
      <component
        v-if="icon && iconPosition === 'label-right'"
        :is="icon"
        :class="['w-3.5 h-3.5 shrink-0', iconColor]"
      />
    </label>

    <!-- Field Container with Optional Embedded Icon -->
    <div class="relative w-full">
      <!-- Field Left Icon -->
      <div
        v-if="icon && iconPosition === 'field-left'"
        class="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
      >
        <component :is="icon" :class="['w-4 h-4 shrink-0', iconColor]" />
      </div>

      <!-- Native Input -->
      <input
        :type="type"
        :inputmode="inputmode || (type === 'number' ? (step && String(step).includes('.') ? 'decimal' : 'numeric') : undefined)"
        :pattern="pattern || (type === 'number' ? '[0-9]*' : undefined)"
        :value="modelValue ?? ''"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :min="min"
        :max="max"
        :step="step"
        @input="onInput"
        :class="[
          'w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 text-base sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition disabled:opacity-50',
          icon && iconPosition === 'field-left' ? 'pl-10 pr-3.5' : '',
          icon && iconPosition === 'field-right' ? 'pl-3.5 pr-10' : '',
          !icon || iconPosition.startsWith('label') ? 'px-3.5' : '',
          inputClass
        ]"
      />

      <!-- Field Right Icon -->
      <div
        v-if="icon && iconPosition === 'field-right'"
        class="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
      >
        <component :is="icon" :class="['w-4 h-4 shrink-0', iconColor]" />
      </div>
    </div>
  </div>
</template>
