<!--
  VersionInfo 组件

  版本信息区域，展示应用版本、游戏版本、构建时间。

  功能：
  - 展示应用版本
  - 展示游戏版本
  - 展示构建时间

  Props:
  - config (Config, 可选): 游戏配置对象

  Emits:
  无

  使用示例:
  ```vue
  <VersionInfo :config="gameConfig" />
  ```
-->
<template>
  <section class="settings-section version-section">
    <h2 class="section-title">
      <i class="fas fa-info-circle"></i>
      版本信息
    </h2>

    <div class="version-info">
      <div class="version-item">
        <span class="version-label">应用版本：</span>
        <span class="version-value">{{ appVersion }}</span>
      </div>
      <div class="version-item">
        <span class="version-label">游戏版本：</span>
        <span class="version-value">{{ gameVersion }}</span>
      </div>
      <div class="version-item">
        <span class="version-label">构建时间：</span>
        <span class="version-value">{{ buildTime }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Config } from '../../../types'

interface Props {
  config?: Config
}

const props = defineProps<Props>()

/**
 * 应用版本
 * 在构建时从 package.json 自动注入
 */
const appVersion = computed(() => {
  return __APP_VERSION__
})

/**
 * 游戏版本
 */
const gameVersion = computed(() => {
  return props.config?.version || '未知'
})

/**
 * 构建时间
 * 在构建时自动生成并注入
 */
const buildTime = computed(() => {
  return __BUILD_TIME__
})
</script>

<style scoped>
/* ========================================
   设置区域
   ======================================== */
.settings-section {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--border-color);
}

.section-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--primary-blue);
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.section-title i {
  font-size: var(--text-lg);
}

/* ========================================
   版本信息
   ======================================== */
.version-section {
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.version-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
}

.version-label {
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  min-width: 100px;
}

.version-value {
  color: var(--primary-blue);
  font-weight: var(--font-semibold);
}

/* ========================================
   响应式设计
   ======================================== */
@media (max-width: 768px) {
  .settings-section {
    padding: var(--spacing-lg);
  }
}

@media (max-width: 480px) {
  .settings-section {
    padding: var(--spacing-md);
  }

  .section-title {
    font-size: var(--text-lg);
  }
}
</style>
