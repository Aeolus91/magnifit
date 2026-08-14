import { supabase } from '../lib/supabaseClient'

export interface PendingMutation {
  id: string
  table: string
  action: 'insert' | 'update' | 'delete'
  payload: any
  timestamp: number
}

const STORAGE_KEY = 'mfit_offline_mutation_queue_v1'

class OfflineSyncManager {
  private queue: PendingMutation[] = []
  private isFlushing = false

  constructor() {
    this.loadQueue()
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.flush())
    }
  }

  private loadQueue(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        this.queue = JSON.parse(raw)
      }
    } catch {
      this.queue = []
    }
  }

  private saveQueue(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue))
    } catch {}
  }

  public enqueue(table: string, action: 'insert' | 'update' | 'delete', payload: any): void {
    const mutation: PendingMutation = {
      id: payload.id || crypto.randomUUID(),
      table,
      action,
      payload,
      timestamp: Date.now()
    }
    this.queue.push(mutation)
    this.saveQueue()
  }

  public async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0 || !navigator.onLine) return
    this.isFlushing = true

    while (this.queue.length > 0) {
      const mutation = this.queue[0]
      try {
        let error = null
        if (mutation.action === 'insert') {
          const res = await supabase.from(mutation.table).insert([mutation.payload])
          error = res.error
        } else if (mutation.action === 'update') {
          const res = await supabase.from(mutation.table).update(mutation.payload).eq('id', mutation.id)
          error = res.error
        } else if (mutation.action === 'delete') {
          const res = await supabase.from(mutation.table).delete().eq('id', mutation.id)
          error = res.error
        }

        if (!error) {
          this.queue.shift()
          this.saveQueue()
        } else {
          // If server rejects with client/conflict error (not network), drop to avoid infinite loop
          console.warn(`[Sync] Dropped stalled mutation on ${mutation.table}:`, error)
          this.queue.shift()
          this.saveQueue()
        }
      } catch (err) {
        // Network still unreachable, pause draining
        break
      }
    }

    this.isFlushing = false
  }

  public getPendingCount(): number {
    return this.queue.length
  }
}

export const offlineSync = new OfflineSyncManager()
