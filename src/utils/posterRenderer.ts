/**
 * 把 BillPoster 渲染成 PNG Blob。
 * 离屏挂载一个 Vue 组件实例 → html2canvas 截图 → 卸载 → 返回 Blob。
 */
import { createApp, h } from 'vue'
import type { Component } from 'vue'
import html2canvas from 'html2canvas'
import BillPoster from '@/components/business/BillPoster.vue'
import type { SessionState } from '@/types'
import {
  totalFeeFromPackages,
  totalDurationFromPackages,
  avgFee,
  participantsTotalDuration
} from './calc'

export interface PosterData {
  title: string
  totalFee: number
  avgFee: number
  totalDuration: number
  tableCount: number
  tableDuration: number
  packages: SessionState['packages']
  participants: Array<{
    id: string
    name: string
    index: number
    duration: number
    personalFee: number
  }>
}

/** 计算生成海报所需的全部字段 */
export function buildPosterData(session: SessionState): PosterData {
  const totalFee = totalFeeFromPackages(session.packages)
  const totalDur = totalDurationFromPackages(session.packages)
  const avg = avgFee(totalFee, session.participants)
  const tableCount = session.tableCount || 1
  const tableDur = tableCount > 0 ? totalDur / tableCount : totalDur
  const sumDur = participantsTotalDuration(session.participants)
  return {
    title: session.title,
    totalFee,
    avgFee: avg,
    totalDuration: totalDur,
    tableCount,
    tableDuration: tableDur,
    packages: session.packages,
    participants: session.participants.map((p, i) => ({
      id: p.id,
      index: i + 1,
      name: p.name,
      duration: p.duration,
      personalFee:
        sumDur > 0
          ? Math.round(((p.duration / sumDur) * totalFee) * 100) / 100
          : 0
    }))
  }
}

/**
 * 渲染指定海报数据为 PNG Blob。
 * 可选传入自定义组件（默认用内置 BillPoster）。
 */
export async function renderPosterToBlob(
  data: PosterData,
  component: Component = BillPoster
): Promise<Blob> {
  // 1. 离屏容器
  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.left = '-99999px'
  host.style.top = '0'
  host.style.pointerEvents = 'none'
  document.body.appendChild(host)

  // 2. 挂组件
  const app = createApp({ render: () => h(component, data) })
  const vm = app.mount(host)

  // 3. 等一帧让 svg/img 完整绘制
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

  try {
    const target = host.firstElementChild as HTMLElement | null
    if (!target) throw new Error('海报组件未挂载')

    const canvas = await html2canvas(target, {
      backgroundColor: '#ECFDF5',
      scale: 2, // 高清
      logging: false,
      useCORS: true
    })

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('canvas.toBlob 失败'))),
        'image/png'
      )
    })
  } finally {
    app.unmount()
    document.body.removeChild(host)
    void vm
  }
}

/** 一站式：会话 → PNG Blob */
export async function sessionToPngBlob(session: SessionState): Promise<Blob> {
  return renderPosterToBlob(buildPosterData(session))
}
