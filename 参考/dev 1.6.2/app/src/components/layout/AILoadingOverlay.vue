<!--
  AILoadingOverlay 组件

  AI 加载遮罩层组件，在 AI 处理时显示全屏加载动画。

  功能：
  - 全屏遮罩层
  - 加载动画和提示文本
  - 支持显示重试信息
  - 条件渲染
  - 无障碍支持

  Props:
  - isVisible (boolean): 是否显示遮罩层
  - message (string, 默认: 'AI 正在思考中...'): 提示消息
  - isRetrying (boolean, 可选): 是否正在重试
  - retryCount (number, 可选): 当前重试次数
  - maxRetries (number, 可选): 最大重试次数
  - retryReason (string, 可选): 重试原因
-->
<template>
  <div v-if="isVisible" class="ai-loading-overlay">
    <div class="ai-loading-content">
      <LoadingSpinner
        :message="message"
        :is-retrying="isRetrying"
        :retry-count="retryCount"
        :max-retries="maxRetries"
        :retry-reason="retryReason"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import LoadingSpinner from '../common/LoadingSpinner.vue'

/**
 * AI 加载遮罩组件 - 在 AI 生成内容时显示加载动画
 */

// Props
interface Props {
  isVisible: boolean
  message?: string
  isRetrying?: boolean
  retryCount?: number
  maxRetries?: number
  retryReason?: string
}

withDefaults(defineProps<Props>(), {
  message: 'AI 正在思考中，请稍候...',
  isRetrying: false,
})
</script>

<style scoped>
.ai-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.ai-loading-content {
  background: white;
  padding: var(--spacing-2xl);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  min-width: 300px;
  max-width: 400px;
  width: 90%;
  text-align: center;
}
</style>
