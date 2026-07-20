<script setup lang="ts">
import clsx from 'clsx'
import { computed } from 'vue'

interface Props {
  label: string
  value: string
  unit?: string
  highlight?: boolean
  tone?: 'default' | 'brand' | 'warn' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  highlight: false,
  tone: 'default'
})

const valueClass = computed(() =>
  clsx(
    'text-xl font-bold tabular-nums',
    props.tone === 'brand' && 'text-brand-600',
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
        'rounded-md px-3 py-2.5 text-left',
        highlight ? 'bg-brand-50 ring-1 ring-brand-100' : 'bg-ink-50'
      )
    "
  >
    <div class="text-xs text-ink-500">{{ label }}</div>
    <div :class="valueClass" class="mt-1">
      {{ value }}<span v-if="unit" class="ml-0.5 text-sm font-normal text-ink-400">{{ unit }}</span>
    </div>
  </div>
</template>