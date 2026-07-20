<script setup lang="ts">
import { Copy, RotateCcw, BookmarkPlus } from 'lucide-vue-next'
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
    class="fixed inset-x-2 bottom-2 z-30 rounded-2xl border border-ink-200/80 bg-[#fffefb]/95 p-2 shadow-floating backdrop-blur-xl sm:static sm:inset-auto sm:mt-5 sm:rounded-[18px] sm:px-3 sm:py-2.5 sm:shadow-card"
    style="padding-bottom: max(8px, env(safe-area-inset-bottom))"
  >
    <div class="mx-auto flex max-w-[1080px] items-stretch gap-1.5 sm:gap-2">
      <AppButton
        variant="ghost"
        size="sm"
        class="h-9 px-2 text-xs"
        title="复制账单文本"
        aria-label="复制账单文本"
        @click="$emit('export')"
      >
        <Copy :size="14" />
        <span class="whitespace-nowrap">复制</span>
      </AppButton>
      <AppButton
        variant="ghost"
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
      <ShareChooser :session="session" />
    </div>
  </div>
</template>
