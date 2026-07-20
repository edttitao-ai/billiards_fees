import { defineStore } from 'pinia'
import type { BillPackage, Participant, SessionState, SettlementAdvice } from '@/types'
import {
  avgDuration,
  avgFee,
  buildSettlementAdvice,
  participantsTotalDuration,
  personalFee,
  round2,
  totalDurationFromPackages,
  totalFeeFromPackages,
  uid
} from '@/utils/calc'

/** 预置套餐模板（用户可手填覆盖） */
export const PACKAGE_TEMPLATES = [
  { name: '1小时套餐', hours: 1, price: 21 },
  { name: '2小时套餐', hours: 2, price: 35 },
  { name: '3小时套餐', hours: 3, price: 140 },
  { name: '4小时套餐', hours: 4, price: 180 }
]

const DEFAULT_NAMES: string[] = []
const DEFAULT_DURATIONS: number[] = []

function makeDefaultPackages(): BillPackage[] {
  return [
    { id: uid(), name: '1小时套餐', hours: 1, price: 21, qty: 1 },
    { id: uid(), name: '2小时套餐', hours: 2, price: 35, qty: 1 }
  ]
}

function makeDefaultParticipants(): Participant[] {
  // 首次打开页面，参与人员为空，让用户主动添加
  return DEFAULT_NAMES.map((name, i) => ({
    id: uid(),
    index: i + 1,
    name,
    avatarId: i % 6,
    gender: 'male',
    duration: DEFAULT_DURATIONS[i] ?? 1,
    personalFee: 0
  }))
}

function createInitialState(): SessionState {
  return {
    title: '台费账单',
    packages: makeDefaultPackages(),
    participants: makeDefaultParticipants(),
    tableCount: 1,
    tableManual: false
  }
}

