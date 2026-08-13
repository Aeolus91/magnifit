/**
 * Offline Sync Queue Utility for mfit PWA
 * Queues database mutations when offline and syncs automatically when connection restores.
 */

export interface QueuedMutation {
  id: string
  table: string
  payload: any
  timestamp: number
}

const QUEUE_KEY = 'mfit_offline_mutations'

export class OfflineSyncStore {
  private getQueue(): QueuedMutation[] {
    try {
      const stored = localStorage.getItem(QUEUE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private saveQueue(queue: QueuedMutation[]): void {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  }

  public enqueue(table: string, payload: any): void {
    const queue = this.getQueue()
    queue.push({
      id: crypto.randomUUID(),
      table,
      payload,
      timestamp: Date.now()
    })
    this.saveQueue(queue)
  }

  public getPendingCount(): number {
    return this.getQueue().length
  }

  public async syncPending(client: { from: (table: string) => { insert: (data: any) => Promise<any> } }): Promise<number> {
    const queue = this.getQueue()
    if (queue.length === 0) return 0

    const remaining: QueuedMutation[] = []
    let syncedCount = 0

    for (const item of queue) {
      try {
        const { error } = await client.from(item.table).insert(item.payload)
        if (error) {
          remaining.push(item)
        } else {
          syncedCount++
        }
      } catch {
        remaining.push(item)
      }
    }

    this.saveQueue(remaining)
    return syncedCount
  }
}

export const offlineSyncStore = new OfflineSyncStore()
