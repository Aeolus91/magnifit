<script setup lang="ts">
import { watchEffect } from 'vue'
import { onMounted } from 'vue'
import { useAuthStore } from './stores/authStore'
import { useRouter } from './lib/router'
import AuthGate from './components/layout/AuthGate.vue'
import LandingView from './views/LandingView.vue'
import AuthView from './views/AuthView.vue'
import DashboardView from './views/DashboardView.vue'
import MealsView from './views/MealsView.vue'

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
    // Unauthenticated users hitting protected '/dash' or '/meals' get redirected to '/auth'
    if (route === '/dash' || route === '/meals') {
      navigate('/auth', true)
    }
  }
})
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
    <Transition name="page" mode="out-in">
      <LandingView v-if="currentRoute === '/'" key="landing" />
      <AuthView v-else-if="currentRoute === '/auth'" key="auth" />
      <DashboardView v-else-if="currentRoute === '/dash'" key="dash" />
      <MealsView v-else-if="currentRoute === '/meals'" key="meals" />
    </Transition>
  </main>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
