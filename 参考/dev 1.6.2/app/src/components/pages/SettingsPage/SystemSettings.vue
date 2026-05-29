<!--
  SystemSettings 组件

  系统设置容器组件，组合多个设置子组件。

  功能：
  - UI 设置（通过 UISettings 子组件）
  - 性能设置（通过 PerformanceSettings 子组件）
  - 图片设置（通过 ImageSettings 子组件）
  - 开发者设置（通过 DeveloperSettings 子组件）
  - 恢复默认设置按钮

  Props:
  无

  Emits:
  无

  使用示例:
  ```vue
  <SystemSettings />
  ```
-->
<template>
  <section class="settings-section">
    <h2 class="section-title">
      <i class="fas fa-sliders-h"></i>
      系统设置
    </h2>

    <div class="settings-content">
      <!-- UI 设置 -->
      <UISettings :settings="localSettings" @update:settings="handleSettingUpdate" />

      <!-- 性能设置 -->
      <PerformanceSettings :settings="localSettings" @update:settings="handleSettingUpdate" />

      <!-- 图片设置 -->
      <ImageSettings :settings="localSettings" @update:settings="handleSettingUpdate" />

      <!-- TTS 语音设置 -->
      <TTSSettings />

      <!-- 开发者设置 -->
      <DeveloperSettings :settings="localSettings" @update:settings="handleSettingUpdate" />
    </div>

    <!-- 操作按钮 -->
    <div class="settings-actions">
      <button class="btn btn-secondary" @click="handleReset">
        <i class="fas fa-undo"></i>
        恢复默认设置
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import UISettings from './SystemSettings/UISettings.vue'
import PerformanceSettings from './SystemSettings/PerformanceSettings.vue'
import ImageSettings from './SystemSettings/ImageSettings.vue'
import TTSSettings from './SystemSettings/TTSSettings.vue'
import DeveloperSettings from './SystemSettings/DeveloperSettings.vue'
import { useSettingsStore } from '../../../stores/settingsStore'
import { useToast } from '../../../composables/ui/useToast'
import type { AppSettings } from '../../../types'

const settingsStore = useSettingsStore()
const { success: showSuccessToast, info: showInfoToast } = useToast()

// 本地设置副本（用于双向绑定）
const localSettings = ref({ ...settingsStore.settings })

/**
 * 处理设置更新
 */
const handleSettingUpdate = (updates: Partial<AppSettings>) => {
  localSettings.value = { ...localSettings.value, ...updates }
  settingsStore.updateSettings(localSettings.value)
  showSuccessToast('设置已保存')
}

/**
 * 重置设置
 */
const handleReset = () => {
  settingsStore.resetSettings()
  localSettings.value = { ...settingsStore.settings }
  showInfoToast('设置已恢复为默认值')
}

/**
 * 组件挂载时加载设置
 */
onMounted(() => {
  settingsStore.loadSettings()
  localSettings.value = { ...settingsStore.settings }
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
   设置内容区域
   ======================================== */
.settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

/* ========================================
   操作按钮
   ======================================== */
.settings-actions {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: var(--spacing-md);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.btn-secondary {
  background: white;
  color: var(--primary-blue);
  border: 2px solid var(--primary-blue);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-secondary:hover {
  background: var(--primary-blue);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 128, 255, 0.3);
}

.btn-secondary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
