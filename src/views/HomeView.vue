<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import TopBar from '@/components/layout/TopBar.vue'
import BottomBar from '@/components/layout/BottomBar.vue'
import ToastHost from '@/components/layout/ToastHost.vue'
import BillHeader from '@/components/business/BillHeader.vue'
import PackageList from '@/components/business/PackageList.vue'
import TableCountCard from '@/components/business/TableCountCard.vue'
import ParticipantSection from '@/components/business/ParticipantSection.vue'
import SummaryCard from '@/components/business/SummaryCard.vue'
import { useSessionStore } from '@/stores/session'
import { useHistoryStore } from '@/stores/history'
import { useUIStore } from '@/stores/ui'
import { buildBillText, copyToClipboard } from '@/utils/share'

const session = useSessionStore()
const history = useHistoryStore()
const ui = useUIStore()

const saving = ref(false)
/** 最近一次保存的“指纹”，避免保存按钮重复刷记录 */
const lastSavedFingerprint = ref<string>('')

onMounted(() => {
  session.recalc()
  history.loadAll().catch(() => {})
})

const sessionView = () => ({
  title: session.title,
  packages: session.packages.map((p) => ({ ...p })),
  participants: [...session.participants],
  tableCount: session.tableCount,
  tableManual: !!session.tableManual
})

/** 生成账单关键字段指纹，用于去重 */
function fingerprint(): string {
  return JSON.stringify({
    title: session.title,
    fee: session.totalFee,
    dur: session.totalDuration,
    tables: session.tableCount,
    pkgs: session.packages.map((p) => `${p.id}|${p.hours}|${p.price}|${p.qty}|${p.name}`),
    ps: session.participants.map((p) => `${p.id}|${p.duration}|${p.name}`)
  })
}

/** 保存按钮启用条件：至少有套餐且至少有一位参与人员 */
const canSave = computed(
  () => session.packages.length > 0 && session.participants.length > 0
)

async function saveSnapshot(silent = false): Promise<boolean> {
  const fp = fingerprint()
  if (fp === lastSavedFingerprint.value) {
    if (!silent) ui.showToast('当前账单已保存过，无需重复', 'info')
    return false
  }
  const snap = {
    id: 'snap-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: session.title,
    createdAt: new Date().toISOString(),
    session: sessionView(),
    totalFee: session.totalFee,
    avgFee: session.avgFee,
    totalDuration: session.totalDuration
  }
  try {
    await history.save(snap)
    lastSavedFingerprint.value = fp
    if (!silent) ui.showToast('账单已保存到历史记录', 'success')
    return true
  } catch {
    ui.showToast('保存失败，浏览器可能禁用了本地存储', 'error')
    return false
  }
}

async function onExport() {
  const text = buildBillText(sessionView())
  const ok = await copyToClipboard(text)
  ui.showToast(ok ? '账单已复制到剪贴板' : '复制失败，请手动选择文本', ok ? 'success' : 'error')
  await saveSnapshot(true)
}

async function onSave() {
  if (saving.value) return
  if (!canSave.value) {
    ui.showToast('请先添加套餐与至少一位参与人员', 'warn')
    return
  }
  saving.value = true
  try {
    await saveSnapshot(false)
  } finally {
    saving.value = false
  }
}

async function onReset() {
  const ok = await ui.confirm({
    title: '重置账单',
    message: '确认重置当前账单为初始状态？\n此操作不会删除已保存的账单快照。',
    confirmText: '重置',
    tone: 'primary'
  })
  if (!ok) return
  session.reset()
  lastSavedFingerprint.value = ''
  ui.showToast('已重置为初始账单', 'info')
}
</script>

<template>
  <div class="container-page">
    <TopBar title="台费分摊" />

    <main class="space-y-4">
      <BillHeader />
      <div class="grid gap-4 lg:grid-cols-12 lg:items-start">
        <PackageList class="order-1 lg:col-span-12" />
        <TableCountCard class="order-2 lg:order-3 lg:col-span-4" />
        <ParticipantSection class="order-3 lg:order-2 lg:col-span-8" />
        <SummaryCard class="order-4 lg:col-span-12" />
      </div>
    </main>

    <BottomBar
      :session="sessionView()"
      :can-save="canSave"
      :saving="saving"
      @export="onExport"
      @reset="onReset"
      @save="onSave"
    />
    <ToastHost />
  </div>
</template>
