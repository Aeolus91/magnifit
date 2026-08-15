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

export type AuthStateChangeListener = (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | 'SESSION_INVALID', session: Session | null) => void

export class CustomSupabaseClient {
  public url: string
  public key: string
  private storageKey: string
  private session: Session | null = null
  private authListeners: Set<AuthStateChangeListener> = new Set()
  private ws: WebSocket | null = null
  private realtimeListeners: Map<string, Array<(payload: any) => void>> = new Map()
  private pendingJoins: Set<string> = new Set()
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
        // If expired, attempt background refresh if online, but NEVER purge offline sessions
        if (this.session?.expires_at && this.session.expires_at * 1000 < Date.now()) {
          if (typeof navigator !== 'undefined' && navigator.onLine) {
            this.auth.refreshSession().catch(err => {
              // Only invalidate on explicit 400/401 invalid grant, never on network error
              if (err?.message?.includes('invalid_grant') || err?.message?.includes('Token refresh failed')) {
                this.handleInvalidSession()
              }
            })
          }
        }
      }
    } catch {
      this.session = null
    }
  }

  public handleInvalidSession(): void {
    this.saveSession(null)
    this.notifyAuth('SESSION_INVALID')
    this.notifyAuth('SIGNED_OUT')
  }

  private saveSession(session: Session | null): void {
    this.session = session
    if (session) {
      localStorage.setItem(this.storageKey, JSON.stringify(session))
    } else {
      localStorage.removeItem(this.storageKey)
    }
  }

  public getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
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
    signUp: async (credentials: { email: string; password?: string; data?: Record<string, any> }) => {
      const { email, password, data } = credentials
      const res = await fetch(`${this.url}/auth/v1/signup`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, password, data })
      })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error_description || resData.msg || resData.message || 'Signup failed')
      if (resData.access_token) {
        this.saveSession(resData)
        this.notifyAuth('SIGNED_IN')
      }
      return resData
    },

    signInWithPassword: async (credentials: { email: string; password?: string }) => {
      const res = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(credentials)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error_description || data.msg || data.message || 'Authentication failed')
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

    updateUser: async (attributes: { email?: string; password?: string; data?: Record<string, any> }) => {
      if (!this.session?.access_token) throw new Error('No authenticated user')
      const res = await fetch(`${this.url}/auth/v1/user`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(attributes)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error_description || data.msg || data.message || 'Failed to update user')
      if (this.session) {
        this.session.user = { ...this.session.user, ...data }
        this.saveSession(this.session)
        this.notifyAuth('USER_UPDATED')
      }
      return data
    },

    refreshSession: async () => {
      if (!this.session?.refresh_token) throw new Error('No refresh token available')
      const res = await fetch(`${this.url}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ refresh_token: this.session.refresh_token })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error_description || data.msg || 'Token refresh failed')
      this.saveSession(data)
      this.notifyAuth('TOKEN_REFRESHED')
      return data
    },

    deleteUser: async () => {
      if (!this.session?.user?.id) throw new Error('No authenticated user')
      const res = await fetch(`${this.url}/auth/v1/user`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })
      if (!res.ok) {
        const adminRes = await fetch(`${this.url}/auth/v1/admin/users/${this.session.user.id}`, {
          method: 'DELETE',
          headers: this.getHeaders()
        })
        if (!adminRes.ok) throw new Error('Failed to delete account')
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

  private notifyAuth(event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | 'SESSION_INVALID'): void {
    this.authListeners.forEach(cb => cb(event, this.session))
  }

  public async generateNonce(): Promise<string | null> {
    try {
      if (!this.session?.access_token) return null
      const res = await fetch(`${this.url}/rest/v1/rpc/generate_nonce`, {
        method: 'POST',
        headers: this.getHeaders()
      })
      if (!res.ok) return null
      const nonce = await res.json()
      return nonce
    } catch {
      return null
    }
  }

  public from<T = any>(table: string) {
    return new QueryBuilder<T>(
      `${this.url}/rest/v1/${table}`,
      this.getHeaders.bind(this),
      this.handleInvalidSession.bind(this),
      this.generateNonce.bind(this),
      this.auth.refreshSession.bind(this.auth),
      () => this.session
    )
  }

  public async rpc<T = any>(fn: string, args: Record<string, any> = {}): Promise<{ data: T | null; error: Error | null }> {
    try {
      const res = await fetch(`${this.url}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(args)
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: res.statusText }))
        return { data: null, error: new Error(errData.message || errData.msg || errData.error_description || 'RPC call failed') }
      }
      const data = await res.json().catch(() => null)
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
    }
  }

  public channel(topic: string) {
    const wsUrl = this.url.replace(/^http/, 'ws') + `/realtime/v1/websocket?apikey=${this.key}&vsn=1.0.0`
    
    const channelObj = {
      on: (
        eventOrType: string,
        filterOrCallback: any,
        callbackMaybe?: (payload: any) => void
      ) => {
        let event = '*'
        let table = '*'
        let cb: (payload: any) => void

        if (typeof filterOrCallback === 'function') {
          // 2-arg overload: channel.on('INSERT', (payload) => {})
          event = eventOrType
          cb = filterOrCallback
        } else {
          // 3-arg overload: channel.on('postgres_changes', { event, table }, (payload) => {})
          event = filterOrCallback?.event || '*'
          table = filterOrCallback?.table || '*'
          cb = callbackMaybe || (() => {})
        }

        const key = `${topic}:${table}:${event}`
        if (!this.realtimeListeners.has(key)) {
          this.realtimeListeners.set(key, [])
        }
        this.realtimeListeners.get(key)!.push(cb)
        return channelObj
      },

      subscribe: () => {
        this.pendingJoins.add(topic)

        if (!this.ws || this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING) {
          this.ws = new WebSocket(wsUrl)
          this.ws.onopen = () => {
            this.startHeartbeat()
            this.flushPendingJoins()
          }
          this.ws.onmessage = (e) => this.handleWsMessage(e)
          this.ws.onerror = () => {}
          this.ws.onclose = () => {
            if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
          }
        } else if (this.ws.readyState === WebSocket.OPEN) {
          this.flushPendingJoins()
        }
        return channelObj
      }
    }

    return channelObj
  }

  private flushPendingJoins(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    for (const top of this.pendingJoins) {
      this.sendJoin(top)
    }
    this.pendingJoins.clear()
  }

  private sendJoin(topic: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.pendingJoins.add(topic)
      return
    }
    this.refCounter++
    const msg = {
      topic: `realtime:${topic}`,
      event: 'phx_join',
      payload: { config: { postgres_changes: [{ event: '*', schema: 'public' }] } },
      ref: String(this.refCounter)
    }
    try {
      this.ws.send(JSON.stringify(msg))
    } catch {}
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.refCounter++
        try {
          this.ws.send(JSON.stringify({
            topic: 'phoenix',
            event: 'heartbeat',
            payload: {},
            ref: String(this.refCounter)
          }))
        } catch {}
      }
    }, 30000)
  }

  private handleWsMessage(e: MessageEvent): void {
    try {
      const data = JSON.parse(e.data)
      if (data.event === 'postgres_changes') {
        const payload = data.payload?.data
        const eventType = payload?.type // INSERT, UPDATE, DELETE
        const table = payload?.table
        const topic = data.topic?.replace(/^realtime:/, '')

        // Dispatch specific and wildcard listeners
        const keys = [
          `${topic}:${table}:${eventType}`,
          `${topic}:${table}:*`,
          `${topic}:*:${eventType}`,
          `${topic}:*:*`
        ]

        keys.forEach(k => {
          const listeners = this.realtimeListeners.get(k)
          if (listeners) {
            listeners.forEach(cb => cb(payload))
          }
        })
      }
    } catch {}
  }
}

