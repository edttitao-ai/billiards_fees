<script setup lang="ts">
/**
 * 简单的分享方式选择器。点 [分享] 按钮弹出三种方式：
 *   - 复制文本：直接复制 plain text 账单
 *   - 生成图片：截图 PNG 并下载 / 调系统分享
 *   - 生成共享链接：生成 /share?p=… 链接并复制
 *
 * 用法：<ShareChooser @copy-text @image-png @share-link />
 */
import { computed, ref } from 'vue'
import { Share2, Copy, Image, Link2, ChevronUp } from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui'
import {
  buildBillText,
  buildShareUrl,
  downloadBlob,
  posterFilename,
  copyToClipboard
} from '@/utils/share'
import { sessionToPngBlob } from '@/utils/posterRenderer'
import type { SessionState } from '@/types'

const props = defineProps<{
  session: SessionState
}>()

const emit = defineEmits<{
  (e: 'copied'): void
  (e: 'image-saved'): void
  (e: 'link-copied'): void
}>()

const ui = useUIStore()
const open = ref(false)

const canShareFiles = computed(() => typeof navigator !== 'undefined' && 'share' in navigator)

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

async function handleImage() {
  await close()
  ui.showToast('正在生成图片…', 'info')
  let blob: Blob | null = null
  let filename = posterFilename(props.session.title)
  try {
    blob = await sessionToPngBlob(props.session)
    // 优先用 Web Share API（移动端能直接发到微信/朋友圈）
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      typeof navigator.share === 'function' &&
      navigator.canShare({ files: [new File([blob], filename, { type: 'image/png' })] })
    ) {
      const file = new File([blob], filename, { type: 'image/png' })
      await navigator.share({ files: [file], title: props.session.title })
      emit('image-saved')
      return
    }
  } catch {
    /* 走到下载 fallback */
  }
  if (blob) {
    downloadBlob(blob, filename)
    ui.showToast('图片已下载', 'success')
    emit('image-saved')
  }
}

async function handleShareLink() {
  const url = buildShareUrl(props.session)
  const ok = await copyToClipboard(url)
  ui.showToast(ok ? '共享链接已复制' : '复制失败', ok ? 'success' : 'error')
  emit('link-copied')
  await close()
}
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="inline-flex h-9 px-3 text-xs font-medium items-center gap-1 rounded-md bg-brand-500 text-white hover:bg-brand-600 sm:h-10 sm:px-5 sm:text-sm"
      @click="open = !open"
    >
      <Share2 :size="14" class="sm:hidden" />
      <Share2 :size="16" class="hidden sm:block" />
      <span class="whitespace-nowrap">导出账单</span>
      <ChevronUp :size="14" class="transition-transform" :class="open ? '' : 'rotate-180'" />
    </button>

    <!-- 下拉 -->
    <transition name="pop">
      <div
        v-if="open"
        class="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-lg border border-ink-100 bg-white shadow-card sm:left-auto sm:right-0 sm:bottom-full sm:mb-2 sm:w-60"
        style="z-index: 40"
      >
        <button
          type="button"
          class="flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-left text-xs hover:bg-ink-50"
          @click="handleCopyText"
        >
          <Copy :size="14" class="shrink-0 text-ink-500" />
          <span class="flex-1">导出为文本</span>
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2 whitespace-nowrap border-t border-ink-100 px-3 py-2 text-left text-xs hover:bg-ink-50"
          @click="handleImage"
        >
          <Image :size="14" class="shrink-0 text-ink-500" />
          <span class="flex-1">生成账单图片</span>
          <span class="shrink-0 text-[10px] text-ink-400">
            {{ canShareFiles ? '可分享到微信' : '下载到本地' }}
          </span>
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2 whitespace-nowrap border-t border-ink-100 px-3 py-2 text-left text-xs hover:bg-ink-50"
          @click="handleShareLink"
        >
          <Link2 :size="14" class="shrink-0 text-ink-500" />
          <span class="flex-1">复制共享链接</span>
        </button>
      </div>
    </transition>

    <!-- 点击外部关闭 -->
    <div
      v-if="open"
      class="fixed inset-0 z-30"
      @click="close"
    />
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
  transform: translateY(6px);
}
</style>
