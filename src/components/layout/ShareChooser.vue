<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Share2,
  Copy,
  Link2,
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
  buildShareUrl,
  copyToClipboard
} from '@/utils/share'
import {
  captureNodeToPngBlob,
  copyPngBlobToClipboard,
  defaultPosterFilename,
  downloadBlob
} from '@/utils/posterImage'
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
  (e: 'link-copied'): void
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

async function handleShareLink() {
  const url = buildShareUrl(props.session)
  const ok = await copyToClipboard(url)
  ui.showToast(ok ? '共享链接已复制' : '复制失败', ok ? 'success' : 'error')
  emit('link-copied')
  await close()
}

const previewOpen = ref(false)
/** BillPoster 根节点的 DOM ref，用于 modern-screenshot 截图 */
const posterRef = ref<HTMLElement | null>(null)
/** 截图进行中：禁用按钮，避免重复触发 */
const capturing = ref(false)

function handleOpenPreview() {
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
    else ui.showToast('当前浏览器不支持复制图片，请用「保存图片」', 'warn')
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
          @click="handleShareLink"
        >
          <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <Link2 :size="13" />
          </span>
          <span class="flex-1 whitespace-nowrap">复制共享链接</span>
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
          使用下方按钮可一键保存或复制为图片；长按或右键也可手动截图。
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
          保存图片
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
