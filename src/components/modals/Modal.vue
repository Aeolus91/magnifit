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
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto overscroll-contain"
      @click.self="emit('close')"
    >
      <div
        :class="[
          'w-full max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] bg-slate-900/95 border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-2xl flex flex-col my-auto',
          props.maxWidthClass
        ]"
      >
        <!-- Header (Fixed at top of modal) -->
        <div v-if="props.title || props.showClose || $slots.header" class="pb-3 border-b border-slate-800/60 shrink-0">
          <slot name="header">
            <div class="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <div class="flex items-center gap-2" :class="props.iconColor">
                <component :is="props.icon" v-if="props.icon" class="w-4 h-4 shrink-0" />
                <span v-if="props.title" class="text-sm font-bold text-slate-100 truncate">{{ props.title }}</span>
              </div>
              <button
                v-if="props.showClose"
                type="button"
                @click="emit('close')"
                class="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition cursor-pointer shrink-0 ml-2"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </slot>
        </div>

        <!-- Body (Scrolls only if content exceeds max viewport height) -->
        <div class="space-y-4 py-3 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-800 flex-1">
          <slot />
        </div>

        <!-- Footer (Fixed at bottom if provided) -->
        <div v-if="$slots.footer" class="pt-3 border-t border-slate-800/80 shrink-0">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
