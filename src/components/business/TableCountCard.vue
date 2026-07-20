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
  session.packages.reduce((sum, item) => sum + (item.qty || 0), 0)
)

const inputDisplay = ref<number>(tableCount.value)
watch(tableCount, async (value) => {
  inputDisplay.value = value
  await nextTick()
  inputDisplay.value = value
})

function inc() {
  set(tableCount.value + 1)
}
function dec() {
  if (tableCount.value <= 1) return
  set(tableCount.value - 1)
}
function set(value: number) {
  session.setTableCount(value, { fromUser: true })
}
function onInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 1) return
  set(value)
}
function resetLink() {
  session.tableManual = false
  session.setTableCount(totalTables.value || 1)
}
</script>

<template>
  <AppCard class="h-full">
    <div class="mb-4">
      <div class="section-kicker">Table setup</div>
      <div class="mt-0.5 flex items-center gap-2">
        <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
          <Square :size="13" />
        </span>
        <h2 class="section-title">球桌设置</h2>
      </div>
    </div>

    <div class="rounded-2xl border border-brand-100 bg-brand-50/70 p-3.5">
      <div class="flex items-end justify-between gap-3">
        <div>
          <div class="text-[11px] font-medium text-ink-500">当前使用</div>
          <div class="mt-1 data-number text-2xl font-bold text-brand-800">
            {{ tableCount }}<span class="ml-1 text-sm font-medium text-brand-600">桌</span>
          </div>
        </div>

        <div class="inline-flex items-center overflow-hidden rounded-xl border border-brand-200 bg-[#fffefb] shadow-sm">
          <button
            type="button"
            class="inline-flex h-10 w-9 items-center justify-center border-r border-brand-100 text-ink-500 hover:bg-brand-50 disabled:opacity-35"
            :disabled="tableCount <= 1"
            aria-label="减少"
            @click="dec"
          >
            <Minus :size="14" />
          </button>
          <input
            v-model.number="inputDisplay"
            type="number"
            min="1"
            step="1"
            class="num-input h-10 w-11 bg-transparent text-center font-data text-sm font-bold tabular-nums text-ink-900 focus:outline-none"
            @input="onInput"
          />
          <button
            type="button"
            class="inline-flex h-10 w-9 items-center justify-center border-l border-brand-100 text-brand-700 hover:bg-brand-50"
            aria-label="增加"
            @click="inc"
          >
            <Plus :size="14" />
          </button>
        </div>
      </div>

      <div class="my-3 h-px bg-brand-100" />
      <div class="flex flex-wrap items-center gap-1.5 text-xs">
        <span class="text-ink-500">{{ formatNumber(totalDuration, 1) }} h</span>
        <span class="text-ink-300">÷</span>
        <span class="text-ink-500">{{ tableCount }} 桌</span>
        <span class="text-ink-300">=</span>
        <span class="font-semibold text-brand-700">每桌 {{ formatNumber(tableDuration, 1) }} h</span>
      </div>
    </div>

    <div class="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-ink-500">
      <Info :size="13" class="mt-0.5 shrink-0 text-brand-500" />
      <span>
        {{
          tableManual
            ? '桌数已手动锁定，套餐张数不会再自动修改桌数。'
            : `当前套餐共 ${totalTables} 张，桌数会自动同步。`
        }}
      </span>
    </div>
    <button
      v-if="tableManual"
      type="button"
      class="mt-3 inline-flex h-8 items-center rounded-lg border border-brand-200 px-2.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
      @click="resetLink"
    >
      恢复套餐联动
    </button>
  </AppCard>
</template>
