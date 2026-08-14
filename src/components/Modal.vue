<script setup lang="ts">
import { onMounted, onUnmounted, type Component } from 'vue'
import { X } from '@lucide/vue'

interface Props {
  title?: string
  icon?: Component
  iconColor?: string
  maxWidthClass?: string
  showClose?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  iconColor: 'text-emerald-400',
  maxWidthClass: 'max-w-lg',
  showClose: true
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden overscroll-none touch-none"
      @click.self="emit('close')"
    >
      <div
        :class="[
          'w-full bg-slate-900/95 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 flex flex-col justify-between',
          props.maxWidthClass
        ]"
      >
        <!-- Header -->
        <div v-if="props.title || props.showClose || $slots.header" class="space-y-4">
          <slot name="header">
            <div class="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <div class="flex items-center gap-2" :class="props.iconColor">
                <component :is="props.icon" v-if="props.icon" class="w-4 h-4" />
                <span v-if="props.title" class="text-sm font-bold text-slate-100">{{ props.title }}</span>
              </div>
              <button
                v-if="props.showClose"
                type="button"
                @click="emit('close')"
                class="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition cursor-pointer"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </slot>
        </div>

        <!-- Body -->
        <div class="space-y-4">
          <slot />
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="pt-4 border-t border-slate-800/80">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
