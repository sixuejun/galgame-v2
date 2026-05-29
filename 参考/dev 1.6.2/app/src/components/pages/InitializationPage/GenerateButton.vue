<!--
  GenerateButton 组件

  生成按钮组件，用于触发初始化数据生成。

  功能：
  - 显示生成按钮
  - 生成中显示加载状态
  - 显示错误消息
  - 禁用状态控制

  Props:
  - isGenerating (boolean): 是否正在生成
  - errorMessage (string): 错误消息

  Emits:
  - click(): 点击按钮时触发
-->
<template>
  <div class="action-section">
    <button
      class="generate-btn"
      :disabled="isGenerating"
      aria-label="生成初始化数据"
      @click="emit('click')"
    >
      <i class="fas" :class="isGenerating ? 'fa-spinner fa-spin' : 'fa-magic'"></i>
      <span>{{ isGenerating ? '正在生成中...' : '开始初始化' }}</span>
    </button>
  </div>

  <!-- 错误提示 -->
  <div v-if="errorMessage" class="error-message">
    <i class="fas fa-exclamation-triangle"></i>
    <span>{{ errorMessage }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isGenerating: boolean
  errorMessage: string
}

defineProps<Props>()

const emit = defineEmits<{
  click: []
}>()
</script>

<style scoped>
/* 操作按钮区域 */
.action-section {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-lg);
}

.generate-btn {
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  border: 1px solid var(--primary-blue-light);
  color: white;
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  padding: var(--spacing-md) var(--spacing-2xl);
  border-radius: var(--radius-full);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  transition: all var(--transition-base);
  box-shadow: 0 4px 16px rgba(0, 128, 255, 0.4);
  position: relative;
  overflow: hidden;
}

.generate-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition:
    width 0.6s,
    height 0.6s;
}

.generate-btn:hover::before {
  width: 300px;
  height: 300px;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 128, 255, 0.6);
}

.generate-btn:active:not(:disabled) {
  transform: translateY(0);
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.generate-btn i {
  font-size: var(--text-xl);
  position: relative;
  z-index: 1;
}

.generate-btn span {
  position: relative;
  z-index: 1;
}

/* 错误提示 */
.error-message {
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  color: #fca5a5;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--text-sm);
}

.error-message i {
  font-size: var(--text-lg);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .generate-btn {
    font-size: var(--text-base);
    padding: var(--spacing-sm) var(--spacing-xl);
  }
}
</style>
