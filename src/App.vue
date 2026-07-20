<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppConfirmDialog from '@/components/base/AppConfirmDialog.vue'
</script>

<template>
  <div class="app-shell">
    <RouterView v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </RouterView>
    <AppConfirmDialog />
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.fade-leave-to {
  opacity: 0;
}
</style>
