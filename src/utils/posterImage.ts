/**
 * 海报截图工具：把 DOM 子树转成 PNG Blob。
 * 用 modern-screenshot 完成 DOM → canvas → png 的渲染。
 */
import { domToBlob } from 'modern-screenshot'

/** 海报截图的默认参数。背景为海报自身的浅灰色背景；scale=2 输出 retina 效果 */
const DEFAULT_OPTIONS = {
  backgroundColor: '#eaf0f4',
  scale: 2,
  type: 'image/png' as const
}

/**
 * 把 DOM 节点渲染成 PNG Blob。
 * @param node 要截图的 DOM 节点（一般是 BillPoster 的根 div）
 * @param options 透传给 modern-screenshot
 */
export async function captureNodeToPngBlob(
  node: HTMLElement,
  options: { backgroundColor?: string; scale?: number } = {}
): Promise<Blob> {
  if (!node) throw new Error('captureNodeToPngBlob: node 为空')
  const blob = await domToBlob(node, {
    ...DEFAULT_OPTIONS,
    ...options
  })
  return blob
}

/** 把 Blob 转成可下载的临时 URL */
export function blobToObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}

/** 触发浏览器下载。调用后请 revokeObjectUrl */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  // 必须 append 进文档才能在 Firefox 里触发 click
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // 给浏览器一点时间处理下载，延迟回收
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * 把 PNG Blob 复制到剪贴板。
 * 浏览器需支持 ClipboardItem（iOS 13.4+ / Chrome 76+ / Edge 79+）。
 * 返回是否复制成功。
 */
export async function copyPngBlobToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (typeof ClipboardItem === 'undefined') return false
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return true
  } catch {
    return false
  }
}

/** 生成下载用的默认文件名：`台费账单_yyyyMMdd_HHmm.png` */
export function defaultPosterFilename(title = '台费账单'): string {
  const d = new Date()
  const pad = (v: number) => String(v).padStart(2, '0')
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(
    d.getHours()
  )}${pad(d.getMinutes())}`
  // 仅保留中文/字母/数字/下划线/短横线
  const safe = title.trim().replace(/[\\/:*?"<>|]/g, '_').slice(0, 24) || '台费账单'
  return `${safe}_${stamp}.png`
}
