<!--
  SkeletonCard 组件

  骨架屏卡片组件，用于显示内容加载状态。

  功能：
  - 模拟卡片内容的加载占位符
  - 闪烁动画效果（shimmer）
  - 脉冲动画效果（pulse）
  - 响应式设计，适配移动端
  - 无障碍支持（ARIA 属性）
  - 无需 props，纯展示组件

  使用场景：
  - 商品列表加载
  - 卡片列表加载
  - 任何需要显示加载状态的卡片布局

  使用示例：
  <div v-if="isLoading" class="grid">
    <SkeletonCard v-for="i in 12" :key="i" />
  </div>
-->
<template>
  <div class="skeleton-card" role="status" aria-label="正在加载内容">
    <div class="skeleton-image"></div>
    <div class="skeleton-content">
      <div class="skeleton-title"></div>
      <div class="skeleton-text"></div>
      <div class="skeleton-text short"></div>
      <div class="skeleton-footer">
        <div class="skeleton-badge"></div>
        <div class="skeleton-badge"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * SkeletonCard 组件
 *
 * 骨架屏组件，用于显示加载状态
 * 无需 props，纯展示组件
 */
</script>

<style scoped>
.skeleton-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  border: 1px solid rgba(0, 128, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-image {
  width: 100%;
  height: 120px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.skeleton-title {
  width: 70%;
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

.skeleton-text {
  width: 100%;
  height: 14px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

.skeleton-text.short {
  width: 60%;
}

.skeleton-footer {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.skeleton-badge {
  width: 60px;
  height: 24px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-full);
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .skeleton-card {
    padding: var(--spacing-md);
  }

  .skeleton-image {
    height: 100px;
  }
}

@media (max-width: 480px) {
  .skeleton-card {
    padding: var(--spacing-sm);
  }

  .skeleton-image {
    height: 80px;
  }
}
</style>
