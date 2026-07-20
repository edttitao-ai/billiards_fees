/**
 * 浏览器端 JSON 存储。
 *
 * 为什么不用 IndexedDB：库数据量小（几十~几百条快照 + 几十球友），
 * 用 localStorage 一个 JSON 字符串就能搞定，调试时可读、可手动改。
 *
 * 顶层导出：
 *  - CRUD：list / get / save / remove / clear
 *  - 文件：exportToFile / importFromFile  （用户主动点"导出/导入"按钮）
 *
 * 注意：所有 store 同步行为都改用这个，db.ts 已废弃。
 */

import type { BallBuddy, Snapshot } from '@/types'

const SNAPSHOTS_KEY = 'bs:snapshots:v1'
const BUDDIES_KEY = 'bs:buddies:v1'

/** 应用整体导出的形态 */
export interface ExportShape {
  /** 格式版本号（用于将来兼容） */
  version: 1
  /** 导出时间（ISO） */
  exportedAt: string
  /** 账单快照 */
  bills: Snapshot[]
  /** 球友库 */
  buddies: BallBuddy[]
}

// ---------- localStorage helpers ----------

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function readArray<T>(key: string): T[] {
  if (typeof localStorage === 'undefined') return []
  return safeParse<T[]>(localStorage.getItem(key), [])
}

function writeArray<T>(key: string, list: T[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(key, JSON.stringify(list))
}

// ---------- Snapshots ----------

export function listSnapshots(): Snapshot[] {
  return readArray<Snapshot>(SNAPSHOTS_KEY).sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1
  )
}

export function getSnapshot(id: string): Snapshot | undefined {
  return readArray<Snapshot>(SNAPSHOTS_KEY).find((s) => s.id === id)
}

export function saveSnapshot(s: Snapshot): void {
  const list = readArray<Snapshot>(SNAPSHOTS_KEY)
  const idx = list.findIndex((x) => x.id === s.id)
  if (idx >= 0) list[idx] = s
  else list.push(s)
  writeArray(SNAPSHOTS_KEY, list)
}

export function removeSnapshot(id: string): void {
  const list = readArray<Snapshot>(SNAPSHOTS_KEY).filter((s) => s.id !== id)
  writeArray(SNAPSHOTS_KEY, list)
}

export function clearSnapshots(): void {
  writeArray(SNAPSHOTS_KEY, [])
}

// ---------- Buddies ----------

export function listBuddies(): BallBuddy[] {
  return readArray<BallBuddy>(BUDDIES_KEY).sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : 1
  )
}

export function saveBuddy(b: BallBuddy): void {
  const list = readArray<BallBuddy>(BUDDIES_KEY)
  const idx = list.findIndex((x) => x.id === b.id)
  if (idx >= 0) list[idx] = b
  else list.push(b)
  writeArray(BUDDIES_KEY, list)
}

export function removeBuddy(id: string): void {
  const list = readArray<BallBuddy>(BUDDIES_KEY).filter((b) => b.id !== id)
  writeArray(BUDDIES_KEY, list)
}

export function clearBuddies(): void {
  writeArray(BUDDIES_KEY, [])
}

// ---------- 文件导入 / 导出 ----------

const FILE_NAME = 'billiards-data.json'

/** 把当前所有数据打包，触发浏览器下载 */
export function exportToFile(): void {
  const shape: ExportShape = {
    version: 1,
    exportedAt: new Date().toISOString(),
    bills: listSnapshots(),
    buddies: listBuddies()
  }
  const blob = new Blob([JSON.stringify(shape, null, 2)], {
    type: 'application/json;charset=utf-8'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = FILE_NAME
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // 给浏览器一点点时间完成下载再 revoke
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 解析用户上传的 JSON 文件，返回写入后的统计 */
export async function importFromFile(file: File): Promise<{
  bills: number
  buddies: number
}> {
  const text = await file.text()
  let parsed: Partial<ExportShape>
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('文件不是合法 JSON')
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('JSON 结构不合法')
  }
  const bills: Snapshot[] = Array.isArray(parsed.bills) ? parsed.bills : []
  const buddies: BallBuddy[] = Array.isArray(parsed.buddies) ? parsed.buddies : []

  if (bills.length) writeArray(SNAPSHOTS_KEY, bills)
  if (buddies.length) writeArray(BUDDIES_KEY, buddies)

  return { bills: bills.length, buddies: buddies.length }
}

/** 触发一个隐藏的 <input type=file>，选完调 onPicked */
export function pickJsonFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.style.display = 'none'
    input.addEventListener('change', () => {
      const f = input.files && input.files[0] ? input.files[0] : null
      document.body.removeChild(input)
      resolve(f)
    })
    document.body.appendChild(input)
    input.click()
  })
}
