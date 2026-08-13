import { ref, computed } from 'vue'

export type RoutePath = '/' | '/auth' | '/dash'

const currentPath = ref<string>(window.location.pathname || '/')

export function useRouter() {
  const navigate = (path: RoutePath | string, replace: boolean = false) => {
    if (replace) {
      window.history.replaceState({}, '', path)
    } else {
      window.history.pushState({}, '', path)
    }
    currentPath.value = path
  }

  const currentRoute = computed(() => {
    const p = currentPath.value.toLowerCase()
    if (p.startsWith('/auth')) return '/auth'
    if (p.startsWith('/dash')) return '/dash'
    return '/'
  })

  // Listen to popstate (back/forward)
  window.addEventListener('popstate', () => {
    currentPath.value = window.location.pathname || '/'
  })

  return {
    currentPath,
    currentRoute,
    navigate
  }
}
