<!--
  InitializationPage 组件

  游戏初始化页面，用于生成初始游戏数据。

  功能：
  - 显示系统指令输入框（可选覆盖默认指令）
  - 提供用户自定义输入区域
  - AI 生成初始化数据
  - 显示生成进度和错误信息
  - 支持暴露方法供父组件调用
  - 错误边界保护

  Props:
  - systemInstruction (string, 必需): 默认的系统指令文本

  Emits:
  - generate(systemInstruction: string, userInput: string): 当用户点击生成按钮时触发

  暴露方法:
  - getIsGenerating(): 获取当前是否正在生成
  - getErrorMessage(): 获取错误消息
  - setErrorMessage(message: string): 设置错误消息

  使用示例:
  ```vue
  <InitializationPage
    :system-instruction="defaultInstruction"
    @generate="handleGenerate"
    ref="initPageRef"
  />
  ```
-->
<template>
  <ErrorBoundary @error="handleError">
    <div class="initialization-page">
      <!-- AI 加载遮罩 - 使用统一的 AILoadingOverlay 组件 -->
      <AILoadingOverlay
        :is-visible="isGenerating"
        :message="aiLoadingMessage"
        :is-retrying="isAnyRetrying"
        :retry-count="currentRetryCount"
        :max-retries="currentMaxRetries"
        :retry-reason="currentRetryReason"
      />

      <div class="init-container">
        <!-- 标题区域 -->
        <InitHeader />

        <!-- 系统指令输入区域 -->
        <SystemInstructionInput v-model="systemInstructionInput" :placeholder="systemInstruction" />

        <!-- 用户输入区域 -->
        <UserInputSection v-model="userInput" @submit="handleGenerate" />

        <!-- 生成按钮和错误提示 -->
        <GenerateButton
          :is-generating="isGenerating"
          :error-message="errorMessage"
          @click="handleGenerate"
        />
      </div>
    </div>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ErrorBoundary from '../common/ErrorBoundary.vue'
import AILoadingOverlay from '../layout/AILoadingOverlay.vue'
import InitHeader from './InitializationPage/InitHeader.vue'
import SystemInstructionInput from './InitializationPage/SystemInstructionInput.vue'
import UserInputSection from './InitializationPage/UserInputSection.vue'
import GenerateButton from './InitializationPage/GenerateButton.vue'
import { useAILoadingState } from '../../composables/ai/useAILoadingState'
import { logger } from '../../utils/logger'

// Props
defineProps<{
  systemInstruction: string
}>()

// Emits
const emit = defineEmits<{
  generate: [systemInstruction: string, userInput: string]
}>()

// 使用 AI 加载状态管理
const {
  getLoadingMessage,
  isAnyRetrying,
  currentRetryCount,
  currentMaxRetries,
  currentRetryReason,
} = useAILoadingState()

// 使用动态加载消息
const aiLoadingMessage = computed(() => getLoadingMessage.value)

// State
const systemInstructionInput = ref('')
const userInput = ref('')
const isGenerating = ref(false)
const errorMessage = ref('')

// Methods
const handleGenerate = () => {
  errorMessage.value = ''
  emit('generate', systemInstructionInput.value, userInput.value)
}

/**
 * 错误处理
 */
const handleError = (error: Error) => {
  logger.error('InitializationPage 发生错误:', error)
}

// 暴露方法供父组件调用
defineExpose({
  setGenerating: (value: boolean) => {
    isGenerating.value = value
  },
  setError: (message: string) => {
    errorMessage.value = message
  },
})
</script>

<style scoped>
.initialization-page {
  background: linear-gradient(135deg, #f5f9fc 0%, #e8f0f7 100%);
  padding: var(--spacing-xl) var(--spacing-lg);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.init-container {
  max-width: 800px;
  width: 100%;
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 0 60px rgba(0, 128, 255, 0.15);
  border: 2px solid rgba(0, 128, 255, 0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .initialization-page {
    padding: var(--spacing-lg) var(--spacing-md);
  }

  .init-container {
    padding: var(--spacing-xl);
  }
}

@media (max-width: 480px) {
  .init-container {
    padding: var(--spacing-lg);
  }
}
</style>
