<template>
  <Provider>
    <router-view />
    <!-- Meting API 测试工具 (仅在开发环境显示) -->
    <MetingTest v-if="isDev" />
  </Provider>
</template>

<script setup lang="ts">
import { isDev } from "@/utils/helper";
import MetingTest from "@/components/Debug/MetingTest.vue";
</script>

<style>
/* 全局样式已由其他文件处理 */
</style>