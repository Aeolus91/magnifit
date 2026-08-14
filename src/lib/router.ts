import { ref, computed } from 'vue'

export type RoutePath = '/' | '/auth' | '/dash' | '/meals'

const currentPath = ref<string>(typeof window !== 'undefined' ? window.location.pathname || '/' : '/')
const routeState = ref<Record<string, any>>({})

// Prevent browser default scroll jump during popstate/swipe-back
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

export function useRouter() {
  const navigate = (path: RoutePath | string, replace: boolean = false, state?: Record<string, any>) => {
    if (state !== undefined) {
      routeState.value = state
      window.history.pushState(state, '', path)
    } else if (replace) {
      window.history.replaceState(window.history.state, '', path)
    } else {
      window.history.pushState(window.history.state, '', path)
    }
    currentPath.value = path

    // Smooth deterministic scroll reset
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }

  const currentRoute = computed(() => {
    const p = currentPath.value.toLowerCase()
    if (p.startsWith('/auth')) return '/auth'
    if (p.startsWith('/dash')) return '/dash'
    if (p.startsWith('/meals')) return '/meals'
    return '/'
  })

  // Listen to popstate (back/forward swipe)
  window.addEventListener('popstate', (e) => {
    currentPath.value = window.location.pathname || '/'
    if (e.state) {
      routeState.value = e.state
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  })

  return {
    currentPath,
    currentRoute,
    routeState,
    navigate
  }
}
