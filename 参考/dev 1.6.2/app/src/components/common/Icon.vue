<!--
  Icon 组件

  通用图标组件，支持多种图标类型。

  功能：
  - 支持 Font Awesome 图标
  - 支持图片 URL
  - 支持纯文本图标
  - 自动识别图标类型
  - 无障碍支持（ARIA 属性）

  Props:
  - iconData: 图标数据（Font Awesome 类名、图片 URL 或文本）
  - alt: 图标的替代文本（可选，默认为"图标"）
  - fallbackIcon: 图片加载失败时的备用图标（可选，默认为"fas fa-image"）

  使用示例：
  <Icon iconData="fas fa-star" alt="星标" />
  <Icon iconData="https://example.com/icon.png" alt="自定义图标" />
  <Icon iconData="⭐" alt="星星" />
-->
<template>
  <i v-if="isFontAwesome" :class="iconClass" :aria-label="alt"></i>
  <SafeImage
    v-else-if="isUrl"
    :src="iconData"
    :alt="alt"
    image-class="custom-icon"
    :fallback-icon="fallbackIcon"
  />
  <span v-else :aria-label="alt">{{ iconData }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SafeImage from './SafeImage.vue'

/**
 * Props 定义
 * @property {string} iconData - 图标数据（Font Awesome 类名、图片 URL 或文本）
 * @property {string} [alt='图标'] - 图标的替代文本
 * @property {string} [fallbackIcon='fas fa-image'] - 图片加载失败时的备用图标
 */
const props = withDefaults(
  defineProps<{
    /** 图标数据（Font Awesome 类名、图片 URL 或文本） */
    iconData: string
    /** 图标的替代文本 */
    alt?: string
    /** 图片加载失败时的备用图标 */
    fallbackIcon?: string
  }>(),
  {
    alt: '图标',
    fallbackIcon: 'fas fa-image',
  }
)

const isFontAwesome = computed(() => {
  return props.iconData && props.iconData.includes('fa-')
})

const isUrl = computed(() => {
  return (
    props.iconData &&
    (props.iconData.startsWith('http://') || props.iconData.startsWith('https://'))
  )
})

const iconClass = computed(() => {
  if (!isFontAwesome.value) return ''
  // 如果已经包含样式前缀 (fas, far 等), 直接使用
  if (props.iconData.startsWith('fa-')) {
    return `fas ${props.iconData}`
  }
  // 否则直接使用完整的类名
  return props.iconData
})
</script>

<style scoped>
.custom-icon {
  max-width: 100%;
  max-height: 100%;
}
</style>
