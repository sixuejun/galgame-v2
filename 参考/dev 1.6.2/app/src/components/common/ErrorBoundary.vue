<!--
  ErrorBoundary 组件

  用于捕获子组件中的错误并显示友好的错误界面。

  功能：
  - 捕获子组件中的运行时错误
  - 显示友好的错误提示界面
  - 提供重试功能
  - 支持自定义错误恢复回调
  - 支持回退到安全状态
  - 阻止错误向上传播
  - 记录错误日志

  Props:
  - fallbackComponent: 自定义错误展示组件
  - onRetry: 重试回调函数
  - onGoBack: 回退回调函数
  - showGoBack: 是否显示回退按钮（默认：false）
  - maxRetries: 最大重试次数（默认：3）

  Emits:
  - error: 当捕获到错误时触发，传递 Error 对象

  使用示例：
  <ErrorBoundary
    @error="handleError"
    :on-retry="handleRetry"
    :on-go-back="handleGoBack"
    :show-go-back="true"
  >
    <YourComponent />
  </ErrorBoundary>
-->
<template>
  <div v-if="error" class="error-boundary">
    <div class="error-icon">⚠️</div>
    <h3 class="error-title">出错了</h3>
    <p class="error-message">{{ error.message }}</p>
    <div class="error-actions">
      <button class="error-retry" :disabled="retryCount >= maxRetries" @click="handleRetry">
        重试 {{ retryCount > 0 ? `(${retryCount}/${maxRetries})` : '' }}
      </button>
      <button v-if="showGoBack" class="error-go-back" @click="handleGoBack">返回</button>
    </div>
    <p v-if="retryCount >= maxRetries" class="error-hint">已达到最大重试次数，请返回或刷新页面</p>
  </div>
  <slot v-else></slot>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { logger } from '../../utils/logger'

interface Props {
  onRetry?: () => void | Promise<void>
  onGoBack?: () => void
  showGoBack?: boolean
  maxRetries?: number
}

const props = withDefaults(defineProps<Props>(), {
  showGoBack: false,
  maxRetries: 3,
})

/**
 * 错误状态
 */
const error = ref<Error | null>(null)
const retryCount = ref(0)

/**
 * Emits 定义
 * @event error - 当捕获到错误时触发
 */
const emit = defineEmits<{
  error: [error: Error]
}>()

onErrorCaptured((err: Error, _instance, info) => {
  logger.error('捕获到错误:', err)
  logger.error('错误信息:', info)

  error.value = err
  emit('error', err)

  // 阻止错误继续向上传播
  return false
})

const handleRetry = async () => {
  if (retryCount.value >= props.maxRetries) {
    logger.warn('已达到最大重试次数')
    return
  }

  retryCount.value++
  logger.info(`尝试重试 (${retryCount.value}/${props.maxRetries})`)

  try {
    if (props.onRetry) {
      await props.onRetry()
    }
    error.value = null
    retryCount.value = 0
  } catch (err) {
    logger.error('重试失败:', err)
    error.value = err instanceof Error ? err : new Error('重试失败')
  }
}

const handleGoBack = () => {
  logger.info('用户选择返回')
  if (props.onGoBack) {
    props.onGoBack()
  }
  error.value = null
  retryCount.value = 0
}
</script>

<style scoped>
.error-boundary {
  padding: var(--spacing-2xl);
  text-align: center;
  background: var(--gray-50);
  border-radius: var(--radius-xl);
  border: 2px dashed var(--error);
  margin: var(--spacing-xl);
}

.error-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
}

.error-title {
  color: var(--error);
  margin-bottom: var(--spacing-sm);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
}

.error-message {
  color: var(--text-muted);
  margin-bottom: var(--spacing-lg);
  font-size: var(--text-base);
}

.error-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  margin-bottom: var(--spacing-md);
}

.error-retry,
.error-go-back {
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  font-weight: var(--font-semibold);
  transition: all var(--transition-base);
  font-size: var(--text-base);
}

.error-retry {
  background: var(--primary-blue);
  color: white;
}

.error-retry:hover:not(:disabled) {
  background: var(--primary-blue-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.error-retry:active:not(:disabled) {
  transform: translateY(0);
}

.error-retry:disabled {
  background: var(--gray-300);
  cursor: not-allowed;
  opacity: 0.6;
}

.error-go-back {
  background: var(--gray-200);
  color: var(--text-primary);
}

.error-go-back:hover {
  background: var(--gray-300);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.error-go-back:active {
  transform: translateY(0);
}

.error-hint {
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin-top: var(--spacing-md);
}
</style>
