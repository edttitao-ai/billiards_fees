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
  // 1. 离屏容器：放到屏幕外但保持完整布局上下文
  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.left = '0'
  host.style.top = '0'
  host.style.zIndex = '-1'
  host.style.opacity = '0'
  host.style.pointerEvents = 'none'
  host.style.width = '480px'
  document.body.appendChild(host)

  // 2. 挂组件
  const app = createApp({ render: () => h(component, data) })
  const vm = app.mount(host)

  // 3. 等待：先让 Vue 完成首次渲染，再等字体加载，再多帧确保布局稳定
  await new Promise<void>((resolve) => setTimeout(resolve, 50))
  if (document.fonts && typeof document.fonts.ready?.then === 'function') {
    try {
      await document.fonts.ready
    } catch {
      /* ignore */
    }
  }
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

  try {
    const target = host.firstElementChild as HTMLElement | null
    if (!target) throw new Error('海报组件未挂载')

    // 4. 读取目标真实尺寸，告知 html2canvas 完整范围，避免截不全
    const rect = target.getBoundingClientRect()
    const width = Math.max(1, Math.ceil(rect.width))
    const height = Math.max(1, Math.ceil(rect.height))

    const canvas = await html2canvas(target, {
      backgroundColor: '#EAF0F4',
      scale: 2, // 高清
      logging: false,
      useCORS: true,
      width,
      height,
      windowWidth: Math.max(width, document.documentElement.clientWidth),
      windowHeight: Math.max(height, document.documentElement.clientHeight),
      scrollX: 0,
      scrollY: 0
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
