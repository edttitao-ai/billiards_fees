<script setup lang="ts">
import clsx from 'clsx'
import { computed } from 'vue'

interface Props {
  label: string
  value: string
  unit?: string
  highlight?: boolean
  tone?: 'default' | 'brand' | 'warn' | 'danger'
  size?: 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  highlight: false,
  tone: 'default',
  size: 'md'
})

const valueClass = computed(() =>
  clsx(
    'data-number font-bold',
    props.size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-xl',
    props.tone === 'brand' && 'text-brand-700',
    props.tone === 'warn' && 'text-warn-500',
    props.tone === 'danger' && 'text-danger-500',
    props.tone === 'default' && 'text-ink-900'
  )
)
</script>

<template>
  <div
    :class="
      clsx(
        'rounded-xl border px-3 py-3 text-left',
        highlight
          ? 'border-accent-200 bg-accent-50'
          : 'border-ink-100 bg-ink-50/80'
      )
    "
  >
    <div class="text-[11px] font-medium tracking-wide text-ink-500">{{ label }}</div>
    <div :class="valueClass" class="mt-1">
      {{ value }}<span v-if="unit" class="ml-1 text-xs font-normal text-ink-400">{{ unit }}</span>
    </div>
  </div>
</template>
