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
  /** 选中态是否展示对勾 */
  showCheck?: boolean
  /** 触发器尺寸 */
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择',
  disabled: false,
  showCheck: true,
  size: 'md'
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | number): void
  (e: 'change', v: string | number): void
}>()

const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const current = computed(
  () => props.options.find((o) => o.value === props.modelValue) ?? null
)

function toggle() {
  if (props.disabled) return
  open.value = !open.value
}

function pick(opt: Option) {
  emit('update:modelValue', opt.value)
  emit('change', opt.value)
  open.value = false
  triggerRef.value?.focus()
}

function onDocClick(e: MouseEvent) {
  if (!open.value) return
  const t = e.target as Node
  if (triggerRef.value?.contains(t)) return
  if (panelRef.value?.contains(t)) return
  open.value = false
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

watch(open, async (v) => {
  if (v) {
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
          'inline-flex w-full items-center justify-between gap-1.5 rounded-md border bg-white text-ink-900 transition-colors',
          'focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100',
          'disabled:cursor-not-allowed disabled:opacity-50',
          size === 'sm' ? 'h-8 px-2.5 text-sm' : 'h-10 px-3 text-sm',
          open ? 'border-brand-400 ring-2 ring-brand-100' : 'border-ink-200 hover:border-ink-300'
        )
      "
      @click="toggle"
    >
      <span :class="clsx('truncate', !current && 'text-ink-400')">
        {{ current ? current.label : placeholder }}
      </span>
      <ChevronDown
        :size="16"
        :class="clsx('shrink-0 text-ink-400 transition-transform', open && 'rotate-180 text-brand-600')"
      />
    </button>

    <transition name="picker">
      <div
        v-if="open"
        ref="panelRef"
        class="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[420px] rounded-t-2xl bg-white p-2 shadow-soft sm:absolute sm:bottom-auto sm:left-0 sm:top-full sm:mt-1.5 sm:rounded-lg sm:p-1.5"
        style="padding-bottom: max(12px, env(safe-area-inset-bottom))"
      >
        <!-- 移动端小把手 -->
        <div class="mx-auto mb-2 mt-1 h-1 w-10 rounded-full bg-ink-200 sm:hidden" />
        <ul class="max-h-[60vh] overflow-y-auto sm:max-h-[280px]">
          <li
            v-for="opt in options"
            :key="opt.value"
            :class="
              clsx(
                'flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm transition-colors',
                'hover:bg-brand-50',
                opt.value === modelValue && 'bg-brand-50'
              )
            "
            @click="pick(opt)"
          >
            <div class="min-w-0 flex-1">
              <div
                :class="
                  clsx(
                    'truncate font-medium',
                    opt.value === modelValue ? 'text-brand-700' : 'text-ink-900'
                  )
                "
              >
                {{ opt.label }}
              </div>
              <div v-if="opt.description" class="mt-0.5 truncate text-xs text-ink-400">
                {{ opt.description }}
              </div>
            </div>
            <Check
              v-if="showCheck && opt.value === modelValue"
              :size="16"
              class="shrink-0 text-brand-600"
            />
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
  transform: translateY(8px);
}
@media (max-width: 640px) {
  .picker-enter-from,
  .picker-leave-to {
    transform: translateY(100%);
  }
}
</style>