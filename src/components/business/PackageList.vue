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

const templateOptions = computed(() => [
  ...PACKAGE_TEMPLATES.map((template, index) => ({
    value: `tpl-${index}`,
    label: template.name,
    description: `${template.hours} 小时 · ¥${template.price}/张`
  })),
  { value: 'custom', label: '自定义套餐', description: '自己填时长与单价' }
])

function currentTplValue(pkg: { name: string; hours: number; price: number }): string {
  const index = PACKAGE_TEMPLATES.findIndex(
    (template) =>
      template.name === pkg.name && template.hours === pkg.hours && template.price === pkg.price
  )
  return index >= 0 ? `tpl-${index}` : 'custom'
}

function onTemplateChange(id: string, value: string | number) {
  const selected = String(value)
  if (selected === 'custom') {
    session.setPackageName(id, '自定义套餐')
    session.setPackageHours(id, 1)
    session.setPackagePrice(id, 60)
  } else if (selected.startsWith('tpl-')) {
    session.applyPackageTemplate(id, Number(selected.slice(4)))
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
    <div class="mb-4 flex items-end justify-between gap-3">
      <div>
        <div class="section-kicker">Packages</div>
        <div class="mt-0.5 flex items-center gap-2">
          <Tickets :size="17" class="text-brand-600" />
          <h2 class="section-title">套餐列表</h2>
          <span class="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-500">
            {{ packages.length }} 项
          </span>
        </div>
      </div>
      <AppButton variant="primary" size="sm" @click="addPackage">
        <Plus :size="14" />
        添加套餐
      </AppButton>
    </div>

    <div
      class="hidden grid-cols-[minmax(160px,1fr)_84px_96px_112px_104px_32px] items-center gap-2 rounded-xl bg-ink-50 px-3 py-2 font-data text-[10px] font-semibold uppercase tracking-wider text-ink-400 sm:grid"
    >
      <div>套餐</div>
      <div class="text-center">时长</div>
      <div class="text-center">单价</div>
      <div class="text-center">张数</div>
      <div class="text-right">小计</div>
      <div />
    </div>

    <ul v-if="packages.length" class="space-y-3 sm:space-y-0 sm:divide-y sm:divide-ink-100">
      <li
        v-for="(pkg, index) in packages"
        :key="pkg.id"
        class="rounded-2xl border border-ink-100 bg-ink-50/45 p-3 sm:grid sm:grid-cols-[minmax(160px,1fr)_84px_96px_112px_104px_32px] sm:items-center sm:gap-2 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-3 sm:py-3"
      >
        <div class="flex min-w-0 items-center">
          <span
            class="mr-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-700 font-data text-[9px] font-bold text-white sm:hidden"
          >
            P{{ index + 1 }}
          </span>
          <div class="min-w-0 flex-1">
            <AppPicker
              :model-value="currentTplValue(pkg)"
              :options="templateOptions"
              size="sm"
              @change="(value) => onTemplateChange(pkg.id, value)"
            />
            <input
              v-if="currentTplValue(pkg) === 'custom'"
              :value="pkg.name"
              class="mt-1.5 h-8 w-full rounded-xl border border-ink-200 bg-white px-2.5 text-xs focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="套餐名"
              @input="(event) => session.setPackageName(pkg.id, (event.target as HTMLInputElement).value)"
            />
          </div>
        </div>

        <div class="mt-3 grid grid-cols-3 gap-2 sm:contents">
          <div class="flex min-w-0 flex-col items-stretch sm:items-center sm:justify-center">
            <span class="mb-1 text-[10px] font-medium text-ink-400 sm:hidden">时长</span>
            <div class="flex min-w-0 items-center overflow-hidden rounded-[10px] border border-ink-200 bg-[#fffefb] sm:border-transparent sm:bg-transparent">
              <input
                :value="pkg.hours"
                type="number"
                step="0.5"
                min="0"
                class="num-input h-9 min-w-0 flex-1 bg-transparent text-center font-data text-sm font-bold tabular-nums focus:outline-none sm:hidden"
                @input="(event) => session.setPackageHours(pkg.id, Number((event.target as HTMLInputElement).value))"
              />
              <div class="hidden sm:block">
                <NumberStepper
                  :model-value="pkg.hours"
                  :step="0.5"
                  :min="0"
                  :max="24"
                  size="sm"
                  @update:model-value="(value) => session.setPackageHours(pkg.id, value)"
                />
              </div>
            </div>
          </div>

          <div class="flex min-w-0 flex-col items-stretch sm:items-center sm:justify-center">
            <span class="mb-1 text-[10px] font-medium text-ink-400 sm:hidden">单价</span>
            <div class="relative flex min-w-0 items-center rounded-[10px] border border-ink-200 bg-[#fffefb] pl-2 pr-1 sm:pl-4">
              <span class="shrink-0 font-data text-xs font-semibold text-accent-600 sm:absolute sm:left-2">¥</span>
              <input
                :value="pkg.price"
                type="number"
                step="0.01"
                min="0"
                class="num-input h-9 min-w-0 flex-1 bg-transparent text-right font-data text-sm font-bold tabular-nums text-ink-900 focus:outline-none"
                @input="(event) => session.setPackagePrice(pkg.id, Number((event.target as HTMLInputElement).value))"
              />
            </div>
          </div>

          <div class="flex min-w-0 flex-col items-stretch sm:items-center sm:justify-center">
            <span class="mb-1 text-[10px] font-medium text-ink-400 sm:hidden">张数</span>
            <div class="flex min-w-0 items-center overflow-hidden rounded-[10px] border border-ink-200 bg-[#fffefb]">
              <button
                type="button"
                class="inline-flex h-9 w-7 shrink-0 items-center justify-center border-r border-ink-100 text-ink-500 hover:bg-brand-50 disabled:opacity-35 sm:w-8"
                :disabled="pkg.qty <= 0"
                aria-label="减少"
                @click="session.setPackageQty(pkg.id, pkg.qty - 1)"
              >
                <Minus :size="13" />
              </button>
              <input
                :value="pkg.qty"
                type="number"
                step="1"
                min="0"
                class="num-input h-9 min-w-0 flex-1 bg-transparent text-center font-data text-sm font-bold tabular-nums text-ink-900 focus:outline-none"
                @input="(event) => session.setPackageQty(pkg.id, Number((event.target as HTMLInputElement).value))"
              />
              <button
                type="button"
                class="inline-flex h-9 w-7 shrink-0 items-center justify-center border-l border-ink-100 text-brand-700 hover:bg-brand-50 sm:w-8"
                aria-label="增加"
                @click="session.setPackageQty(pkg.id, pkg.qty + 1)"
              >
                <Plus :size="13" />
              </button>
            </div>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between border-t border-dashed border-ink-200 pt-2.5 sm:contents sm:border-0 sm:pt-0">
          <div class="flex items-baseline gap-1 sm:block sm:text-right">
            <span class="text-[10px] font-medium text-ink-400 sm:hidden">小计</span>
            <span class="data-number text-base font-bold text-accent-600">
              {{ formatCurrency(packageSubtotal(pkg)) }}
            </span>
            <span class="text-[10px] text-ink-400 sm:block">{{ packageHours(pkg) }} h</span>
          </div>
          <button
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-red-50 hover:text-danger-500"
            aria-label="删除"
            @click="removePackage(pkg.id, pkg.name)"
          >
            <Trash2 :size="15" />
          </button>
        </div>
      </li>
    </ul>

    <div class="mt-3 grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end sm:gap-3">
      <div class="rounded-xl border border-ink-100 bg-ink-50 px-3 py-2 sm:min-w-32">
        <div class="text-[10px] font-medium text-ink-400">累计时长</div>
        <div class="data-number mt-0.5 text-sm font-bold text-ink-700">{{ session.totalDuration }} 小时</div>
      </div>
      <div class="rounded-xl border border-accent-200 bg-accent-50 px-3 py-2 sm:min-w-36">
        <div class="text-[10px] font-medium text-accent-700">套餐总额</div>
        <div class="data-number mt-0.5 text-base font-bold text-accent-700">{{ formatCurrency(session.totalFee) }}</div>
      </div>
    </div>
  </AppCard>
</template>
