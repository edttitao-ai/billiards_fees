<script setup lang="ts">
import { ArrowLeft, History } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

interface Props {
  title: string
  showBack?: boolean
  showHistory?: boolean
  showGuide?: boolean
}

withDefaults(defineProps<Props>(), {
  showBack: false,
  showHistory: true,
  showGuide: false
})

const router = useRouter()

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
function goHistory() {
  router.push('/history')
}
</script>

<template>
  <header
    class="sticky top-0 z-20 -mx-3 mb-4 flex h-14 items-center gap-2 border-b border-brand-900/5 bg-[#f4f6f7]/90 px-3 backdrop-blur-xl sm:-mx-6 sm:h-16 sm:px-6"
  >
    <button
      v-if="showBack"
      class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-white/80 text-ink-500 transition hover:border-brand-300 hover:text-brand-700"
      aria-label="返回"
      @click="goBack"
    >
      <ArrowLeft :size="18" />
    </button>
    <div
      v-else
      class="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[5px] border-[#f8f3e8] bg-brand-800 shadow-soft ring-1 ring-brand-900/20"
      aria-hidden="true"
    >
      <span class="h-2 w-2 rounded-full bg-accent-300 shadow-[0_0_0_2px_rgba(255,255,255,0.16)]" />
    </div>

    <div class="min-w-0 flex-1">
      <h1 class="truncate font-display text-sm font-bold tracking-[-0.02em] text-ink-900 sm:text-base">
        {{ title }}
      </h1>
      <div class="hidden font-data text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-600 sm:block">
        Billiards split sheet
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-1">
      <button
        v-if="showHistory"
        class="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition hover:bg-white hover:text-brand-700 sm:w-auto sm:gap-1.5 sm:px-2.5"
        aria-label="历史记录"
        @click="goHistory"
      >
        <History :size="17" />
        <span class="hidden text-xs font-medium sm:inline">历史</span>
      </button>
    </div>
  </header>
</template>