import { ref, computed } from 'vue'

export type RoutePath = '/' | '/auth' | '/dash' | '/meals'

export type NavigationGuard = (
  to: RoutePath | string,
  from: RoutePath | string
) => RoutePath | string | boolean | void | Promise<RoutePath | string | boolean | void>

// Handle GitHub Pages SPA 404 redirect param (?p=...)
function handleGitHubPagesRedirect() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const redirectedPath = params.get('p')

  if (redirectedPath) {
    params.delete('p')
    const remainingQuery = params.toString() ? `?${params.toString()}` : ''
    const cleanUrl = window.location.pathname.replace(/\/$/, '') + redirectedPath + remainingQuery + window.location.hash
    window.history.replaceState(null, '', cleanUrl)
  }
}

handleGitHubPagesRedirect()

const currentPath = ref<string>(typeof window !== 'undefined' ? window.location.pathname || '/' : '/')
const routeState = ref<Record<string, any>>({})
const guards: NavigationGuard[] = []

// Prevent browser default scroll jump during popstate/swipe-back
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

export function useRouter() {
  const beforeEach = (guard: NavigationGuard) => {
    guards.push(guard)
    // Immediately execute guard for current initial path
    runGuards(currentPath.value, currentPath.value).then((target) => {
      if (typeof target === 'string' && target !== currentPath.value) {
        navigate(target, true)
      }
    })
  }

  const runGuards = async (to: string, from: string): Promise<string | boolean | void> => {
    for (const guard of guards) {
      const result = await guard(to, from)
      if (result === false) return false
      if (typeof result === 'string') return result
    }
    return true
  }

  const navigate = async (path: RoutePath | string, replace: boolean = false, state?: Record<string, any>) => {
    const from = currentPath.value
    const target = await runGuards(path, from)

    if (target === false) return
    const finalPath = typeof target === 'string' ? target : path

    if (state !== undefined) {
      routeState.value = state
      window.history.pushState(state, '', finalPath)
    } else if (replace) {
      window.history.replaceState(window.history.state, '', finalPath)
    } else {
      window.history.pushState(window.history.state, '', finalPath)
    }
    currentPath.value = finalPath

    // Smooth deterministic scroll reset
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }

  const currentRoute = computed<RoutePath>(() => {
    const p = currentPath.value.toLowerCase()
    if (p.startsWith('/auth')) return '/auth'
    if (p.startsWith('/dash')) return '/dash'
    if (p.startsWith('/meals')) return '/meals'
    return '/'
  })

  // Listen to popstate (back/forward swipe)
  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', async (e) => {
      const to = window.location.pathname || '/'
      const from = currentPath.value
      const target = await runGuards(to, from)

      if (target === false) {
        // Revert history
        window.history.pushState(window.history.state, '', from)
        return
      }

      const finalPath = typeof target === 'string' ? target : to
      if (typeof target === 'string' && target !== to) {
        window.history.replaceState(null, '', finalPath)
      }

      currentPath.value = finalPath
      if (e.state) {
        routeState.value = e.state
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    })
  }

  return {
    currentPath,
    currentRoute,
    routeState,
    navigate,
    beforeEach
  }
}
