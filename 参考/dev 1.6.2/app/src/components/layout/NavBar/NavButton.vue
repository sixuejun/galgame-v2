<!--
  NavButton 组件

  导航按钮组件，用于页面导航。

  功能：
  - 显示图标和文本
  - 激活状态样式
  - 点击导航
  - 无障碍支持

  Props:
  - icon (IconData): 图标数据对象
  - name (string): 按钮文本
  - isActive (boolean, 默认: false): 是否激活

  Emits:
  - click(): 点击按钮时触发
-->
<template>
  <button
    :class="['nav-button', { active: isActive }]"
    :aria-label="`导航到${name}`"
    :aria-current="isActive ? 'page' : undefined"
    @click="$emit('click')"
  >
    <Icon :icon-data="icon" :alt="`${name}按钮`" />
    <span class="nav-button-text">{{ name }}</span>
  </button>
</template>

<script setup lang="ts">
import Icon from '../../common/Icon.vue'

defineProps<{
  icon: string
  name: string
  isActive: boolean
}>()

defineEmits<{
  click: []
}>()
</script>

<style scoped>
.nav-button {
  background: rgba(0, 128, 255, 0.08);
  border: 2px solid rgba(0, 128, 255, 0.2);
  cursor: pointer;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--primary-blue);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  transition: all var(--transition-base) cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  min-height: 44px;
}

.nav-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 128, 255, 0.1), rgba(0, 191, 255, 0.1));
  opacity: 0;
  transition: opacity var(--transition-base) ease;
}

.nav-button:hover {
  background: rgba(0, 128, 255, 0.15);
  border-color: rgba(0, 128, 255, 0.5);
  color: var(--primary-blue);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 128, 255, 0.25);
}

.nav-button:hover::before {
  opacity: 1;
}

.nav-button:active {
  transform: translateY(0);
}

.nav-button.active {
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  border-color: var(--primary-blue);
  color: white;
  box-shadow:
    0 4px 16px rgba(0, 128, 255, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.nav-button.active::before {
  opacity: 0;
}

.nav-button :deep(.custom-icon) {
  font-size: var(--text-xl);
  transition: transform var(--transition-base) ease;
}

.nav-button:hover :deep(.custom-icon) {
  transform: scale(1.1);
}

.nav-button-text {
  position: relative;
  z-index: 1;
  white-space: nowrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-button {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--text-xs);
  }

  .nav-button :deep(.custom-icon) {
    font-size: var(--text-lg);
  }
}

@media (max-width: 480px) {
  .nav-button-text {
    display: none;
  }

  .nav-button {
    padding: var(--spacing-sm);
    min-width: 44px;
    justify-content: center;
  }
}
</style>
