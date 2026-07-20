<script setup lang="ts">
import { Clock4 } from 'lucide-vue-next'
import AppCard from '@/components/base/AppCard.vue'
import Stat from '@/components/base/Stat.vue'
import { useSessionStore } from '@/stores/session'
import { formatCurrency, formatNumber } from '@/utils/format'

const session = useSessionStore()

const packageCount = () => session.packages.reduce((s, p) => s + (p.qty || 0), 0)
const participantCount = () => session.participants.length
</script>

<template>
  <AppCard>
    <div class="mb-3 flex items-center gap-2 text-ink-900">
      <Clock4 :size="18" class="text-brand-600" />
      <span class="font-semibold">分摊结果</span>
    </div>
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <Stat label="总时长" :value="formatNumber(session.totalDuration, 1)" unit="小时" />
      <Stat label="桌时长" :value="formatNumber(session.tableDuration, 1)" unit="小时/桌" />
      <Stat label="套餐数" :value="String(packageCount())" unit="张" />
      <Stat label="总台费" :value="formatCurrency(session.totalFee)" highlight tone="brand" />
      <Stat label="人均时长" :value="formatNumber(session.avgDuration, 1)" unit="小时" />
      <Stat label="参与人数" :value="String(participantCount())" unit="人" />
    </div>
  </AppCard>
</template>