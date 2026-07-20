<script setup lang="ts">
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
  const filename = posterFilename(props.session.title)
  try {
    blob = await sessionToPngBlob(props.session)
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
    // 不支持系统分享时降级为下载
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
          @click="handleImage"
        >
          <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
            <Image :size="13" />
          </span>
          <span class="min-w-0 flex-1 whitespace-nowrap">生成账单图片</span>
          <span class="shrink-0 whitespace-nowrap text-[12px] text-ink-400">
            {{ canShareFiles ? '可分享' : '下载' }}
          </span>
        </button>
        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-ink-700 hover:bg-brand-50"
          @click="handleShareLink"
        >
          <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <Link2 :size="13" />
          </span>
          <span class="flex-1 whitespace-nowrap">复制共享链接</span>
        </button>
      </div>
    </transition>

    <div v-if="open" class="fixed inset-0 z-30" @click="close" />
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
