<!--
  ProgressBar 组件

  进度条组件，用于显示进度百分比和数值。

  功能：
  - 显示动态进度条
  - 显示当前值/最大值（支持千位分隔符）
  - 显示标签文本
  - 支持自定义颜色（CSS变量或渐变）
  - 平滑动画效果
  - 悬停交互效果
  - 无障碍支持

  Props:
  - current (number): 当前值
  - max (number): 最大值
  - label (string): 标签文本
  - barClass (string): 进度条颜色类名或CSS颜色值

  使用示例：
  <ProgressBar
    label="经验值"
    :current="750"
    :max="1000"
    bar-class="gold"
  />
  <ProgressBar
    label="生命值"
    :current="80"
    :max="100"
    bar-class="linear-gradient(90deg, #ff6b6b, #ee5a6f)"
  />
-->
<template>
  <div class="progress-item">
    <div class="progress-label">
      <span>{{ label }}</span>
      <span>{{ current.toLocaleString() }} / {{ max.toLocaleString() }}</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" :style="fillStyle"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Props 定义
 */
interface Props {
  /** 标签文本 */
  label: string
  /** 当前值 */
  current: number
  /** 最大值 */
  max: number
  /** 进度条颜色类名或CSS颜色值（如 'gold', 'linear-gradient(...)'） */
  barClass: string
}

const props = defineProps<Props>()

/**
 * 计算进度百分比（0-100）
 */
const percentage = computed(() => {
  return Math.max(0, Math.min(100, (props.current / props.max) * 100))
})

/**
 * 检查字符串是否为有效的CSS颜色值
 * @param colorStr - 颜色字符串
 * @returns 是否为有效的CSS颜色
 */
const isCssColor = (colorStr: string): boolean => {
  if (!colorStr) return false
  const s = new Option().style
  s.color = colorStr
  return s.color !== ''
}

/**
 * 判断是否使用直接样式（渐变或CSS颜色值）
 */
const isDirectStyle = computed(() => {
  return props.barClass.includes('gradient') || isCssColor(props.barClass)
})

/**
 * 计算进度条填充样式
 * 支持两种模式：
 * 1. 直接样式：渐变或CSS颜色值
 * 2. CSS变量：使用 --progress-{barClass} 变量
 */
const fillStyle = computed(() => {
  const width = `width: ${percentage.value}%`
  if (isDirectStyle.value) {
    return `${width}; background: ${props.barClass};`
  } else {
    return `${width}; background-color: var(--progress-${props.barClass.replace('-bar', '')}, var(--primary-blue));`
  }
})
</script>

<style scoped>
.progress-item {
  margin-bottom: var(--spacing-md);
  transition: transform var(--transition-base) ease;
}

.progress-item:last-child {
  margin-bottom: 0;
}

.progress-item:hover {
  transform: translateX(4px);
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  font-weight: var(--font-medium);
  color: var(--text-dark);
  font-size: var(--text-sm);
}

.progress-label span:first-child {
  font-weight: var(--font-semibold);
}

.progress-label span:last-child {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-weight: var(--font-normal);
  background: var(--gray-100);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.progress-bar {
  width: 100%;
  height: 28px;
  background: var(--gray-100);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--gray-200);
}

.progress-fill {
  height: 100%;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-full);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.progress-fill::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent);
  border-radius: var(--radius-full) var(--radius-full) 0 0;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.2) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.2) 75%,
    transparent 75%,
    transparent
  );
  background-size: 40px 40px;
  animation: progress-stripes 1.5s linear infinite;
}

@keyframes progress-stripes {
  from {
    background-position: 40px 0;
  }
  to {
    background-position: 0 0;
  }
}
</style>
