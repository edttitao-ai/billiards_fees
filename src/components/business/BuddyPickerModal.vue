<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Search, Plus, Trash2, Check, UsersRound } from 'lucide-vue-next'
import AppModal from '@/components/base/AppModal.vue'
import Avatar from '@/components/base/Avatar.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import AppButton from '@/components/base/AppButton.vue'
import { useBuddiesStore } from '@/stores/buddies'
import { useUIStore } from '@/stores/ui'
import type { BallBuddy } from '@/types'

interface Props {
  open: boolean
  /** 已加入当前账单的姓名集合（用于去重提示） */
  existingNames?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  existingNames: () => []
})

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'confirm', buddies: BallBuddy[]): void
}>()

const buddies = useBuddiesStore()
const ui = useUIStore()

const keyword = ref('')
const selected = ref<Set<string>>(new Set())
const addingName = ref('')

const list = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return buddies.list
  return buddies.list.filter((c) => c.name.toLowerCase().includes(q))
})

const existingSet = computed(() => new Set(props.existingNames))

onMounted(async () => {
  if (!buddies.loaded) await buddies.loadAll({ seedIfEmpty: true })
})

watch(
  () => props.open,
  (v) => {
    if (v) {
      // 每次打开时，默认勾选"已在当前账单中"的人，方便二次编辑保留选中
      selected.value = new Set(
        buddies.list.filter((c) => existingSet.value.has(c.name)).map((c) => c.id)
      )
      keyword.value = ''
    }
  }
)

function isSelected(id: string) {
  return selected.value.has(id)
}

function toggle(id: string) {
  const s = new Set(selected.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selected.value = s
}

function selectAllVisible() {
  const s = new Set(selected.value)
  list.value.forEach((c) => s.add(c.id))
  selected.value = s
}

function inverseVisible() {
  const s = new Set(selected.value)
  list.value.forEach((c) => {
    if (s.has(c.id)) s.delete(c.id)
    else s.add(c.id)
  })
  selected.value = s
}

async function addBuddy() {
  const name = addingName.value.trim()
  if (!name) {
    ui.showToast('请输入姓名', 'warn')
    return
  }
  try {
    const c = await buddies.add(name)
    addingName.value = ''
    selected.value = new Set(selected.value).add(c.id)
    ui.showToast(`已添加球友「${c.name}」`, 'success')
  } catch {
    /* ignored */
  }
}

async function removeBuddy(id: string, name: string) {
  const ok = await ui.confirm({
    title: '删除球友',
    message: `确认删除球友「${name}」？\n此操作不会影响已加入账单的人员。`,
    confirmText: '删除',
    tone: 'danger'
  })
  if (!ok) return
  await buddies.remove(id)
  selected.value.delete(id)
  ui.showToast('已删除球友', 'success')
}

function close() {
  emit('update:open', false)
}

function confirm() {
  const picked = buddies.list.filter((c) => selected.value.has(c.id))
  // 去掉已经在账单中的人
  const fresh = picked.filter((c) => !existingSet.value.has(c.name))
  const skipped = picked.length - fresh.length
  emit('confirm', fresh)
  if (fresh.length === 0) {
    ui.showToast('没有新增人员', 'info')
  } else if (skipped > 0) {
    ui.showToast(`已添加 ${fresh.length} 人（${skipped} 人已在账单中跳过）`, 'success')
  } else {
    ui.showToast(`已添加 ${fresh.length} 人`, 'success')
  }
  close()
}

const selectedCount = computed(() => selected.value.size)
</script>

<template>
  <AppModal
    :open="open"
    title="添加人员"
    max-width-class="sm:max-w-[560px]"
    @update:open="(v) => emit('update:open', v)"
  >
    <!-- 搜索 + 添加 -->
    <div class="sticky top-0 z-10 space-y-2 bg-white px-5 py-3">
      <div class="relative">
        <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          v-model="keyword"
          placeholder="搜索球友姓名"
          class="h-10 w-full rounded-md border border-ink-200 bg-white pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <div class="flex gap-2">
        <input
          v-model="addingName"
          placeholder="新球友姓名（回车添加）"
          class="h-9 min-w-0 flex-1 rounded-md border border-ink-200 bg-white px-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          @keyup.enter="addBuddy"
        />
        <AppButton variant="primary" size="sm" @click="addBuddy">
          <Plus :size="14" />
          添加
        </AppButton>
      </div>
      <div class="flex items-center justify-between text-xs text-ink-500">
        <span class="flex items-center gap-1">
          <UsersRound :size="14" class="text-brand-600" />
          共 {{ buddies.list.length }} 位球友，已选 {{ selectedCount }} 人
        </span>
        <div class="flex gap-2 text-brand-600">
          <button class="hover:underline" @click="selectAllVisible">全选</button>
          <span class="text-ink-300">·</span>
          <button class="hover:underline" @click="inverseVisible">反选</button>
        </div>
      </div>
    </div>

    <!-- 列表 -->
    <ul v-if="list.length" class="divide-y divide-ink-100">
      <li
        v-for="c in list"
        :key="c.id"
        class="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-brand-50/60"
        :class="isSelected(c.id) && 'bg-brand-50'"
        @click="toggle(c.id)"
      >
        <Avatar :name="c.name" :id="c.avatarId" :size="36" />
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-medium text-ink-900">{{ c.name }}</div>
          <div v-if="existingSet.has(c.name)" class="text-xs text-ink-400">
            已在账单中
          </div>
        </div>
        <button
          class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-300 hover:bg-red-50 hover:text-danger-500"
          aria-label="删除球友"
          @click.stop="removeBuddy(c.id, c.name)"
        >
          <Trash2 :size="14" />
        </button>
        <div
          class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all"
          :class="
            isSelected(c.id)
              ? 'border-brand-500 bg-brand-500 text-white'
              : 'border-ink-300 bg-white text-transparent'
          "
        >
          <Check v-if="isSelected(c.id)" :size="14" />
        </div>
      </li>
    </ul>

    <EmptyState
      v-else-if="keyword"
      title="没有匹配的球友"
      description="试试其他关键词，或在顶部新增一位"
    />
    <EmptyState
      v-else
      title="还没有球友"
      description="在上方输入姓名，点「添加」即可永久保存到球友库"
    />

    <template #footer>
      <button
        class="inline-flex h-9 items-center rounded-md px-3 text-sm text-ink-500 hover:bg-ink-100"
        @click="close"
      >
        取消
      </button>
      <AppButton variant="primary" size="sm" :disabled="selectedCount === 0" @click="confirm">
        <Check :size="14" />
        确定添加 {{ selectedCount }} 人
      </AppButton>
    </template>
  </AppModal>
</template>