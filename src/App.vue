<script setup lang="ts">
import { watchEffect } from 'vue'
import { useAuthStore } from './stores/authStore'
import { useRouter } from './lib/router'
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
