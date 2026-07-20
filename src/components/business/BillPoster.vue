<script setup lang="ts">
/**
 * 账单海报模板：固定 480 宽，离屏渲染，
 * 专门给 html2canvas 截图用。
 *
 * 字段：标题 / 总台费 / 人均 / 总时长 / 桌数 & 桌时长 /
 *      套餐明细 / 每人应付明细
 */
import { computed } from 'vue'
import type { BillPackage, Participant } from '@/types'
import { formatCurrency, formatNumber } from '@/utils/format'

const props = defineProps<{
  title: string
  totalFee: number
  avgFee: number
  totalDuration: number
  tableCount: number
  tableDuration: number
  packages: BillPackage[]
  participants: Participant[]
  /** 海报脚注，比如生成时间 / 标识 */
  footer?: string
}>()

const nowText = computed(() => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
})
</script>

<template>
  <!-- 480px 宽海报；外层有 padding，里面浅卡其色背景 -->
  <div
    style="
      width: 480px;
      box-sizing: border-box;
      padding: 16px;
      background: #ECFDF5;
      font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
    "
  >
    <div
      style="
        background: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
      "
    >
      <!-- 顶 banner -->
      <div
        style="
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 18px 20px;
          text-align: center;
        "
      >
        <div
          style="
            font-size: 20px;
            font-weight: 700;
            line-height: 1.3;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          "
        >
          {{ title || '台费账单' }}
        </div>
      </div>

      <!-- 关键指标 2x2 -->
      <div
        style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: #e2e8f0;
        "
      >
        <div style="background: #f8fafc; padding: 14px 18px">
          <div style="font-size: 11px; color: #94a3b8">总台费</div>
          <div style="font-size: 22px; font-weight: 700; color: #059669; margin-top: 2px">
            {{ formatCurrency(totalFee) }}
          </div>
        </div>
        <div style="background: #f8fafc; padding: 14px 18px">
          <div style="font-size: 11px; color: #94a3b8">人均</div>
          <div style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 2px">
            {{ formatCurrency(avgFee) }}
          </div>
        </div>
        <div style="background: #f8fafc; padding: 14px 18px">
          <div style="font-size: 11px; color: #94a3b8">总时长</div>
          <div style="font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 4px">
            {{ formatNumber(totalDuration, 1) }} 小时
          </div>
        </div>
        <div style="background: #f8fafc; padding: 14px 18px">
          <div style="font-size: 11px; color: #94a3b8">每桌时长</div>
          <div style="font-size: 16px; font-weight: 600; color: #0f172a; margin-top: 4px">
            {{ tableCount }}桌 ·
            {{ formatNumber(tableDuration, 1) }}h
          </div>
        </div>
      </div>

      <!-- 套餐列表 -->
      <div style="padding: 14px 18px">
        <div
          style="
            font-size: 12px;
            color: #64748b;
            letter-spacing: 0.05em;
            margin-bottom: 6px;
          "
        >
          套餐明细
        </div>
        <div
          v-if="packages.length"
          style="
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
          "
        >
          <div
            v-for="(p, i) in packages"
            :key="p.id"
            style="
              display: grid;
              grid-template-columns: 1fr auto;
              align-items: center;
              padding: 10px 14px;
              background: #ffffff;
              font-size: 14px;
              border-top: 1px solid #f1f5f9;
            "
            :style="i === 0 ? 'border-top: none' : ''"
          >
            <div style="min-width: 0">
              <div style="font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{ p.name }}</div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 2px">
                {{ formatNumber(p.hours, 1) }}h · ¥{{ p.price }}/张 × {{ p.qty }}张
              </div>
            </div>
            <div style="font-weight: 700; color: #059669">
              {{ formatCurrency(p.qty * p.price) }}
            </div>
          </div>
        </div>
        <div v-else style="font-size: 12px; color: #94a3b8">（无）</div>
      </div>

      <!-- 每人明细 -->
      <div style="padding: 0 18px 14px">
        <div
          style="
            font-size: 12px;
            color: #64748b;
            letter-spacing: 0.05em;
            margin-bottom: 6px;
          "
        >
          各人应付
        </div>
        <div
          v-if="participants.length"
          style="
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
          "
        >
          <div
            v-for="(p, i) in participants"
            :key="p.id"
            style="
              display: grid;
              grid-template-columns: 24px 1fr auto auto;
              align-items: center;
              gap: 10px;
              padding: 10px 14px;
              background: #ffffff;
              border-top: 1px solid #f1f5f9;
            "
            :style="i === 0 ? 'border-top: none' : ''"
          >
            <div
              style="
                width: 24px;
                height: 24px;
                border-radius: 999px;
                background: #d1fae5;
                color: #047857;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: 700;
              "
            >
              {{ p.index }}
            </div>
            <div style="min-width: 0; font-weight: 600; color: #0f172a; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">
              {{ p.name }}
            </div>
            <div style="font-size: 12px; color: #64748b; white-space: nowrap">
              {{ formatNumber(p.duration, 1) }} h
            </div>
            <div style="font-weight: 700; color: #059669; font-size: 14px; white-space: nowrap">
              {{ formatCurrency(p.personalFee) }}
            </div>
          </div>
        </div>
        <div v-else style="font-size: 12px; color: #94a3b8">（无）</div>
      </div>

      <!-- 脚注 -->
      <div
        style="
          padding: 10px 18px 16px;
          font-size: 11px;
          color: #94a3b8;
          text-align: center;
          border-top: 1px dashed #e2e8f0;
        "
      >
        {{ footer ?? `台费分摊 · ${nowText}` }}
      </div>
    </div>
  </div>
</template>
