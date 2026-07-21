<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Share2,
  Copy,
  ChevronUp,
  Camera,
  Download,
  ClipboardCopy
} from 'lucide-vue-next'
import AppModal from '@/components/base/AppModal.vue'
import BillPoster from '@/components/business/BillPoster.vue'
import { useUIStore } from '@/stores/ui'
import {
  buildBillText,
  copyToClipboard
} from '@/utils/share'
import {
  captureNodeToPngBlob,
  copyPngBlobToClipboard,
  defaultPosterFilename,
  downloadBlob
} from '@/utils/posterImage'
import { isWeChatBrowser, isMobileWeChat } from '@/utils/env'
import {
  totalFeeFromPackages,
  totalDurationFromPackages,
  avgFee
} from '@/utils/calc'
import type { SessionState, BillPackage, Participant } from '@/types'

const props = defineProps<{
  session: SessionState
}>()

const emit = defineEmits<{
  (e: 'copied'): void
}>()

const ui = useUIStore()
const open = ref(false)

async function close() {
  open.value = false
}

async function handleCopyText() {
  const text = buildBillText(props.session)
  const ok = await copyToClipboard(text)
  ui.showToast(ok ? '账单文本已复制' : '复制失败，请手动操作', ok ? 'success' : 'error')
  emit('copied')
  await close()
}

const previewOpen = ref(false)
/** BillPoster 根节点的 DOM ref，用于 modern-screenshot 截图 */
const posterRef = ref<HTMLElement | null>(null)
/** 截图进行中：禁用按钮，避免重复触发 */
const capturing = ref(false)
/** 微信内置浏览器：改走"新窗口预览 + 长按保存"流程 */
const isInWeChat = ref(false)
/** 移动端微信：window.open 不可靠，改走"当前页大图预览 + 长按保存" */
const isInMobileWeChat = ref(false)

function handleOpenPreview() {
  isInWeChat.value = isWeChatBrowser()
  isInMobileWeChat.value = isMobileWeChat()
  previewOpen.value = true
  close()
}

/** 处理 modal 内部元素以便挂在 ref 上 */
function setPosterRef(el: Element | { $el?: Element } | null) {
  if (el && '$el' in (el as Record<string, unknown>)) {
    posterRef.value = ((el as { $el: HTMLElement }).$el as HTMLElement) ?? null
  } else {
    posterRef.value = (el as HTMLElement | null) ?? null
  }
}

/** 把海报 PNG 在新窗口打开预览图（用于 PC 端微信 WebView 长按保存） */
function openPosterInNewTab(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank')
  // 某些浏览器/微信拦截新窗口时，w 可能为 null。仍保留 URL 让用户可以复制。
  if (!w) {
    ui.showToast('浏览器拦截了新窗口，请允许弹出后重试', 'warn')
  }
  // 延迟回收，避免新窗口还没来得及加载就被 revoke
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

/** Blob → dataURL（避免 blob: URL 在不同上下文中的生命周期问题） */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('读取图片失败'))
    reader.readAsDataURL(blob)
  })
}

/** 移动端微信：在当前页弹一张大图预览，用户长按图片保存到相册 */
const mobilePreviewOpen = ref(false)
const mobilePreviewUrl = ref<string>('')
async function openPosterInAppPreview(blob: Blob) {
  const dataUrl = await blobToDataURL(blob)
  mobilePreviewUrl.value = dataUrl
  mobilePreviewOpen.value = true
}

/** 「保存图片」：渲染为 PNG 并触发浏览器下载 */
async function handleSaveImage() {
  if (capturing.value) return
  if (!posterRef.value) {
    ui.showToast('海报未渲染，请稍候重试', 'warn')
    return
  }
  capturing.value = true
  try {
    const blob = await captureNodeToPngBlob(posterRef.value)
    if (isInMobileWeChat.value) {
      // 手机端微信 window.open 会被静默拦截，改走"当前页大图预览 + 长按保存"
      await openPosterInAppPreview(blob)
      ui.showToast('请长按图片保存到相册', 'info')
      return
    }
    if (isInWeChat.value) {
      // PC 端微信：仍走"新窗口预览 + 长按保存"
      openPosterInNewTab(blob)
      ui.showToast('请在新打开的图片上长按保存', 'info')
      return
    }
    downloadBlob(blob, defaultPosterFilename(props.session.title))
    ui.showToast('图片已下载', 'success')
  } catch (e) {
    ui.showToast(
      '生成图片失败：' + (e instanceof Error ? e.message : '未知错误'),
      'error'
    )
  } finally {
    capturing.value = false
  }
}

/** 「复制图片」：复制 PNG 到剪贴板 */
async function handleCopyImage() {
  if (capturing.value) return
  if (!posterRef.value) {
    ui.showToast('海报未渲染，请稍候重试', 'warn')
    return
  }
  capturing.value = true
  try {
    const blob = await captureNodeToPngBlob(posterRef.value)
    const ok = await copyPngBlobToClipboard(blob)
    if (ok) ui.showToast('图片已复制到剪贴板', 'success')
    else if (isInWeChat.value) {
      ui.showToast(
        '微信内置浏览器不允许复制图片，请用其他浏览器打开',
        'warn'
      )
    } else ui.showToast('当前浏览器不支持复制图片，请用「保存图片」', 'warn')
  } catch (e) {
    ui.showToast(
      '复制图片失败：' + (e instanceof Error ? e.message : '未知错误'),
      'error'
    )
  } finally {
    capturing.value = false
  }
}

