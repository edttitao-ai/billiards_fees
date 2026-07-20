import { defineStore } from 'pinia'
import type { Snapshot } from '@/types'
import {
  clearSnapshots,
  getSnapshot,
  listSnapshots,
  removeSnapshot,
  saveSnapshot
} from '@/utils/jsonStore'

export const useHistoryStore = defineStore('history', {
  state: () => ({
    list: [] as Snapshot[],
    loaded: false
  }),

  actions: {
    async loadAll() {
      try {
        this.list = listSnapshots()
      } catch {
        this.list = []
      } finally {
        this.loaded = true
      }
    },

    async save(snap: Snapshot) {
      saveSnapshot(snap)
      const idx = this.list.findIndex((x) => x.id === snap.id)
      if (idx >= 0) this.list.splice(idx, 1, snap)
      else this.list.unshift(snap)
    },

    async remove(id: string) {
      removeSnapshot(id)
      this.list = this.list.filter((x) => x.id !== id)
    },

    async clearAll() {
      clearSnapshots()
      this.list = []
    },

    /** 把传入的快照合并进当前列表（按 id 去重，不覆盖已有） */
    async mergeMany(incoming: Snapshot[]) {
      const seen = new Set(this.list.map((x) => x.id))
      let added = 0
      for (const s of incoming) {
        if (!s || typeof s.id !== 'string' || seen.has(s.id)) continue
        saveSnapshot(s)
        this.list.unshift(s)
        seen.add(s.id)
        added++
      }
      // 重新按时间倒序
      this.list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      return added
    },

    async get(id: string) {
      return getSnapshot(id)
    }
  }
})
