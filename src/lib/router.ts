import { ref, computed } from 'vue'

export type RoutePath = '/' | '/auth' | '/dash' | '/meals'

const currentPath = ref<string>(window.location.pathname || '/')
const routeState = ref<Record<string, any>>({})

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
  }

  const currentRoute = computed(() => {
    const p = currentPath.value.toLowerCase()
    if (p.startsWith('/auth')) return '/auth'
    if (p.startsWith('/dash')) return '/dash'
    if (p.startsWith('/meals')) return '/meals'
    return '/'
  })

  // Listen to popstate (back/forward)
  window.addEventListener('popstate', (e) => {
    currentPath.value = window.location.pathname || '/'
    if (e.state) {
      routeState.value = e.state
    }
  })

  return {
    currentPath,
    currentRoute,
    routeState,
    navigate
  }
}
