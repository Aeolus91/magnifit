<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '../lib/i18n'
import type { Profile } from '../types/fitness'
import { RefreshCw, User as UserIcon, ChevronDown, Sliders, LogOut } from '@lucide/vue'

interface Props {
  userProfile: Profile | null
  userEmail?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  userProfile: null,
  loading: false
})

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'open-onboarding'): void
  (e: 'sign-out'): void
}>()

const { t } = useI18n()
const showProfileMenu = ref(false)

const handleFocusOut = (e: FocusEvent) => {
  const currentTarget = e.currentTarget as HTMLElement | null
  if (currentTarget && !currentTarget.contains(e.relatedTarget as Node)) {
    showProfileMenu.value = false
  }
}
</script>

<template>
  <header class="flex items-center justify-between border-b border-slate-800 pb-4">
    <div>
      <h1 class="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
        {{ t('brand.name') }}
      </h1>
    </div>
    <div class="flex items-center gap-3">
      <!-- Refresh Data Button -->
      <button
        type="button"
        @click="emit('refresh')"
        :title="t('dash.actions.refresh')"
        class="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 transition cursor-pointer"
      >
        <RefreshCw class="w-4 h-4 text-slate-300" :class="{ 'animate-spin': loading }" />
      </button>

      <!-- Profile Button & Dropdown Popover Menu -->
      <div class="relative" @focusout="handleFocusOut">
        <button
          type="button"
          @click="showProfileMenu = !showProfileMenu"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition cursor-pointer"
        >
          <div class="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <UserIcon class="w-3 h-3" />
          </div>
          <span class="font-medium max-w-[140px] truncate">
            {{ userProfile?.display_name || userProfile?.username || userEmail || 'Profile' }}
          </span>
          <ChevronDown
            class="w-3.5 h-3.5 text-slate-400 transition-transform duration-150"
            :class="{ 'rotate-180': showProfileMenu }"
          />
        </button>

        <!-- Backdrop for Outside Dismissal -->
        <div v-if="showProfileMenu" @click="showProfileMenu = false" class="fixed inset-0 z-30 bg-transparent"></div>

        <!-- Profile Dropdown Popover -->
        <div
          v-if="showProfileMenu"
          @click="showProfileMenu = false"
          tabindex="-1"
          class="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-40 space-y-1 animate-in fade-in zoom-in-95 duration-100 focus:outline-none"
        >
          <!-- User Metadata Header -->
          <div class="px-3 py-2 border-b border-slate-800/80 mb-1">
            <div class="text-xs font-semibold text-slate-200 truncate">
              {{ userProfile?.display_name || 'My Profile' }}
            </div>
            <div class="text-[11px] text-slate-500 truncate">
              {{ userProfile?.username ? `@${userProfile.username}` : userEmail }}
            </div>
          </div>

          <!-- Onboarding / Preferences Trigger -->
          <button
            type="button"
            @click="emit('open-onboarding')"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition cursor-pointer"
          >
            <Sliders class="w-3.5 h-3.5" />
            <span>{{ t('dash.profile.redo_onboarding') }}</span>
          </button>

          <!-- Logout Button -->
          <button
            type="button"
            @click="emit('sign-out')"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
          >
            <LogOut class="w-3.5 h-3.5" />
            <span>{{ t('dash.profile.logout') }}</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
