<!--
  UISettings 组件

  UI 界面设置区域，提供主题选择和显示选项。

  功能：
  - 主题选择
  - 显示主页标题开关

  Props:
  - settings (Partial<AppSettings>): 设置对象

  Emits:
  - update:settings: 设置更新事件

  使用示例:
  ```vue
  <UISettings :settings="localSettings" @update:settings="handleUpdate" />
  ```
-->
<template>
  <div class="settings-subsection">
    <h3 class="subsection-title">
      <i class="fas fa-palette"></i>
      界面设置
    </h3>

    <div class="settings-grid">
      <!-- 主题选择 -->
      <div class="setting-item">
        <label for="theme-select" class="setting-label">
          <i class="fas fa-palette"></i>
          主题
        </label>
        <div class="setting-control">
          <CustomSelect
            id="theme-select"
            :model-value="settings.theme || 'default'"
            :options="themeOptions"
            aria-label="选择主题"
            @update:model-value="handleThemeChange"
          />
          <span class="setting-hint">选择应用主题（默认、护眼、高对比度、冷色、暖色）</span>
        </div>
      </div>

      <!-- 显示主页标题 -->
      <div class="setting-item">
        <label for="show-home-header" class="setting-label">
          <i class="fas fa-heading"></i>
          显示主页标题
        </label>
        <div class="setting-control">
          <label class="switch">
            <input
              id="show-home-header"
              :checked="settings.showHomeHeader ?? true"
              type="checkbox"
              @change="handleShowHomeHeaderChange"
            />
            <span class="slider"></span>
          </label>
          <span class="setting-hint">控制主页标题区域是否显示</span>
        </div>
      </div>

      <!-- 显示故事元数据 -->
      <div class="setting-item">
        <label for="show-story-metadata" class="setting-label">
          <i class="fas fa-info-circle"></i>
          显示故事元数据
        </label>
        <div class="setting-control">
          <label class="switch">
            <input
              id="show-story-metadata"
              :checked="settings.showStoryMetadata ?? true"
              type="checkbox"
              @change="handleShowStoryMetadataChange"
            />
            <span class="slider"></span>
          </label>
          <span class="setting-hint">控制故事场景信息（时间、地点、天气）是否显示</span>
        </div>
      </div>

      <!-- 导航栏自动隐藏 -->
      <div class="setting-item">
        <label for="enable-navbar-auto-hide" class="setting-label">
          <i class="fas fa-eye-slash"></i>
          导航栏自动隐藏
        </label>
        <div class="setting-control">
          <label class="switch">
            <input
              id="enable-navbar-auto-hide"
              :checked="settings.enableNavbarAutoHide ?? false"
              type="checkbox"
              @change="handleEnableNavbarAutoHideChange"
            />
            <span class="slider"></span>
          </label>
          <span class="setting-hint">启用后导航栏默认隐藏，鼠标悬停顶部时显示</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CustomSelect from '../../../common/CustomSelect.vue'
import type { AppSettings, ThemeType } from '../../../../types'

interface Props {
  settings: Partial<AppSettings>
}

defineProps<Props>()

const emit = defineEmits<{
  'update:settings': [value: Partial<AppSettings>]
}>()

// 主题选项
const themeOptions = ref<{ value: ThemeType; label: string }[]>([
  { value: 'default', label: '默认主题' },
  { value: 'eye-comfort', label: '护眼模式' },
  { value: 'high-contrast', label: '高对比度' },
  { value: 'cool', label: '冷色主题' },
  { value: 'warm', label: '暖色主题' },
])

/**
 * 处理主题变更
 */
const handleThemeChange = (value: string) => {
  emit('update:settings', { theme: value as ThemeType })
}

/**
 * 处理显示主页标题变更
 */
const handleShowHomeHeaderChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:settings', { showHomeHeader: target.checked })
}

/**
 * 处理显示故事元数据变更
 */
const handleShowStoryMetadataChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:settings', { showStoryMetadata: target.checked })
}

/**
 * 处理导航栏自动隐藏变更
 */
const handleEnableNavbarAutoHideChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:settings', { enableNavbarAutoHide: target.checked })
}
</script>

<style scoped>
@import './settings-common.css';
</style>