export class QueryBuilder<T> {
  private url: string
  private getHeaders: () => Record<string, string>
  private onAuthFailure?: () => void
  private getNonce?: () => Promise<string | null>
  private queryParams: string[] = []
  private pendingMethod: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET'
  private pendingBody: any = null
  private isSingle: boolean = false
  private upsertResolution: 'ignore-duplicates' | 'merge-duplicates' | null = null
  private refreshSession?: () => Promise<any>
  private getSession?: () => Session | null

  constructor(
    url: string,
    getHeaders: () => Record<string, string>,
    onAuthFailure?: () => void,
    getNonce?: () => Promise<string | null>,
    refreshSession?: () => Promise<any>,
    getSession?: () => Session | null
  ) {
    this.url = url
    this.getHeaders = getHeaders
    this.onAuthFailure = onAuthFailure
    this.getNonce = getNonce
    this.refreshSession = refreshSession
    this.getSession = getSession
  }

  // Filter Builders
  select(columns: string = '*'): this {
    this.queryParams.push(`select=${encodeURIComponent(columns)}`)
    return this
  }

  eq(column: string, value: any): this {
    this.queryParams.push(`${column}=eq.${encodeURIComponent(value)}`)
    return this
  }

  neq(column: string, value: any): this {
    this.queryParams.push(`${column}=neq.${encodeURIComponent(value)}`)
    return this
  }

