<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  name: string
  id?: number
  size?: number
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 36,
  editable: false
})

// 6 种内置配色 + 首字母 fallback
const palette = [
  { bg: '#FEF3C7', fg: '#B45309' },
  { bg: '#DBEAFE', fg: '#1D4ED8' },
  { bg: '#DCFCE7', fg: '#15803D' },
  { bg: '#FCE7F3', fg: '#BE185D' },
  { bg: '#E0E7FF', fg: '#4338CA' },
  { bg: '#FFE4E6', fg: '#BE123C' }
]

const color = computed(() => {
  const id = ((props.id ?? hash(props.name)) % palette.length + palette.length) % palette.length
  return palette[id]
})

const initial = computed(() => (props.name || '?').trim().slice(0, 1))

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}
</script>

<template>
  <div
    class="inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
    :style="{
      width: size + 'px',
      height: size + 'px',
      background: color.bg,
      color: color.fg,
      fontSize: Math.round(size * 0.45) + 'px'
    }"
    :aria-label="name"
  >
    <template v-if="editable">✎</template>
    <template v-else>{{ initial }}</template>
  </div>
</template>