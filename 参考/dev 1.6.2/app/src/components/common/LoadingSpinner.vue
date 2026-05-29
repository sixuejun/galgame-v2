<!--
  LoadingSpinner 组件

  用于显示加载状态的旋转动画组件。

  功能：
  - 显示多层旋转环动画
  - 支持自定义加载消息
  - 支持显示重试信息（重试次数和原因）
  - 响应式设计，适配移动端
  - 无障碍支持（ARIA 属性）

  Props:
  - message: 加载提示消息（可选，默认为"加载中..."）
  - isRetrying: 是否正在重试（可选，默认为 false）
  - retryCount: 当前重试次数（可选）
  - maxRetries: 最大重试次数（可选）
  - retryReason: 重试原因（可选）

  使用示例：
  <LoadingSpinner message="正在加载数据..." />
  <LoadingSpinner
    message="AI 正在思考中..."
    :is-retrying="true"
    :retry-count="2"
    :max-retries="3"
    retry-reason="AI 响应格式不正确"
  />
-->
<template>
  <div class="loading-spinner-container" role="status" aria-live="polite" aria-label="正在加载">
    <div class="loading-spinner">
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
    </div>
    <p v-if="message" class="loading-message">{{ message }}</p>

    <!-- 重试信息提示 -->
    <div
      v-if="isRetrying && retryCount !== undefined && maxRetries !== undefined"
      class="retry-info"
    >
      <i class="fas fa-redo retry-icon"></i>
      <span class="retry-text">
        {{ retryReason || 'AI 响应格式不正确' }}，正在重试 ({{ retryCount }}/{{ maxRetries }})
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Props 定义
 */
withDefaults(
  defineProps<{
    /** 加载提示消息 */
    message?: string
    /** 是否正在重试 */
    isRetrying?: boolean
    /** 当前重试次数 */
    retryCount?: number
    /** 最大重试次数 */
    maxRetries?: number
    /** 重试原因 */
    retryReason?: string
  }>(),
  {
    message: '加载中...',
    isRetrying: false,
  }
)
</script>

<style scoped>
.loading-spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-2xl);
  min-height: 200px;
}

.loading-spinner {
  position: relative;
  width: 80px;
  height: 80px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 6px solid transparent;
  border-top-color: var(--primary-blue);
  border-radius: 50%;
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  /* 添加阴影增强可见性 */
  filter: drop-shadow(0 0 8px currentColor);
}

.spinner-ring:nth-child(1) {
  animation-delay: -0.45s;
  border-top-color: var(--primary-blue);
  opacity: 1;
}

.spinner-ring:nth-child(2) {
  animation-delay: -0.3s;
  border-top-color: var(--secondary-blue);
  opacity: 0.9;
}

.spinner-ring:nth-child(3) {
  animation-delay: -0.15s;
  border-top-color: var(--purple);
  opacity: 0.8;
}

.spinner-ring:nth-child(4) {
  border-top-color: var(--accent-pink);
  opacity: 0.7;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-message {
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  color: var(--text-dark);
  text-align: center;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}

.retry-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(255, 152, 0, 0.1);
  border: 1px solid rgba(255, 152, 0, 0.3);
  border-radius: var(--radius-md);
  animation: pulse 1.5s ease-in-out infinite;
}

.retry-icon {
  color: var(--warning-orange, #ff9800);
  font-size: var(--text-base);
  animation: spin 2s linear infinite;
}

.retry-text {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--warning-orange, #ff9800);
  text-align: center;
}

@media (max-width: 768px) {
  .retry-info {
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .retry-text {
    font-size: var(--text-xs);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .loading-spinner {
    width: 60px;
    height: 60px;
  }

  .loading-message {
    font-size: var(--text-base);
  }
}
</style>
