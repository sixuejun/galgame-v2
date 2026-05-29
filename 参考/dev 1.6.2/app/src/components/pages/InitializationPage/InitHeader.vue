<!--
  InitHeader 组件

  初始化页面的头部组件，显示标题和欢迎信息。

  功能：
  - 显示伊甸园图标动画
  - 显示初始化标题
  - 显示欢迎副标题
-->
<template>
  <div class="init-header">
    <div class="init-icon">
      <i class="fas fa-seedling"></i>
    </div>
    <h1 class="init-title">伊甸园系统初始化</h1>
    <p class="init-subtitle">欢迎来到伊甸园，让我们开始创造属于你的完美世界</p>
  </div>
</template>

<style scoped>
/* 标题区域 */
.init-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.init-icon {
  font-size: 4rem;
  color: var(--primary-blue);
  margin-bottom: var(--spacing-md);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.init-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--primary-blue);
  margin-bottom: var(--spacing-sm);
  text-shadow: 0 2px 10px rgba(0, 128, 255, 0.2);
}

.init-subtitle {
  font-size: var(--text-base);
  color: var(--text-muted);
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .init-title {
    font-size: var(--text-2xl);
  }

  .init-subtitle {
    font-size: var(--text-sm);
  }
}

@media (max-width: 480px) {
  .init-icon {
    font-size: 3rem;
  }

  .init-title {
    font-size: var(--text-xl);
  }
}
</style>
