<script setup lang="ts">
import clsx from 'clsx'
import { computed } from 'vue'

interface Props {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  highlight?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'md',
  highlight: false
})

const classes = computed(() =>
  clsx(
    'rounded-lg bg-white shadow-card',
    props.padding === 'none' && 'p-0',
    props.padding === 'sm' && 'p-3',
    props.padding === 'md' && 'p-4 sm:p-5',
    props.padding === 'lg' && 'p-5 sm:p-6',
    props.highlight && 'ring-1 ring-brand-100'
  )
)
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>