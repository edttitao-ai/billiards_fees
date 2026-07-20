<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next'
import clsx from 'clsx'

interface Props {
  modelValue: number
  step?: number
  min?: number
  max?: number
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  step: 0.5,
  min: 0,
  max: 24,
  size: 'md'
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: number): void
}>()

function clamp(n: number) {
  return Math.min(props.max, Math.max(props.min, Math.round(n * 2) / 2))
}

function bump(delta: number) {
  emit('update:modelValue', clamp(props.modelValue + delta))
}
</script>

<template>
  <div
    :class="
      clsx(
        'inline-flex items-center',
        size === 'sm' ? 'gap-1.5 text-sm' : 'gap-2 text-base'
      )
    "
  >
    <button
      type="button"
      :class="
        clsx(
          'inline-flex items-center justify-center rounded-md border border-ink-200 bg-white text-ink-500 hover:border-brand-400 hover:text-brand-600 disabled:opacity-40',
          size === 'sm' ? 'h-8 w-8' : 'h-9 w-9'
        )
      "
      :disabled="modelValue <= min"
      @click="bump(-step)"
      aria-label="减少"
    >
      <Minus :size="16" />
    </button>
    <div
      :class="
        clsx(
          'text-center font-semibold tabular-nums text-ink-900',
          size === 'sm' ? 'min-w-[2rem] text-xs' : 'min-w-[3rem] text-base'
        )
      "
    >
      {{ modelValue }}
    </div>
    <button
      type="button"
      :class="
        clsx(
          'inline-flex items-center justify-center rounded-md border border-brand-300 bg-white text-brand-600 hover:bg-brand-50 disabled:opacity-40',
          size === 'sm' ? 'h-8 w-8' : 'h-9 w-9'
        )
      "
      :disabled="modelValue >= max"
      @click="bump(step)"
      aria-label="增加"
    >
      <Plus :size="16" />
    </button>
  </div>
</template>