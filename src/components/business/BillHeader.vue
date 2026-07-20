<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Pencil, Check, X, ReceiptText } from 'lucide-vue-next'
import AppCard from '@/components/base/AppCard.vue'
import { useSessionStore } from '@/stores/session'
import { useUIStore } from '@/stores/ui'

const session = useSessionStore()
const ui = useUIStore()

const editing = ref(false)
const titleInput = ref(session.title)

watch(
  () => session.title,
  () => {
    if (!editing.value) titleInput.value = session.title
  }
)

function enterEdit() {
  titleInput.value = session.title
  editing.value = true
}
function cancel() {
  editing.value = false
}
function save() {
  session.setTitle(titleInput.value)
  editing.value = false
  ui.showToast('已更新账单标题', 'success')
}
</script>

<template>
  <AppCard>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 text-ink-900">
        <ReceiptText :size="18" class="text-brand-600" />
        <input
          v-if="editing"
          v-model="titleInput"
          class="h-9 w-full rounded-md border border-ink-200 bg-white px-3 text-base font-semibold focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          placeholder="例如：A台周二晚"
        />
        <span v-else class="text-lg font-semibold">{{ session.title }}</span>
      </div>
      <button
        v-if="!editing"
        class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-brand-600 hover:bg-brand-50"
        @click="enterEdit"
      >
        <Pencil :size="14" />
        改名
      </button>
      <div v-else class="flex items-center gap-1">
        <button
          class="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100"
          aria-label="取消"
          @click="cancel"
        >
          <X :size="16" />
        </button>
        <button
          class="inline-flex h-8 w-8 items-center justify-center rounded-md text-brand-600 hover:bg-brand-50"
          aria-label="保存"
          @click="save"
        >
          <Check :size="16" />
        </button>
      </div>
    </div>
  </AppCard>
</template>