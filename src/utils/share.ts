import type { SessionState } from '@/types'
import { formatCurrency, formatNumber } from './format'
import {
  avgDuration,
  avgFee,
  participantsTotalDuration,
  personalFee,
  totalDurationFromPackages,
  totalFeeFromPackages
} from './calc'

/**
 * 生成可读账单文本。复制到剪贴板 / Web Share 通用。
 * 个人费用按"时长加权"模型（pi = di × T / Σd）计算，与 store.recalc() 保持一致。
 */
export function buildBillText(session: SessionState): string {
  const totalFee = totalFeeFromPackages(session.packages)
  const totalDur = totalDurationFromPackages(session.packages)
  const tableCount = session.tableCount || 1
  const tableDur = tableCount > 0 ? totalDur / tableCount : totalDur
  const avg = avgFee(totalFee, session.participants)
  const avgDur = avgDuration(totalDur, session.participants)

  // 打满者：在场时长等于「每桌时长」的人
  const durations = session.participants.map((p) => p.duration || 0)
  const maxDur = durations.length ? Math.max(...durations) : 0
  const fullCount =
    maxDur > 0
      ? durations.filter((d) => Math.abs(d - maxDur) < 0.005).length
      : 0
  const fullFee =
    fullCount > 0 ? Math.round((totalFee / fullCount) * 100) / 100 : 0

  const lines: string[] = []
  lines.push(`【台费账单】${session.title}`)
  lines.push(`生成时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`)
  lines.push('')
  lines.push('--- 套餐 ---')
  session.packages.forEach((p) => {
    if (!p.qty) return
    const totalHours = p.hours * p.qty
    const subFee = p.price * p.qty
    lines.push(
      `${p.name} ×${p.qty} 张  ${formatCurrency(p.price)}/张  = ${formatCurrency(
        subFee
      )}  ·  累计 ${formatNumber(totalHours, 1)} h`
    )
  })
  lines.push('')
  lines.push('--- 人员 ---')
  lines.push(
    `${'姓名'.padEnd(8, ' ')}  ${'时长(h)'.padStart(8, ' ')}  ${'个人费用'.padStart(10, ' ')}`
  )
  session.participants.forEach((p) => {
    const fee = personalFee(totalFee, session.participants, p.id)
    lines.push(
      `${p.name.padEnd(8, ' ')}  ${formatNumber(p.duration, 1).padStart(8, ' ')}  ${formatCurrency(
        fee
      ).padStart(10, ' ')}`
    )
  })
  lines.push('')
  lines.push('--- 汇总 ---')
  lines.push(`台桌数：${tableCount} 桌 · 每桌时长 ${formatNumber(tableDur, 1)} h`)
  lines.push(`套餐总时长：${formatNumber(totalDur, 1)} 小时`)
  lines.push(`人均时长：${formatNumber(avgDur, 1)} 小时`)
  lines.push(`总台费：${formatCurrency(totalFee)}`)
  if (session.participants.length > 0) {
    lines.push(
      `人均费用：${formatCurrency(avg)}（不计早走加权的平均值）`
    )
    if (fullCount > 0) {
      lines.push(`打满者人均：${formatCurrency(fullFee)}（共 ${fullCount} 人打满 ${formatNumber(maxDur, 1)} h）`)
    }
    lines.push(
      `个人费用按在场时长加权：pi = di × 总台费 / Σd（早走少付、打满多付）`
    )
  } else {
    lines.push('尚未添加参与人员')
  }

  return lines.join('\n')
}

/** 复制到剪贴板 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/** 调用 Web Share API；不支持时回退到复制 */
export async function shareOrCopy(
  title: string,
  text: string
): Promise<'shared' | 'copied' | 'unsupported'> {
  try {
    if (navigator.share) {
      await navigator.share({ title, text })
      return 'shared'
    }
  } catch {
    /* 用户取消等情况 */
  }
  const ok = await copyToClipboard(text)
  return ok ? 'copied' : 'unsupported'
}

// ============================================================
// 分享增强：图片账单 + 共享链接
// ============================================================

/** 共享链接里塞的精简账单元数据（只保留显示需要的字段） */
export interface SharedBill {
  v: 1
  t: string // title
  p: Array<{ n: string; h: number; pr: number; q: number }> // packages
  ps: Array<{ i: number; n: string; d: number }> // participants(序号, name, duration)
  tc: number // tableCount
  /** 计算字段避免重算 */
  tf: number // totalFee
  td: number // totalDuration
}

/** 把 SessionState 精简为可分享的快照 */
export function buildSharedBill(session: SessionState): SharedBill {
  const totalFee = totalFeeFromPackages(session.packages)
  const totalDur = totalDurationFromPackages(session.packages)
  // 复算 personalFee（与服务端一致）
  const sumDur = participantsTotalDuration(session.participants)
  const ps = session.participants.map((p, i) => ({
    i: i + 1,
    n: p.name,
    d: p.duration,
    fee: sumDur > 0 ? Math.round(((p.duration / sumDur) * totalFee) * 100) / 100 : 0
  }))
  return {
    v: 1,
    t: session.title,
    p: session.packages.map((p) => ({ n: p.name, h: p.hours, pr: p.price, q: p.qty })),
    ps: ps.map((x) => ({ i: x.i, n: x.n, d: x.d, fee: x.fee })),
    tc: session.tableCount,
    tf: totalFee,
    td: totalDur
  } as SharedBill & { ps: Array<{ i: number; n: string; d: number; fee: number }> }
}

/** 把可分享账单数据转成 URL：/share?p=<base64-lz-string> */
export function buildShareUrl(session: SessionState, origin = window.location.origin): string {
  const obj = buildSharedBill(session) as unknown as Record<string, unknown>
  // 用 btoa 把 unicode 字符串安全化
  const json = JSON.stringify(obj)
  // 同时给一份 Unicode safe 的 btoa
  const b64 = btoa(unescape(encodeURIComponent(json)))
  // 用 URL-safe 替换
  const safe = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${origin}/share?p=${safe}`
}

/** 从 URL hash 解析出可分享账单 */
export function parseShareBill(search = window.location.search): SharedBill | null {
  const url = new URLSearchParams(search)
  const p = url.get('p')
  if (!p) return null
  try {
    let b64 = p.replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    const json = decodeURIComponent(escape(atob(b64)))
    const obj = JSON.parse(json)
    if (!obj || obj.v !== 1) return null
    return obj as SharedBill
  } catch {
    return null
  }
}

/** 重导出 calc 帮助函数给上层用 */
export { totalFeeFromPackages, totalDurationFromPackages, avgFee, avgDuration }
