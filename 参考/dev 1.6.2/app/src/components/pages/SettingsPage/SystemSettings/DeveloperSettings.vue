<!--
  DeveloperSettings 组件

  开发者设置区域，提供调试模式和自动保存配置。

  功能：
  - 调试模式开关
  - 自动保存开关

  Props:
  - settings (Partial<AppSettings>): 设置对象

  Emits:
  - update:settings: 设置更新事件

  使用示例:
  ```vue
  <DeveloperSettings :settings="localSettings" @update:settings="handleUpdate" />
  ```
-->
<template>
  <div class="settings-subsection">
    <h3 class="subsection-title">
      <i class="fas fa-code"></i>
      开发者设置
    </h3>

    <div class="settings-grid">
      <!-- 调试模式 -->
      <div class="setting-item">
        <label for="debug-mode" class="setting-label">
          <i class="fas fa-bug"></i>
          调试模式
        </label>
        <div class="setting-control">
          <label class="switch">
            <input
              id="debug-mode"
              :checked="settings.debugMode ?? false"
              type="checkbox"
              @change="handleDebugModeChange"
            />
            <span class="slider"></span>
          </label>
          <span class="setting-hint">启用后将在控制台输出详细日志</span>
        </div>
      </div>

      <!-- 自动保存 -->
      <div class="setting-item">
        <label for="auto-save" class="setting-label">
          <i class="fas fa-save"></i>
          自动保存
        </label>
        <div class="setting-control">
          <label class="switch">
            <input
              id="auto-save"
              :checked="settings.autoSave ?? true"
              type="checkbox"
              @change="handleAutoSaveChange"
            />
            <span class="slider"></span>
          </label>
          <span class="setting-hint">每次选择后自动保存游戏进度</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AppSettings } from '../../../../types'

interface Props {
  settings: Partial<AppSettings>
}

defineProps<Props>()

const emit = defineEmits<{
  'update:settings': [value: Partial<AppSettings>]
}>()

/**
 * 处理调试模式变更
 */
const handleDebugModeChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:settings', { debugMode: target.checked })
}

/**
 * 处理自动保存变更
 */
const handleAutoSaveChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:settings', { autoSave: target.checked })
}
</script>

<style scoped>
@import './settings-common.css';
</style>
