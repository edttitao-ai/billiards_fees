<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Minus, Plus, Square, Info } from 'lucide-vue-next'
import AppCard from '@/components/base/AppCard.vue'
import { useSessionStore } from '@/stores/session'
import { formatNumber } from '@/utils/format'

const session = useSessionStore()

const totalDuration = computed(() => session.totalDuration)
const tableCount = computed(() => session.tableCount)
const tableDuration = computed(() => session.tableDuration)
const tableManual = computed(() => !!session.tableManual)
const totalTables = computed(() =>
  session.packages.reduce((s, p) => s + (p.qty || 0), 0)
)

// 显式管理输入框显示值（避免 number input 程序性 value 写入失灵）
const inputDisplay = ref<number>(tableCount.value)
watch(tableCount, async (v) => {
  // store 真值变了 → 同步给 input
  inputDisplay.value = v
  // nextTick 保险：将 input 显示也写一次
  await nextTick()
  inputDisplay.value = v
})

function inc() {
  set(tableCount.value + 1)
}
function dec() {
  if (tableCount.value <= 1) return
  set(tableCount.value - 1)
}
function set(v: number) {
  session.setTableCount(v, { fromUser: true })
}
function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1) return // 不合法的输入就忽略
  // 立即更新 store；watcher 会再 sync 回 inputDisplay
  set(n)
}

function resetLink() {
  session.tableManual = false
  session.setTableCount(totalTables.value || 1)
}
</script>

<template>
  <AppCard>
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex min-w-0 flex-1 items-center gap-2 text-ink-900">
        <span
          class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700"
        >
          <Square :size="14" />
        </span>
        <span class="truncate font-semibold">台球桌</span>
        <span class="shrink-0 text-xs text-ink-400">共 {{ tableCount }} 桌</span>
      </div>

      <div class="flex shrink-0 items-center gap-1.5">
        <div class="inline-flex items-center rounded-md border border-ink-200">
          <button
            type="button"
            class="h-9 w-8 text-ink-500 hover:bg-ink-100 disabled:opacity-40"
            :disabled="tableCount <= 1"
            aria-label="减少"
            @click="dec"
          >
            <Minus :size="14" class="mx-auto" />
          </button>
          <input
            type="number"
            min="1"
            step="1"
            v-model.number="inputDisplay"
            class="num-input h-9 w-12 border-x border-ink-200 bg-white text-center text-sm tabular-nums focus:outline-none"
            @input="onInput"
          />
          <button
            type="button"
            class="h-9 w-8 text-ink-500 hover:bg-ink-100"
            aria-label="增加"
            @click="inc"
          >
            <Plus :size="14" class="mx-auto" />
          </button>
        </div>
        <span class="shrink-0 text-xs text-ink-500">桌</span>
      </div>
    </div>

    <!-- 公式条 -->
    <div class="mt-3 rounded-md bg-brand-50/60 px-3 py-2 text-xs text-ink-700">
      <div class="flex flex-wrap items-center gap-1.5">
        <span class="text-ink-500">总时长</span>
        <span class="font-semibold text-ink-900 tabular-nums">
          {{ formatNumber(totalDuration, 1) }} h
        </span>
        <span class="text-ink-400">÷</span>
        <span class="font-semibold text-ink-900 tabular-nums">
          {{ tableCount }} 桌
        </span>
        <span class="text-ink-400">=</span>
        <span class="font-semibold text-brand-600 tabular-nums">
          每桌 {{ formatNumber(tableDuration, 1) }} h
        </span>
      </div>
      <div class="mt-1.5 flex items-start gap-1.5 text-[11px] text-ink-500">
        <Info :size="12" class="mt-0.5 shrink-0 text-ink-400" />
        <span>
          调整桌数或套餐张数时，所有参与人员的时长会同步更新为「每桌时长」。
          {{
            tableManual
              ? '已手动锁定桌数；套餐张数不再自动改桌数。'
              : `当前套餐合计 ${totalTables} 张，自动同步桌数。`
          }}
        </span>
      </div>
      <button
        v-if="tableManual"
        type="button"
        class="mt-1.5 inline-flex h-7 items-center rounded-md border border-brand-300 px-2 text-xs text-brand-600 hover:bg-brand-50"
        @click="resetLink"
      >
        重新让套餐联动桌数
      </button>
    </div>
  </AppCard>
</template>