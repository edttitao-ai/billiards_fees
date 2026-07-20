<script setup lang="ts">
import clsx from 'clsx'
import { computed, useAttrs } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  block: false,
  disabled: false,
  loading: false,
  type: 'button'
})

defineEmits<{
  (e: 'click', evt: MouseEvent): void
}>()

const attrs = useAttrs()

const classes = computed(() =>
  clsx(
    'inline-flex select-none items-center justify-center gap-1.5 rounded-[11px] font-semibold transition-all duration-150',
    'active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:active:translate-y-0',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2',
    props.block && 'w-full',
    props.size === 'sm' && 'h-8 px-3 text-sm',
    props.size === 'md' && 'h-10 px-4 text-sm',
    props.size === 'lg' && 'h-12 px-5 text-base',
    props.variant === 'primary' &&
      'border border-brand-700 bg-brand-700 text-white shadow-soft hover:border-brand-800 hover:bg-brand-800',
    props.variant === 'secondary' &&
      'border border-ink-200 bg-[#fffefb] text-ink-700 shadow-[0_1px_1px_rgba(24,33,29,0.03)] hover:border-brand-300 hover:text-brand-700',
    props.variant === 'ghost' &&
      'border border-transparent bg-transparent text-ink-500 hover:bg-brand-50 hover:text-brand-700',
    props.variant === 'danger' &&
      'border border-danger-500/35 bg-[#fffefb] text-danger-500 hover:bg-red-50',
    (attrs.class as string | undefined) ?? ''
  )
)
</script>

<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span
      v-if="loading"
      class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
    <slot />
  </button>
</template>
