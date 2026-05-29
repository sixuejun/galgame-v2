<!--
  SafeImage 组件

  安全的图片加载组件，支持加载失败时的备用图标。

  功能：
  - 图片懒加载（loading="lazy"）
  - 加载失败时显示备用图标
  - 自动记录加载失败日志
  - 支持自定义样式类
  - 响应式容器布局

  Props:
  - src: 图片 URL
  - alt: 图片替代文本（可选，默认为 "image"）
  - imageClass: 自定义样式类（可选）
  - fallbackIcon: 加载失败时的备用图标（可选，默认为 "fas fa-image"）

  使用示例：
  <SafeImage
    src="https://example.com/image.jpg"
    alt="示例图片"
    image-class="custom-image"
    fallback-icon="fas fa-user"
  />
-->
<template>
  <div class="safe-image-container">
    <img
      v-if="!loadError"
      :src="src"
      :alt="alt"
      :class="imageClass"
      loading="lazy"
      @load="handleLoad"
      @error="handleError"
    />
    <div v-else :class="['fallback-icon', imageClass]">
      <i :class="fallbackIconClass"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { logger } from '../../utils/logger'

/**
 * Props 定义
 * @property {string} src - 图片 URL
 * @property {string} [alt='image'] - 图片替代文本
 * @property {string} [imageClass=''] - 自定义样式类
 * @property {string} [fallbackIcon='fas fa-image'] - 加载失败时的备用图标
 */
const props = withDefaults(
  defineProps<{
    /** 图片 URL */
    src: string
    /** 图片替代文本 */
    alt?: string
    /** 自定义样式类 */
    imageClass?: string
    /** 加载失败时的备用图标 */
    fallbackIcon?: string
  }>(),
  {
    alt: 'image',
    imageClass: '',
    fallbackIcon: 'fas fa-image',
  }
)

const loadError = ref(false)
const isLoaded = ref(false)

const fallbackIconClass = ref(props.fallbackIcon)

const handleLoad = () => {
  isLoaded.value = true
  loadError.value = false
}

const handleError = () => {
  loadError.value = true
  logger.warn(`图片加载失败: ${props.src}`)
}
</script>

<style scoped>
.safe-image-container {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.safe-image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.fallback-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0, 128, 255, 0.1), rgba(0, 191, 255, 0.1));
  border-radius: 8px;
  color: var(--primary-blue);
  font-size: 2em;
  opacity: 0.6;
}

.fallback-icon i {
  font-size: inherit;
}
</style>
