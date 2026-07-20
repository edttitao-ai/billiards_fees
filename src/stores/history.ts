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

    async get(id: string) {
      return getSnapshot(id)
    }
  }
})
