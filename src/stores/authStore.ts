import { ref, computed } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from '../lib/router'
import type { User, Session } from '../lib/cust-supabase'

const session = ref<Session | null>(supabase.auth.getSession())
const user = ref<User | null>(supabase.auth.getUser())
const loading = ref<boolean>(false)
const error = ref<string | null>(null)

// Subscribe to auth state changes
supabase.auth.onAuthStateChange((event, currentSession) => {
  session.value = currentSession
  user.value = currentSession?.user || null

  // Never redirect offline users to auth screen
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
  if (!isOffline && (event === 'SESSION_INVALID' || (!currentSession && window.location.pathname.startsWith('/dash')))) {
    const { navigate } = useRouter()
    navigate('/auth', true)
  }
})

export function useAuthStore() {
  const isAuthenticated = computed(() => !!session.value)

  const signUp = async (email: string, password?: string) => {
    loading.value = true
    error.value = null
    try {
      await supabase.auth.signUp({ email, password })
    } catch (e: any) {
      error.value = e.message || 'Failed to sign up'
      throw e
    } finally {
      loading.value = false
    }
  }

  const signIn = async (email: string, password?: string) => {
    loading.value = true
    error.value = null
    try {
      await supabase.auth.signInWithPassword({ email, password })
    } catch (e: any) {
      error.value = e.message || 'Failed to sign in'
      throw e
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    loading.value = true
    error.value = null
    try {
      await supabase.auth.signOut()
    } catch (e: any) {
      error.value = e.message || 'Failed to sign out'
    } finally {
      loading.value = false
    }
  }

  const deleteAccount = async () => {
    loading.value = true
    error.value = null
    try {
      await supabase.auth.deleteUser()
    } catch (e: any) {
      error.value = e.message || 'Failed to delete account'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    session,
    isAuthenticated,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    deleteAccount
  }
}
