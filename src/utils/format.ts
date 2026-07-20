import dayjs from 'dayjs'

const CNY = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const NUM2 = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const NUM1 = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
})

/** ¥120.00 */
export function formatCurrency(n: number): string {
  if (!Number.isFinite(n)) return '¥0.00'
  return CNY.format(n)
}

/** 120.00（不带符号） */
export function formatNumber(n: number, fractionDigits = 2): string {
  if (!Number.isFinite(n)) return '0.00'
  if (fractionDigits === 1) return NUM1.format(n)
  return NUM2.format(n)
}

/** 显示用货币：正值 +¥xx、负值 -¥xx */
export function formatSigned(n: number): string {
  if (!Number.isFinite(n) || Math.abs(n) < 0.005) return '¥0.00'
  const sign = n > 0 ? '+' : '-'
  return `${sign}¥${formatNumber(Math.abs(n))}`
}

/** 05-19 14:00 */
export function formatShortTime(iso: string): string {
  return dayjs(iso).format('MM-DD HH:mm')
}

/** 2026-05-19 14:00 */
export function formatDateTime(iso: string): string {
  return dayjs(iso).format('YYYY-MM-DD HH:mm')
}

/** 把用户输入的 datetime-local 字符串转 ISO */
export function toISO(local: string): string {
  return dayjs(local).toISOString()
}

/** 当前本地时间转 datetime-local 字符串 */
export function nowLocal(): string {
  return dayjs().format('YYYY-MM-DDTHH:mm')
}