<script setup lang="ts">
import { computed } from 'vue'
import { Clock4 } from 'lucide-vue-next'
import AppCard from '@/components/base/AppCard.vue'
import Stat from '@/components/base/Stat.vue'
import { useSessionStore } from '@/stores/session'
import { personalFee } from '@/utils/calc'
import { formatCurrency, formatNumber } from '@/utils/format'

const session = useSessionStore()

const participantCount = () => session.participants.length

/**
 * 套餐简汇：按套餐小时数分组，输出紧凑表达式，如「1h ×4 · 2h ×5」。
 * - 同小时数累计张数（不分套餐名）
 * - 总数 = 全部张数
 */
const packageSummary = computed(() => {
  const list = session.packages
  if (!list.length) return { parts: [], totalQty: 0 }
  // 按小时数聚合
  const byHours = new Map<number, number>()
  let totalQty = 0
  list.forEach((p) => {
    const h = Number(p.hours) || 0
    const q = Number(p.qty) || 0
    if (q <= 0) return
    byHours.set(h, (byHours.get(h) || 0) + q)
    totalQty += q
  })
  // 按小时数升序排序，输出紧凑数组
  const parts = Array.from(byHours.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hours, qty]) => `${formatNumber(hours, 1)}h ×${qty}`)
  return { parts, totalQty }
})

/**
 * 最少费用：在场时长最短者（按时长加权 pi = di × T / Σd）实际分摊到的金额。
 * - 0 人时返回 0
 */
const minFee = computed(() => {
  const list = session.participants
  if (!list.length) return 0
  const totalFee = session.totalFee
  return list.reduce(
    (min, p) => Math.min(min, personalFee(totalFee, list, p.id)),
    Number.POSITIVE_INFINITY
  )
})
</script>

<template>
  <AppCard>
    <div class="mb-4 flex items-end justify-between gap-3">
      <div>
        <div class="section-kicker">Settlement</div>
        <div class="mt-0.5 flex items-center gap-2">
          <Clock4 :size="17" class="text-brand-600" />
          <h2 class="section-title">分摊结果</h2>
        </div>
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-[minmax(220px,0.9fr)_2fr]">
      <div class="relative overflow-hidden rounded-2xl border border-accent-200 bg-accent-50 px-4 py-5 sm:px-5">
        <div class="absolute -right-8 -top-8 h-24 w-24 rounded-full border-[18px] border-accent-100/70" />
        <div class="relative text-xs font-medium text-accent-700">本次总台费</div>
        <div class="relative mt-2 data-number text-3xl font-bold text-brand-800 sm:text-4xl">
          {{ formatCurrency(session.totalFee) }}
        </div>
        <div class="relative mt-3 text-[13px] text-ink-500">
          由 {{ participantCount() }} 位球友按实际时长分摊
        </div>
      </div>

      <div class="space-y-2">
        <!-- 上排：总时长 + 每桌时长 -->
        <div class="grid grid-cols-2 gap-2">
          <Stat label="总时长" :value="formatNumber(session.totalDuration, 1)" unit="小时" />
          <Stat label="每桌时长" :value="formatNumber(session.tableDuration, 1)" unit="小时" />
        </div>

        <!-- 套餐简汇：独占整行（按小时分组，如 1h ×4 · 2h ×5） -->
        <div class="rounded-xl border border-ink-100 bg-ink-50/80 px-3 py-3 text-left">
          <div class="text-[13px] font-medium tracking-wide text-ink-500">套餐简汇</div>
          <div
            v-if="packageSummary.parts.length"
            class="mt-1 truncate text-base font-bold text-ink-900"
            :title="packageSummary.parts.join(' · ')"
          >
            {{ packageSummary.parts.join(' · ') }}
          </div>
          <div v-else class="mt-1 text-base font-bold text-ink-300">—</div>
          <div class="mt-0.5 text-xs text-ink-400">共 {{ packageSummary.totalQty }} 张</div>
        </div>

        <!-- 下排：最少费用 + 参与人数 -->
        <div class="grid grid-cols-2 gap-2">
          <Stat label="最少费用" :value="formatCurrency(minFee)" />
          <Stat label="参与人数" :value="String(participantCount())" unit="人" />
        </div>
      </div>
    </div>
  </AppCard>
</template>
