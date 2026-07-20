<script setup lang="ts">
import { Pencil, Trash2, UserPlus, Info } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import AppCard from '@/components/base/AppCard.vue'
import AppButton from '@/components/base/AppButton.vue'
import NumberStepper from '@/components/base/NumberStepper.vue'
import BuddyPickerModal from '@/components/business/BuddyPickerModal.vue'
import { useSessionStore } from '@/stores/session'
import { useUIStore } from '@/stores/ui'
import { formatCurrency, formatNumber } from '@/utils/format'
import type { BallBuddy } from '@/types'

const session = useSessionStore()
const ui = useUIStore()
const editingId = ref<string | null>(null)
const tempName = ref('')
const buddyModalOpen = ref(false)

const existingNames = computed(() => session.participants.map((p) => p.name))

function startEdit(id: string, name: string) {
  editingId.value = id
  tempName.value = name
}
function commitEdit(id: string) {
  if (editingId.value === id) {
    session.updateName(id, tempName.value)
    editingId.value = null
  }
}
function cancelEdit() {
  editingId.value = null
  tempName.value = ''
}

async function removeParticipant(id: string, name: string) {
  if (session.participants.length <= 1) {
    ui.showToast('至少保留一位参与人员', 'warn')
    return
  }
  const rest = session.participants.length - 1
  const ok = await ui.confirm({
    title: '删除参与人员',
    message: `确认删除「${name}」？\n账单会按剩余 ${rest} 人重新分摊。`,
    confirmText: '删除',
    tone: 'danger'
  })
  if (!ok) return
  session.removeParticipant(id)
  ui.showToast(`已删除 ${name}，账单已按 ${rest} 人重新分摊`, 'success')
}

function onBuddyConfirm(buddies: BallBuddy[]) {
  if (!buddies || buddies.length === 0) return
  session.addParticipantsFromBuddies(buddies)
}
</script>

<template>
  <AppCard>
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2 text-ink-900">
        <span class="font-semibold">参与人员</span>
        <span class="text-xs text-ink-400">({{ session.participants.length }}人)</span>
      </div>
      <div class="flex items-center gap-2">
        <AppButton variant="primary" size="sm" @click="buddyModalOpen = true">
          <UserPlus :size="14" />
          添加人员
        </AppButton>
      </div>
    </div>

    <!-- PC 表头 -->
    <div
      class="hidden grid-cols-[28px_1fr_180px_96px_36px] items-center gap-2 px-2 pb-2 text-xs text-ink-400 sm:grid"
    >
      <div>#</div>
      <div>姓名</div>
      <div class="text-center">打球时长 (小时)</div>
      <div class="text-right">个人费用</div>
      <div></div>
    </div>

    <!-- 空状态 -->
    <div
      v-if="!session.participants.length"
      class="rounded-md border border-dashed border-ink-200 bg-ink-50/50 px-3 py-6 text-center text-sm text-ink-500"
    >
      <div class="mb-2 font-medium">还没有参与人员</div>
      <div class="text-xs text-ink-400">点击右上角「添加人员」开始</div>
    </div>

    <ul v-else class="divide-y divide-ink-100">
      <li
        v-for="p in session.participants"
        :key="p.id"
        class="grid grid-cols-[24px_minmax(0,1fr)_auto_auto_auto] items-center gap-2 px-2 py-2 sm:grid-cols-[28px_1fr_180px_96px_36px]"
      >
        <!-- 第 1 列：编号 -->
        <div
          class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700"
        >
          {{ p.index }}
        </div>

        <!-- 第 2 列：姓名 -->
        <div class="min-w-0">
          <input
            v-if="editingId === p.id"
            v-model="tempName"
            class="h-9 w-full rounded-md border border-brand-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100"
            autofocus
            @blur="commitEdit(p.id)"
            @keyup.enter="commitEdit(p.id)"
            @keyup.esc="cancelEdit"
          />
          <button
            v-else
            class="group inline-flex max-w-full items-center gap-1 truncate text-left text-sm font-medium text-ink-900 hover:text-brand-600"
            @click="startEdit(p.id, p.name)"
          >
            <span class="truncate">{{ p.name }}</span>
            <Pencil :size="12" class="shrink-0 opacity-0 transition group-hover:opacity-60" />
          </button>
        </div>

        <!-- 第 3 列：步进器（紧凑 size='sm'） -->
        <div class="flex items-center justify-end">
          <NumberStepper
            :model-value="p.duration"
            :size="'sm'"
            @update:model-value="(v) => session.setDuration(p.id, v)"
          />
        </div>

        <!-- 第 4 列：费用 -->
        <div class="flex items-center justify-end">
          <span class="whitespace-nowrap text-sm font-semibold text-brand-600 tabular-nums">
            {{ formatCurrency(p.personalFee) }}
          </span>
        </div>

        <!-- 第 5 列：删除按钮 -->
        <button
          class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-400 hover:bg-red-50 hover:text-danger-500"
          aria-label="删除"
          @click="removeParticipant(p.id, p.name)"
        >
          <Trash2 :size="14" />
        </button>
      </li>
    </ul>

    <div class="mt-3 flex items-center gap-1.5 rounded-md bg-ink-50 px-3 py-2 text-xs text-ink-500">
      <Info :size="14" class="shrink-0 text-ink-400" />
      <span>提示：修改打球时长会自动重新计算每个人的费用</span>
    </div>

    <BuddyPickerModal
      v-model:open="buddyModalOpen"
      :existing-names="existingNames"
      @confirm="onBuddyConfirm"
    />
  </AppCard>
</template>
