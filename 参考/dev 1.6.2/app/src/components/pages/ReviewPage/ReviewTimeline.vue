<!--
  ReviewTimeline 组件

  回顾时间线组件，以时间线形式显示剧情摘要。

  功能：
  - 时间线布局显示摘要
  - 加载更多摘要
  - 空状态提示
  - 滚动到顶部按钮

  Props:
  - summaries (Summary[]): 剧情摘要列表
  - displayCount (number): 显示数量

  Emits:
  - load-more(): 点击加载更多时触发
-->
<template>
  <div class="timeline">
    <div v-for="(summary, index) in summaries" :key="index" class="timeline-item">
      <div class="timeline-marker">
        <i class="fas fa-circle"></i>
      </div>
      <div class="timeline-content">
        <div class="timeline-time">{{ formatTime(summary.time) }}</div>
        <div class="timeline-text">{{ summary.content }}</div>
      </div>
    </div>

    <!-- 查看更多按钮 -->
    <div v-if="hasMore" class="load-more">
      <button class="load-more-btn" @click="handleLoadMore">
        <i class="fas fa-chevron-down"></i>
        查看更多
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Summary } from '../../../types'
import { logger } from '../../../utils/logger'

interface Props {
  summaries: Summary[]
  hasMore: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  loadMore: []
}>()

const formatTime = (timeStr: string): string => {
  if (!timeStr) return '未知时间'

  try {
    // 尝试解析为日期对象
    const date = new Date(timeStr)

    // 检查是否为有效日期
    if (isNaN(date.getTime())) {
      // 如果不是有效日期，直接返回原始字符串
      logger.debug(`时间格式无效，显示原始字符串: ${timeStr}`)
      return timeStr
    }

    // 如果是有效日期，格式化显示
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch (error) {
    // 解析失败，返回原始字符串
    logger.debug(`时间解析失败，显示原始字符串: ${timeStr}`, error)
    return timeStr
  }
}

const handleLoadMore = () => {
  emit('loadMore')
}
</script>

<style scoped>
/* 时间线 */
.timeline {
  position: relative;
  padding-left: 40px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(to bottom, var(--primary-blue), var(--secondary-blue), transparent);
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(0, 128, 255, 0.3);
}

.timeline-item {
  position: relative;
  margin-bottom: var(--spacing-xl);
  padding-left: var(--spacing-lg);
  animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) backwards;
}

.timeline-item:nth-child(1) {
  animation-delay: 0.1s;
}
.timeline-item:nth-child(2) {
  animation-delay: 0.2s;
}
.timeline-item:nth-child(3) {
  animation-delay: 0.3s;
}
.timeline-item:nth-child(4) {
  animation-delay: 0.4s;
}
.timeline-item:nth-child(5) {
  animation-delay: 0.5s;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.timeline-marker {
  position: absolute;
  left: 0;
  top: 8px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  border-radius: 50%;
  box-shadow:
    0 0 0 4px rgba(0, 128, 255, 0.2),
    0 0 20px rgba(0, 128, 255, 0.4);
  transition: all var(--transition-base);
}

.timeline-item:hover .timeline-marker {
  transform: scale(1.2);
  box-shadow:
    0 0 0 6px rgba(0, 128, 255, 0.3),
    0 0 30px rgba(0, 128, 255, 0.6);
}

.timeline-marker i {
  font-size: 10px;
  color: white;
}

.timeline-content {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(245, 249, 252, 0.95));
  border: 1px solid rgba(0, 128, 255, 0.25);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  transition: all var(--transition-base);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 128, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.timeline-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-blue), var(--secondary-blue));
  opacity: 0;
  transition: opacity var(--transition-base);
}

.timeline-content:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(245, 249, 252, 1));
  border-color: rgba(0, 128, 255, 0.5);
  transform: translateX(8px);
  box-shadow: 0 8px 30px rgba(0, 128, 255, 0.2);
}

.timeline-content:hover::before {
  opacity: 1;
}

.timeline-time {
  font-size: var(--text-xs);
  color: var(--primary-blue);
  margin-bottom: var(--spacing-sm);
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.timeline-time::before {
  content: '📅';
  font-size: var(--text-sm);
}

.timeline-text {
  color: var(--text-primary);
  line-height: 1.8;
  font-size: var(--text-base);
  font-weight: var(--font-normal);
}

/* 查看更多 */
.load-more {
  text-align: center;
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  position: relative;
}

.load-more::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--primary-blue), transparent);
}

.load-more-btn {
  padding: var(--spacing-md) var(--spacing-2xl);
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  border: 1px solid var(--primary-blue-light);
  border-radius: var(--radius-full);
  color: white;
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: all var(--transition-base);
  box-shadow: 0 4px 15px rgba(0, 128, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.load-more-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  transition:
    width 0.6s,
    height 0.6s;
}

.load-more-btn:hover::before {
  width: 300px;
  height: 300px;
}

.load-more-btn:hover {
  background: linear-gradient(135deg, var(--secondary-blue), var(--primary-blue-light));
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 128, 255, 0.5);
}

.load-more-btn:active {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 128, 255, 0.4);
}

.load-more-btn i {
  transition: transform var(--transition-base);
}

.load-more-btn:hover i {
  transform: translateY(3px);
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(5px);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .timeline {
    padding-left: var(--spacing-md);
  }

  .timeline-item {
    padding-left: var(--spacing-md);
  }
}
</style>
