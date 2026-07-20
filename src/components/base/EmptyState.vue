<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'

interface Props {
  title?: string
  description?: string
}

withDefaults(defineProps<Props>(), {
  title: '暂无数据',
  description: ''
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 text-center text-ink-400">
    <div class="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink-100">
      <Inbox :size="22" />
    </div>
    <div class="text-sm font-medium text-ink-500">{{ title }}</div>
    <div v-if="description" class="mt-1 text-xs text-ink-400">{{ description }}</div>
    <slot />
  </div>
</template>