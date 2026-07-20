<script setup lang="ts">
import clsx from 'clsx'
import { computed } from 'vue'

interface Props {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  highlight?: boolean
  variant?: 'default' | 'soft' | 'felt'
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'md',
  highlight: false,
  variant: 'default'
})

const classes = computed(() =>
  clsx(
    'relative rounded-[20px] border transition-shadow duration-200',
    props.variant === 'default' && 'border-ink-200/80 bg-[#fffefb] shadow-card',
    props.variant === 'soft' && 'border-brand-100 bg-brand-50/80',
    props.variant === 'felt' && 'overflow-hidden border-brand-700 bg-brand-800 text-white shadow-felt',
    props.padding === 'none' && 'p-0',
    props.padding === 'sm' && 'p-3',
    props.padding === 'md' && 'p-4 sm:p-5',
    props.padding === 'lg' && 'p-5 sm:p-6',
    props.highlight && 'ring-1 ring-accent-300/70'
  )
)
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
