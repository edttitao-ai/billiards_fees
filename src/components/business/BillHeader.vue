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
const packageCount = computed(() => session.packages.reduce((sum, item) => sum + item.qty, 0))

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
  <AppCard variant="felt" padding="none">
    <div class="pointer-events-none absolute inset-2 rounded-[15px] border border-white/10">
      <span class="absolute left-[22%] top-[-3px] h-1.5 w-1.5 rotate-45 bg-accent-300/70" />
      <span class="absolute right-[22%] top-[-3px] h-1.5 w-1.5 rotate-45 bg-accent-300/70" />
      <span class="absolute bottom-[-3px] left-[22%] h-1.5 w-1.5 rotate-45 bg-accent-300/70" />
      <span class="absolute bottom-[-3px] right-[22%] h-1.5 w-1.5 rotate-45 bg-accent-300/70" />
    </div>

    <div class="relative p-5 sm:p-7">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <div class="mb-2 flex items-center gap-2 font-data text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-300">
            <ReceiptText :size="14" />
            当前记分单
          </div>
          <input
            v-if="editing"
            v-model="titleInput"
            class="h-11 w-full max-w-xl rounded-xl border border-white/20 bg-white/10 px-3 font-display text-xl font-bold text-white placeholder:text-white/40 focus:border-accent-300 focus:outline-none focus:ring-2 focus:ring-accent-300/20"
            placeholder="例如：A 台周二晚"
            autofocus
            @keyup.enter="save"
            @keyup.esc="cancel"
          />
          <h2 v-else class="truncate font-display text-2xl font-bold tracking-[-0.035em] text-white sm:text-3xl">
            {{ session.title }}
          </h2>

          <div class="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-medium text-white/68">
            <span class="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1">
              {{ packageCount }} 张套餐
            </span>
            <span class="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1">
              {{ session.tableCount }} 桌
            </span>
            <span class="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1">
              {{ session.participants.length }} 位球友
            </span>
          </div>
        </div>

        <button
          v-if="!editing"
          class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-3 text-xs font-semibold text-white/80 transition hover:border-accent-300/60 hover:bg-white/[0.14] hover:text-white"
          @click="enterEdit"
        >
          <Pencil :size="13" />
          <span class="hidden sm:inline">修改名称</span>
        </button>
        <div v-else class="flex shrink-0 items-center gap-1">
          <button
            class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
            aria-label="取消"
            @click="cancel"
          >
            <X :size="16" />
          </button>
          <button
            class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent-300 text-brand-900 hover:bg-accent-200"
            aria-label="保存"
            @click="save"
          >
            <Check :size="16" />
          </button>
        </div>
      </div>
    </div>
  </AppCard>
</template>
