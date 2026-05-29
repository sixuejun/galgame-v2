<!--
  SettingsPage 组件

  游戏设置页面，组合多个设置子组件。

  功能：
  - 系统设置（通过 SystemSettings 子组件）
  - 帮助 & FAQ（通过 HelpSection 子组件）
  - 版本信息（通过 VersionInfo 子组件）

  Props:
  - config (Config, 可选): 游戏配置对象

  Emits:
  无

  使用示例:
  ```vue
  <SettingsPage :config="gameConfig" />
  ```
-->
<template>
  <ErrorBoundary @error="handleError">
    <div class="settings-page">
      <h1 id="page-title" class="page-title">
        <i class="fas fa-cog"></i>
        {{ pageTitle }}
      </h1>

      <div class="settings-content">
        <!-- 系统设置区域 -->
        <SystemSettings />

        <!-- 帮助和FAQ区域 -->
        <HelpSection />

        <!-- 版本信息区域 -->
        <VersionInfo :config="config" />
      </div>
    </div>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Config } from '../../types'
import ErrorBoundary from '../common/ErrorBoundary.vue'
import SystemSettings from './SettingsPage/SystemSettings.vue'
import HelpSection from './SettingsPage/HelpSection.vue'
import VersionInfo from './SettingsPage/VersionInfo.vue'
import { logger } from '../../utils/logger'

interface Props {
  config?: Config
}

defineProps<Props>()

/**
 * 页面标题 - 使用默认值
 */
const pageTitle = computed(() => {
  // 注意：settings 页面配置在新数据模型中没有定义，使用默认值
  return '设置'
})

/**
 * 处理错误
 */
const handleError = (error: Error) => {
  logger.error('设置页面发生错误:', error)
}
</script>

<style scoped>
.settings-page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--primary-blue);
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.page-title i {
  font-size: var(--text-2xl);
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

/* ========================================
   响应式设计
   ======================================== */
@media (max-width: 768px) {
  .page-title {
    font-size: var(--text-2xl);
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: var(--text-xl);
  }
}
</style>
