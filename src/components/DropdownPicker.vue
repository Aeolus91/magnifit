<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import type { Component } from 'vue'
import { ChevronDown, Check, Search, X } from '@lucide/vue'

export interface DropdownOption {
  value: string | number
  label: string
  description?: string
  icon?: Component
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null
    options: DropdownOption[] | string[]
    label?: string
    placeholder?: string
    searchable?: boolean
    searchPlaceholder?: string
    icon?: Component
    iconPosition?: 'field-left' | 'label-left'
    iconColor?: string
    disabled?: boolean
  }>(),
  {
    modelValue: null,
    placeholder: 'Select an option',
    searchable: false,
    searchPlaceholder: 'Search categories...',
    disabled: false,
    iconPosition: 'field-left',
    iconColor: 'text-emerald-400'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const containerRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)

// Normalize options to DropdownOption format
const normalizedOptions = computed<DropdownOption[]>(() => {
  return props.options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt }
    }
    return opt
  })
})

const filteredOptions = computed<DropdownOption[]>(() => {
  if (!props.searchable || !searchQuery.value.trim()) {
    return normalizedOptions.value
  }
  const q = searchQuery.value.toLowerCase().trim()
  return normalizedOptions.value.filter(opt =>
    opt.label.toLowerCase().includes(q) ||
    (opt.description && opt.description.toLowerCase().includes(q))
  )
})

const selectedOption = computed(() => {
  return normalizedOptions.value.find((opt) => opt.value === props.modelValue)
})

const toggle = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value && props.searchable) {
    searchQuery.value = ''
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  }
}

const select = (value: string | number) => {
  emit('update:modelValue', value)
  isOpen.value = false
  searchQuery.value = ''
}

// Auto dismiss on outside click
const handleClickOutside = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

// Auto dismiss on focusout
const handleFocusOut = (e: FocusEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.relatedTarget as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="containerRef" @focusout="handleFocusOut" class="space-y-1.5 w-full relative">
    <!-- Optional Label -->
    <label v-if="label" class="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
      <component
        v-if="icon && iconPosition === 'label-left'"
        :is="icon"
        :class="['w-3.5 h-3.5 shrink-0', iconColor]"
      />
      <span>{{ label }}</span>
    </label>

    <!-- Trigger Button -->
    <button
      type="button"
      @click="toggle"
      :disabled="disabled"
      class="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl pl-3.5 pr-4 py-2.5 text-base sm:text-sm text-slate-100 flex items-center justify-between transition cursor-pointer focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed select-none"
    >
      <div class="flex items-center gap-2.5 truncate">
        <component
          v-if="icon && iconPosition === 'field-left'"
          :is="icon"
          :class="['w-4 h-4 shrink-0', iconColor]"
        />
        <component
          v-else-if="selectedOption?.icon"
          :is="selectedOption.icon"
          :class="['w-4 h-4 shrink-0', iconColor]"
        />
        <span v-if="selectedOption" class="font-medium text-slate-200 truncate">
          {{ selectedOption.label }}
        </span>
        <span v-else class="text-slate-600 truncate">
          {{ placeholder }}
        </span>
      </div>

      <ChevronDown
        class="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ml-2"
        :class="{ 'rotate-180 text-emerald-400': isOpen }"
      />
    </button>

    <!-- Backdrop Click Dismissal for Mobile -->
    <div
      v-if="isOpen"
      @click="isOpen = false"
      class="fixed inset-0 z-40 bg-transparent"
    ></div>

    <!-- Dropdown Menu Popover -->
    <div
      v-if="isOpen"
      tabindex="-1"
      class="absolute left-0 top-full mt-2 w-full bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-1.5 z-50 space-y-1 max-h-72 overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-100 focus:outline-none scrollbar-thin scrollbar-thumb-slate-800"
    >
      <!-- Searchable typeahead input -->
      <div v-if="searchable" class="p-1.5 border-b border-slate-800/80 mb-1 sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
        <div class="relative">
          <Search class="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            ref="searchInputRef"
            type="text"
            v-model="searchQuery"
            :placeholder="searchPlaceholder"
            @click.stop
            class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition"
          />
          <button
            v-if="searchQuery"
            type="button"
            @click.stop="searchQuery = ''"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
          >
            <X class="w-3 h-3" />
          </button>
        </div>
      </div>

      <div v-if="filteredOptions.length === 0" class="px-3 py-4 text-center text-xs text-slate-500">
        No workout matching "{{ searchQuery }}"
      </div>

      <button
        v-for="opt in filteredOptions"
        :key="opt.value"
        type="button"
        @click="select(opt.value)"
        :class="[
          'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer text-left',
          modelValue === opt.value
            ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-semibold'
            : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
        ]"
      >
        <div class="flex items-center gap-2 truncate">
          <component v-if="opt.icon" :is="opt.icon" class="w-4 h-4 shrink-0 text-slate-400" />
          <div class="truncate">
            <div>{{ opt.label }}</div>
            <div v-if="opt.description" class="text-[10px] text-slate-500 font-normal truncate">
              {{ opt.description }}
            </div>
          </div>
        </div>

        <Check
          v-if="modelValue === opt.value"
          class="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[3]"
        />
      </button>
    </div>
  </div>
</template>