export const useSessionStore = defineStore('session', {
  state: (): SessionState => createInitialState(),

  getters: {
    totalDuration(state): number {
      return totalDurationFromPackages(state.packages)
    },
    totalFee(): number {
      return totalFeeFromPackages(this.packages)
    },
    avgDuration(state): number {
      return avgDuration(this.totalDuration, state.participants)
    },
    avgFee(state): number {
      return avgFee(this.totalFee, state.participants)
    },
    settlementAdvice(state): SettlementAdvice {
      return buildSettlementAdvice(this.totalFee, state.participants)
    },
    /** 人员合计时长（占用人时） */
    participantsDuration(state): number {
      return participantsTotalDuration(state.participants)
    },
    /** 完整在场人数：duration 等于"最大在场时长"的人 */
    fullPersonCount(state): number {
      if (state.participants.length === 0) return 0
      const max = Math.max(...state.participants.map((p) => p.duration))
      if (max <= 0) return 0
      return state.participants.filter((p) => Math.abs(p.duration - max) < 0.005).length
    },
    /** 「打满」者的费用（默认参考值） */
    fullPersonFee(): number {
      const n = this.fullPersonCount
      if (n <= 0) return 0
      return round2(this.totalFee / n)
    },
    /** 一桌的打球时长 = 总时长 / 桌数 */
    tableDuration(): number {
      const t = this.tableCount
      if (!t || t <= 0) return 0
      return round2(this.totalDuration / t)
    }
  },

  actions: {
    /** 重算每个人分摊费用缓存 & 序号 */
    recalc() {
      const total = this.totalFee
      this.participants.forEach((p) => {
        p.personalFee = personalFee(total, this.participants, p.id)
      })
      this.participants.forEach((p, i) => (p.index = i + 1))
    },

    /**
     * 套餐 / 桌数变了之后，把每个人的时长全部覆盖为「一桌时长」。
     * 这里的策略变了：不再区分 manual，永远同步。
     * 要"有人早走"，请直接调时间步进按钮（setDuration），下次联动仍会覆盖。
     */
    syncParticipantsToTableDuration() {
      const td = this.tableDuration
      this.participants.forEach((p) => {
        p.duration = td
      })
      this.recalc()
    },

    /**
     * 兼容旧调用。
     */
    syncParticipantsToTotalDuration() {
      this.syncParticipantsToTableDuration()
    },

    /** 设置桌数（不会覆盖 manual=true 的人员） */
    setTableCount(v: number, opts: { fromUser?: boolean } = {}) {
      let n = Math.floor(Number(v))
      if (!Number.isFinite(n) || n < 1) n = 1
      const before = this.tableCount
      this.tableCount = n
      // 用户手调桌数 = 解锁 = 套餐张数不再自动改桌数
      if (opts.fromUser) this.tableManual = true
      this.syncParticipantsToTableDuration()
      // 兜底：确保 reactive 真的感知到（极少数情况下 Pinia 同步赋值被吞）
      if (this.tableCount !== n) {
        this.$patch({ tableCount: n })
      }
      return n - before
    },

    setTitle(v: string) {
      this.title = v.trim() || '台费账单'
    },

    /** ========== 套餐操作 ========== */
    addPackage(template?: { name: string; hours: number; price: number }) {
      const t = template ?? PACKAGE_TEMPLATES[0]
      this.packages.push({
        id: uid(),
        name: t.name,
        hours: t.hours,
        price: t.price,
        qty: 1
      })
      if (!this.tableManual) {
        this.tableCount = this.packages.reduce(
          (s, x) => s + (x.qty || 0),
          0
        )
      }
      this.syncParticipantsToTotalDuration()
    },

    removePackage(id: string) {
      this.packages = this.packages.filter((p) => p.id !== id)
      if (!this.tableManual) {
        const totalTables = this.packages.reduce(
          (s, x) => s + (x.qty || 0),
          0
        )
        if (totalTables > 0) this.tableCount = totalTables
      }
      this.syncParticipantsToTotalDuration()
    },

    setPackageName(id: string, name: string) {
      const p = this.packages.find((x) => x.id === id)
      if (!p) return
      p.name = name.trim() || p.name
    },

    setPackageHours(id: string, hours: number) {
      const p = this.packages.find((x) => x.id === id)
      if (!p) return
      if (!Number.isFinite(hours) || hours < 0) return
      p.hours = Math.round(hours * 2) / 2
      this.syncParticipantsToTotalDuration()
    },

    setPackagePrice(id: string, price: number) {
      const p = this.packages.find((x) => x.id === id)
      if (!p) return
      if (!Number.isFinite(price) || price < 0) return
      p.price = Math.round(price * 100) / 100
      this.recalc()
    },

    setPackageQty(id: string, qty: number) {
      const p = this.packages.find((x) => x.id === id)
      if (!p) return
      if (!Number.isFinite(qty) || qty < 0) return
      p.qty = Math.max(0, Math.floor(qty))
      // 没手动调过桌数 → 套餐张数联动到桌数（取所有套餐总张数）
      if (!this.tableManual) {
        const totalTables = this.packages.reduce(
          (s, x) => s + (x.qty || 0),
          0
        )
        if (totalTables > 0) this.tableCount = totalTables
      }
      this.syncParticipantsToTotalDuration()
    },

    /** 应用预置套餐（同时覆盖 name/hours/price） */
    applyPackageTemplate(id: string, tplIdx: number) {
      const t = PACKAGE_TEMPLATES[tplIdx]
      const p = this.packages.find((x) => x.id === id)
      if (!p || !t) return
      p.name = t.name
      p.hours = t.hours
      p.price = t.price
      this.syncParticipantsToTotalDuration()
    },

    /** ========== 人员操作 ========== */
    addParticipant(name?: string) {
      const p: Participant = {
        id: uid(),
        index: this.participants.length + 1,
        name: name ?? `成员${this.participants.length + 1}`,
        avatarId: this.participants.length % 6,
        gender: 'male',
        duration: this.tableDuration,
        personalFee: 0
      }
      this.participants.push(p)
      this.recalc()
    },

    /**
     * 批量从球友库导入到当前账单。
     * 名字按本次账单"组合名"（例：如果已有人叫"小涛"，再加就不重复）。
     */
    addParticipantsFromBuddies(
      buddies: { id: string; name: string; avatarId: number }[]
    ) {
      const existNames = new Set(this.participants.map((p) => p.name))
      const tableDuration = this.tableDuration
      buddies.forEach((c) => {
        if (existNames.has(c.name)) return
        const p: Participant = {
          id: uid(),
          index: this.participants.length + 1,
          name: c.name,
          avatarId: c.avatarId,
          gender: 'male',
          duration: tableDuration,
          personalFee: 0
        }
        this.participants.push(p)
        existNames.add(c.name)
      })
      this.recalc()
    },

    removeParticipant(id: string) {
      const idx = this.participants.findIndex((p) => p.id === id)
      if (idx < 0) return
      this.participants.splice(idx, 1)
      this.recalc()
    },

    updateDuration(id: string, delta: number) {
      const p = this.participants.find((x) => x.id === id)
      if (!p) return
      p.duration = Math.max(0, Math.round((p.duration + delta) * 2) / 2)
      this.recalc()
    },

    setDuration(id: string, value: number) {
      const p = this.participants.find((x) => x.id === id)
      if (!p) return
      p.duration = Math.max(0, Math.round(value * 2) / 2)
      this.recalc()
    },

    updateName(id: string, name: string) {
      const p = this.participants.find((x) => x.id === id)
      if (!p) return
      p.name = name.trim() || p.name
    },

    /** ========== 通用 ========== */
    reset() {
      const init = createInitialState()
      this.$patch(init)
      this.recalc()
    },

    loadFromSession(s: SessionState) {
      this.$patch({
        title: s.title,
        packages: s.packages.map((p) => ({ ...p })),
        participants: s.participants.map((p) => {
          const { manual, ...rest } = p as Participant & { manual?: boolean }
          void manual
          return rest as Participant
        }),
        tableCount: s.tableCount || 1,
        tableManual: s.tableManual ?? true
      })
      // 加载历史快照：把时长也对齐到「桌时长」，与当前语义保持一致
      this.syncParticipantsToTableDuration()
    }
  }
})