  gt(column: string, value: any): this {
    this.queryParams.push(`${column}=gt.${encodeURIComponent(value)}`)
    return this
  }

  gte(column: string, value: any): this {
    this.queryParams.push(`${column}=gte.${encodeURIComponent(value)}`)
    return this
  }

  lt(column: string, value: any): this {
    this.queryParams.push(`${column}=lt.${encodeURIComponent(value)}`)
    return this
  }

  lte(column: string, value: any): this {
    this.queryParams.push(`${column}=lte.${encodeURIComponent(value)}`)
    return this
  }

  in(column: string, values: any[]): this {
    this.queryParams.push(`${column}=in.(${values.map(v => encodeURIComponent(v)).join(',')})`)
    return this
  }

  is(column: string, value: null | boolean): this {
    this.queryParams.push(`${column}=is.${value}`)
    return this
  }

  like(column: string, pattern: string): this {
    this.queryParams.push(`${column}=like.${encodeURIComponent(pattern)}`)
    return this
  }

  ilike(column: string, pattern: string): this {
    this.queryParams.push(`${column}=ilike.${encodeURIComponent(pattern)}`)
    return this
  }

  order(column: string, opts: { ascending?: boolean; nullsFirst?: boolean } = {}): this {
    const asc = opts.ascending ?? true
    let str = `${column}.${asc ? 'asc' : 'desc'}`
    if (opts.nullsFirst !== undefined) {
      str += `.${opts.nullsFirst ? 'nullsfirst' : 'nullslast'}`
    }
    this.queryParams.push(`order=${str}`)
    return this
  }

  limit(count: number): this {
    this.queryParams.push(`limit=${count}`)
    return this
  }

  range(from: number, to: number): this {
    this.queryParams.push(`offset=${from}`)
    this.queryParams.push(`limit=${to - from + 1}`)
    return this
  }

  single(): this {
    this.isSingle = true
    return this
  }

  // Mutation Operations
  insert(records: Partial<T> | Partial<T>[]): this {
    this.pendingMethod = 'POST'
    this.pendingBody = records
    return this
  }

  upsert(records: Partial<T> | Partial<T>[], opts: { onConflict?: string; ignoreDuplicates?: boolean } = {}): this {
    this.pendingMethod = 'POST'
    this.pendingBody = records
    this.upsertResolution = opts.ignoreDuplicates ? 'ignore-duplicates' : 'merge-duplicates'
    if (opts.onConflict) {
      this.queryParams.push(`on_conflict=${encodeURIComponent(opts.onConflict)}`)
    }
    return this
  }

  update(values: Partial<T>): this {
    this.pendingMethod = 'PATCH'
    this.pendingBody = values
    return this
  }

  delete(): this {
    this.pendingMethod = 'DELETE'
    return this
  }

  private buildUrl(): string {
    return this.queryParams.length ? `${this.url}?${this.queryParams.join('&')}` : this.url
  }

