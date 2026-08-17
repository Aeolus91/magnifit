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
  if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') return null
  return normalizedOptions.value.find((opt) => String(opt.value) === String(props.modelValue))
})

const menuPlacement = ref<'bottom' | 'top'>('bottom')
const maxHeightStyle = ref<string>('18rem')
const coords = ref<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 })
const isPositioned = ref(false)

const updateMenuPosition = () => {
  if (!isOpen.value || !containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const padding = 12
  const spaceBelow = viewportHeight - rect.bottom - padding
  const spaceAbove = rect.top - padding

  let top = rect.bottom + 8
  let maxHeight = Math.min(288, spaceBelow - 8)

  if (spaceBelow < 200 && spaceAbove > spaceBelow) {
    menuPlacement.value = 'top'
    top = Math.max(padding, rect.top - Math.min(288, spaceAbove - 8) - 8)
    maxHeight = Math.min(288, spaceAbove - 8)
  } else {
    menuPlacement.value = 'bottom'
  }

  coords.value = {
    top: Math.round(top),
    left: Math.round(rect.left),
    width: Math.round(rect.width)
  }
  maxHeightStyle.value = `${Math.max(120, maxHeight)}px`
  isPositioned.value = true
}

const toggle = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    isPositioned.value = false
    nextTick(updateMenuPosition)
    if (props.searchable) {
      searchQuery.value = ''
      nextTick(() => {
        searchInputRef.value?.focus()
      })
    }
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
    const menuEl = document.getElementById(`dropdown-menu-${instanceId}`)
    if (menuEl && menuEl.contains(e.target as Node)) return
    isOpen.value = false
  }
}

const instanceId = Math.random().toString(36).substring(2, 9)

const handleResize = () => {
  if (isOpen.value) {
    updateMenuPosition()
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleResize, true)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleResize, true)
})
</script>

<template>
  <div ref="containerRef" class="space-y-1.5 w-full relative">
    <!-- Optional Label -->
    <label v-if="label" class="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
      <component v-if="icon && iconPosition === 'label-left'" :is="icon" :class="['w-3.5 h-3.5 shrink-0', iconColor]" />
      <span>{{ label }}</span>
    </label>

    <!-- Trigger Button -->
    <button type="button" @click="toggle" :disabled="disabled"
      class="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl pl-3.5 pr-4 py-2.5 text-base sm:text-sm text-slate-100 flex items-center justify-between transition cursor-pointer focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed select-none">
      <div class="flex items-center gap-2.5 truncate">
        <component v-if="icon && iconPosition === 'field-left'" :is="icon" :class="['w-4 h-4 shrink-0', iconColor]" />
        <component v-else-if="selectedOption?.icon" :is="selectedOption.icon"
          :class="['w-4 h-4 shrink-0', iconColor]" />
        <span v-if="selectedOption" class="font-medium text-slate-200 truncate">
          {{ selectedOption.label }}
        </span>
        <span v-else class="text-slate-600 truncate">
          {{ placeholder }}
        </span>
      </div>

      <ChevronDown class="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ml-2"
        :class="{ 'rotate-180 text-emerald-400': isOpen }" />
    </button>

    <!-- Dropdown Menu Teleported to body (Escape modal z-index / overflow clipping) -->
    <Teleport to="body">
      <template v-if="isOpen && isPositioned">
        <!-- Backdrop Click Dismissal -->
        <div @click="isOpen = false" class="fixed inset-0 z-60 bg-transparent"></div>

        <div
          :id="`dropdown-menu-${instanceId}`"
          ref="menuRef"
          tabindex="-1"
          :style="{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            maxHeight: maxHeightStyle
          }"
          class="fixed z-60 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-1.5 space-y-1 overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-100 focus:outline-none scrollbar-thin scrollbar-thumb-slate-800"
        >
          <!-- Searchable typeahead input -->
          <div v-if="searchable"
            class="p-1.5 border-b border-slate-800/80 mb-1 sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
            <div class="relative">
              <Search class="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input ref="searchInputRef" type="text" v-model="searchQuery" :placeholder="searchPlaceholder" @click.stop
                class="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition" />
              <button v-if="searchQuery" type="button" @click.stop="searchQuery = ''"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer">
                <X class="w-3 h-3" />
              </button>
            </div>
          </div>

          <div v-if="filteredOptions.length === 0" class="px-3 py-4 text-center text-xs text-slate-500">
            No matching options
          </div>

          <button v-for="opt in filteredOptions" :key="opt.value" type="button" @click="select(opt.value)" :class="[
            'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer text-left',
            String(modelValue) === String(opt.value)
              ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
          ]">
            <div class="flex items-center gap-2 truncate">
              <component v-if="opt.icon" :is="opt.icon" class="w-4 h-4 shrink-0 text-slate-400" />
              <div class="truncate">
                <div>{{ opt.label }}</div>
                <div v-if="opt.description" class="text-[10px] text-slate-500 font-normal truncate">
                  {{ opt.description }}
                </div>
              </div>
            </div>

            <Check v-if="String(modelValue) === String(opt.value)" class="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-3" />
          </button>
        </div>
      </template>
    </Teleport>
  </div>
</template>
