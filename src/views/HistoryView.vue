<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Receipt, Users, Trash2 } from 'lucide-vue-next'
import EmptyState from '@/components/base/EmptyState.vue'
import ToastHost from '@/components/layout/ToastHost.vue'
import { useHistoryStore } from '@/stores/history'
import { useUIStore } from '@/stores/ui'
import { formatCurrency, formatDateTime } from '@/utils/format'

const history = useHistoryStore()
const ui = useUIStore()
const router = useRouter()

onMounted(() => history.loadAll())

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
          <div class="mt-0.5 flex items-center gap-2 text-xs text-ink-400">
            <span class="font-semibold text-brand-600">{{ formatCurrency(s.totalFee) }}</span>
            <span class="inline-flex items-center gap-0.5">
              <Users :size="12" />
              {{ s.session.participants.length }} 人
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