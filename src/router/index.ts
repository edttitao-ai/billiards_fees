import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: '台费分摊' }
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/views/HistoryView.vue'),
      meta: { title: '历史记录' }
    },
    {
      path: '/history/:id',
      name: 'history-detail',
      component: () => import('@/views/HistoryDetailView.vue'),
      meta: { title: '账单详情' }
    },
    {
      path: '/guide',
      name: 'guide',
      component: () => import('@/views/GuideView.vue'),
      meta: { title: '使用说明' }
    },
    {
      path: '/share',
      name: 'share',
      component: () => import('@/views/ShareView.vue'),
      meta: { title: '收到的账单', hideTopBar: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} · 台费分摊`
  }
})

export default router