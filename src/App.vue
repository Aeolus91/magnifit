<script setup lang="ts">
import { watchEffect, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from './stores/authStore'
import { useRouter } from './lib/router'
import LandingView from './views/LandingView.vue'
import AuthView from './views/AuthView.vue'
import DashboardView from './views/DashboardView.vue'
import MealsView from './views/MealsView.vue'

const { currentRoute, navigate, beforeEach } = useRouter()
const authStore = useAuthStore()

// Register Navigation Guard with Router
beforeEach((to) => {
  const isAuth = authStore.isAuthenticated.value
  const target = to.toLowerCase()

  if (isAuth) {
    // Authenticated users trying to access landing '/' or '/auth' resolve redirect intent or go to '/dash'
    if (target === '/' || target.startsWith('/auth')) {
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get('redirect')
      return redirect && redirect.startsWith('/') ? redirect : '/dash'
    }
  } else {
    // Unauthenticated users trying to access protected routes are sent to '/auth?redirect=...'
    if (target.startsWith('/dash') || target.startsWith('/meals')) {
      return `/auth?redirect=${encodeURIComponent(to)}`
    }
  }
})

// React to auth session changes (e.g. login, logout)
watchEffect(() => {
  const isAuth = authStore.isAuthenticated.value
  const route = currentRoute.value

  if (isAuth && (route === '/' || route === '/auth')) {
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get('redirect')
    navigate(redirect && redirect.startsWith('/') ? redirect : '/dash', true)
  } else if (!isAuth && (route === '/dash' || route === '/meals')) {
    navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`, true)
  }
})

// Mobile Virtual Keyboard Viewport Auto-Scroll
onMounted(() => {
  const handleFocusIn = (e: FocusEvent) => {
    const target = e.target as HTMLElement | null
    if (!target) return
    if (target.matches('input, textarea, select, [contenteditable="true"]')) {
      // 300ms delay ensures mobile keyboard slide-up animation finishes resizing viewport
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      }, 300)
    }
  }

  const handleViewportResize = () => {
    const active = document.activeElement as HTMLElement | null
    if (active && active.matches('input, textarea, select, [contenteditable="true"]')) {
      active.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    }
  }

  window.addEventListener('focusin', handleFocusIn)
  window.visualViewport?.addEventListener('resize', handleViewportResize)

  onUnmounted(() => {
    window.removeEventListener('focusin', handleFocusIn)
    window.visualViewport?.removeEventListener('resize', handleViewportResize)
  })
})
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
    <div class="grid grid-cols-1 grid-rows-1">
      <Transition name="page">
        <LandingView v-if="currentRoute === '/'" key="landing" class="col-start-1 row-start-1 w-full" />
        <AuthView v-else-if="currentRoute === '/auth'" key="auth" class="col-start-1 row-start-1 w-full" />
        <DashboardView v-else-if="currentRoute === '/dash'" key="dash" class="col-start-1 row-start-1 w-full" />
        <MealsView v-else-if="currentRoute === '/meals'" key="meals" class="col-start-1 row-start-1 w-full" />
      </Transition>
    </div>
  </main>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease-out;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
