<script setup lang="ts">
import { Clock4 } from 'lucide-vue-next'
import AppCard from '@/components/base/AppCard.vue'
import Stat from '@/components/base/Stat.vue'
import { useSessionStore } from '@/stores/session'
import { formatCurrency, formatNumber } from '@/utils/format'

const session = useSessionStore()

const packageCount = () => session.packages.reduce((sum, item) => sum + (item.qty || 0), 0)
const participantCount = () => session.participants.length
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
      <span class="rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-medium text-ink-500">
        {{ packageCount() }} 张套餐
      </span>
    </div>

    <div class="grid gap-3 sm:grid-cols-[minmax(220px,0.9fr)_2fr]">
      <div class="relative overflow-hidden rounded-2xl border border-accent-200 bg-accent-50 px-4 py-5 sm:px-5">
        <div class="absolute -right-8 -top-8 h-24 w-24 rounded-full border-[18px] border-accent-100/70" />
        <div class="relative text-xs font-medium text-accent-700">本次总台费</div>
        <div class="relative mt-2 data-number text-3xl font-bold text-brand-800 sm:text-4xl">
          {{ formatCurrency(session.totalFee) }}
        </div>
        <div class="relative mt-3 text-[11px] text-ink-500">
          由 {{ participantCount() }} 位球友按实际时长分摊
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <Stat label="总时长" :value="formatNumber(session.totalDuration, 1)" unit="小时" />
        <Stat label="每桌时长" :value="formatNumber(session.tableDuration, 1)" unit="小时" />
        <Stat label="人均时长" :value="formatNumber(session.avgDuration, 1)" unit="小时" />
        <Stat label="参与人数" :value="String(participantCount())" unit="人" />
      </div>
    </div>
  </AppCard>
</template>
