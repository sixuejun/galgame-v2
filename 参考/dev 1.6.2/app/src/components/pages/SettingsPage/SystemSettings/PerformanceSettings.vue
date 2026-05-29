<!--
  PerformanceSettings 组件

  性能相关设置区域，提供重试次数和延迟时间配置。

  功能：
  - AI 请求重试次数设置
  - 数据处理重试次数设置
  - 重试延迟时间设置

  Props:
  - settings (Partial<AppSettings>): 设置对象

  Emits:
  - update:settings: 设置更新事件

  使用示例:
  ```vue
  <PerformanceSettings :settings="localSettings" @update:settings="handleUpdate" />
  ```
-->
<template>
  <div class="settings-subsection">
    <h3 class="subsection-title">
      <i class="fas fa-tachometer-alt"></i>
      性能设置
    </h3>

    <div class="settings-grid">
      <!-- AI 请求重试次数 -->
      <div class="setting-item">
        <label for="max-retries" class="setting-label">
          <i class="fas fa-redo"></i>
          AI 请求最大重试次数
        </label>
        <div class="setting-control">
          <CustomNumberInput
            id="max-retries"
            :model-value="settings.maxRetries ?? 3"
            :min="1"
            :max="10"
            label="AI 请求最大重试次数"
            @update:model-value="handleMaxRetriesChange"
          />
          <span class="setting-hint">当 AI 响应格式不正确时的重试次数（1-10）</span>
        </div>
      </div>

      <!-- 数据处理重试次数 -->
      <div class="setting-item">
        <label for="max-data-retries" class="setting-label">
          <i class="fas fa-database"></i>
          数据处理最大重试次数
        </label>
        <div class="setting-control">
          <CustomNumberInput
            id="max-data-retries"
            :model-value="settings.maxDataRetries ?? 3"
            :min="1"
            :max="10"
            label="数据处理最大重试次数"
            @update:model-value="handleMaxDataRetriesChange"
          />
          <span class="setting-hint">当数据处理失败时的重试次数（1-10）</span>
        </div>
      </div>

      <!-- 重试延迟时间 -->
      <div class="setting-item">
        <label for="retry-delay" class="setting-label">
          <i class="fas fa-clock"></i>
          重试延迟时间
        </label>
        <div class="setting-control">
          <CustomNumberInput
            id="retry-delay"
            :model-value="settings.retryDelay ?? 1000"
            :min="RETRY_CONFIG.DELAY_MIN"
            :max="RETRY_CONFIG.DELAY_MAX"
            :step="RETRY_CONFIG.DELAY_STEP"
            label="重试延迟时间"
            @update:model-value="handleRetryDelayChange"
          />
          <span class="setting-hint"
            >重试前等待时间（毫秒，{{ RETRY_CONFIG.DELAY_MIN }}-{{ RETRY_CONFIG.DELAY_MAX }}）</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CustomNumberInput from '../../../common/CustomNumberInput.vue'
import { RETRY_CONFIG } from '../../../../constants'
import type { AppSettings } from '../../../../types'

interface Props {
  settings: Partial<AppSettings>
}

defineProps<Props>()

const emit = defineEmits<{
  'update:settings': [value: Partial<AppSettings>]
}>()

/**
 * 处理 AI 请求重试次数变更
 */
const handleMaxRetriesChange = (value: number) => {
  emit('update:settings', { maxRetries: value })
}

/**
 * 处理数据处理重试次数变更
 */
const handleMaxDataRetriesChange = (value: number) => {
  emit('update:settings', { maxDataRetries: value })
}

/**
 * 处理重试延迟时间变更
 */
const handleRetryDelayChange = (value: number) => {
  emit('update:settings', { retryDelay: value })
}
</script>

<style scoped>
@import './settings-common.css';
</style>
