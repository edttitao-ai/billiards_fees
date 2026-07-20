<script setup lang="ts">
import { Upload, RotateCcw, BookmarkPlus } from 'lucide-vue-next'
import AppButton from '@/components/base/AppButton.vue'
import ShareChooser from '@/components/layout/ShareChooser.vue'
import type { SessionState } from '@/types'

defineProps<{
  session: SessionState
  canSave?: boolean
  saving?: boolean
}>()

defineEmits<{
  (e: 'export'): void
  (e: 'reset'): void
  (e: 'save'): void
}>()
</script>

<template>
  <div
    class="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white/95 px-2 py-2 backdrop-blur sm:static sm:mt-6 sm:rounded-lg sm:border sm:bg-white sm:px-4 sm:py-3 sm:shadow-card"
    style="padding-bottom: max(8px, env(safe-area-inset-bottom))"
  >
    <div class="mx-auto flex max-w-[960px] items-stretch gap-1.5 sm:gap-3">
      <!-- 次要按钮 -->
      <AppButton
        variant="secondary"
        size="sm"
        class="h-9 px-2 text-xs"
        title="复制账单文本"
        aria-label="复制账单文本"
        @click="$emit('export')"
      >
        <Upload :size="14" />
        <span class="whitespace-nowrap">导出</span>
      </AppButton>
      <AppButton
        variant="secondary"
        size="sm"
        class="h-9 px-2 text-xs"
        title="重置"
        aria-label="重置"
        @click="$emit('reset')"
      >
        <RotateCcw :size="14" />
        <span class="whitespace-nowrap">重置</span>
      </AppButton>
      <AppButton
        variant="secondary"
        size="sm"
        class="h-9 px-2 text-xs"
        :disabled="!canSave"
        :loading="saving"
        title="保存账单到历史记录"
        aria-label="保存账单"
        @click="$emit('save')"
      >
        <BookmarkPlus :size="14" />
        <span class="whitespace-nowrap">保存</span>
      </AppButton>

      <div class="flex-1" />

      <!-- 主按钮：分享（含 3 种方式下拉） -->
      <ShareChooser :session="session" />
    </div>
  </div>
</template>