  // Explicit Execution Methods with Pre-flight and Reactive Auto-Refresh
  async execute(isRetry = false): Promise<{ data: any; error: Error | null; count?: number | null }> {
    try {
      // 1. Proactive pre-flight token refresh if within 60s of expiring
      if (!isRetry && this.getSession && this.refreshSession && typeof navigator !== 'undefined' && navigator.onLine) {
        const curSession = this.getSession()
        if (curSession?.expires_at && curSession.expires_at * 1000 - Date.now() < 60000) {
          await this.refreshSession().catch(() => {})
        }
      }

      const headers: Record<string, string> = {
        ...this.getHeaders(),
        'Prefer': 'return=representation'
      }

      // Automatically fetch and attach mutation nonce for POST, PATCH, DELETE
      if (this.pendingMethod !== 'GET' && this.getNonce) {
        const nonce = await this.getNonce()
        if (nonce) {
          headers['x-request-nonce'] = nonce
        }
      }

      if (this.upsertResolution) {
        headers['Prefer'] += `,resolution=${this.upsertResolution}`
      }

      if (this.isSingle && this.pendingMethod === 'GET') {
        headers['Accept'] = 'application/vnd.pgrst.object+json'
      }

      const options: RequestInit = {
        method: this.pendingMethod,
        headers
      }

      if (this.pendingBody !== null && this.pendingMethod !== 'GET' && this.pendingMethod !== 'DELETE') {
        options.body = JSON.stringify(this.pendingBody)
      }

      const requestUrl = this.buildUrl()

      // Instant offline return for GET requests if navigator is offline
      if (this.pendingMethod === 'GET' && typeof navigator !== 'undefined' && !navigator.onLine) {
        try {
          const cached = localStorage.getItem(`mfit_cache:${requestUrl}`)
          if (cached) {
            return { data: JSON.parse(cached), error: null }
          }
        } catch {}
      }

      const res = await fetch(requestUrl, options)
      
      if (!res.ok) {
        // Reactive auto-retry on 401 Unauthorized or 403 Forbidden (expired token dropped to anon)
        if (!isRetry && (res.status === 401 || res.status === 403) && this.refreshSession && typeof navigator !== 'undefined' && navigator.onLine) {
          try {
            await this.refreshSession()
            // Retry request once with fresh access token
            return await this.execute(true)
          } catch {
            if (typeof this.onAuthFailure === 'function') {
              this.onAuthFailure()
            }
          }
        } else if (res.status === 401 && typeof this.onAuthFailure === 'function') {
          this.onAuthFailure()
        }

        let errDetail = `Status ${res.status}`
        try {
          const errJson = await res.json()
          errDetail = errJson.message || errJson.details || errJson.hint || JSON.stringify(errJson)
        } catch {
          errDetail = await res.text() || errDetail
        }
        throw new Error(errDetail)
      }

      // Handle 204 No Content
      if (res.status === 204) {
        return { data: null, error: null }
      }

      const data = await res.json()

      // Cache successful GET responses for instant offline access
      if (this.pendingMethod === 'GET' && data !== undefined) {
        try {
          localStorage.setItem(`mfit_cache:${requestUrl}`, JSON.stringify(data))
        } catch {}
      }

      return { data, error: null }
    } catch (error: any) {
      // Fallback to cache on network fetch failure for GET requests
      if (this.pendingMethod === 'GET') {
        try {
          const cached = localStorage.getItem(`mfit_cache:${this.buildUrl()}`)
          if (cached) {
            return { data: JSON.parse(cached), error: null }
          }
        } catch {}
      }
      return { data: null, error }
    }
  }

  // Alias for backward-compatibility with existing calls: .get()
  async get(): Promise<{ data: any; error: Error | null }> {
    return this.execute()
  }

  // Promise-like then / catch implementation so await client.from('...').insert(...) works seamlessly
  then<TResult1 = { data: any; error: Error | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: Error | null }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<{ data: any; error: Error | null } | TResult> {
    return this.execute().catch(onrejected)
  }
}