/** 给 BillPoster 用的派生数据，避免修改原 store 形态 */
const totalFeeFromSession = computed(() =>
  totalFeeFromPackages(props.session.packages)
)
const totalDurationFromSession = computed(() =>
  totalDurationFromPackages(props.session.packages)
)
const avgFeeFromSession = computed(() =>
  avgFee(totalFeeFromSession.value, props.session.participants)
)
const tableDurationFromSession = computed(() => {
  const tc = props.session.tableCount || 1
  return tc > 0 ? totalDurationFromSession.value / tc : totalDurationFromSession.value
})
const packagesForPoster = computed<BillPackage[]>(() =>
  props.session.packages.map((p) => ({ ...p }))
)
const participantsForPoster = computed<Participant[]>(() =>
  props.session.participants.map((p) => ({ ...p }))
)
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="inline-flex h-9 items-center gap-1.5 rounded-xl border border-brand-800 bg-brand-800 px-3 text-xs font-semibold text-white shadow-soft transition hover:bg-brand-900 sm:h-10 sm:px-4 sm:text-sm"
      @click="open = !open"
    >
      <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent-300 text-brand-900">
        <Share2 :size="11" />
      </span>
      <span class="whitespace-nowrap">导出账单</span>
      <ChevronUp :size="13" class="transition-transform" :class="open ? '' : 'rotate-180'" />
    </button>

    <transition name="pop">
      <div
        v-if="open"
        class="absolute bottom-full right-0 z-40 mb-2 w-60 overflow-hidden rounded-2xl border border-ink-200 bg-[#fffefb] p-1.5 shadow-floating"
      >
        <div class="px-2 pb-1 pt-0.5 font-data text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-400">
          选择导出方式
        </div>
        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-ink-700 hover:bg-brand-50"
          @click="handleCopyText"
        >
          <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
            <Copy :size="13" />
          </span>
          <span class="flex-1 whitespace-nowrap">导出为文本</span>
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-ink-700 hover:bg-brand-50"
          @click="handleOpenPreview"
        >
          <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-300/40 text-brand-700">
            <Camera :size="13" />
          </span>
          <span class="flex-1 whitespace-nowrap">生成账单图片</span>
        </button>
      </div>
    </transition>

    <div v-if="open" class="fixed inset-0 z-30" @click="close" />

    <!-- 分享海报预览 Modal：展示 BillPoster，支持一键保存/复制图片 -->
    <AppModal
      v-model:open="previewOpen"
      title="分享海报预览"
      max-width-class="sm:max-w-[640px]"
    >
      <div class="bg-ink-50 px-3 py-4 sm:px-5">
        <!-- PC 端：海报固定宽 480 居中；手机端：宽度 100% -->
        <div
          class="mx-auto w-full max-w-[480px] overflow-hidden rounded-md border border-ink-200 bg-[#fcfdfd] shadow-card"
          :ref="setPosterRef"
        >
          <BillPoster
            :title="session.title"
            :total-fee="totalFeeFromSession"
            :avg-fee="avgFeeFromSession"
            :total-duration="totalDurationFromSession"
            :table-count="session.tableCount || 1"
            :table-duration="tableDurationFromSession"
            :packages="packagesForPoster"
            :participants="participantsForPoster"
          />
        </div>
        <p class="mt-3 text-center text-xs text-ink-500">
          <template v-if="isInMobileWeChat">
            微信内置浏览器不支持直接下载。点击「长按图片保存」后，长按图片保存到相册。
          </template>
          <template v-else-if="isInWeChat">
            微信内置浏览器不支持直接下载。请点击「在新窗口打开」后，长按图片保存到相册。
          </template>
          <template v-else>
            使用下方按钮可一键保存或复制为图片。
          </template>
        </p>
      </div>

      <template #footer>
        <button
          type="button"
          class="inline-flex h-9 items-center gap-1.5 rounded-[11px] border border-ink-200 bg-[#fffefb] px-3 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
          @click="previewOpen = false"
        >
          关闭
        </button>
        <button
          type="button"
          class="inline-flex h-9 items-center gap-1.5 rounded-[11px] border border-brand-200 bg-brand-50 px-3 text-sm font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="capturing"
          @click="handleCopyImage"
        >
          <ClipboardCopy :size="14" />
          复制图片
        </button>
        <button
          type="button"
          class="inline-flex h-9 items-center gap-1.5 rounded-[11px] border border-brand-700 bg-brand-700 px-3 text-sm font-semibold text-white shadow-soft transition hover:border-brand-800 hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="capturing"
          @click="handleSaveImage"
        >
          <Download :size="14" />
          {{ isInMobileWeChat ? '图片保存' : isInWeChat ? '在新窗口打开' : '保存图片' }}
        </button>
      </template>
    </AppModal>

    <!-- 移动端微信：在当前页弹一张大图，用户长按保存到相册 -->
    <AppModal
      v-model:open="mobilePreviewOpen"
      title="长按图片保存"
      max-width-class="sm:max-w-[640px]"
    >
      <div class="bg-ink-50 px-3 py-4 sm:px-5">
        <img
          v-if="mobilePreviewUrl"
          :src="mobilePreviewUrl"
          alt="账单海报"
          class="mx-auto block max-w-full select-none rounded-md border border-ink-200 bg-white shadow-card"
          style="-webkit-touch-callout: default; -webkit-user-select: none; user-select: none;"
          draggable="false"
        />
        <p class="mt-3 text-center text-xs text-ink-500">
          长按图片，选择「保存到相册」或「发送给朋友」。
        </p>
      </div>
      <template #footer>
        <button
          type="button"
          class="inline-flex h-9 items-center gap-1.5 rounded-[11px] border border-brand-700 bg-brand-700 px-3 text-sm font-semibold text-white shadow-soft transition hover:border-brand-800 hover:bg-brand-800"
          @click="mobilePreviewOpen = false"
        >
          关闭
        </button>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.pop-enter-active,
.pop-leave-active {
  transition: transform 0.16s ease, opacity 0.14s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}
</style>
