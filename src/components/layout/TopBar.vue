<script setup lang="ts">
import { ArrowLeft, HelpCircle, History } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import DataIOActions from '@/components/layout/DataIOActions.vue'

interface Props {
  title: string
  showBack?: boolean
  showHistory?: boolean
  showGuide?: boolean
}

withDefaults(defineProps<Props>(), {
  showBack: false,
  showHistory: true,
  showGuide: true
})

const router = useRouter()

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
function goGuide() {
  router.push('/guide')
}
function goHistory() {
  router.push('/history')
}
</script>

<template>
  <header
    class="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between gap-2 bg-white/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"
  >
    <button
      v-if="showBack"
      class="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100"
      aria-label="返回"
      @click="goBack"
    >
      <ArrowLeft :size="20" />
    </button>
    <div v-else class="w-9" />

    <h1 class="truncate text-base font-semibold text-ink-900 sm:text-lg">{{ title }}</h1>

    <div class="flex items-center gap-1">
      <DataIOActions />
      <button
        v-if="showGuide"
        class="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-ink-500 hover:bg-ink-100 sm:text-sm"
        @click="goGuide"
      >
        <HelpCircle :size="16" />
        <span class="hidden sm:inline">使用说明</span>
      </button>
      <button
        v-if="showHistory"
        class="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-ink-500 hover:bg-ink-100 sm:text-sm"
        @click="goHistory"
      >
        <History :size="16" />
        <span class="hidden sm:inline">历史记录</span>
      </button>
    </div>
  </header>
</template>
