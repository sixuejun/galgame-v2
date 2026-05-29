<!--
  AchievementsGrid 组件

  成就网格组件，以网格形式显示成就列表。

  功能：
  - 网格布局显示成就
  - 使用 v-memo 优化性能
  - 区分已解锁和未解锁状态

  Props:
  - achievements (Achievement[]): 成就列表
-->
<template>
  <!-- 成就列表 -->
  <section
    v-if="achievements.length > 0"
    class="achievement-grid"
    role="list"
    aria-label="成就列表"
  >
    <AchievementCard
      v-for="(achievement, key) in achievements"
      :key="key"
      v-memo="[achievement.unlocked, achievement.date]"
      :achievement="achievement"
      role="listitem"
    />
  </section>

  <!-- 无搜索结果 -->
  <section v-else class="no-results" role="status">
    <i class="fas fa-search" aria-hidden="true"></i>
    <p>未找到匹配的成就</p>
  </section>
</template>

<script setup lang="ts">
import type { Achievement } from '../../../types'
import AchievementCard from './AchievementCard.vue'

interface Props {
  achievements: Achievement[]
}

defineProps<Props>()
</script>

<style scoped>
/* 成就网格 */
.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-lg);
}

/* 无搜索结果 */
.no-results {
  text-align: center;
  padding: var(--spacing-3xl);
  color: var(--text-muted);
}

.no-results i {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
  opacity: 0.3;
}

.no-results p {
  font-size: var(--text-lg);
}

@media (max-width: 1024px) {
  .achievement-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--spacing-md);
  }
}

@media (max-width: 768px) {
  .achievement-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--spacing-sm);
  }
}

@media (max-width: 480px) {
  .achievement-grid {
    grid-template-columns: 1fr;
  }
}
</style>
