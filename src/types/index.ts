/**
 * 全局业务类型定义
 */

/**
 * 长期保存的球友（"我的台球搭子"）。
 * 与账单快照（Snapshot）独立存储：球友库独立维护，跨账单复用。
 */
export interface BallBuddy {
  id: string
  /** 姓名 */
  name: string
  /** 头像 id（与 Participant 共用一组配色） */
  avatarId: number
  /** 创建时间（ISO） */
  createdAt: string
}

export interface Participant {
  /** 唯一 id */
  id: string
  /** 编号（从 1 开始，仅用于展示） */
  index: number
  /** 姓名 */
  name: string
  /** 头像 id（对应一组内置 SVG 头像） */
  avatarId: number
  /** 性别（仅决定默认头像与名称） */
  gender: 'male' | 'female'
  /** 个人打球时长（小时，支持 0.5 步进）。改套餐/桌数时全量覆盖。 */
  duration: number
  /** 个人分摊费用（缓存字段，由计算派生） */
  personalFee: number
}

/**
 * 团购套餐项：一整张券（不是 hours × 单价）。
 * 例：2小时套餐 ¥100/qty=1 = 100；qty=2 张 = 200。
 */
export interface BillPackage {
  id: string
  /** 套餐名（可手填覆盖，例如"1小时套餐"） */
  name: string
  /** 套餐内含时长（小时） */
  hours: number
  /** 套餐单价（元 / 张） */
  price: number
  /** 张数 */
  qty: number
}

export interface SessionState {
  /** 账单标题 */
  title: string
  /** 套餐列表（混合叠加） */
  packages: BillPackage[]
  /** 参与人员 */
  participants: Participant[]
  /** 开台桌数（默认 1，与套餐张数联动） */
  tableCount: number
  /** 用户手调过桌数？true = 套餐张数不再自动同步桌数 */
  tableManual?: boolean
}

export interface AdviceItem {
  participantId: string
  name: string
  amount: number // 正数
}

export interface SettlementAdvice {
  /** 需要多支付（少付钱的人去补） */
  needPay: AdviceItem[]
  /** 需要少支付（多付钱的人应收） */
  needReceive: AdviceItem[]
}

export interface Snapshot {
  id: string
  title: string
  createdAt: string
  session: SessionState
  /** 当时的总台费 */
  totalFee: number
  /** 人均费用（按当前总时长 ÷ 人数） */
  avgFee: number
  /** 当时的总时长 */
  totalDuration: number
}