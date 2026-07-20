import type { SessionState } from '@/types'
import { formatCurrency, formatNumber } from './format'
import {
  totalFeeFromPackages,
  totalDurationFromPackages,
  avgFee,
  participantsTotalDuration,
  avgDuration
} from './calc'

/**
 * 生成可读账单文本。复制到剪贴板 / Web Share 通用。
 */
export function buildBillText(session: SessionState): string {
  const totalFee = totalFeeFromPackages(session.packages)
  const totalDur = totalDurationFromPackages(session.packages)
  const avg = avgFee(totalFee, session.participants)
  const sumDur = participantsTotalDuration(session.participants)
  const max = session.participants.length
    ? Math.max(...session.participants.map((p) => p.duration))
    : 0
  const fullCount = session.participants.filter((p) => Math.abs(p.duration - max) < 0.005).length
  const fullFee = fullCount > 0 ? totalFee / fullCount : 0

  const lines: string[] = []
  lines.push(`【台费账单】${session.title}`)
  lines.push('--- 套餐 ---')
  session.packages.forEach((p) => {
    if (!p.qty) return
    lines.push(
      `${p.name} ×${p.qty}  ${formatCurrency(p.price)}/张  = ${formatCurrency(
        p.price * p.qty
      )}  (${formatNumber(p.hours * p.qty, 1)}h)`
    )
  })
  lines.push('--- 人员 ---')
  lines.push(
    `${'姓名'.padEnd(8, ' ')}  ${'时长(h)'.padStart(8, ' ')}  ${'个人费用'.padStart(10, ' ')}`
  )
  session.participants.forEach((p) => {
    lines.push(
      `${p.name.padEnd(8, ' ')}  ${formatNumber(p.duration, 1).padStart(8, ' ')}  ${formatCurrency(
        p.personalFee
      ).padStart(10, ' ')}`
    )
  })
  lines.push('---')
  lines.push(`套餐总时长：${formatNumber(totalDur, 1)} 小时`)
  lines.push(`台桌数：${session.tableCount || 1} 桌`)
  lines.push(`总台费：${formatCurrency(totalFee)}`)
  lines.push(`打满者人均：${formatCurrency(fullFee)}（共 ${fullCount} 人打满）`)
  lines.push(`占用人时合计：${formatNumber(sumDur, 1)} h（早走者按 di × 总台费 / Σ在场 时长）`)

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

/**
 * 把当前会话渲染成账单 PNG。
 * 这里把 BillPoster 渲染进离屏容器，调用 html2canvas。
 *
 * 由于 BillPoster 是 Vue 组件，这里返回 render 函数：
 *   import BillPoster from '@/components/business/BillPoster.vue'
 *   import { createApp } from 'vue'
 *   await renderSessionToPng(session, BillPoster)
 */
export async function renderSessionToPng(
  session: SessionState,
  posterFactory: (data: {
    title: string
    totalFee: number
    avgFee: number
    totalDuration: number
    tableCount: number
    tableDuration: number
    packages: SessionState['packages']
    participants: SessionState['participants']
  }) => Promise<Blob>
): Promise<Blob> {
  const totalFee = totalFeeFromPackages(session.packages)
  const totalDur = totalDurationFromPackages(session.packages)
  const avg = avgFee(totalFee, session.participants)
  const tableCount = session.tableCount || 1
  const tableDur = tableCount > 0 ? totalDur / tableCount : totalDur
  // 计算 personalFee 给 poster
  const sumDur = participantsTotalDuration(session.participants)
  const ps = session.participants.map((p) => ({
    ...p,
    personalFee:
      sumDur > 0
        ? Math.round(((p.duration / sumDur) * totalFee) * 100) / 100
        : 0
  }))
  return posterFactory({
    title: session.title,
    totalFee,
    avgFee: avg,
    totalDuration: totalDur,
    tableCount,
    tableDuration: tableDur,
    packages: session.packages,
    participants: ps
  })
}

/** 触发下载：把 blob 存为 png */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 文件名：billiards-{title}-{date}.png，去掉不安全字符 */
export function posterFilename(title: string, d = new Date()): string {
  const safe = (title || 'bill').replace(/[\\/:*?"<>|\s]+/g, '-')
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}`
  return `billiards-${safe}-${stamp}.png`
}

/** 重导出 calc 帮助函数给上层用 */
export { totalFeeFromPackages, totalDurationFromPackages, avgFee, avgDuration }
