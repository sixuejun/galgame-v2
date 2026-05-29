<!--
  ToastContainer 组件

  用于显示全局 Toast 通知消息的容器组件。

  功能：
  - 显示不同类型的通知（成功、错误、警告、信息）
  - 支持点击关闭
  - 自动过期消失
  - 平滑的进入/退出动画
  - 响应式设计，适配移动端

  Toast 类型：
  - success: 成功消息（绿色）
  - error: 错误消息（红色）
  - warning: 警告消息（黄色）
  - info: 信息消息（蓝色）

  使用方式：
  通过 useToast() composable 调用：
  const { success, error, warning, info } = useToast()
  success('操作成功！')
-->
<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', `toast-${toast.type}`]"
        @click="removeToast(toast.id)"
      >
        <div class="toast-icon">
          <i :class="getIcon(toast.type)"></i>
        </div>
        <div class="toast-message">{{ toast.message }}</div>
        <button class="toast-close" @click.stop="removeToast(toast.id)">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '../../composables/ui/useToast'

// 使用 Toast composable 获取 toasts 列表和移除方法
const { toasts, removeToast } = useToast()

/**
 * 根据 Toast 类型获取对应的图标类名
 * @param type - Toast 类型（success, error, warning, info）
 * @returns FontAwesome 图标类名
 */
const getIcon = (type: string) => {
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle',
  }
  return icons[type as keyof typeof icons] || icons.info
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  right: var(--spacing-lg);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  pointer-events: none;
  max-width: 500px;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg) var(--spacing-xl);
  background: white;
  border-radius: var(--radius-xl);
  box-shadow:
    var(--shadow-2xl),
    0 0 30px rgba(0, 0, 0, 0.1);
  min-width: 320px;
  max-width: 500px;
  pointer-events: auto;
  cursor: pointer;
  transition: all var(--transition-base) var(--ease-out);
  border-left: 5px solid;
  position: relative;
  overflow: hidden;
}

.toast::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.5) 100%);
  opacity: 0;
  transition: opacity var(--transition-base) var(--ease-out);
  pointer-events: none;
}

.toast:hover::before {
  opacity: 1;
}

.toast:hover {
  transform: translateX(-8px) scale(1.02);
  box-shadow:
    var(--shadow-2xl),
    0 8px 40px rgba(0, 0, 0, 0.15);
}

.toast-success {
  border-left-color: var(--success);
}

.toast-success::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  background: linear-gradient(180deg, var(--success-light), var(--success-dark));
  box-shadow: 0 0 15px var(--success);
}

.toast-error {
  border-left-color: var(--error);
}

.toast-error::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  background: linear-gradient(180deg, var(--error-light), var(--error-dark));
  box-shadow: 0 0 15px var(--error);
}

.toast-warning {
  border-left-color: var(--warning);
}

.toast-warning::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  background: linear-gradient(180deg, var(--warning-light), var(--warning-dark));
  box-shadow: 0 0 15px var(--warning);
}

.toast-info {
  border-left-color: var(--info);
}

.toast-info::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  background: linear-gradient(180deg, var(--info-light), var(--info-dark));
  box-shadow: 0 0 15px var(--info);
}

.toast-icon {
  font-size: var(--text-2xl);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.toast-success .toast-icon {
  color: var(--success);
}

.toast-error .toast-icon {
  color: var(--error);
}

.toast-warning .toast-icon {
  color: var(--warning);
}

.toast-info .toast-icon {
  color: var(--info);
}

.toast-message {
  flex: 1;
  color: var(--text-dark);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  font-weight: var(--font-medium);
  position: relative;
  z-index: 1;
}

.toast-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast) var(--ease-out);
  position: relative;
  z-index: 1;
}

.toast-close:hover {
  background: var(--gray-200);
  color: var(--text-dark);
  transform: rotate(90deg);
}

/* 动画 */
.toast-enter-active {
  transition: all var(--transition-slow) var(--ease-bounce);
}

.toast-leave-active {
  transition: all var(--transition-base) var(--ease-in);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(120%) scale(0.8);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(120%) scale(0.7);
}

.toast-move {
  transition: transform var(--transition-base) var(--ease-out);
}

@media (max-width: 768px) {
  .toast-container {
    right: var(--spacing-md);
    left: var(--spacing-md);
  }

  .toast {
    min-width: auto;
    max-width: none;
  }
}
</style>
