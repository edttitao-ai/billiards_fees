/**
 * 浏览器端 IndexedDB 存储。
 *
 * 人员列表和历史账单分别存入独立对象仓库；首次打开时会把旧版
 * localStorage 数据合并进 IndexedDB，迁移成功后删除旧数据。
 *
 * 顶层导出：
 *  - CRUD：list / get / save / remove / clear
 *  - 文件：exportToFile / importFromFile（用户主动点“导出/导入”按钮）
 */

import type { BallBuddy, Snapshot } from '@/types'

const DB_NAME = 'billiards-splitter'
const DB_VERSION = 1
const SNAPSHOTS_STORE = 'snapshots'
const BUDDIES_STORE = 'buddies'

const LEGACY_SNAPSHOTS_KEY = 'bs:snapshots:v1'
const LEGACY_BUDDIES_KEY = 'bs:buddies:v1'

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

type StoreName = typeof SNAPSHOTS_STORE | typeof BUDDIES_STORE

let databasePromise: Promise<IDBDatabase> | undefined
let readyDatabasePromise: Promise<IDBDatabase> | undefined

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB 操作失败'))
  })
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB 事务失败'))
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB 事务已中止'))
  })
}

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise

  databasePromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('当前浏览器不支持 IndexedDB'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
        db.createObjectStore(SNAPSHOTS_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(BUDDIES_STORE)) {
        db.createObjectStore(BUDDIES_STORE, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => db.close()
      resolve(db)
    }
    request.onerror = () => reject(request.error ?? new Error('无法打开 IndexedDB'))
    request.onblocked = () => reject(new Error('IndexedDB 升级被其他页面阻塞，请关闭其他页面后重试'))
  })

  return databasePromise
}

async function getAllFromDatabase<T>(db: IDBDatabase, storeName: StoreName): Promise<T[]> {
  const transaction = db.transaction(storeName, 'readonly')
  const done = transactionToPromise(transaction)
  const records = await requestToPromise(transaction.objectStore(storeName).getAll()) as T[]
  await done
  return records
}

function readLegacyArray<T>(key: string): { exists: boolean; records: T[] } {
  if (typeof localStorage === 'undefined') return { exists: false, records: [] }

  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return { exists: false, records: [] }
    const parsed = JSON.parse(raw)
    return { exists: true, records: Array.isArray(parsed) ? parsed as T[] : [] }
  } catch {
    return { exists: true, records: [] }
  }
}

async function migrateLegacyData(db: IDBDatabase): Promise<void> {
  const legacySnapshots = readLegacyArray<Snapshot>(LEGACY_SNAPSHOTS_KEY)
  const legacyBuddies = readLegacyArray<BallBuddy>(LEGACY_BUDDIES_KEY)

  if (!legacySnapshots.exists && !legacyBuddies.exists) return

  const [currentSnapshots, currentBuddies] = await Promise.all([
    getAllFromDatabase<Snapshot>(db, SNAPSHOTS_STORE),
    getAllFromDatabase<BallBuddy>(db, BUDDIES_STORE)
  ])
  const snapshotIds = new Set(currentSnapshots.map((item) => item.id))
  const buddyIds = new Set(currentBuddies.map((item) => item.id))
  const snapshotsToAdd = legacySnapshots.records.filter((item) => {
    if (!item || typeof item.id !== 'string' || snapshotIds.has(item.id)) return false
    snapshotIds.add(item.id)
    return true
  })
  const buddiesToAdd = legacyBuddies.records.filter((item) => {
    if (!item || typeof item.id !== 'string' || buddyIds.has(item.id)) return false
    buddyIds.add(item.id)
    return true
  })

  if (snapshotsToAdd.length || buddiesToAdd.length) {
    const transaction = db.transaction([SNAPSHOTS_STORE, BUDDIES_STORE], 'readwrite')
    const done = transactionToPromise(transaction)
    const snapshotsStore = transaction.objectStore(SNAPSHOTS_STORE)
    const buddiesStore = transaction.objectStore(BUDDIES_STORE)
    snapshotsToAdd.forEach((item) => snapshotsStore.add(item))
    buddiesToAdd.forEach((item) => buddiesStore.add(item))
    await done
  }

  try {
    if (legacySnapshots.exists) localStorage.removeItem(LEGACY_SNAPSHOTS_KEY)
    if (legacyBuddies.exists) localStorage.removeItem(LEGACY_BUDDIES_KEY)
  } catch {
    // 数据已成功迁移；无法清理旧存储不影响 IndexedDB 使用。
  }
}

function getReadyDatabase(): Promise<IDBDatabase> {
  if (!readyDatabasePromise) {
    readyDatabasePromise = openDatabase().then(async (db) => {
      await migrateLegacyData(db)
      return db
    })
  }
  return readyDatabasePromise
}

async function putRecord<T>(storeName: StoreName, record: T): Promise<void> {
  const db = await getReadyDatabase()
  const transaction = db.transaction(storeName, 'readwrite')
  const done = transactionToPromise(transaction)
  transaction.objectStore(storeName).put(record)
  await done
}

async function deleteRecord(storeName: StoreName, id: string): Promise<void> {
  const db = await getReadyDatabase()
  const transaction = db.transaction(storeName, 'readwrite')
  const done = transactionToPromise(transaction)
  transaction.objectStore(storeName).delete(id)
  await done
}

