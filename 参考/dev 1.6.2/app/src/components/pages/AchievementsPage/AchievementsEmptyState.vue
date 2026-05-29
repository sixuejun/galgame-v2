<!--
  AchievementsEmptyState 组件

  成就空状态组件，当没有成就时显示。

  功能：
  - 显示空状态图标和提示信息
  - 提供前往主页的按钮

  Emits:
  - navigate-to-home(): 点击前往主页按钮时触发
-->
<template>
  <section class="empty-state" role="status">
    <div class="empty-icon">
      <i class="fas fa-trophy" aria-hidden="true"></i>
    </div>
    <h3>暂无成就</h3>
    <p>继续游戏以解锁更多成就！</p>
    <button class="btn-primary" aria-label="跳转主页继续游戏" @click="emit('navigate-to-home')">
      <i class="fas fa-play" aria-hidden="true"></i>
      跳转主页继续游戏
    </button>
  </section>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  'navigate-to-home': []
}>()
</script>

<style scoped>
/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.05), rgba(255, 215, 0, 0.02));
  border-radius: var(--radius-xl);
  border: 2px dashed rgba(255, 215, 0, 0.3);
  margin: var(--spacing-xl) 0;
}

.empty-icon {
  font-size: 5rem;
  color: var(--gold);
  margin-bottom: var(--spacing-lg);
  display: inline-block;
  opacity: 0.6;
  animation: float 3s ease-in-out infinite;
}

.empty-icon i {
  filter: drop-shadow(0 4px 8px rgba(255, 215, 0, 0.3));
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

.btn-primary {
  padding: var(--spacing-md) var(--spacing-xl);
  background: linear-gradient(135deg, var(--gold), #ffa500);
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
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #ffa500, var(--gold));
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
}

.btn-primary i {
  font-size: var(--text-lg);
}
</style>
