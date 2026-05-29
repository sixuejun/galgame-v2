<!--
  StorageEmptyState 组件

  仓库空状态组件，当仓库没有物品时显示。

  功能：
  - 显示空状态图标和提示信息
  - 提供前往商店的按钮

  Emits:
  - navigate-to-shop(): 点击前往商店按钮时触发
-->
<template>
  <section class="empty-storage" role="status">
    <div class="empty-icon">
      <i class="fas fa-box-open" aria-hidden="true"></i>
    </div>
    <h3>仓库空空如也</h3>
    <p>去商店看看有什么好东西吧！</p>
    <button class="btn-primary" aria-label="前往商店购买物品" @click="handleNavigateToShop">
      <i class="fas fa-shopping-cart" aria-hidden="true"></i>
      前往商店
    </button>
  </section>
</template>

<script setup lang="ts">
interface Emits {
  (e: 'navigate-to-shop'): void
}

const emit = defineEmits<Emits>()

const handleNavigateToShop = () => {
  emit('navigate-to-shop')
}
</script>

<style scoped>
.empty-storage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  background: linear-gradient(135deg, rgba(147, 112, 219, 0.05), rgba(138, 43, 226, 0.02));
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  border: 2px dashed rgba(147, 112, 219, 0.3);
  text-align: center;
}

.empty-icon {
  font-size: 5rem;
  color: var(--purple);
  margin-bottom: var(--spacing-lg);
  display: inline-block;
  opacity: 0.6;
  animation: float 3s ease-in-out infinite;
}

.empty-icon i {
  filter: drop-shadow(0 4px 8px rgba(147, 112, 219, 0.3));
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

.empty-storage h3 {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: var(--spacing-md) 0;
}

.empty-storage p {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  background: linear-gradient(135deg, var(--purple), var(--primary-blue));
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: 0 4px 12px rgba(147, 112, 219, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(147, 112, 219, 0.5);
}

.btn-primary:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .empty-storage {
    padding: var(--spacing-xl);
  }

  .empty-icon {
    font-size: 60px;
  }

  .empty-storage p {
    font-size: var(--text-lg);
  }
}
</style>