async function clearStore(storeName: StoreName): Promise<void> {
  const db = await getReadyDatabase()
  const transaction = db.transaction(storeName, 'readwrite')
  const done = transactionToPromise(transaction)
  transaction.objectStore(storeName).clear()
  await done
}

// ---------- Snapshots ----------

export async function listSnapshots(): Promise<Snapshot[]> {
  const db = await getReadyDatabase()
  const list = await getAllFromDatabase<Snapshot>(db, SNAPSHOTS_STORE)
  return list.sort((a, b) => a.createdAt < b.createdAt ? 1 : -1)
}

export async function getSnapshot(id: string): Promise<Snapshot | undefined> {
  const db = await getReadyDatabase()
  const transaction = db.transaction(SNAPSHOTS_STORE, 'readonly')
  const done = transactionToPromise(transaction)
  const result = await requestToPromise(transaction.objectStore(SNAPSHOTS_STORE).get(id)) as Snapshot | undefined
  await done
  return result
}

export function saveSnapshot(snapshot: Snapshot): Promise<void> {
  return putRecord(SNAPSHOTS_STORE, snapshot)
}

export function removeSnapshot(id: string): Promise<void> {
  return deleteRecord(SNAPSHOTS_STORE, id)
}

export function clearSnapshots(): Promise<void> {
  return clearStore(SNAPSHOTS_STORE)
}

// ---------- Buddies ----------

export async function listBuddies(): Promise<BallBuddy[]> {
  const db = await getReadyDatabase()
  const list = await getAllFromDatabase<BallBuddy>(db, BUDDIES_STORE)
  return list.sort((a, b) => a.createdAt < b.createdAt ? -1 : 1)
}

export function saveBuddy(buddy: BallBuddy): Promise<void> {
  return putRecord(BUDDIES_STORE, buddy)
}

export function removeBuddy(id: string): Promise<void> {
  return deleteRecord(BUDDIES_STORE, id)
}

export function clearBuddies(): Promise<void> {
  return clearStore(BUDDIES_STORE)
}

// ---------- 文件导入 / 导出 ----------

const FILE_NAME = 'billiards-data.json'

/** 把当前所有数据打包，触发浏览器下载 */
export async function exportToFile(): Promise<void> {
  const [bills, buddies] = await Promise.all([listSnapshots(), listBuddies()])
  const shape: ExportShape = {
    version: 1,
    exportedAt: new Date().toISOString(),
    bills,
    buddies
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
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 解析用户上传的 JSON 文件，与现有数据按 id 合并（不覆盖已有条目） */
export async function importFromFile(
  file: File
): Promise<{ billsAdded: number; billsSkipped: number; buddiesAdded: number; buddiesSkipped: number }> {
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

  const incomingBills: Snapshot[] = Array.isArray(parsed.bills) ? parsed.bills : []
  const incomingBuddies: BallBuddy[] = Array.isArray(parsed.buddies) ? parsed.buddies : []
  const [currentBills, currentBuddies] = await Promise.all([listSnapshots(), listBuddies()])

  const billIdSet = new Set(currentBills.map((bill) => bill.id))
  const billsToAdd: Snapshot[] = []
  let billsSkipped = 0
  for (const bill of incomingBills) {
    if (!bill || typeof bill.id !== 'string' || billIdSet.has(bill.id)) {
      billsSkipped++
      continue
    }
    billIdSet.add(bill.id)
    billsToAdd.push(bill)
  }

  const buddyIdSet = new Set(currentBuddies.map((buddy) => buddy.id))
  const buddyNameSet = new Set(currentBuddies.map((buddy) => buddy.name))
  const buddiesToAdd: BallBuddy[] = []
  let buddiesSkipped = 0
  for (const buddy of incomingBuddies) {
    if (
      !buddy ||
      typeof buddy.id !== 'string' ||
      typeof buddy.name !== 'string' ||
      buddyIdSet.has(buddy.id) ||
      buddyNameSet.has(buddy.name)
    ) {
      buddiesSkipped++
      continue
    }
    buddyIdSet.add(buddy.id)
    buddyNameSet.add(buddy.name)
    buddiesToAdd.push(buddy)
  }

  if (billsToAdd.length || buddiesToAdd.length) {
    const db = await getReadyDatabase()
    const transaction = db.transaction([SNAPSHOTS_STORE, BUDDIES_STORE], 'readwrite')
    const done = transactionToPromise(transaction)
    const snapshotsStore = transaction.objectStore(SNAPSHOTS_STORE)
    const buddiesStore = transaction.objectStore(BUDDIES_STORE)
    billsToAdd.forEach((item) => snapshotsStore.add(item))
    buddiesToAdd.forEach((item) => buddiesStore.add(item))
    await done
  }

  return {
    billsAdded: billsToAdd.length,
    billsSkipped,
    buddiesAdded: buddiesToAdd.length,
    buddiesSkipped
  }
}

/** 触发一个隐藏的 <input type=file>，选完调 onPicked */
export function pickJsonFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.style.display = 'none'
    input.addEventListener('change', () => {
      const file = input.files && input.files[0] ? input.files[0] : null
      document.body.removeChild(input)
      resolve(file)
    })
    document.body.appendChild(input)
    input.click()
  })
}
