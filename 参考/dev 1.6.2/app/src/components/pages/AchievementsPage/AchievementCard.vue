<!--
  AchievementCard 组件

  成就卡片组件，显示单个成就的信息。

  功能：
  - 显示成就图标、名称、描述
  - 区分已解锁和未解锁状态
  - 显示稀有度样式
  - 显示解锁时间
  - 无障碍支持

  Props:
  - achievement (Achievement): 成就数据对象
-->
<template>
  <article
    :class="[
      'achievement-card',
      achievement.unlocked ? 'unlocked' : 'locked',
      `rarity-${normalizedRarity}`,
    ]"
    role="article"
    :aria-label="`成就：${achievement.name}，${achievement.unlocked ? '已解锁' : '未解锁'}`"
  >
    <div class="rarity-badge" role="text" :aria-label="`稀有度：${rarityLabel}`">
      {{ rarityLabel }}
    </div>
    <div class="achievement-icon" aria-hidden="true">
      <Icon :icon-data="achievement.icon" :alt="`${achievement.name}成就图标`" />
    </div>
    <h3 class="achievement-name">{{ achievement.name }}</h3>
    <p class="achievement-desc">{{ achievement.desc }}</p>

    <!-- 进度条（未解锁时显示） -->
    <AchievementProgress
      v-if="!achievement.unlocked"
      :achievement="achievement"
      :game-data="gameData"
    />

    <!-- 解锁日期（已解锁时显示） -->
    <div
      v-if="achievement.unlocked && achievement.date"
      class="achievement-date"
      role="text"
      :aria-label="`解锁日期：${formattedDate}`"
    >
      <i class="fas fa-calendar-alt" aria-hidden="true"></i>
      {{ formattedDate }}
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Achievement } from '../../../types'
import Icon from '../../common/Icon.vue'
import AchievementProgress from './AchievementProgress.vue'
import { formatDate } from '../../../utils/dateUtils'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../../../stores/gameStore'

const props = defineProps<{
  achievement: Achievement
}>()

// 从 store 获取游戏数据
const { gameData } = storeToRefs(useGameStore())

const formattedDate = computed(() => {
  return props.achievement.date ? formatDate(props.achievement.date) : ''
})

const normalizedRarity = computed(() => {
  return (props.achievement.rarity || 'common').toLowerCase()
})

const rarityLabel = computed(() => {
  const labels: Record<string, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说',
  }
  return labels[normalizedRarity.value] || '普通'
})
</script>

<style scoped>
.achievement-card {
  background: white;
  border: 2px solid var(--gray-300);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  text-align: center;
  transition: all var(--transition-base) ease;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.achievement-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gray-300);
  transition: all var(--transition-base) ease;
}

.achievement-card.locked {
  opacity: 0.5;
}

.achievement-card.locked:hover {
  opacity: 0.7;
}

/* 未解锁成就的灰度效果 - 只应用于图标、文字和徽章，不影响进度条 */
.achievement-card.locked .achievement-icon,
.achievement-card.locked .achievement-name,
.achievement-card.locked .achievement-desc,
.achievement-card.locked .rarity-badge {
  filter: grayscale(1);
}

/* 稀有度徽章 */
.rarity-badge {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--gray-200);
  color: var(--gray-600);
  transition: all var(--transition-base) ease;
}

/* 普通稀有度 */
.achievement-card.rarity-common.unlocked {
  border-color: var(--rarity-common);
}

.achievement-card.rarity-common.unlocked::before {
  background: var(--rarity-common);
}

.achievement-card.rarity-common .rarity-badge {
  background: var(--rarity-common);
  color: white;
}

.achievement-card.rarity-common.unlocked:hover {
  box-shadow: 0 4px 16px rgba(156, 163, 175, 0.3);
  transform: translateY(-4px);
}

/* 稀有稀有度 */
.achievement-card.rarity-rare.unlocked {
  border-color: var(--rarity-rare);
  background: linear-gradient(to bottom, white, rgba(59, 130, 246, 0.05));
}

.achievement-card.rarity-rare.unlocked::before {
  background: linear-gradient(90deg, var(--rarity-rare), var(--info));
}

.achievement-card.rarity-rare .rarity-badge {
  background: linear-gradient(135deg, var(--rarity-rare), var(--info));
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.achievement-card.rarity-rare.unlocked:hover {
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
  transform: translateY(-6px);
}

/* 史诗稀有度 */
.achievement-card.rarity-epic.unlocked {
  border-color: var(--rarity-epic);
  background: linear-gradient(135deg, white, rgba(147, 112, 219, 0.08));
  border-width: 3px;
}

.achievement-card.rarity-epic.unlocked::before {
  background: linear-gradient(90deg, var(--rarity-epic), var(--purple-light));
  height: 5px;
}

.achievement-card.rarity-epic .rarity-badge {
  background: linear-gradient(135deg, var(--rarity-epic), var(--purple-light));
  color: white;
  box-shadow: 0 2px 12px rgba(147, 112, 219, 0.4);
}

.achievement-card.rarity-epic.unlocked:hover {
  box-shadow: 0 12px 32px rgba(147, 112, 219, 0.5);
  transform: translateY(-8px) scale(1.02);
}

.achievement-card.rarity-epic.unlocked .achievement-icon {
  animation: pulse 2s ease-in-out infinite;
}

/* 传说稀有度 */
.achievement-card.rarity-legendary.unlocked {
  border-color: var(--rarity-legendary);
  background: linear-gradient(135deg, white, rgba(255, 215, 0, 0.1));
  border-width: 3px;
  border-style: solid;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

.achievement-card.rarity-legendary.unlocked::before {
  background: linear-gradient(90deg, var(--gold), var(--gold-light), var(--gold));
  background-size: 200% 100%;
  animation: shimmer 3s linear infinite;
  height: 6px;
}

.achievement-card.rarity-legendary .rarity-badge {
  background: linear-gradient(135deg, var(--gold), var(--gold-light));
  color: var(--gray-900);
  box-shadow: 0 2px 16px rgba(255, 215, 0, 0.5);
  animation: pulse 2s ease-in-out infinite;
}

.achievement-card.rarity-legendary.unlocked:hover {
  box-shadow: 0 16px 40px rgba(255, 215, 0, 0.6);
  transform: translateY(-10px) scale(1.05);
}

.achievement-card.rarity-legendary.unlocked .achievement-icon {
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

/* 图标样式 */
.achievement-icon {
  font-size: 56px;
  margin-bottom: var(--spacing-md);
  color: var(--primary-blue);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60px;
  transition: all var(--transition-base) ease;
}

.achievement-card.unlocked:hover .achievement-icon {
  transform: scale(1.1);
}

.achievement-icon :deep(.custom-icon) {
  max-width: 100%;
  max-height: 100%;
}

/* 文字样式 */
.achievement-name {
  font-weight: var(--font-bold);
  margin-bottom: var(--spacing-xs);
  color: var(--text-dark);
  font-size: var(--text-lg);
}

.achievement-desc {
  font-size: var(--text-sm);
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: var(--spacing-sm);
}

.achievement-date {
  font-size: var(--text-xs);
  color: var(--accent-pink);
  margin-top: var(--spacing-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  font-weight: var(--font-medium);
}

@media (max-width: 768px) {
  .achievement-card {
    padding: var(--spacing-md);
  }

  .achievement-icon {
    font-size: 48px;
    height: 50px;
  }

  .achievement-name {
    font-size: var(--text-base);
  }
}
</style>
