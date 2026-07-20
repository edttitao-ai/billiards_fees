<script setup lang="ts">
import { Download, Upload } from 'lucide-vue-next'
import AppButton from '@/components/base/AppButton.vue'
import { useUIStore } from '@/stores/ui'
import { useHistoryStore } from '@/stores/history'
import { useBuddiesStore } from '@/stores/buddies'
import {
  exportToFile,
  importFromFile,
  pickJsonFile
} from '@/utils/jsonStore'

const ui = useUIStore()
const history = useHistoryStore()
const buddies = useBuddiesStore()

async function handleExport() {
  try {
    exportToFile()
    ui.showToast('JSON 文件已下载', 'success')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    ui.showToast(`导出失败：${msg}`, 'error')
  }
}

async function handleImport() {
  const file = await pickJsonFile()
  if (!file) return
  // 二次确认，避免误操作覆盖数据
  const ok = await ui.confirm({
    title: '导入账单数据',
    message: `将覆盖当前浏览器里的账单快照与球友库。\n文件：${file.name}\n确定继续？`,
    confirmText: '导入',
    tone: 'primary'
  })
  if (!ok) return
  try {
    const { bills, buddies: buddyCount } = await importFromFile(file)
    // 重新加载 store
    await Promise.all([history.loadAll(), buddies.loadAll({ seedIfEmpty: false })])
    ui.showToast(`已导入 ${bills} 条账单 / ${buddyCount} 位球友`, 'success')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    ui.showToast(`导入失败：${msg}`, 'error')
  }
}
</script>

<template>
  <!-- 顶部一行两个动作按钮，移动端小尺寸 -->
  <div class="flex items-center gap-1.5">
    <AppButton
      variant="secondary"
      size="sm"
      title="导出账单与球友为 JSON 文件"
      aria-label="导出 JSON"
      @click="handleExport"
    >
      <Download :size="14" />
      <span>导出</span>
    </AppButton>
    <AppButton
      variant="secondary"
      size="sm"
      title="从 JSON 文件导入账单与球友"
      aria-label="导入 JSON"
      @click="handleImport"
    >
      <Upload :size="14" />
      <span>导入</span>
    </AppButton>
  </div>
</template>
