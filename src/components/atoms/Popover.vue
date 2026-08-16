<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch, type Component } from 'vue'

interface Props {
  modelValue?: boolean
  placement?: 'bottom-start' | 'bottom-end' | 'bottom-center'
  offset?: number
  disabled?: boolean
  closeOnClickOutside?: boolean
  closeOnEscape?: boolean
  icon?: Component
  triggerClass?: string
  title?: string
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  placement: 'bottom-end',
  offset: 8,
  disabled: false,
  closeOnClickOutside: true,
  closeOnEscape: true,
  triggerClass: '',
  title: 'Details',
  ariaLabel: 'Details'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'open'): void
  (e: 'close'): void
}>()

const internalOpen = ref(false)
const isOpen = computed(() => props.modelValue !== undefined ? props.modelValue : internalOpen.value)

const triggerRef = ref<HTMLElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)
const isPositioned = ref(false)
const isMeasured = ref(false)
const coords = ref<{ top: number; left: number; maxWidth?: number }>({ top: 0, left: 0 })

const updatePosition = () => {
  if (!isOpen.value || !triggerRef.value) return

  const rect = triggerRef.value.getBoundingClientRect()
  const padding = 12
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Use actual measured DOM width/height once rendered
  const popoverWidth = popoverRef.value?.offsetWidth || 200
  const popoverHeight = popoverRef.value?.offsetHeight || 80

  let top = rect.bottom + props.offset
  let left = rect.left

  if (props.placement === 'bottom-end') {
    left = rect.right - popoverWidth
  } else if (props.placement === 'bottom-center') {
    left = rect.left + (rect.width / 2) - (popoverWidth / 2)
  }

  // Viewport Horizontal Clamping
  if (left + popoverWidth > viewportWidth - padding) {
    left = viewportWidth - padding - popoverWidth
  }
  if (left < padding) {
    left = padding
  }

  // Viewport Vertical Clamping (Flip up if bottom overflows)
  if (top + popoverHeight > viewportHeight - padding && rect.top - popoverHeight - props.offset > padding) {
    top = rect.top - popoverHeight - props.offset
  }

  coords.value = {
    top: Math.round(top),
    left: Math.round(left),
    maxWidth: viewportWidth - (padding * 2)
  }
  isPositioned.value = true
  isMeasured.value = true
}

const setOpen = (val: boolean) => {
  if (props.disabled && val) return

  if (!val) {
    isPositioned.value = false
    isMeasured.value = false
  }

  if (props.modelValue !== undefined) {
    emit('update:modelValue', val)
  } else {
    internalOpen.value = val
  }

  if (val) {
    emit('open')
    nextTick(() => {
      updatePosition()
    })
  } else {
    emit('close')
  }
}

const toggle = () => setOpen(!isOpen.value)

const handleClickOutside = (e: MouseEvent) => {
  if (!isOpen.value || !props.closeOnClickOutside) return
  const target = e.target as Node
  if (triggerRef.value?.contains(target)) return
  if (popoverRef.value?.contains(target)) return
  setOpen(false)
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isOpen.value && props.closeOnEscape) {
    setOpen(false)
  }
}

watch(isOpen, (val) => {
  if (val) {
    nextTick(() => {
      updatePosition()
    })
  } else {
    isPositioned.value = false
    isMeasured.value = false
  }
})

onMounted(() => {
  window.addEventListener('click', handleClickOutside, true)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('resize', updatePosition)
  window.addEventListener('scroll', updatePosition, true)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside, true)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('resize', updatePosition)
  window.removeEventListener('scroll', updatePosition, true)
})

defineExpose({
  open: () => setOpen(true),
  close: () => setOpen(false),
  toggle,
  updatePosition
})
</script>

<template>
  <button
    ref="triggerRef"
    type="button"
    :class="['inline-flex items-center justify-center cursor-pointer transition-colors focus:outline-none', triggerClass]"
    :aria-expanded="isOpen"
    :aria-label="ariaLabel"
    :title="title"
    :disabled="disabled"
    @click.stop="toggle"
  >
    <slot name="trigger" :is-open="isOpen" :toggle="toggle">
      <component :is="icon" v-if="icon" class="w-3.5 h-3.5" />
    </slot>
  </button>

  <Teleport to="body">
    <div
      v-if="isOpen"
      ref="popoverRef"
      :style="{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        maxWidth: coords.maxWidth ? `${coords.maxWidth}px` : undefined,
        opacity: isMeasured ? 1 : 0,
        pointerEvents: isMeasured ? 'auto' : 'none',
        zIndex: 999
      }"
      :class="[
        'transition-opacity duration-150 focus:outline-none',
        isMeasured ? 'animate-in fade-in zoom-in-95 duration-100' : ''
      ]"
      @click.stop
    >
      <slot :close="() => setOpen(false)" />
    </div>
  </Teleport>
</template>
