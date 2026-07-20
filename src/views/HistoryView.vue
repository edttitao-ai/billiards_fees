<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  Download,
  Receipt,
  Square,
  Upload,
  Users,
  Trash2
} from 'lucide-vue-next'
import EmptyState from '@/components/base/EmptyState.vue'
import ToastHost from '@/components/layout/ToastHost.vue'
import { useHistoryStore } from '@/stores/history'
import { useBuddiesStore } from '@/stores/buddies'
import { useUIStore } from '@/stores/ui'
import { formatCurrency, formatDateTime } from '@/utils/format'
import {
  exportToFile,
  importFromFile,
  pickJsonFile
} from '@/utils/jsonStore'
import type { BallBuddy, Snapshot } from '@/types'

const history = useHistoryStore()
const buddies = useBuddiesStore()
const ui = useUIStore()
const router = useRouter()

onMounted(async () => {
  await history.loadAll()
  await buddies.loadAll({ seedIfEmpty: false })
})

function openDetail(id: string) {
  router.push({ name: 'history-detail', params: { id } })
}

async function removeOne(id: string, e: Event) {
  e.stopPropagation()
  const ok = await ui.confirm({
    title: '删除账单',
    message: '确认删除这条账单快照？此操作不可恢复。',
    confirmText: '删除',
    tone: 'danger'
  })
  if (!ok) return
  await history.remove(id)
  ui.showToast('已删除', 'success')
}

async function clearAll() {
  const ok = await ui.confirm({
    title: '清空历史记录',
    message: `确认清空全部 ${history.list.length} 条历史账单？此操作不可恢复。`,
    confirmText: '全部清空',
    tone: 'danger'
  })
  if (!ok) return
  await history.clearAll()
  ui.showToast('已清空历史账单', 'success')
}

/** 把当前所有数据打包成 JSON 文件下载 */
async function exportJson() {
  if (!history.list.length && !buddies.list.length) {
    ui.showToast('暂无可导出的数据', 'info')
    return
  }
  try {
    await exportToFile()
    ui.showToast('已导出 billiards-data.json', 'success')
  } catch (e) {
    ui.showToast('导出失败：' + (e instanceof Error ? e.message : '未知错误'), 'error')
  }
}

/** 在 Modal 中预览「最新一条」账单的共享链接 */
async function importJson() {
  const file = await pickJsonFile()
  if (!file) return
  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    const bills: Snapshot[] = Array.isArray(parsed?.bills) ? parsed.bills : []
    const buddiesIn: BallBuddy[] = Array.isArray(parsed?.buddies) ? parsed.buddies : []
    if (!bills.length && !buddiesIn.length) {
      ui.showToast('JSON 中没有账单或球友数据', 'info')
      return
    }
    const result = await importFromFile(file)
    // IndexedDB 导入完成后重新加载内存中的 store
    await Promise.all([
      history.loadAll(),
      buddies.loadAll({ seedIfEmpty: false })
    ])
    const msg =
      `导入完成：新增账单 ${result.billsAdded}` +
      (result.billsSkipped ? `（跳过 ${result.billsSkipped}）` : '') +
      `，新增球友 ${result.buddiesAdded}` +
      (result.buddiesSkipped ? `（跳过 ${result.buddiesSkipped}）` : '')
    ui.showToast(msg, 'success')
  } catch (e) {
    const msg = e instanceof Error ? e.message : '未知错误'
    ui.showToast('导入失败：' + msg, 'error')
  }
}
</script>

<template>
  <div class="container-page">
    <header
      class="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between bg-white/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"
    >
      <button
        class="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100"
        aria-label="返回"
        @click="router.back()"
      >
        <ArrowLeft :size="20" />
      </button>
      <h1 class="text-base font-semibold text-ink-900 sm:text-lg">历史记录</h1>
      <button
        v-if="history.list.length"
        class="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-danger-500 hover:bg-red-50 sm:text-sm"
        @click="clearAll"
      >
        <Trash2 :size="14" />
        清空
      </button>
      <div v-else class="w-9" />
    </header>

    <!-- 数据备份栏：导出 / 导入 JSON -->
    <section
      class="mb-4 flex flex-col gap-2 rounded-2xl border border-ink-200/80 bg-white p-3 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-4"
    >
      <div class="min-w-0">
        <div class="text-sm font-semibold text-ink-900">数据备份</div>
        <div class="mt-0.5 text-xs text-ink-500">
          把所有账单和球友库打包成 JSON 文件，可随时备份或迁移到其他设备。
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <button
          type="button"
          class="inline-flex h-9 items-center gap-1.5 rounded-[11px] border border-ink-200 bg-[#fffefb] px-3 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
          @click="importJson"
        >
          <Upload :size="14" />
          导入 JSON
        </button>
        <button
          type="button"
          class="inline-flex h-9 items-center gap-1.5 rounded-[11px] border border-brand-700 bg-brand-700 px-3 text-sm font-semibold text-white shadow-soft transition hover:border-brand-800 hover:bg-brand-800"
          @click="exportJson"
        >
          <Download :size="14" />
          导出 JSON
        </button>
      </div>
    </section>

    <EmptyState
      v-if="history.loaded && history.list.length === 0"
      title="还没有账单"
      description="在主页分享或导出账单后会自动保存到这里"
    />

    <ul v-else class="space-y-2">
      <li
        v-for="s in history.list"
        :key="s.id"
        class="flex items-center gap-3 rounded-lg bg-white p-4 shadow-card transition hover:shadow-soft"
        @click="openDetail(s.id)"
      >
        <div class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
          <Receipt :size="20" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-semibold text-ink-900">{{ s.title }}</div>
          <div class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-400">
            <span class="font-semibold text-brand-600">{{ formatCurrency(s.totalFee) }}</span>
            <span class="inline-flex items-center gap-0.5">
              <Users :size="12" />
              {{ s.session.participants.length }} 人
            </span>
            <span class="inline-flex items-center gap-0.5">
              <Square :size="12" />
              {{ s.session.tableCount || 1 }} 桌
            </span>
            <span>·</span>
            <span>{{ formatDateTime(s.createdAt) }}</span>
          </div>
        </div>
        <button
          class="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-400 hover:bg-red-50 hover:text-danger-500"
          aria-label="删除"
          @click="(e) => removeOne(s.id, e)"
        >
          <Trash2 :size="16" />
        </button>
      </li>
    </ul>

    <ToastHost />
  </div>
</template>