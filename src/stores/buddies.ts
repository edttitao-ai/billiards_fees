import { defineStore } from 'pinia'
import type { BallBuddy } from '@/types'
import {
  clearBuddies,
  listBuddies,
  removeBuddy,
  saveBuddy
} from '@/utils/jsonStore'

const DEFAULT_BUDDIES: Omit<BallBuddy, 'createdAt'>[] = [
  { id: 'c-demo-2', name: '彬哥', avatarId: 1 },
  { id: 'c-demo-3', name: '星哥', avatarId: 2 },
  { id: 'c-demo-4', name: '星姐', avatarId: 3 },
  { id: 'c-demo-5', name: 'QC', avatarId: 4 },
  { id: 'c-demo-6', name: '叶哥', avatarId: 5 },
  { id: 'c-demo-7', name: '古哥', avatarId: 6 }
]

export const useBuddiesStore = defineStore('buddies', {
  state: () => ({
    list: [] as BallBuddy[],
    loaded: false
  }),

  actions: {
    async loadAll(opts: { seedIfEmpty?: boolean } = {}) {
      try {
        let all = await listBuddies()
        if (all.length === 0 && opts.seedIfEmpty !== false) {
          // 第一次进页面，丢几条示例球友
          const now = Date.now()
          for (let i = 0; i < DEFAULT_BUDDIES.length; i++) {
            const seed = DEFAULT_BUDDIES[i]
            await saveBuddy({
              ...seed,
              createdAt: new Date(now + i).toISOString()
            })
          }
          all = await listBuddies()
        }
        this.list = all
      } catch {
        this.list = []
      } finally {
        this.loaded = true
      }
    },

    async add(name: string): Promise<BallBuddy> {
      const trimmed = name.trim()
      if (!trimmed) {
        throw new Error('名字不能为空')
      }
      // 重名防呆
      const existed = this.list.find((c) => c.name === trimmed)
      if (existed) return existed
      const buddy: BallBuddy = {
        id: 'c-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4),
        name: trimmed,
        avatarId: this.list.length % 6,
        createdAt: new Date().toISOString()
      }
      await saveBuddy(buddy)
      this.list.push(buddy)
      return buddy
    },

    async addBulk(names: string[]): Promise<BallBuddy[]> {
      const out: BallBuddy[] = []
      for (const n of names) {
        if (!n.trim()) continue
        out.push(await this.add(n))
      }
      return out
    },

    async remove(id: string) {
      await removeBuddy(id)
      this.list = this.list.filter((c) => c.id !== id)
    },

    async clearAll() {
      await clearBuddies()
      this.list = []
    },

    /** 把传入的球友合并进当前列表（按 id 与 name 去重，不覆盖已有） */
    async mergeMany(incoming: BallBuddy[]) {
      const idSet = new Set(this.list.map((b) => b.id))
      const nameSet = new Set(this.list.map((b) => b.name))
      let added = 0
      for (const b of incoming) {
        if (!b || typeof b.id !== 'string' || typeof b.name !== 'string') continue
        if (idSet.has(b.id) || nameSet.has(b.name)) continue
        await saveBuddy(b)
        this.list.push(b)
        idSet.add(b.id)
        nameSet.add(b.name)
        added++
      }
      this.list.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
      return added
    }
  }
})
