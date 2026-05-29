<!--
  HomeHeader 组件

  游戏主页面的标题和副标题区域

  Props:
  - show: 是否显示标题区域
  - title: 页面标题
  - subtitle: 页面副标题
-->
<template>
  <div v-if="show" class="home-header">
    <h1 id="page-title">{{ title }}</h1>
    <p>{{ subtitle }}</p>
  </div>
</template>

<script setup lang="ts">
// Props
defineProps<{
  show: boolean
  title: string
  subtitle: string
}>()
</script>

<style scoped>
.home-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, rgba(0, 128, 255, 0.05), rgba(0, 191, 255, 0.05));
  border-radius: var(--radius-xl);
  border: 1px solid rgba(0, 128, 255, 0.1);
}

.home-header h1 {
  color: var(--primary-blue);
  font-size: var(--text-4xl);
  margin: 0;
  font-weight: var(--font-light);
  letter-spacing: 3px;
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 3s linear infinite;
  background-size: 200% 100%;
}

.home-header p {
  color: var(--text-muted);
  margin-top: var(--spacing-sm);
  font-style: italic;
  font-size: var(--text-lg);
  font-weight: var(--font-light);
}

@media (max-width: 768px) {
  .home-header h1 {
    font-size: var(--text-3xl);
    letter-spacing: 2px;
  }

  .home-header p {
    font-size: var(--text-base);
  }
}
</style>
