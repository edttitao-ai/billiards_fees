<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { X } from 'lucide-vue-next'

interface Props {
  open: boolean
  title?: string
  /** 桌面端最大宽度（class） */
  maxWidthClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  maxWidthClass: 'sm:max-w-[520px]'
})

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'close'): void
}>()

function close() {
  emit('update:open', false)
  emit('close')
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) close()
}

function lockBody(lock: boolean) {
  if (typeof document === 'undefined') return
  document.body.style.overflow = lock ? 'hidden' : ''
}

watch(
  () => props.open,
  (v) => lockBody(v)
)

onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  lockBody(false)
})
</script>

<template>
  <transition name="modal">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4"
      @click.self="close"
    >
      <div
        class="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-soft sm:rounded-lg"
        :class="maxWidthClass"
        style="padding-bottom: env(safe-area-inset-bottom)"
        @click.stop
      >
        <!-- 移动端小把手 -->
        <div class="mx-auto mt-2 h-1 w-10 rounded-full bg-ink-200 sm:hidden" />

        <header
          v-if="title"
          class="flex items-center justify-between border-b border-ink-100 px-5 py-3"
        >
          <h3 class="text-base font-semibold text-ink-900">{{ title }}</h3>
          <button
            class="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-400 hover:bg-ink-100"
            aria-label="关闭"
            @click="close"
          >
            <X :size="18" />
          </button>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <slot />
        </div>

        <footer
          v-if="$slots.footer"
          class="flex items-center justify-end gap-2 border-t border-ink-100 bg-ink-50/60 px-5 py-3"
        >
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.18s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.22s ease;
}
.modal-enter-from > div,
.modal-leave-to > div {
  transform: translateY(20px);
}
@media (max-width: 640px) {
  .modal-enter-from > div,
  .modal-leave-to > div {
    transform: translateY(100%);
  }
}
</style>