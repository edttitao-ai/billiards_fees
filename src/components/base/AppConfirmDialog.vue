<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, Info } from 'lucide-vue-next'
import AppModal from '@/components/base/AppModal.vue'
import AppButton from '@/components/base/AppButton.vue'
import { useUIStore } from '@/stores/ui'

const ui = useUIStore()

const open = computed({
  get: () => ui.confirmReq != null,
  set: (v: boolean) => {
    if (!v) ui.resolveConfirm(false)
  }
})

const titleText = computed(() => ui.confirmReq?.title ?? '')
const message = computed(() => ui.confirmReq?.message ?? '')
const confirmText = computed(() => ui.confirmReq?.confirmText ?? '确定')
const cancelText = computed(() => ui.confirmReq?.cancelText ?? '取消')
const tone = computed(() => ui.confirmReq?.tone ?? 'primary')

function onConfirm() {
  ui.resolveConfirm(true)
}
function onCancel() {
  ui.resolveConfirm(false)
}
</script>

<template>
  <AppModal
    :open="open"
    :title="titleText"
    max-width-class="sm:max-w-[420px]"
    @update:open="(v) => (open = v)"
  >
    <div class="flex items-start gap-3 px-5 py-5">
      <div
        :class="
          tone === 'danger'
            ? 'bg-danger-500/10 text-danger-500'
            : 'bg-brand-500/10 text-brand-600'
        "
        class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
      >
        <AlertTriangle v-if="tone === 'danger'" :size="20" />
        <Info v-else :size="20" />
      </div>
      <p
        v-if="message"
        class="whitespace-pre-line text-sm leading-relaxed text-ink-700"
      >
        {{ message }}
      </p>
    </div>

    <template #footer>
      <button
        class="inline-flex h-9 items-center rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-700 hover:bg-ink-50"
        @click="onCancel"
      >
        {{ cancelText }}
      </button>
      <AppButton
        :variant="tone === 'danger' ? 'danger' : 'primary'"
        size="sm"
        @click="onConfirm"
      >
        {{ confirmText }}
      </AppButton>
    </template>
  </AppModal>
</template>