<!--
  EmptyState 组件

  通用空状态组件，用于显示无数据时的友好提示。

  功能：
  - 支持自定义图标、标题、描述
  - 支持可选的操作按钮
  - 支持多种主题配色（金色、紫色、粉色、蓝色、默认）
  - 图标浮动动画效果
  - 响应式设计
  - 无障碍支持（ARIA 属性）

  Props:
  - icon: 图标类名（Font Awesome）
  - title: 标题文本
  - description: 描述文本
  - buttonText: 按钮文本（可选）
  - buttonIcon: 按钮图标（可选）
  - buttonAriaLabel: 按钮的 ARIA 标签（可选）
  - theme: 主题配色（可选，默认为 'default'）

  Emits:
  - button-click: 当按钮被点击时触发

  使用示例：
  <EmptyState
    icon="fas fa-inbox"
    title="暂无数据"
    description="开始使用后会显示内容"
    button-text="开始使用"
    button-icon="fas fa-plus"
    theme="blue"
    @button-click="handleStart"
  />
-->
<template>
  <section class="empty-state" :class="`theme-${theme}`" role="status">
    <div class="empty-icon">
      <i :class="icon" aria-hidden="true"></i>
    </div>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <button
      v-if="buttonText"
      class="btn-primary"
      :aria-label="buttonAriaLabel || buttonText"
      @click="handleButtonClick"
    >
      <i v-if="buttonIcon" :class="buttonIcon" aria-hidden="true"></i>
      {{ buttonText }}
    </button>
  </section>
</template>

<script setup lang="ts">
/**
 * Props 定义
 * @property {string} icon - 图标类名（Font Awesome）
 * @property {string} title - 标题文本
 * @property {string} description - 描述文本
 * @property {string} [buttonText] - 按钮文本（可选）
 * @property {string} [buttonIcon] - 按钮图标（可选）
 * @property {string} [buttonAriaLabel] - 按钮的 ARIA 标签（可选）
 * @property {'gold' | 'purple' | 'pink' | 'blue' | 'default'} [theme='default'] - 主题配色
 */
interface Props {
  /** 图标类名（Font Awesome） */
  icon: string
  /** 标题文本 */
  title: string
  /** 描述文本 */
  description: string
  /** 按钮文本（可选） */
  buttonText?: string
  /** 按钮图标（可选） */
  buttonIcon?: string
  /** 按钮的 ARIA 标签（可选） */
  buttonAriaLabel?: string
  /** 主题配色 */
  theme?: 'gold' | 'purple' | 'pink' | 'blue' | 'default'
}

withDefaults(defineProps<Props>(), {
  theme: 'default',
})

/**
 * Emits 定义
 * @event button-click - 当按钮被点击时触发
 */
const emit = defineEmits<{
  'button-click': []
}>()

/**
 * 处理按钮点击
 */
const handleButtonClick = () => {
  emit('button-click')
}
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  border-radius: var(--radius-xl);
  border: 2px dashed;
  margin: var(--spacing-xl) 0;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 默认主题 */
.empty-state.theme-default {
  background: linear-gradient(135deg, rgba(0, 128, 255, 0.05), rgba(0, 191, 255, 0.02));
  border-color: rgba(0, 128, 255, 0.3);
}

.empty-state.theme-default .empty-icon {
  color: var(--primary-blue);
}

.empty-state.theme-default .empty-icon i {
  filter: drop-shadow(0 4px 8px rgba(0, 128, 255, 0.3));
}

/* 金色主题 - 成就 */
.empty-state.theme-gold {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.05), rgba(255, 215, 0, 0.02));
  border-color: rgba(255, 215, 0, 0.3);
}

.empty-state.theme-gold .empty-icon {
  color: var(--gold);
}

.empty-state.theme-gold .empty-icon i {
  filter: drop-shadow(0 4px 8px rgba(255, 215, 0, 0.3));
}

.empty-state.theme-gold .btn-primary {
  background: linear-gradient(135deg, var(--gold), #ffa500);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.empty-state.theme-gold .btn-primary:hover {
  background: linear-gradient(135deg, #ffa500, var(--gold));
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
}

/* 紫色主题 - 仓库 */
.empty-state.theme-purple {
  background: linear-gradient(135deg, rgba(147, 112, 219, 0.05), rgba(138, 43, 226, 0.02));
  border-color: rgba(147, 112, 219, 0.3);
}

.empty-state.theme-purple .empty-icon {
  color: var(--purple);
}

.empty-state.theme-purple .empty-icon i {
  filter: drop-shadow(0 4px 8px rgba(147, 112, 219, 0.3));
}

.empty-state.theme-purple .btn-primary {
  background: linear-gradient(135deg, var(--purple), #8a2be2);
  box-shadow: 0 4px 12px rgba(147, 112, 219, 0.3);
}

.empty-state.theme-purple .btn-primary:hover {
  background: linear-gradient(135deg, #8a2be2, var(--purple));
  box-shadow: 0 6px 20px rgba(147, 112, 219, 0.5);
}

/* 粉色主题 - 商店 */
.empty-state.theme-pink {
  background: linear-gradient(135deg, rgba(255, 105, 180, 0.05), rgba(255, 182, 193, 0.02));
  border-color: rgba(255, 105, 180, 0.3);
}

.empty-state.theme-pink .empty-icon {
  color: var(--accent-pink);
}

.empty-state.theme-pink .empty-icon i {
  filter: drop-shadow(0 4px 8px rgba(255, 105, 180, 0.3));
}

.empty-state.theme-pink .btn-primary {
  background: linear-gradient(135deg, var(--accent-pink), #ffb6d9);
  box-shadow: 0 4px 12px rgba(255, 105, 180, 0.3);
}

.empty-state.theme-pink .btn-primary:hover {
  background: linear-gradient(135deg, #ffb6d9, var(--accent-pink));
  box-shadow: 0 6px 20px rgba(255, 105, 180, 0.5);
}

/* 蓝色主题 */
.empty-state.theme-blue {
  background: linear-gradient(135deg, rgba(0, 128, 255, 0.05), rgba(0, 191, 255, 0.02));
  border-color: rgba(0, 128, 255, 0.3);
}

.empty-state.theme-blue .empty-icon {
  color: var(--primary-blue);
}

.empty-state.theme-blue .empty-icon i {
  filter: drop-shadow(0 4px 8px rgba(0, 128, 255, 0.3));
}

.empty-state.theme-blue .btn-primary {
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  box-shadow: 0 4px 12px rgba(0, 128, 255, 0.3);
}

.empty-state.theme-blue .btn-primary:hover {
  background: linear-gradient(135deg, var(--secondary-blue), var(--primary-blue));
  box-shadow: 0 6px 20px rgba(0, 128, 255, 0.5);
}

/* 图标样式 */
.empty-icon {
  font-size: 5rem;
  margin-bottom: var(--spacing-lg);
  display: inline-block;
  opacity: 0.6;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* 文字样式 */
.empty-state h3 {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: var(--spacing-md) 0;
}

.empty-state p {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
}

/* 按钮样式 */
.btn-primary {
  padding: var(--spacing-md) var(--spacing-xl);
  border: none;
  border-radius: var(--radius-lg);
  color: white;
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: all var(--transition-base);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.btn-primary i {
  font-size: var(--text-lg);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .empty-state {
    min-height: 300px;
    padding: var(--spacing-xl);
  }

  .empty-icon {
    font-size: 4rem;
  }

  .empty-state h3 {
    font-size: var(--text-xl);
  }

  .empty-state p {
    font-size: var(--text-base);
  }
}
</style>
