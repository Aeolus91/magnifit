export interface CustomSupabaseConfig {
  supabaseUrl: string
  supabaseKey: string
  autoRefreshToken?: boolean
  persistSession?: boolean
  storageKey?: string
}

export interface User {
  id: string
  email?: string
  role?: string
  user_metadata?: Record<string, any>
  app_metadata?: Record<string, any>
  created_at?: string
}

export interface Session {
  access_token: string
  token_type: string
  expires_in: number
  expires_at?: number
  refresh_token: string
  user: User
}

export type AuthStateChangeListener = (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED', session: Session | null) => void

export class CustomSupabaseClient {
  private url: string
  private key: string
  private storageKey: string
  private session: Session | null = null
  private authListeners: Set<AuthStateChangeListener> = new Set()
  private ws: WebSocket | null = null
  private realtimeListeners: Map<string, Array<(payload: any) => void>> = new Map()
  private heartbeatTimer: any = null
  private refCounter = 0

  constructor(config: CustomSupabaseConfig) {
    this.url = config.supabaseUrl.replace(/\/$/, '')
    this.key = config.supabaseKey
    this.storageKey = config.storageKey || 'cust-supabase-auth'
    this.loadSession()
  }

  private loadSession(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.session = JSON.parse(stored)
      }
    } catch {
      this.session = null
    }
  }

  private saveSession(session: Session | null): void {
    this.session = session
    if (session) {
      localStorage.setItem(this.storageKey, JSON.stringify(session))
    } else {
      localStorage.removeItem(this.storageKey)
    }
  }

  private getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'apikey': this.key,
      'Content-Type': 'application/json',
      ...extraHeaders
    }
    if (this.session?.access_token) {
      headers['Authorization'] = `Bearer ${this.session.access_token}`
    } else {
      headers['Authorization'] = `Bearer ${this.key}`
    }
    return headers
  }

  public auth = {
    signUp: async (credentials: { email: string; password?: string }) => {
      const res = await fetch(`${this.url}/auth/v1/signup`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(credentials)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error_description || data.msg || 'Signup failed')
      if (data.access_token) {
        this.saveSession(data)
        this.notifyAuth('SIGNED_IN')
      }
      return data
    },

    signInWithPassword: async (credentials: { email: string; password?: string }) => {
      const res = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(credentials)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error_description || data.msg || 'Authentication failed')
      this.saveSession(data)
      this.notifyAuth('SIGNED_IN')
      return data
    },

    signOut: async () => {
      if (this.session?.access_token) {
        await fetch(`${this.url}/auth/v1/logout`, {
          method: 'POST',
          headers: this.getHeaders()
        }).catch(() => {})
      }
      this.saveSession(null)
      this.notifyAuth('SIGNED_OUT')
    },

    deleteUser: async () => {
      if (!this.session?.user?.id) throw new Error('No authenticated user')
      const res = await fetch(`${this.url}/auth/v1/admin/users/${this.session.user.id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })
      if (!res.ok) {
        // Fallback for non-admin client-side self delete via REST RPC or Auth API
        const selfRes = await fetch(`${this.url}/auth/v1/user`, {
          method: 'DELETE',
          headers: this.getHeaders()
        })
        if (!selfRes.ok) throw new Error('Failed to delete account')
      }
      this.saveSession(null)
      this.notifyAuth('SIGNED_OUT')
    },

    getSession: (): Session | null => this.session,

    getUser: (): User | null => this.session?.user || null,

    onAuthStateChange: (callback: AuthStateChangeListener) => {
      this.authListeners.add(callback)
      return {
        unsubscribe: () => this.authListeners.delete(callback)
      }
    }
  }

  private notifyAuth(event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED'): void {
    this.authListeners.forEach(cb => cb(event, this.session))
  }

  public from<T = any>(table: string) {
    return new QueryBuilder<T>(`${this.url}/rest/v1/${table}`, this.getHeaders.bind(this))
  }

  public channel(topic: string) {
    const wsUrl = this.url.replace(/^http/, 'ws') + `/realtime/v1/websocket?apikey=${this.key}&vsn=1.0.0`
    
    return {
      on: (event: 'INSERT' | 'UPDATE' | 'DELETE' | '*', callback: (payload: any) => void) => {
        const key = `${topic}:${event}`
        if (!this.realtimeListeners.has(key)) {
          this.realtimeListeners.set(key, [])
        }
        this.realtimeListeners.get(key)!.push(callback)
        return this
      },

      subscribe: () => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          this.ws = new WebSocket(wsUrl)
          this.ws.onopen = () => {
            this.startHeartbeat()
            this.sendJoin(topic)
          }
          this.ws.onmessage = (e) => this.handleWsMessage(e)
        } else {
          this.sendJoin(topic)
        }
      }
    }
  }

  private sendJoin(topic: string): void {
    this.refCounter++
    const msg = {
      topic: `realtime:${topic}`,
      event: 'phx_join',
      payload: { config: { postgres_changes: [{ event: '*', schema: 'public' }] } },
      ref: String(this.refCounter)
    }
    this.ws?.send(JSON.stringify(msg))
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = setInterval(() => {
      this.refCounter++
      this.ws?.send(JSON.stringify({
        topic: 'phoenix',
        event: 'heartbeat',
        payload: {},
        ref: String(this.refCounter)
      }))
    }, 30000)
  }

  private handleWsMessage(e: MessageEvent): void {
    try {
      const data = JSON.parse(e.data)
      if (data.event === 'postgres_changes') {
        const payload = data.payload?.data
        const eventType = payload?.type
        const topic = data.topic?.replace(/^realtime:/, '')

        const specificListeners = this.realtimeListeners.get(`${topic}:${eventType}`) || []
        const wildcardListeners = this.realtimeListeners.get(`${topic}:*`) || []
        
        specificListeners.forEach(cb => cb(payload))
        wildcardListeners.forEach(cb => cb(payload))
      }
    } catch {}
  }
}

class QueryBuilder<T> {
  private url: string
  private getHeaders: () => Record<string, string>
  private queryParams: string[] = []

  constructor(url: string, getHeaders: () => Record<string, string>) {
    this.url = url
    this.getHeaders = getHeaders
  }

  select(columns: string = '*'): this {
    this.queryParams.push(`select=${encodeURIComponent(columns)}`)
    return this
  }

  eq(column: string, value: any): this {
    this.queryParams.push(`${column}=eq.${encodeURIComponent(value)}`)
    return this
  }

  order(column: string, opts: { ascending?: boolean } = {}): this {
    const asc = opts.ascending ?? true
    this.queryParams.push(`order=${column}.${asc ? 'asc' : 'desc'}`)
    return this
  }

  limit(count: number): this {
    this.queryParams.push(`limit=${count}`)
    return this
  }

  private buildUrl(): string {
    return this.queryParams.length ? `${this.url}?${this.queryParams.join('&')}` : this.url
  }

  async get(): Promise<{ data: T[] | null; error: Error | null }> {
    try {
      const res = await fetch(this.buildUrl(), {
        method: 'GET',
        headers: this.getHeaders()
      })
      if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`)
      const data = await res.json()
      return { data, error: null }
    } catch (error: any) {
      return { data: null, error }
    }
  }

  async insert(records: Partial<T> | Partial<T>[]): Promise<{ data: T[] | null; error: Error | null }> {
    try {
      const headers = {
        ...this.getHeaders(),
        'Prefer': 'return=representation'
      }
      const res = await fetch(this.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(records)
      })
      if (!res.ok) throw new Error(`Insert failed with status ${res.status}`)
      const data = await res.json()
      return { data, error: null }
    } catch (error: any) {
      return { data: null, error }
    }
  }
}
