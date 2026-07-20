<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppConfirmDialog from '@/components/base/AppConfirmDialog.vue'
</script>

<template>
  <div class="min-h-full bg-ink-50">
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
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>