<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Trash2, Pencil } from 'lucide-vue-next'
import TopBar from '@/components/layout/TopBar.vue'
import AppCard from '@/components/base/AppCard.vue'
import AppButton from '@/components/base/AppButton.vue'
import Stat from '@/components/base/Stat.vue'
import ToastHost from '@/components/layout/ToastHost.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import { useHistoryStore } from '@/stores/history'
import { useSessionStore } from '@/stores/session'
import { useUIStore } from '@/stores/ui'
import { formatCurrency, formatDateTime, formatNumber } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const history = useHistoryStore()
const session = useSessionStore()
const ui = useUIStore()

const snap = ref<Awaited<ReturnType<typeof history.get>>>(undefined)

onMounted(async () => {
  await history.loadAll()
  const id = String(route.params.id)
  snap.value = await history.get(id)
})

const totalDur = computed(() =>
  snap.value ? snap.value.session.packages.reduce((s, p) => s + p.hours * p.qty, 0) : 0
)

const packageCount = computed(() =>
  snap.value ? snap.value.session.packages.reduce((s, p) => s + p.qty, 0) : 0
)

const avgDur = computed(() => {
  if (!snap.value || snap.value.session.participants.length === 0) return 0
  const durs = snap.value.session.participants.map((p) => p.duration)
  const max = Math.max(...durs)
  const fullCount = durs.filter((d) => Math.abs(d - max) < 0.005).length
  return max // 打满者的时长
})

const fullCount = computed(() => {
  if (!snap.value || snap.value.session.participants.length === 0) return 0
  const durs = snap.value.session.participants.map((p) => p.duration)
  const max = Math.max(...durs)
  return durs.filter((d) => Math.abs(d - max) < 0.005).length
})

const fullFee = computed(() =>
  fullCount.value > 0 ? snap.value!.totalFee / fullCount.value : 0
)

async function remove() {
  if (!snap.value) return
  const ok = await ui.confirm({
    title: '删除账单',
    message: '确认删除这条账单快照？删除后无法恢复。',
    confirmText: '删除',
    tone: 'danger'
  })
  if (!ok) return
  await history.remove(snap.value.id)
  ui.showToast('已删除', 'success')
  router.replace('/history')
}

function loadToHome() {
  if (!snap.value) return
  session.loadFromSession(snap.value.session)
  ui.showToast('已载入到主页，可继续编辑', 'success')
  router.replace('/')
}
</script>

<template>
  <div class="container-page">
    <TopBar title="账单详情" :show-back="true" :show-history="false" :show-guide="false" />

    <div v-if="!snap" class="mt-10">
      <EmptyState title="未找到这条账单" description="可能已被删除">
        <AppButton class="mt-4" variant="primary" @click="router.replace('/history')">
          返回历史
        </AppButton>
      </EmptyState>
    </div>

    <template v-else>
      <AppCard>
        <div class="mb-2 text-xs text-ink-400">账单快照</div>
        <div class="text-base font-semibold text-ink-900">{{ snap.title }}</div>
        <div class="mt-0.5 text-xs text-ink-400">{{ formatDateTime(snap.createdAt) }}</div>

        <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Stat label="总时长" :value="formatNumber(totalDur, 1)" unit="小时" />
          <Stat label="台桌数" :value="String(snap.session.tableCount || 1)" unit="桌" />
          <Stat label="套餐数" :value="String(packageCount)" unit="张" />
          <Stat label="总台费" :value="formatCurrency(snap.totalFee)" highlight tone="brand" />
          <Stat label="人均费用" :value="formatCurrency(snap.avgFee)" />
        </div>
      </AppCard>

      <AppCard class="mt-3">
        <div class="mb-2 text-sm font-semibold text-ink-900">套餐明细</div>
        <ul v-if="snap.session.packages.length" class="divide-y divide-ink-100">
          <li
            v-for="p in snap.session.packages"
            :key="p.id"
            class="flex items-center justify-between py-2 text-sm"
          >
            <span class="text-ink-700">{{ p.name }} ×{{ p.qty }}</span>
            <span class="text-ink-500">{{ formatNumber(p.hours * p.qty, 1) }} 小时</span>
            <span class="font-semibold text-brand-600">
              {{ formatCurrency(p.price * p.qty) }}
            </span>
          </li>
        </ul>
      </AppCard>

      <AppCard class="mt-3">
        <div class="mb-2 text-sm font-semibold text-ink-900">参与人员</div>
        <ul class="divide-y divide-ink-100">
          <li
            v-for="p in snap.session.participants"
            :key="p.id"
            class="flex items-center justify-between py-2 text-sm"
          >
            <span class="text-ink-700">{{ p.index }}. {{ p.name }}</span>
            <span class="text-ink-500">{{ formatNumber(p.duration, 1) }} 小时</span>
            <span class="font-semibold text-brand-600">{{ formatCurrency(p.personalFee) }}</span>
          </li>
        </ul>
      </AppCard>

      <AppCard class="mt-3">
        <div class="mb-2 text-sm font-semibold text-ink-900">收款建议</div>
        <div class="text-xs text-ink-500">
          打满者人均 {{ formatCurrency(fullFee) }}（{{ fullCount }} 人打满 {{ formatNumber(avgDur, 1) }} h）
        </div>
        <div class="mt-2 text-xs text-ink-400">
          早走者按 di × 总台费 / Σ在场时长 比例分摊。在主页可查看完整的多退少补建议。
        </div>
      </AppCard>

      <div class="mt-6 flex gap-2">
        <AppButton variant="danger" class="flex-1" @click="remove">
          <Trash2 :size="16" />
          删除该条
        </AppButton>
        <AppButton variant="primary" class="flex-1" @click="loadToHome">
          <Pencil :size="16" />
          再次编辑
        </AppButton>
      </div>
    </template>

    <ToastHost />
  </div>
</template>