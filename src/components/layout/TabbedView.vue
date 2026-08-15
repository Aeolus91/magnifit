<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface TabItem {
  id: string
  label: string
  icon?: any
  badge?: string | number
}

interface Props {
  modelValue: string
  tabs: TabItem[]
  pillColorClass?: string
  containerClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  pillColorClass: 'bg-emerald-500',
  containerClass: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', tabId: string): void
  (e: 'change', tabId: string): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const dragOffsetX = ref(0)
const isAnimating = ref(false)

const currentTabIndex = computed(() => {
  const idx = props.tabs.findIndex(t => t.id === props.modelValue)
  return idx !== -1 ? idx : 0
})

const pillProgress = computed(() => {
  const containerWidth = containerRef.value?.clientWidth || 1
  const offsetRatio = -dragOffsetX.value / containerWidth
  const raw = currentTabIndex.value + offsetRatio
  return Math.max(0, Math.min(props.tabs.length - 1, raw))
})

const selectTab = (tabId: string) => {
  isAnimating.value = true
  dragOffsetX.value = 0
  emit('update:modelValue', tabId)
  emit('change', tabId)
  setTimeout(() => {
    isAnimating.value = false
  }, 280)
}

// Direction-Locked Touch Gesture Handling
let touchStartX = 0
let touchStartY = 0
let touchStartTime = 0
let gestureLocked: 'horizontal' | 'vertical' | null = null

const handleTouchStart = (e: TouchEvent) => {
  if (e.touches.length !== 1) return
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  touchStartTime = Date.now()
  gestureLocked = null
  dragOffsetX.value = 0
  isDragging.value = false
}

const handleTouchMove = (e: TouchEvent) => {
  if (e.touches.length !== 1) return
  const currentX = e.touches[0].clientX
  const currentY = e.touches[0].clientY
  const dx = currentX - touchStartX
  const dy = currentY - touchStartY

  if (!gestureLocked) {
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      if (Math.abs(dx) > Math.abs(dy)) {
        gestureLocked = 'horizontal'
        isDragging.value = true
      } else {
        gestureLocked = 'vertical'
        return
      }
    }
  }

  if (gestureLocked === 'horizontal') {
    if (e.cancelable) e.preventDefault()
    // Rubber-band resistance at track edges
    let effectiveDx = dx
    if ((currentTabIndex.value === 0 && dx > 0) || (currentTabIndex.value === props.tabs.length - 1 && dx < 0)) {
      effectiveDx = dx * 0.3
    }
    dragOffsetX.value = effectiveDx
  }
}

const handleTouchEnd = () => {
  if (gestureLocked === 'horizontal') {
    const elapsed = Date.now() - touchStartTime
    const velocity = Math.abs(dragOffsetX.value) / Math.max(elapsed, 1)
    const threshold = (containerRef.value?.clientWidth || 300) * 0.2

    let targetIdx = currentTabIndex.value
    if (dragOffsetX.value < -threshold || (dragOffsetX.value < -25 && velocity > 0.4)) {
      if (targetIdx < props.tabs.length - 1) targetIdx++
    } else if (dragOffsetX.value > threshold || (dragOffsetX.value > 25 && velocity > 0.4)) {
      if (targetIdx > 0) targetIdx--
    }

    isAnimating.value = true
    isDragging.value = false
    dragOffsetX.value = 0
    if (targetIdx !== currentTabIndex.value) {
      const nextTab = props.tabs[targetIdx]
      if (nextTab) {
        emit('update:modelValue', nextTab.id)
        emit('change', nextTab.id)
      }
    }
    setTimeout(() => {
      isAnimating.value = false
    }, 280)
  }
  gestureLocked = null
  isDragging.value = false
}

// Mouse Side-Scroll (Horizontal Wheel & Shift + Wheel) Handling - Single Tab Per Scroll
let isWheelCoolingDown = false
let wheelCooldownTimer: ReturnType<typeof setTimeout> | null = null

