<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ChevronDown, Check } from 'lucide-vue-next'
import clsx from 'clsx'

interface Option {
  label: string
  value: string | number
  description?: string
  selected?: boolean
}

interface Props {
  modelValue: string | number
  options: Option[]
  placeholder?: string
  disabled?: boolean
  showCheck?: boolean
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择',
  disabled: false,
  showCheck: true,
  size: 'md'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', value: string | number): void
}>()

const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const current = computed(
  () => props.options.find((option) => option.value === props.modelValue) ?? null
)

function toggle() {
  if (props.disabled) return
  open.value = !open.value
}

function pick(option: Option) {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  open.value = false
  triggerRef.value?.focus()
}

function onDocClick(event: MouseEvent) {
  if (!open.value) return
  const target = event.target as Node
  if (triggerRef.value?.contains(target)) return
  if (panelRef.value?.contains(target)) return
  open.value = false
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

watch(open, async (value) => {
  if (value) {
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    await nextTick()
  } else {
    document.removeEventListener('click', onDocClick)
    document.removeEventListener('keydown', onKey)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="relative">
    <button
      ref="triggerRef"
      type="button"
      :disabled="disabled"
      :class="
        clsx(
          'inline-flex w-full items-center justify-between gap-1.5 rounded-[10px] border bg-[#fffefb] text-ink-900 transition-all',
          'focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100',
          'disabled:cursor-not-allowed disabled:opacity-50',
          size === 'sm' ? 'h-9 px-2.5 text-sm' : 'h-10 px-3 text-sm',
          open
            ? 'border-brand-400 ring-2 ring-brand-100'
            : 'border-ink-200 hover:border-brand-300'
        )
      "
      @click="toggle"
    >
      <span :class="clsx('truncate font-medium', !current && 'text-ink-400')">
        {{ current ? current.label : placeholder }}
      </span>
      <ChevronDown
        :size="15"
        :class="clsx('shrink-0 text-ink-400 transition-transform', open && 'rotate-180 text-brand-700')"
      />
    </button>

    <transition name="picker">
      <div
        v-if="open"
        ref="panelRef"
        class="fixed inset-x-2 bottom-2 z-50 mx-auto w-auto max-w-[420px] rounded-2xl border border-ink-200 bg-[#fffefb] p-2 shadow-floating sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:mt-1.5 sm:w-full sm:min-w-56"
        style="padding-bottom: max(10px, env(safe-area-inset-bottom))"
      >
        <div class="mx-auto mb-2 mt-0.5 h-1 w-9 rounded-full bg-ink-200 sm:hidden" />
        <ul class="max-h-[60vh] overflow-y-auto sm:max-h-[280px]">
          <li
            v-for="option in options"
            :key="option.value"
            :class="
              clsx(
                'flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-brand-50',
                option.value === modelValue && 'bg-brand-50'
              )
            "
            @click="pick(option)"
          >
            <div class="min-w-0 flex-1">
              <div
                :class="clsx('truncate font-semibold', option.value === modelValue ? 'text-brand-800' : 'text-ink-900')"
              >
                {{ option.label }}
              </div>
              <div v-if="option.description" class="mt-0.5 truncate text-xs text-ink-400">
                {{ option.description }}
              </div>
            </div>
            <span
              v-if="showCheck && option.value === modelValue"
              class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white"
            >
              <Check :size="13" />
            </span>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.picker-enter-active,
.picker-leave-active {
  transition: transform 0.18s ease, opacity 0.16s ease;
}
.picker-enter-from,
.picker-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.99);
}
@media (max-width: 640px) {
  .picker-enter-from,
  .picker-leave-to {
    transform: translateY(100%);
  }
}
</style>
