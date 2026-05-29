<!--
  ReviewPage 组件

  回顾页面，用于查看和管理游戏剧情摘要。

  功能：
  - 显示游戏剧情摘要时间线
  - 配置显示和发送给 AI 的摘要数量
  - 支持加载更多摘要
  - 重置配置到默认值
  - 空状态提示
  - 错误边界保护

  Props:
  - config (Config, 可选): 游戏配置对象
  - summaries (Summary[], 默认: []): 剧情摘要列表

  使用示例:
  ```vue
  <ReviewPage
    :config="gameConfig"
    :summaries="gameSummaries"
  />
  ```
-->
<template>
  <ErrorBoundary @error="handleError">
    <div class="review-page">
      <div class="page-header">
        <h1 id="page-title" class="page-title">
          <i class="fas fa-history"></i>
          {{ pageTitle }}
        </h1>
      </div>

      <div class="review-content">
        <!-- 配置面板 -->
        <ReviewConfigPanel
          :display-count="displayCount"
          :send-count="sendCount"
          @update:display-count="handleDisplayCountUpdate"
          @update:send-count="handleSendCountUpdate"
          @reset="resetConfig"
        />

        <!-- 空状态 -->
        <div v-if="!summaries || summaries.length === 0" class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>暂无回顾记录</p>
          <p class="empty-hint">随着游戏进行，这里会显示过往剧情的摘要</p>
        </div>

        <!-- 时间线 -->
        <ReviewTimeline
          v-else
          :summaries="displayedSummaries"
          :has-more="hasMore"
          @load-more="loadMore"
        />
      </div>
    </div>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Config, Summary } from '../../types'
import ErrorBoundary from '../common/ErrorBoundary.vue'
import ReviewConfigPanel from './ReviewPage/ReviewConfigPanel.vue'
import ReviewTimeline from './ReviewPage/ReviewTimeline.vue'
import { logger } from '../../utils/logger'
import { loadFromLocalStorage, saveToLocalStorage } from '../../utils/storage'

const props = defineProps<{
  config?: Config
  summaries?: Summary[]
}>()

// 页面标题 - 使用新数据模型结构
const pageTitle = computed(() => {
  return props.config?.review?.title || '剧情回顾'
})

// 配置状态
const displayCount = ref(5) // 默认显示条数
const sendCount = ref(5) // 发送给AI的条数
const currentDisplayCount = ref(5) // 当前实际显示的条数

// 配置键名
const CONFIG_KEY = 'eden_review_config'

// 计算属性
const displayedSummaries = computed(() => {
  if (!props.summaries) return []
  // 倒序显示（最新的在前），因为摘要是以追加方式添加的
  const reversed = [...props.summaries].reverse()
  return reversed.slice(0, currentDisplayCount.value)
})

const hasMore = computed(() => {
  if (!props.summaries) return false
  return currentDisplayCount.value < props.summaries.length
})

// 方法
const handleDisplayCountUpdate = (value: number) => {
  displayCount.value = value
  currentDisplayCount.value = value
  saveConfig()
}

const handleSendCountUpdate = (value: number) => {
  sendCount.value = value
  saveConfig()
}

const loadMore = () => {
  if (!props.summaries) return
  // 每次加载更多 5 条
  currentDisplayCount.value = Math.min(currentDisplayCount.value + 5, props.summaries.length)
}

const saveConfig = () => {
  const config = {
    displayCount: displayCount.value,
    sendCount: sendCount.value,
  }
  saveToLocalStorage(CONFIG_KEY, config)
  logger.info('✅ 回顾页面配置已保存')
}

const loadConfig = () => {
  const defaultConfig = {
    displayCount: 5,
    sendCount: 5,
  }
  const config = loadFromLocalStorage(CONFIG_KEY, defaultConfig)
  displayCount.value = config.displayCount
  sendCount.value = config.sendCount
  currentDisplayCount.value = displayCount.value
  logger.info('✅ 回顾页面配置已加载')
}

const resetConfig = () => {
  displayCount.value = 5
  sendCount.value = 5
  currentDisplayCount.value = 5
  saveConfig()
  logger.info('✅ 回顾页面配置已重置')
}

// 生命周期
onMounted(() => {
  loadConfig()
})

/**
 * 处理错误
 */
const handleError = (error: Error) => {
  logger.error('回顾页面发生错误:', error)
}

// 暴露配置供外部使用
defineExpose({
  getSendCount: () => sendCount.value,
})
</script>

<style scoped>
.review-page {
  padding: var(--spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeInUp var(--transition-slow) cubic-bezier(0.4, 0, 0.2, 1);
}

.page-header {
  margin-bottom: var(--spacing-xl);
  text-align: center;
  position: relative;
}

.page-header::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-blue), var(--secondary-blue));
  border-radius: 2px;
}

.page-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-md);
  margin: 0;
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-title i {
  color: var(--primary-blue);
  -webkit-text-fill-color: var(--primary-blue);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-secondary);
  background: linear-gradient(135deg, rgba(0, 128, 255, 0.03), rgba(0, 191, 255, 0.02));
  border-radius: var(--radius-xl);
  border: 2px dashed rgba(0, 128, 255, 0.2);
  margin: var(--spacing-xl) 0;
}

.empty-state i {
  font-size: 5rem;
  color: var(--text-tertiary);
  margin-bottom: var(--spacing-lg);
  display: block;
  opacity: 0.5;
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

.empty-state p {
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  margin: var(--spacing-md) 0;
}

.empty-hint {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  margin-top: var(--spacing-sm);
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .review-page {
    padding: var(--spacing-md);
  }

  .page-title {
    font-size: var(--text-2xl);
  }
}
</style>
