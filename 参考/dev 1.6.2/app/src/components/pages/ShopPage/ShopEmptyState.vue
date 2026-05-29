<!--
  ShopEmptyState 组件

  商店空状态组件，当商店没有商品时显示。

  功能：
  - 显示空状态图标和提示信息
-->
<template>
  <section class="empty-shop" role="status">
    <div class="empty-icon">
      <i class="fas fa-shopping-bag" aria-hidden="true"></i>
    </div>
    <h3>商店暂无商品</h3>
    <p>商品正在补货中，请稍后再来看看！</p>
  </section>
</template>

<style scoped>
.empty-shop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  background: linear-gradient(135deg, rgba(0, 128, 255, 0.05), rgba(0, 191, 255, 0.02));
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  border: 2px dashed rgba(0, 128, 255, 0.3);
  text-align: center;
}

.empty-icon {
  font-size: 5rem;
  color: var(--primary-blue);
  margin-bottom: var(--spacing-lg);
  display: inline-block;
  opacity: 0.6;
  animation: float 3s ease-in-out infinite;
}

.empty-icon i {
  filter: drop-shadow(0 4px 8px rgba(0, 128, 255, 0.3));
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

.empty-shop h3 {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: var(--spacing-md) 0;
}

.empty-shop p {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
}

@media (max-width: 768px) {
  .empty-shop {
    padding: var(--spacing-xl);
  }

  .empty-icon {
    font-size: 60px;
  }

  .empty-shop p {
    font-size: var(--text-lg);
  }
}
</style>
