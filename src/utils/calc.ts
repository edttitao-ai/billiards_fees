import type {
  AdviceItem,
  BillPackage,
  Participant,
  SettlementAdvice
} from '@/types'

/** 把数字四舍五入到 2 位小数 */
export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** 单张套餐的小计 = price × qty */
export function packageSubtotal(pkg: BillPackage): number {
  return round2((pkg.price || 0) * (pkg.qty || 0))
}

/** 单张套餐的时长 = hours × qty */
export function packageHours(pkg: BillPackage): number {
  return round2((pkg.hours || 0) * (pkg.qty || 0))
}

/** 所有套餐累计时长 */
export function totalDurationFromPackages(packages: BillPackage[]): number {
  return round2(packages.reduce((s, p) => s + packageHours(p), 0))
}

/** 所有套餐累计金额 */
export function totalFeeFromPackages(packages: BillPackage[]): number {
  return round2(packages.reduce((s, p) => s + packageSubtotal(p), 0))
}

/** 参与人员累计时长 */
export function participantsTotalDuration(participants: Participant[]): number {
  return round2(participants.reduce((s, p) => s + (p.duration || 0), 0))
}

/**
 * 个人分摊费用：「按时段加权」模型。
 * 公式：pi = di × T / Σ_k dk
 *  - T  : 总台费（按套餐叠加）
 *  - di : 个人在场时长
 *  - Σ dk：所有人在场时长总和（即"占用人时"）
 *
 * 例：A=6, B=10, C=10, T=100
 *   Σ dk = 26 → A=23.08, B=C=38.46
 *
 * 所有人都打满时退化为简单 AA：Σ dk = n×H，pi = di × T / (nH) = T/n
 */
export function personalFee(
  totalFee: number,
  participants: Participant[],
  selfId?: string
): number {
  const sumDur = participantsTotalDuration(participants)
  if (sumDur <= 0) return 0
  if (!selfId) {
    // 兼容旧调用：传入单人 duration
    return 0
  }
  const self = participants.find((p) => p.id === selfId)
  if (!self) return 0
  return round2((self.duration / sumDur) * totalFee)
}

/** 人均时长 */
export function avgDuration(totalDuration: number, participants: Participant[]): number {
  if (participants.length === 0) return 0
  return round2(totalDuration / participants.length)
}

/** 人均费用 */
export function avgFee(totalFee: number, participants: Participant[]): number {
  if (participants.length === 0) return 0
  return round2(totalFee / participants.length)
}

/** 收款建议：delta = personalFee - avgFee */
export function buildSettlementAdvice(
  totalFee: number,
  participants: Participant[]
): SettlementAdvice {
  const needPay: AdviceItem[] = []
  const needReceive: AdviceItem[] = []

  if (participants.length === 0) {
    return { needPay, needReceive }
  }

  const avg = avgFee(totalFee, participants)
  let residual = round2(
    participants.reduce((s, p) => s + p.personalFee, 0) - avg * participants.length
  )

  for (const p of participants) {
    const delta = round2(p.personalFee - avg)
    if (Math.abs(delta) < 0.005) continue
    if (delta > 0) {
      needReceive.push({ participantId: p.id, name: p.name, amount: round2(delta) })
    } else {
      needPay.push({ participantId: p.id, name: p.name, amount: round2(-delta) })
    }
  }

  if (Math.abs(residual) > 0.005 && needReceive.length > 0) {
    needReceive.sort((a, b) => b.amount - a.amount)
    needReceive[0].amount = round2(needReceive[0].amount + residual)
  } else if (Math.abs(residual) > 0.005 && needPay.length > 0) {
    needPay.sort((a, b) => b.amount - a.amount)
    needPay[0].amount = round2(needPay[0].amount - residual)
  }

  needPay.sort((a, b) => b.amount - a.amount)
  needReceive.sort((a, b) => b.amount - a.amount)

  return { needPay, needReceive }
}

/** 简易 uuid */
export function uid(): string {
  return 'p-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}