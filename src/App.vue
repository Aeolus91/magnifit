<script setup lang="ts">
import { watchEffect } from 'vue'
import { useRouter } from './lib/router'
import { useAuthStore } from './stores/authStore'
import LandingView from './views/LandingView.vue'
import AuthView from './views/AuthView.vue'
import DashboardView from './views/DashboardView.vue'

const { currentRoute, navigate } = useRouter()
const authStore = useAuthStore()

// Route Guards
watchEffect(() => {
  const isAuth = authStore.isAuthenticated.value
  const route = currentRoute.value

  if (isAuth) {
    // Authenticated users hitting landing '/' or '/auth' get sent directly to '/dash'
    if (route === '/' || route === '/auth') {
      navigate('/dash', true)
    }
  } else {
    // Unauthenticated users hitting protected '/dash' get redirected to '/auth'
    if (route === '/dash') {
      navigate('/auth', true)
    }
  }
})
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
    <LandingView v-if="currentRoute === '/'" />
    <AuthView v-else-if="currentRoute === '/auth'" />
    <DashboardView v-else-if="currentRoute === '/dash'" />
  </main>
</template>
