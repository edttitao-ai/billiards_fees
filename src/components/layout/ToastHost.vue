<script setup lang="ts">
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-vue-next'
import clsx from 'clsx'
import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'

const ui = useUIStore()
const t = computed(() => ui.toast)
const icon = computed(() => {
  switch (t.value?.type) {
    case 'success':
      return CheckCircle2
    case 'warn':
      return AlertTriangle
    case 'error':
      return XCircle
    default:
      return Info
  }
})
const toneClass = computed(() => {
  switch (t.value?.type) {
    case 'success':
      return 'bg-brand-600 text-white'
    case 'warn':
      return 'bg-warn-500 text-white'
    case 'error':
      return 'bg-danger-500 text-white'
    default:
      return 'bg-ink-900 text-white'
  }
})
</script>

<template>
  <transition name="toast">
    <div
      v-if="t"
      class="pointer-events-none fixed inset-x-0 top-16 z-[60] flex justify-center px-4 sm:top-20"
    >
      <div
        :class="clsx('pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 shadow-soft', toneClass)"
      >
        <component :is="icon" :size="16" />
        <span class="text-sm">{{ t.text }}</span>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.18s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>