const handleWheel = (e: WheelEvent) => {
  const isHorizontalWheel = Math.abs(e.deltaX) > Math.abs(e.deltaY)
  const isShiftWheel = e.shiftKey && Math.abs(e.deltaY) > 0
  const deltaX = isHorizontalWheel ? e.deltaX : (isShiftWheel ? e.deltaY : 0)

  if (Math.abs(deltaX) < 8) return

  // Prevent vertical page scroll if this is an explicit horizontal wheel event
  if (isHorizontalWheel || isShiftWheel) {
    if (e.cancelable) e.preventDefault()
  }

  if (isWheelCoolingDown) return

  if (Math.abs(deltaX) >= 12) {
    let targetIdx = currentTabIndex.value
    if (deltaX > 0 && targetIdx < props.tabs.length - 1) {
      targetIdx++
    } else if (deltaX < 0 && targetIdx > 0) {
      targetIdx--
    }

    if (targetIdx !== currentTabIndex.value) {
      isWheelCoolingDown = true
      selectTab(props.tabs[targetIdx].id)
      if (wheelCooldownTimer) clearTimeout(wheelCooldownTimer)
      wheelCooldownTimer = setTimeout(() => {
        isWheelCoolingDown = false
      }, 350)
    }
  }
}

onMounted(() => {
  if (containerRef.value) {
    containerRef.value.addEventListener('touchstart', handleTouchStart, { passive: true })
    containerRef.value.addEventListener('touchmove', handleTouchMove, { passive: false })
    containerRef.value.addEventListener('touchend', handleTouchEnd, { passive: true })
    containerRef.value.addEventListener('touchcancel', handleTouchEnd, { passive: true })
    containerRef.value.addEventListener('wheel', handleWheel, { passive: false })
  }
})

onUnmounted(() => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('touchstart', handleTouchStart)
    containerRef.value.removeEventListener('touchmove', handleTouchMove)
    containerRef.value.removeEventListener('touchend', handleTouchEnd)
    containerRef.value.removeEventListener('touchcancel', handleTouchEnd)
    containerRef.value.removeEventListener('wheel', handleWheel)
  }
  if (wheelCooldownTimer) clearTimeout(wheelCooldownTimer)
})
</script>

<template>
  <div class="space-y-6" :class="containerClass">
    <!-- Tab Navigation Header with Real-Time Sliding Pill -->
    <div
      class="relative grid p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold overflow-hidden"
      :style="{
        gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`
      }"
    >
      <!-- Real-Time Sliding Background Pill -->
      <div
        class="absolute top-1 bottom-1 rounded-lg shadow-md pointer-events-none"
        :class="[
          pillColorClass,
          isDragging ? '' : 'transition-transform duration-250 ease-out'
        ]"
        :style="{
          width: `calc((100% - 8px) / ${tabs.length})`,
          left: '4px',
          transform: `translateX(${pillProgress * 100}%)`
        }"
      ></div>

      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        @click="selectTab(tab.id)"
        :class="[
          'relative z-10 py-2 px-1 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5 cursor-pointer text-center truncate select-none',
          modelValue === tab.id
            ? 'text-slate-950 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        ]"
      >
        <component :is="tab.icon" v-if="tab.icon" class="w-4 h-4 shrink-0" />
        <span class="truncate">{{ tab.label }}</span>
        <span v-if="tab.badge !== undefined" class="text-[11px] opacity-80">({{ tab.badge }})</span>
      </button>
    </div>

    <!-- Direction-Locked Gesture Slider Track -->
    <div
      ref="containerRef"
      class="overflow-hidden w-full select-none"
    >
      <div
        class="flex flex-nowrap w-full"
        :class="isDragging ? '' : 'transition-transform duration-250 ease-out'"
        :style="{
          transform: `translateX(calc(-${currentTabIndex * 100}% + ${dragOffsetX}px))`
        }"
      >
        <div
          v-for="(tab, idx) in tabs"
          :key="tab.id"
          class="w-full shrink-0 px-3 sm:px-4"
          :class="isDragging ? '' : 'transition-opacity duration-250 ease-out'"
          :style="{
            opacity: Math.max(0.05, 1 - Math.abs(pillProgress - idx) * 0.95)
          }"
        >
          <slot :name="tab.id" :tab="tab" />
        </div>
      </div>
    </div>
  </div>
</template>
