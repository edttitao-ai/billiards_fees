<script setup lang="ts">
/**
 * 共享账单页面：
 *   1. 从 URL ?p=<base64> 解析出 SharedBill
 *   2. 复用 BillPoster 组件渲染一份"可读账单"
 *   3. 提供"下载图片 / 复制链接 / 返回首页"按钮
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Download, Copy, AlertTriangle } from 'lucide-vue-next'
import AppButton from '@/components/base/AppButton.vue'
import AppCard from '@/components/base/AppCard.vue'
import BillPoster from '@/components/business/BillPoster.vue'
import { useUIStore } from '@/stores/ui'
import {
  parseShareBill,
  downloadBlob,
  posterFilename,
  type SharedBill
} from '@/utils/share'
import { sessionToPngBlob } from '@/utils/posterRenderer'
import type { BillPackage, Participant } from '@/types'

const router = useRouter()
const ui = useUIStore()

const bill = computed<SharedBill | null>(() => parseShareBill())

/** 把精简账单转回 BillPoster 所需的数据形态 */
const posterData = computed(() => {
  const b = bill.value
  if (!b) return null
  const sumDur = b.ps.reduce((s, p) => s + p.d, 0)
  const packages: BillPackage[] = b.p.map((p, i) => ({
    id: `p-${i}`,
    name: p.n,
    hours: p.h,
    price: p.pr,
    qty: p.q
  }))
  const participants: Participant[] = b.ps.map((p) => ({
    id: `ps-${p.i}`,
    index: p.i,
    name: p.n,
    avatarId: 0,
    gender: 'male',
    duration: p.d,
    personalFee:
      sumDur > 0 ? Math.round((p.d / sumDur) * b.tf * 100) / 100 : 0
  }))
  return {
    title: b.t,
    totalFee: b.tf,
    avgFee: b.ps.length > 0 ? Math.round((b.tf / b.ps.length) * 100) / 100 : 0,
    totalDuration: b.td,
    tableCount: b.tc,
    tableDuration: b.tc > 0 ? b.td / b.tc : b.td,
    packages,
    participants
  }
})

async function downloadPng() {
  if (!bill.value) return
  ui.showToast('正在生成图片…', 'info')
  try {
    // 海报组件要的是 SessionState，这里把 SharedBill 伪造成最小 session
    const blob = await sessionToPngBlob({
      title: bill.value.t,
      packages: bill.value.p.map((p, i) => ({
        id: `p-${i}`,
        name: p.n,
        hours: p.h,
        price: p.pr,
        qty: p.q
      })),
      participants: bill.value.ps.map((p, i) => ({
        id: `ps-${i}`,
        index: p.i,
        name: p.n,
        avatarId: 0,
        gender: 'male',
        duration: p.d,
        personalFee: 0
      })),
      tableCount: bill.value.tc,
      tableManual: false
    })
    downloadBlob(blob, posterFilename(bill.value.t))
    ui.showToast('图片已下载', 'success')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    ui.showToast(`图片生成失败：${msg}`, 'error')
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    ui.showToast('链接已复制', 'success')
  } catch {
    ui.showToast('复制失败，请手动复制地址栏', 'error')
  }
}

function back() {
  router.push('/')
}
</script>

<template>
  <div class="container-page">
    <!-- 顶部返回 + 当前页 -->
    <header class="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between bg-white/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <button
        class="inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm text-ink-700 hover:bg-ink-100"
        @click="back"
      >
        <ArrowLeft :size="18" />
        返回
      </button>
      <h1 class="text-base font-semibold text-ink-900 sm:text-lg">收到的账单</h1>
      <div class="w-9" />
    </header>

    <!-- 没有账单数据 -->
    <AppCard v-if="!posterData" class="space-y-3">
      <div class="flex items-center gap-2 text-warn-500">
        <AlertTriangle :size="20" />
        <span class="font-semibold">无效的分享链接</span>
      </div>
      <p class="text-sm text-ink-500">
        链接里没有账单数据，可能被截断或过期。回首页重新生成。
      </p>
      <AppButton variant="primary" @click="back">回首页</AppButton>
    </AppCard>

    <!-- 正常：海报 + 操作 -->
    <template v-else>
      <AppCard class="mb-3">
        <div class="mx-auto max-w-[520px] overflow-hidden rounded-md">
          <BillPoster v-bind="posterData" />
        </div>
      </AppCard>

      <div class="mx-auto flex max-w-[520px] flex-wrap gap-2">
        <AppButton variant="primary" size="md" @click="downloadPng">
          <Download :size="16" />
          下载图片
        </AppButton>
        <AppButton variant="secondary" size="md" @click="copyLink">
          <Copy :size="16" />
          复制链接
        </AppButton>
      </div>
    </template>
  </div>
</template>
