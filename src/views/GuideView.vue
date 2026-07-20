<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft, ListChecks, Calculator, Wand2 } from 'lucide-vue-next'
import TopBar from '@/components/layout/TopBar.vue'
import AppCard from '@/components/base/AppCard.vue'

const router = useRouter()

const steps = [
  {
    icon: ListChecks,
    title: '设置台费和参与人员',
    desc: '填写桌号、单价、开始时间，添加或调整参与人员的打球时长（步进 0.5 小时）。'
  },
  {
    icon: Calculator,
    title: '自动计算每人费用',
    desc: '系统自动算出每个参与者的个人费用、总台费、人均时长与人均费用。'
  },
  {
    icon: Wand2,
    title: '一键平摊 + 收款建议',
    desc: '查看需要多支付 / 需要少支付列表，一键导出账单给好友。'
  }
]
</script>

<template>
  <div class="container-page">
    <TopBar title="使用说明" :show-back="true" :show-history="false" :show-guide="false" />

    <AppCard>
      <div class="text-sm text-ink-700 leading-relaxed">
        台费分摊系统帮你 3 步搞定"打了多久、付了多少钱、应该互相转账多少"这件事。
      </div>

      <ol class="mt-4 space-y-3">
        <li v-for="(s, i) in steps" :key="i" class="flex gap-3 rounded-md bg-ink-50 p-3">
          <div class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-brand-600 shadow-soft">
            <component :is="s.icon" :size="18" />
          </div>
          <div>
            <div class="text-sm font-semibold text-ink-900">
              {{ i + 1 }}. {{ s.title }}
            </div>
            <div class="mt-1 text-xs leading-relaxed text-ink-500">{{ s.desc }}</div>
          </div>
        </li>
      </ol>

      <div class="mt-5 rounded-md bg-brand-50 p-3 text-xs text-brand-700">
        提示：所有数据都保存在你的浏览器本地（IndexedDB），不会上传到服务器。
      </div>
    </AppCard>

    <div class="mt-4 text-center">
      <button class="text-sm text-brand-600 hover:underline" @click="router.replace('/')">
        返回主页 →
      </button>
    </div>
  </div>
</template>