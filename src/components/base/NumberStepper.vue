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
  (e: 'update:modelValue', value: number): void
}>()

function clamp(value: number) {
  return Math.min(props.max, Math.max(props.min, Math.round(value * 2) / 2))
}

function bump(delta: number) {
  emit('update:modelValue', clamp(props.modelValue + delta))
}
</script>

<template>
  <div class="inline-flex items-center overflow-hidden rounded-[10px] border border-ink-200 bg-[#fffefb] shadow-[0_1px_1px_rgba(24,33,29,0.03)]">
    <button
      type="button"
      :class="clsx('inline-flex items-center justify-center border-r border-ink-100 text-ink-500 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-35', size === 'sm' ? 'h-8 w-7' : 'h-9 w-9')"
      :disabled="modelValue <= min"
      aria-label="减少"
      @click="bump(-step)"
    >
      <Minus :size="13" />
    </button>
    <div
      :class="clsx('data-number text-center font-bold text-ink-900', size === 'sm' ? 'min-w-[30px] text-xs' : 'min-w-[46px] text-sm')"
    >
      {{ modelValue }}
    </div>
    <button
      type="button"
      :class="clsx('inline-flex items-center justify-center border-l border-ink-100 text-brand-700 hover:bg-brand-50 disabled:opacity-35', size === 'sm' ? 'h-8 w-7' : 'h-9 w-9')"
      :disabled="modelValue >= max"
      aria-label="增加"
      @click="bump(step)"
    >
      <Plus :size="13" />
    </button>
  </div>
</template>
