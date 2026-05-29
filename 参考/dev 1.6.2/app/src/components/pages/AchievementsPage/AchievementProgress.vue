<!--
  AchievementProgress 组件

  成就进度条组件，显示成就的完成进度。

  功能：
  - 单条件成就：显示具体数值进度（如 100/10000）
  - 多条件成就：显示已完成条件数/总条件数（如 2/3）
  - 支持悬停显示详细进度
  - 根据稀有度应用不同的进度条样式
  - 动画效果和无障碍支持

  Props:
  - achievement (Achievement): 成就数据对象
  - gameData (GameData): 游戏数据对象
-->
<template>
  <div v-if="progress.hasSchedule" class="achievement-progress">
    <!-- 单条件进度 -->
    <div v-if="progress.isSingleCondition" class="progress-single">
      <div class="progress-label">
        <span class="progress-text">{{ progressText }}</span>
        <span class="progress-percentage">{{ Math.round(progress.overallPercentage) }}%</span>
      </div>
      <div class="progress-bar-container">
        <div
          :class="['progress-bar-fill', progressBarClass]"
          :style="{ width: `${progress.overallPercentage}%` }"
          role="progressbar"
          :aria-valuenow="progress.conditions[0].current"
          :aria-valuemin="0"
          :aria-valuemax="progress.conditions[0].target"
          :aria-label="`进度: ${progressText}`"
        ></div>
      </div>
    </div>

    <!-- 多条件进度 -->
    <div v-else class="progress-multi">
      <div class="progress-label">
        <span class="progress-text">已完成 {{ progressText }}</span>
        <span class="progress-percentage">{{ Math.round(progress.overallPercentage) }}%</span>
      </div>
      <div class="progress-bar-container">
        <div
          :class="['progress-bar-fill', progressBarClass]"
          :style="{ width: `${progress.overallPercentage}%` }"
          role="progressbar"
          :aria-valuenow="progress.completedCount"
          :aria-valuemin="0"
          :aria-valuemax="progress.totalCount"
          :aria-label="`已完成条件: ${progressText}`"
        ></div>
      </div>

      <!-- 详细条件列表（悬浮窗） -->
      <div class="conditions-tooltip">
        <div class="conditions-header">
          <i class="fas fa-list-check" aria-hidden="true"></i>
          <span>详细进度</span>
        </div>
        <div class="conditions-list">
          <div
            v-for="(condition, index) in progress.conditions"
            :key="index"
            :class="['condition-item', { completed: condition.completed }]"
          >
            <i
              :class="[
                'condition-icon',
                condition.completed ? 'fas fa-check-circle' : 'far fa-circle',
              ]"
              aria-hidden="true"
            ></i>
            <span class="condition-path">{{ condition.desc }}</span>
            <span class="condition-value">
              {{ condition.current.toLocaleString() }} / {{ condition.target.toLocaleString() }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import type { Achievement, GameData } from '../../../types'
import { useAchievementProgress } from '../../../composables/achievement/useAchievementProgress'

const props = defineProps<{
  achievement: Achievement
  gameData: GameData
}>()

// 使用 toRef 将 props 转换为响应式引用
const achievementRef = toRef(props, 'achievement')
const gameDataRef = toRef(props, 'gameData')

const { progress, progressText, progressBarClass } = useAchievementProgress(
  gameDataRef,
  achievementRef
)
</script>

<style scoped>
.achievement-progress {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) 0;
}

/* 进度标签 */
.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
  font-size: var(--text-xs);
  color: var(--text-muted);
  /* 确保文字不受父元素 filter 影响 */
  filter: none !important;
  opacity: 1 !important;
}

.progress-text {
  font-weight: var(--font-medium);
  color: var(--text-dark);
}

.progress-percentage {
  font-weight: var(--font-semibold);
  color: var(--primary-blue);
}

/* 进度条容器 */
.progress-bar-container {
  width: 100%;
  height: 8px;
  background: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
  /* 确保进度条不受父元素 filter 影响 */
  filter: none !important;
  opacity: 1 !important;
}

/* 进度条填充 */
.progress-bar-fill {
  height: 100%;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: var(--radius-full);
  position: relative;
  overflow: hidden;
  /* 确保进度条颜色不受父元素影响 */
  filter: none !important;
  opacity: 1 !important;
}

/* 进度条光泽效果 */
.progress-bar-fill::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent);
  border-radius: var(--radius-full) var(--radius-full) 0 0;
}

/* 稀有度样式 - 普通 */
.progress-bar-fill.progress-bar-common {
  background: var(--rarity-common);
}

/* 稀有度样式 - 稀有 */
.progress-bar-fill.progress-bar-rare {
  background: var(--rarity-rare);
}

/* 稀有度样式 - 史诗 */
.progress-bar-fill.progress-bar-epic {
  background: var(--rarity-epic);
}

/* 稀有度样式 - 传说 */
.progress-bar-fill.progress-bar-legendary {
  background: linear-gradient(90deg, var(--gold), var(--gold-light), var(--gold));
  background-size: 200% 100%;
  animation: shimmer 3s linear infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 多条件详细信息 - 悬浮窗 */
.progress-multi {
  position: relative;
}

.conditions-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  margin-bottom: 0;
  padding: var(--spacing-sm);
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-300);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: all var(--transition-base) ease;
  z-index: 1000;
  min-width: 200px;
  max-width: 300px;
  /* 确保悬浮窗不受父元素 filter 影响 */
  filter: none !important;
}

/* 悬浮窗箭头 */
.conditions-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: white;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1));
}

.progress-multi:hover .conditions-tooltip {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateX(-50%) translateY(-4px);
}

.conditions-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-dark);
  padding-bottom: var(--spacing-xs);
  border-bottom: 1px solid var(--gray-200);
}

.conditions-header i {
  color: var(--primary-blue);
}

.conditions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.condition-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs);
  background: var(--gray-50);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  transition: all var(--transition-base) ease;
}

.condition-item:hover {
  background: var(--gray-100);
}

.condition-item.completed {
  opacity: 0.7;
}

.condition-icon {
  flex-shrink: 0;
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.condition-item.completed .condition-icon {
  color: var(--success);
}

.condition-path {
  flex: 1;
  font-weight: var(--font-medium);
  color: var(--text-dark);
}

.condition-value {
  flex-shrink: 0;
  font-weight: var(--font-semibold);
  color: var(--text-muted);
  font-size: var(--text-xs);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .progress-label {
    font-size: 10px;
  }

  .progress-bar-container {
    height: 6px;
  }

  .conditions-tooltip {
    padding: var(--spacing-xs);
    min-width: 180px;
    max-width: 250px;
  }

  .condition-item {
    font-size: 10px;
  }

  .conditions-header {
    font-size: 10px;
  }
}
</style>
