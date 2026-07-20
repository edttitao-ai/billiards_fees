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
    'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors select-none',
    'active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
    props.block && 'w-full',
    props.size === 'sm' && 'h-8 px-3 text-sm',
    props.size === 'md' && 'h-10 px-4 text-sm',
    props.size === 'lg' && 'h-12 px-5 text-base',
    props.variant === 'primary' && 'bg-brand-500 text-white hover:bg-brand-600 shadow-soft',
    props.variant === 'secondary' &&
      'bg-white text-ink-700 border border-ink-200 hover:border-brand-300 hover:text-brand-600',
    props.variant === 'ghost' && 'bg-transparent text-ink-500 hover:text-brand-600 hover:bg-brand-50',
    props.variant === 'danger' && 'bg-white text-danger-500 border border-danger-500/40 hover:bg-red-50',
    // 透传外部 class，方便个别位置覆盖尺寸/字号
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
