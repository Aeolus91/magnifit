<script setup lang="ts">
import { onMounted, onUnmounted, type Component } from 'vue'
import { X, Loader2 } from '@lucide/vue'

interface Props {
  title?: string
  icon?: Component
  iconColor?: string
  maxWidthClass?: string
  showClose?: boolean
  // Footer Action Props
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'emerald' | 'amber' | 'cyan' | 'purple' | 'rose'
  confirmIcon?: Component
  confirmDisabled?: boolean
  confirmLoading?: boolean
  showCancel?: boolean
  showConfirm?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  iconColor: 'text-emerald-400',
  maxWidthClass: 'max-w-lg',
  showClose: true,
  cancelText: 'Cancel',
  confirmVariant: 'emerald',
  confirmDisabled: false,
  confirmLoading: false,
  showCancel: true,
  showConfirm: undefined
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'cancel'): void
  (e: 'confirm'): void
}>()

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    emit('close')
  }
}

const handleCancel = () => {
  emit('cancel')
  emit('close')
}

const handleConfirm = () => {
  if (!props.confirmDisabled && !props.confirmLoading) {
    emit('confirm')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const variantClassMap: Record<string, string> = {
  emerald: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/40',
  amber: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40',
  cyan: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-950/40',
  purple: 'bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-purple-950/40',
  rose: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
}
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
        <div v-if="props.title || props.showClose" class="pb-3 border-b border-slate-800/60 shrink-0">
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
                title="Close"
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

        <!-- Footer (Fixed at bottom if provided via slot or built-in actions) -->
        <div v-if="props.confirmText || props.showConfirm" class="pt-3 border-t border-slate-800/80 shrink-0">
          <slot name="footer">
            <div class="flex items-center justify-end gap-2">
              <button
                v-if="props.showCancel"
                type="button"
                @click="handleCancel"
                class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                {{ props.cancelText }}
              </button>
              <button
                type="button"
                :disabled="props.confirmDisabled || props.confirmLoading"
                @click="handleConfirm"
                :class="[
                  'px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed',
                  variantClassMap[props.confirmVariant] || variantClassMap.emerald
                ]"
              >
                <Loader2 v-if="props.confirmLoading" class="w-3.5 h-3.5 animate-spin" />
                <template v-else>
                  <component :is="props.confirmIcon" v-if="props.confirmIcon" class="w-3.5 h-3.5 stroke-3" />
                  <span>{{ props.confirmText || 'Confirm' }}</span>
                </template>
              </button>
            </div>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>
