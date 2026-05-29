<!--
  ImageSettings 组件

  图片相关设置区域，提供图片生成服务、超时和缓存配置。

  功能：
  - 图片生成服务选择
  - ST-ChatU8 超时时间设置
  - 图片缓存上限设置

  Props:
  - settings (Partial<AppSettings>): 设置对象

  Emits:
  - update:settings: 设置更新事件

  使用示例:
  ```vue
  <ImageSettings :settings="localSettings" @update:settings="handleUpdate" />
  ```
-->
<template>
  <div class="settings-subsection">
    <h3 class="subsection-title">
      <i class="fas fa-image"></i>
      图片设置
    </h3>

    <div class="settings-grid">
      <!-- 图片生成服务 -->
      <div class="setting-item">
        <label for="image-generation-service" class="setting-label">
          <i class="fas fa-image"></i>
          图片生成服务
        </label>
        <div class="setting-control">
          <CustomSelect
            id="image-generation-service"
            :model-value="settings.imageGenerationService || 'pollinations'"
            :options="imageServiceOptions"
            aria-label="选择图片生成服务"
            @update:model-value="handleImageServiceChange"
          />
          <span class="setting-hint">选择用于生成图片的服务（pollinations.ai 或 st-chatu8）</span>
        </div>
      </div>

      <!-- ST-ChatU8 图片生成超时时间 -->
      <div class="setting-item">
        <label for="st-chatu8-timeout" class="setting-label">
          <i class="fas fa-clock"></i>
          ST-ChatU8 超时时间
        </label>
        <div class="setting-control">
          <CustomNumberInput
            id="st-chatu8-timeout"
            :model-value="settings.stChatu8ImageTimeout ?? 30000"
            :min="TIMING.ST_CHATU8_TIMEOUT_MIN"
            :max="TIMING.ST_CHATU8_TIMEOUT_MAX"
            :step="TIMING.ST_CHATU8_TIMEOUT_STEP"
            aria-label="ST-ChatU8 图片生成超时时间（毫秒）"
            @update:model-value="handleTimeoutChange"
          />
          <span class="setting-hint"
            >ST-ChatU8 图片生成超时时间（毫秒），建议范围：{{ TIMING.ST_CHATU8_TIMEOUT_MIN }}-{{
              TIMING.ST_CHATU8_TIMEOUT_MAX
            }}（{{ TIMING.ST_CHATU8_TIMEOUT_MIN / 1000 }}-{{
              TIMING.ST_CHATU8_TIMEOUT_MAX / 1000
            }}秒）</span
          >
        </div>
      </div>

      <!-- 图片缓存上限 -->
      <div class="setting-item">
        <label for="image-cache-limit" class="setting-label">
          <i class="fas fa-database"></i>
          图片缓存上限
        </label>
        <div class="setting-control">
          <CustomNumberInput
            id="image-cache-limit"
            :model-value="settings.imageCacheLimit ?? 100"
            :min="10"
            :max="1000"
            :step="10"
            label="图片缓存上限"
            @update:model-value="handleCacheLimitChange"
          />
          <span class="setting-hint"
            >图片缓存最大条数（10-1000），达到上限时自动删除最旧的记录</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CustomNumberInput from '../../../common/CustomNumberInput.vue'
import CustomSelect from '../../../common/CustomSelect.vue'
import { TIMING } from '../../../../constants'
import type { AppSettings, ImageGenerationService } from '../../../../types'

interface Props {
  settings: Partial<AppSettings>
}

defineProps<Props>()

const emit = defineEmits<{
  'update:settings': [value: Partial<AppSettings>]
}>()

// 图片生成服务选项
const imageServiceOptions = ref<{ value: ImageGenerationService; label: string }[]>([
  { value: 'pollinations', label: 'Pollinations.ai（在线服务）' },
  { value: 'st-chatu8', label: 'ST-ChatU8（外部应用）' },
])

/**
 * 处理图片服务变更
 */
const handleImageServiceChange = (value: string) => {
  emit('update:settings', { imageGenerationService: value as ImageGenerationService })
}

/**
 * 处理超时时间变更
 */
const handleTimeoutChange = (value: number) => {
  emit('update:settings', { stChatu8ImageTimeout: value })
}

/**
 * 处理缓存上限变更
 */
const handleCacheLimitChange = (value: number) => {
  emit('update:settings', { imageCacheLimit: value })
}
</script>

<style scoped>
@import './settings-common.css';
</style>
