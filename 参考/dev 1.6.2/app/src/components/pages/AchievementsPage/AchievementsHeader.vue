<!--
  AchievementsHeader 组件

  成就页面头部组件，显示标题和统计信息。

  功能：
  - 显示页面标题
  - 显示成就统计（已解锁/总数）
  - 显示解锁进度百分比

  Props:
  - pageTitle (string): 页面标题
  - unlockedCount (number): 已解锁成就数量
  - totalCount (number): 成就总数
-->
<template>
  <header class="achievements-header">
    <h2 id="page-title">{{ pageTitle }}</h2>
    <div v-if="totalCount > 0" class="achievements-stats">
      <div class="stat-item">
        <span class="stat-value">{{ unlockedCount }}</span>
        <span class="stat-label">已解锁</span>
      </div>
      <div class="stat-divider">/</div>
      <div class="stat-item">
        <span class="stat-value">{{ totalCount }}</span>
        <span class="stat-label">总计</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ completionRate }}%</span>
        <span class="stat-label">完成度</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  pageTitle: string
  totalCount: number
  unlockedCount: number
  completionRate: number
}

defineProps<Props>()
</script>

<style scoped>
/* 标题和统计区 */
.achievements-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.achievements-header h2 {
  color: var(--primary-blue);
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  background: linear-gradient(135deg, var(--primary-blue), var(--gold));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.achievements-stats {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05));
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-lg);
  border: 2px solid rgba(255, 215, 0, 0.3);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.stat-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--gold);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.stat-divider {
  font-size: var(--text-xl);
  color: var(--text-muted);
  font-weight: var(--font-light);
}

@media (max-width: 768px) {
  .achievements-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .achievements-header h2 {
    font-size: var(--text-2xl);
  }

  .achievements-stats {
    width: 100%;
    justify-content: space-around;
  }
}

@media (max-width: 480px) {
  .achievements-stats {
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .stat-value {
    font-size: var(--text-xl);
  }
}
</style>
