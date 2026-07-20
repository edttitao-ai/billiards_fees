<script setup lang="ts">
import { Download, Upload } from 'lucide-vue-next'
import AppButton from '@/components/base/AppButton.vue'
import { useUIStore } from '@/stores/ui'
import { useHistoryStore } from '@/stores/history'
import { useBuddiesStore } from '@/stores/buddies'
import { exportToFile, importFromFile, pickJsonFile } from '@/utils/jsonStore'

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
  const ok = await ui.confirm({
    title: '导入账单数据',
    message: `将覆盖当前浏览器里的账单快照与球友库。\n文件：${file.name}\n确定继续？`,
    confirmText: '导入',
    tone: 'primary'
  })
  if (!ok) return
  try {
    const { bills, buddies: buddyCount } = await importFromFile(file)
    await Promise.all([history.loadAll(), buddies.loadAll({ seedIfEmpty: false })])
    ui.showToast(`已导入 ${bills} 条账单 / ${buddyCount} 位球友`, 'success')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    ui.showToast(`导入失败：${msg}`, 'error')
  }
}
</script>

<template>
  <div class="flex items-center gap-1">
    <AppButton
      variant="ghost"
      size="sm"
      class="h-9 w-9 px-0 lg:w-auto lg:px-2.5"
      title="导出账单与球友为 JSON 文件"
      aria-label="导出 JSON"
      @click="handleExport"
    >
      <Download :size="16" />
      <span class="hidden text-xs lg:inline">数据导出</span>
    </AppButton>
    <AppButton
      variant="ghost"
      size="sm"
      class="h-9 w-9 px-0 lg:w-auto lg:px-2.5"
      title="从 JSON 文件导入账单与球友"
      aria-label="导入 JSON"
      @click="handleImport"
    >
      <Upload :size="16" />
      <span class="hidden text-xs lg:inline">数据导入</span>
    </AppButton>
  </div>
</template>
