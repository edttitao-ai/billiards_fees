<script setup lang="ts">
interface Props {
  label: string
  hint?: string
  align?: 'top' | 'middle' | 'bottom'
}

withDefaults(defineProps<Props>(), {
  align: 'middle'
})
</script>

<template>
  <div class="flex flex-col">
    <div class="text-sm text-ink-500 mb-1.5">{{ label }}</div>
    <slot />
    <div v-if="hint" class="mt-1.5 text-xs text-ink-400">{{ hint }}</div>
  </div>
</template>