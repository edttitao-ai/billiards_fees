<script setup lang="ts">
import { computed } from 'vue'
import { Tickets, Plus, Trash2, Minus } from 'lucide-vue-next'
import AppCard from '@/components/base/AppCard.vue'
import AppPicker from '@/components/base/AppPicker.vue'
import AppButton from '@/components/base/AppButton.vue'
import NumberStepper from '@/components/base/NumberStepper.vue'
import { PACKAGE_TEMPLATES, useSessionStore } from '@/stores/session'
import { useUIStore } from '@/stores/ui'
import { packageHours, packageSubtotal } from '@/utils/calc'
import { formatCurrency } from '@/utils/format'

const session = useSessionStore()
const ui = useUIStore()
const packages = computed(() => session.packages)

/** 模板 + 自定义 的下拉选项 */
const templateOptions = computed(() => [
  ...PACKAGE_TEMPLATES.map((t, i) => ({
    value: `tpl-${i}`,
    label: t.name,
    description: `${t.hours} 小时 · ¥${t.price}/张`
  })),
  { value: 'custom', label: '自定义套餐', description: '自己填时长与单价' }
])

function currentTplValue(pkg: { name: string; hours: number; price: number }): string {
  const idx = PACKAGE_TEMPLATES.findIndex(
    (t) => t.name === pkg.name && t.hours === pkg.hours && t.price === pkg.price
  )
  return idx >= 0 ? `tpl-${idx}` : 'custom'
}

function onTemplateChange(id: string, v: string | number) {
  const s = String(v)
  if (s === 'custom') {
    session.setPackageName(id, '自定义套餐')
    session.setPackageHours(id, 1)
    session.setPackagePrice(id, 60)
  } else if (s.startsWith('tpl-')) {
    session.applyPackageTemplate(id, Number(s.slice(4)))
  }
}

function addPackage() {
  session.addPackage()
  ui.showToast('已添加套餐，总台费已重新计算', 'success')
}

async function removePackage(id: string, name: string) {
  if (session.packages.length <= 1) {
    ui.showToast('至少保留一个套餐', 'warn')
    return
  }
  const ok = await ui.confirm({
    title: '删除套餐',
    message: `确认删除套餐「${name}」？删除后总台费会自动重算。`,
    confirmText: '删除',
    tone: 'danger'
  })
  if (!ok) return
  session.removePackage(id)
  ui.showToast(`已删除 ${name}，总台费已重新计算`, 'success')
}
</script>

