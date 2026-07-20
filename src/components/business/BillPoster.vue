<script setup lang="ts">
/**
 * 账单海报模板：固定 480 宽，离屏渲染，
 * 专门给 html2canvas 截图用。
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
  footer?: string
}>()

const nowText = computed(() => {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
})
</script>

<template>
  <div
    style="
      width: 480px;
      box-sizing: border-box;
      padding: 16px;
      background: #eaf0f4;
      font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
    "
  >
    <div
      style="
        background: #fcfdfd;
        border: 1px solid #c5d3de;
        border-radius: 18px;
        overflow: hidden;
        box-shadow: 0 10px 28px rgba(32, 52, 64, 0.12);
      "
    >
      <div
        style="
          position: relative;
          background: #2d4354;
          color: white;
          padding: 22px 20px 20px;
          text-align: center;
          border-bottom: 3px solid #d4b45e;
        "
      >
        <div
          style="
            font-size: 10px;
            font-weight: 600;
            color: #d4b45e;
            letter-spacing: 0.22em;
            margin-bottom: 5px;
          "
        >
          BILLIARDS SPLIT SHEET
        </div>
        <div
          style="
            font-size: 21px;
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

      <div
        style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: #dde2e5;
        "
      >
        <div style="background: #f7f8f8; padding: 14px 18px">
          <div style="font-size: 11px; color: #929ca3">总台费</div>
          <div style="font-size: 22px; font-weight: 700; color: #7e591d; margin-top: 2px">
            {{ formatCurrency(totalFee) }}
          </div>
        </div>
        <div style="background: #f7f8f8; padding: 14px 18px">
          <div style="font-size: 11px; color: #929ca3">人均</div>
          <div style="font-size: 22px; font-weight: 700; color: #1c252b; margin-top: 2px">
            {{ formatCurrency(avgFee) }}
          </div>
        </div>
        <div style="background: #f7f8f8; padding: 14px 18px">
          <div style="font-size: 11px; color: #929ca3">总时长</div>
          <div style="font-size: 16px; font-weight: 600; color: #1c252b; margin-top: 4px">
            {{ formatNumber(totalDuration, 1) }} 小时
          </div>
        </div>
        <div style="background: #f7f8f8; padding: 14px 18px">
          <div style="font-size: 11px; color: #929ca3">每桌时长</div>
          <div style="font-size: 16px; font-weight: 600; color: #1c252b; margin-top: 4px">
            {{ tableCount }}桌 · {{ formatNumber(tableDuration, 1) }}h
          </div>
        </div>
      </div>

      <div style="padding: 14px 18px">
        <div
          style="
            font-size: 12px;
            color: #68737b;
            letter-spacing: 0.05em;
            margin-bottom: 6px;
          "
        >
          套餐明细
        </div>
        <div
          v-if="packages.length"
          style="border: 1px solid #dde2e5; border-radius: 10px; overflow: hidden"
        >
          <div
            v-for="(pkg, index) in packages"
            :key="pkg.id"
            style="
              display: grid;
              grid-template-columns: 1fr auto;
              align-items: center;
              padding: 10px 14px;
              background: #fcfdfd;
              font-size: 14px;
              border-top: 1px solid #eceff1;
            "
            :style="index === 0 ? 'border-top: none' : ''"
          >
            <div style="min-width: 0">
              <div
                style="
                  font-weight: 600;
                  color: #1c252b;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                "
              >
                {{ pkg.name }}
              </div>
              <div style="font-size: 11px; color: #929ca3; margin-top: 2px">
                {{ formatNumber(pkg.hours, 1) }}h · ¥{{ pkg.price }}/张 × {{ pkg.qty }}张
              </div>
            </div>
            <div style="font-weight: 700; color: #7e591d">
              {{ formatCurrency(pkg.qty * pkg.price) }}
            </div>
          </div>
        </div>
        <div v-else style="font-size: 12px; color: #929ca3">（无）</div>
      </div>

      <div style="padding: 0 18px 14px">
        <div
          style="
            font-size: 12px;
            color: #68737b;
            letter-spacing: 0.05em;
            margin-bottom: 6px;
          "
        >
          各人应付
        </div>
        <div
          v-if="participants.length"
          style="border: 1px solid #dde2e5; border-radius: 10px; overflow: hidden"
        >
          <div
            v-for="(participant, index) in participants"
            :key="participant.id"
            style="
              display: grid;
              grid-template-columns: 24px 1fr auto auto;
              align-items: center;
              gap: 10px;
              padding: 10px 14px;
              background: #fcfdfd;
              border-top: 1px solid #eceff1;
            "
            :style="index === 0 ? 'border-top: none' : ''"
          >
            <div
              style="
                width: 24px;
                height: 24px;
                border-radius: 999px;
                background: #e2eaf0;
                color: #3b5569;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: 700;
              "
            >
              {{ participant.index }}
            </div>
            <div
              style="
                min-width: 0;
                font-weight: 600;
                color: #1c252b;
                font-size: 14px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              "
            >
              {{ participant.name }}
            </div>
            <div style="font-size: 12px; color: #68737b; white-space: nowrap">
              {{ formatNumber(participant.duration, 1) }} h
            </div>
            <div style="font-weight: 700; color: #7e591d; font-size: 14px; white-space: nowrap">
              {{ formatCurrency(participant.personalFee) }}
            </div>
          </div>
        </div>
        <div v-else style="font-size: 12px; color: #929ca3">（无）</div>
      </div>

      <div
        style="
          padding: 10px 18px 16px;
          font-size: 11px;
          color: #929ca3;
          text-align: center;
          border-top: 1px dashed #dde2e5;
        "
      >
        {{ footer ?? `台费分摊 · ${nowText}` }}
      </div>
    </div>
  </div>
</template>
