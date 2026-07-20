<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

interface Props {
  open: boolean
  title?: string
  /** 桌面端最大宽度（class） */
  maxWidthClass?: string
  /**
   * 弹出位置
   * - auto（默认）：>= 768px 居中，< 768px 底部弹出
   * - bottom：始终从底部弹出
   * - center：始终居中
   */
  placement?: 'auto' | 'bottom' | 'center'
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  maxWidthClass: 'sm:max-w-[520px]',
  placement: 'auto'
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

/**
 * 实时检测视口宽度，来源 = window.innerWidth / window.matchMedia('(min-width: 768px)')。
 * 在 SSR/hydration 下用默认值 false，mounted 后立刻同步一次。
 */
const isWideScreen = ref(false)
let mql: MediaQueryList | null = null
function syncWide(e: MediaQueryListEvent | MediaQueryList) {
  isWideScreen.value = e.matches
}
onMounted(() => {
  document.addEventListener('keydown', onKey)
  if (typeof window !== 'undefined') {
    mql = window.matchMedia('(min-width: 768px)')
    isWideScreen.value = mql.matches
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', syncWide)
    } else if (typeof (mql as unknown as {
      addListener?: (cb: (e: MediaQueryListEvent) => void) => void
    }).addListener === 'function') {
      // 兼容老 Safari
      ;(mql as unknown as {
        addListener: (cb: (e: MediaQueryListEvent) => void) => void
      }).addListener(syncWide)
    }
  }
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  lockBody(false)
  if (mql) {
    if (typeof mql.removeEventListener === 'function') {
      mql.removeEventListener('change', syncWide)
    } else if (typeof (mql as unknown as {
      removeListener?: (cb: (e: MediaQueryListEvent) => void) => void
    }).removeListener === 'function') {
      ;(mql as unknown as {
        removeListener: (cb: (e: MediaQueryListEvent) => void) => void
      }).removeListener(syncWide)
    }
    mql = null
  }
})

/** 实际使用的 placement：auto 时按视口推断 */
const effectivePlacement = computed<'bottom' | 'center'>(() => {
  if (props.placement === 'bottom' || props.placement === 'center') {
    return props.placement
  }
  return isWideScreen.value ? 'center' : 'bottom'
})
</script>

<template>
  <Teleport to="body">
    <transition :name="effectivePlacement === 'center' ? 'modal-center' : 'modal'">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex justify-center bg-black/40 backdrop-blur-sm"
        :class="effectivePlacement === 'center' ? 'items-center p-4' : 'items-end sm:items-center sm:p-4'"
        @click.self="close"
      >
        <div
          class="relative flex max-h-[92vh] w-full flex-col overflow-hidden bg-white shadow-soft"
          :class="[
            maxWidthClass,
            effectivePlacement === 'center'
              ? 'rounded-2xl'
              : 'rounded-t-2xl sm:rounded-lg',
            effectivePlacement === 'center' ? '' : 'pb-[env(safe-area-inset-bottom)]'
          ]"
          @click.stop
        >
          <!-- 仅 bottom 模式下显示移动端小把手 -->
          <div
            v-if="effectivePlacement !== 'center'"
            class="mx-auto mt-2 h-1 w-10 rounded-full bg-ink-200 sm:hidden"
          />

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
  </Teleport>
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

/* center 模式：缩放淡入 */
.modal-center-enter-active,
.modal-center-leave-active {
  transition: opacity 0.18s ease;
}
.modal-center-enter-from,
.modal-center-leave-to {
  opacity: 0;
}
.modal-center-enter-active > div,
.modal-center-leave-active > div {
  transition: transform 0.18s ease;
}
.modal-center-enter-from > div,
.modal-center-leave-to > div {
  transform: translateY(8px) scale(0.98);
}
</style>