<template>
  <AppCard>
    <div class="mb-3 flex items-center justify-between">
      <div class="flex items-center gap-2 text-ink-900">
        <Tickets :size="18" class="text-brand-600" />
        <span class="font-semibold">套餐列表</span>
        <span class="text-xs text-ink-400">({{ packages.length }} 项)</span>
      </div>
      <AppButton variant="primary" size="sm" @click="addPackage">
        <Plus :size="14" />
        添加套餐
      </AppButton>
    </div>

    <!-- PC 表头 -->
    <div
      class="hidden grid-cols-[1fr_72px_92px_auto_100px_36px] items-center gap-2 px-1 pb-2 text-xs text-ink-400 sm:grid"
    >
      <div>套餐</div>
      <div class="text-center">时长(h)</div>
      <div class="text-center">单价(¥/张)</div>
      <div class="text-center">张数</div>
      <div class="text-right pr-1">小计</div>
      <div></div>
    </div>

    <ul v-if="packages.length" class="divide-y divide-ink-100">
      <!-- 移动端：竖排卡片；PC 端：6 列表格 -->
      <li
        v-for="pkg in packages"
        :key="pkg.id"
        class="space-y-2 px-1 py-3 sm:space-y-0 sm:grid sm:grid-cols-[1fr_72px_92px_auto_100px_36px] sm:items-center sm:gap-2"
      >
        <!-- 套餐选择（移动端 / PC 端共占第 1 列） -->
        <div class="flex items-center min-w-0">
          <span
            class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 sm:hidden"
          >
            <Tickets :size="14" />
          </span>
          <div class="ml-2 min-w-0 flex-1 sm:ml-0">
            <AppPicker
              :model-value="currentTplValue(pkg)"
              :options="templateOptions"
              size="sm"
              @change="(v) => onTemplateChange(pkg.id, v)"
            />
            <input
              v-if="currentTplValue(pkg) === 'custom'"
              :value="pkg.name"
              class="mt-1.5 h-8 w-full rounded-md border border-ink-200 bg-white px-2 text-xs focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="套餐名"
              @input="(e) => session.setPackageName(pkg.id, (e.target as HTMLInputElement).value)"
            />
          </div>
        </div>

        <!-- 移动端：3 个 chip 一行；PC 端分别占列 -->
        <div class="grid grid-cols-3 gap-2 sm:contents">
          <!-- 时长(h)：移动端 chip + PC NumberStepper -->
          <div class="flex flex-col items-stretch sm:flex sm:items-center sm:justify-center">
            <span class="mb-1 text-[11px] text-ink-400 sm:hidden">时长(h)</span>
            <div class="flex items-center rounded-md border border-ink-200 bg-white px-1 sm:border-transparent sm:bg-transparent sm:px-0">
              <input
                :value="pkg.hours"
                type="number"
                step="0.5"
                min="0"
                class="num-input h-9 w-12 bg-transparent text-center text-sm tabular-nums focus:outline-none sm:hidden"
                @input="(e) => session.setPackageHours(pkg.id, Number((e.target as HTMLInputElement).value))"
              />
              <div class="hidden sm:block">
                <NumberStepper
                  :model-value="pkg.hours"
                  :step="0.5"
                  :min="0"
                  :max="24"
                  size="sm"
                  @update:model-value="(v) => session.setPackageHours(pkg.id, v)"
                />
              </div>
            </div>
          </div>

          <!-- 单价(¥/张)：移动端 chip + PC input -->
          <div class="flex flex-col items-stretch sm:flex sm:items-center sm:justify-center">
            <span class="mb-1 text-[11px] text-ink-400 sm:hidden">单价(¥/张)</span>
            <div
              class="relative flex items-center rounded-md border border-ink-200 bg-white pl-2 pr-1 sm:rounded-md sm:border sm:border-ink-200 sm:bg-white sm:pl-5 sm:pr-1"
            >
              <span class="text-xs text-brand-600 sm:absolute sm:left-2 sm:top-1/2 sm:-translate-y-1/2">
                ¥
              </span>
              <input
                :value="pkg.price"
                type="number"
                step="0.01"
                min="0"
                class="num-input h-9 w-full bg-transparent text-right text-sm tabular-nums focus:outline-none sm:focus:border-brand-400 sm:focus:ring-2 sm:focus:ring-brand-100"
                @input="(e) => session.setPackagePrice(pkg.id, Number((e.target as HTMLInputElement).value))"
              />
            </div>
          </div>

          <!-- 张数：移动端 chip + PC lucide 图标按钮 -->
          <div class="flex flex-col items-stretch sm:flex sm:items-center sm:justify-center">
            <span class="mb-1 text-[11px] text-ink-400 sm:hidden">张数</span>
            <div class="inline-flex items-center overflow-hidden rounded-md border border-ink-200">
              <button
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center border-r border-ink-200 text-ink-500 hover:bg-ink-100 disabled:opacity-40"
                :disabled="pkg.qty <= 0"
                aria-label="减少"
                @click="session.setPackageQty(pkg.id, pkg.qty - 1)"
              >
                <Minus :size="14" />
              </button>
              <input
                :value="pkg.qty"
                type="number"
                step="1"
                min="0"
                class="num-input h-9 w-12 border-x border-ink-200 bg-white text-center text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-200"
                @input="(e) => session.setPackageQty(pkg.id, Number((e.target as HTMLInputElement).value))"
              />
              <button
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center border-l border-ink-200 text-ink-500 hover:bg-ink-100"
                aria-label="增加"
                @click="session.setPackageQty(pkg.id, pkg.qty + 1)"
              >
                <Plus :size="14" />
              </button>
            </div>
          </div>
        </div>

        <!-- 小计 + 删除（移动端：左右分布；PC：小计+删除两列） -->
        <div class="flex items-center justify-between rounded-md bg-ink-50 px-3 py-2 sm:contents sm:bg-transparent sm:px-0 sm:py-0">
          <div class="flex flex-col leading-none">
            <span class="text-[11px] text-ink-400 sm:hidden">小计</span>
            <div class="flex items-baseline gap-1.5">
              <span class="text-base font-bold text-brand-600 tabular-nums sm:text-lg">
                {{ formatCurrency(packageSubtotal(pkg)) }}
              </span>
              <span class="text-xs text-ink-400 tabular-nums">{{ packageHours(pkg) }} h</span>
            </div>
          </div>
          <button
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-400 hover:bg-red-50 hover:text-danger-500"
            aria-label="删除"
            @click="removePackage(pkg.id, pkg.name)"
          >
            <Trash2 :size="16" />
          </button>
        </div>
      </li>
    </ul>

    <!-- 移动端合计行 -->
    <div class="mt-2 grid grid-cols-2 gap-2 text-sm sm:hidden">
      <div class="rounded-md bg-ink-50 px-3 py-2">
        <div class="text-xs text-ink-400">总时长</div>
        <div class="font-semibold text-ink-900">{{ session.totalDuration }} 小时</div>
      </div>
      <div class="rounded-md bg-brand-50 px-3 py-2">
        <div class="text-xs text-brand-700">总台费</div>
        <div class="font-semibold text-brand-600">{{ formatCurrency(session.totalFee) }}</div>
      </div>
    </div>

    <!-- PC 端合计行 -->
    <div class="mt-3 hidden items-center justify-between rounded-md bg-brand-50 px-3 py-2 sm:flex">
      <div class="flex items-center gap-4 text-sm text-brand-700">
        <span>
          共
          <span class="font-semibold">{{ packages.reduce((s, p) => s + p.qty, 0) }}</span>
          张
        </span>
        <span>
          总时长
          <span class="font-semibold">{{ session.totalDuration }}</span>
          小时
        </span>
      </div>
      <div class="text-base font-bold text-brand-600">
        总台费 {{ formatCurrency(session.totalFee) }}
      </div>
    </div>
  </AppCard>
</template>
