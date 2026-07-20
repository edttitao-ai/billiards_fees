<script setup lang="ts">
import { Pencil, Trash2, UserPlus, Info, Users } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import AppCard from '@/components/base/AppCard.vue'
import AppButton from '@/components/base/AppButton.vue'
import NumberStepper from '@/components/base/NumberStepper.vue'
import BuddyPickerModal from '@/components/business/BuddyPickerModal.vue'
import { useSessionStore } from '@/stores/session'
import { useUIStore } from '@/stores/ui'
import { formatCurrency } from '@/utils/format'
import type { BallBuddy } from '@/types'

const session = useSessionStore()
const ui = useUIStore()
const editingId = ref<string | null>(null)
const tempName = ref('')
const buddyModalOpen = ref(false)

const existingNames = computed(() => session.participants.map((participant) => participant.name))

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
  const rest = session.participants.length - 1
  const ok = await ui.confirm({
    title: '删除参与人员',
    message: rest > 0
      ? `确认删除「${name}」？\n账单会按剩余 ${rest} 人重新分摊。`
      : `确认删除「${name}」？\n删除后当前账单将没有参与人员。`,
    confirmText: '删除',
    tone: 'danger'
  })
  if (!ok) return
  session.removeParticipant(id)
  ui.showToast(rest > 0 ? `已删除 ${name}，账单已按 ${rest} 人重新分摊` : `已删除 ${name}`, 'success')
}

function onBuddyConfirm(buddies: BallBuddy[]) {
  if (!buddies || buddies.length === 0) return
  session.addParticipantsFromBuddies(buddies)
}
</script>

<template>
  <AppCard class="h-full">
    <div class="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div>
        <div class="section-kicker">Players</div>
        <div class="mt-0.5 flex items-center gap-2">
          <Users :size="17" class="text-brand-600" />
          <h2 class="section-title">参与人员</h2>
          <span class="rounded-full bg-ink-100 px-2 py-0.5 text-[12px] font-semibold text-ink-500">
            {{ session.participants.length }} 人
          </span>
        </div>
      </div>
      <AppButton variant="primary" size="sm" @click="buddyModalOpen = true">
        <UserPlus :size="14" />
        添加人员
      </AppButton>
    </div>

    <div
      class="hidden grid-cols-[28px_1fr_160px_96px_32px] items-center gap-2 border-b border-ink-100 px-2 pb-2 font-data text-[12px] font-semibold uppercase tracking-wider text-ink-400 sm:grid"
    >
      <div>#</div>
      <div>姓名</div>
      <div class="text-center">打球时长</div>
      <div class="text-right">个人费用</div>
      <div />
    </div>

    <div
      v-if="!session.participants.length"
      class="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-brand-200 bg-brand-50/45 px-4 py-7 text-center"
    >
      <span class="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-100 bg-white text-brand-600 shadow-sm">
        <UserPlus :size="19" />
      </span>
      <div class="text-sm font-semibold text-ink-700">球友还没入场</div>
      <div class="mt-1 text-xs text-ink-400">添加人员后会按打球时长自动分摊</div>
    </div>

    <ul v-else class="divide-y divide-ink-100">
      <li
        v-for="participant in session.participants"
        :key="participant.id"
        class="grid grid-cols-[24px_minmax(0,1fr)_auto_auto_auto] items-center gap-2 px-1 py-2.5 sm:grid-cols-[28px_1fr_160px_96px_32px] sm:px-2"
      >
        <div
          class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#fffefb] bg-brand-700 font-data text-[12px] font-bold text-white shadow-sm"
        >
          {{ participant.index }}
        </div>

        <div class="min-w-0">
          <input
            v-if="editingId === participant.id"
            v-model="tempName"
            class="h-9 w-full rounded-xl border border-brand-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100"
            autofocus
            @blur="commitEdit(participant.id)"
            @keyup.enter="commitEdit(participant.id)"
            @keyup.esc="cancelEdit"
          />
          <button
            v-else
            class="group inline-flex max-w-full items-center gap-1 truncate text-left text-sm font-semibold text-ink-900 hover:text-brand-700"
            @click="startEdit(participant.id, participant.name)"
          >
            <span class="truncate">{{ participant.name }}</span>
            <Pencil :size="11" class="shrink-0 opacity-0 transition group-hover:opacity-60" />
          </button>
        </div>

        <div class="flex items-center justify-end">
          <NumberStepper
            :model-value="participant.duration"
            size="sm"
            @update:model-value="(value) => session.setDuration(participant.id, value)"
          />
        </div>

        <div class="flex items-center justify-end">
          <span class="data-number whitespace-nowrap text-sm font-bold text-accent-600">
            {{ formatCurrency(participant.personalFee) }}
          </span>
        </div>

        <button
          class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-red-50 hover:text-danger-500"
          aria-label="删除"
          @click="removeParticipant(participant.id, participant.name)"
        >
          <Trash2 :size="14" />
        </button>
      </li>
    </ul>

    <div class="mt-3 flex items-start gap-2 rounded-xl border border-ink-100 bg-ink-50/70 px-3 py-2.5 text-[13px] leading-relaxed text-ink-500">
      <Info :size="13" class="mt-0.5 shrink-0 text-brand-500" />
      <span>修改打球时长后，每个人的费用会立即重新计算。</span>
    </div>

    <BuddyPickerModal
      v-model:open="buddyModalOpen"
      :existing-names="existingNames"
      @confirm="onBuddyConfirm"
    />
  </AppCard>
</template>
