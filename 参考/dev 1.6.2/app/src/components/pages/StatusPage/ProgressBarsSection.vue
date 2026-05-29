<!--
  ProgressBarsSection 组件

  进度条区块组件,用于显示多个进度条。

  功能:
  - 显示标题
  - 显示多个进度条
  - 支持自定义进度条样式

  Props:
  - title (string, 必需): 区块标题
  - progressBars (Record<string, ProgressBar>, 必需): 进度条对象,键为进度条ID,值为 ProgressBar

  使用示例:
  ```vue
  <ProgressBarsSection
    title="属性"
    :progress-bars="{
      health: { description: '生命值', current: 80, max: 100, barClass: 'health-bar' },
      mana: { description: '魔法值', current: 50, max: 100, barClass: 'mana-bar' }
    }"
  />
  ```
-->
<template>
  <div class="detail-section">
    <h4>{{ title }}</h4>
    <div class="detail-section-content">
      <ProgressBar
        v-for="(bar, key) in progressBars"
        :key="key"
        :label="bar.description || String(key)"
        :current="bar.current"
        :max="bar.max"
        :bar-class="bar.barClass || 'protocol-bar'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProgressBar as ProgressBarType } from '../../../types'
import ProgressBar from '../../common/ProgressBar.vue'

defineProps<{
  title: string
  progressBars: { [key: string]: ProgressBarType }
}>()
</script>

<style scoped>
.detail-section {
  margin-bottom: 25px;
  background: #ffffff;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.detail-section h4 {
  color: var(--primary-blue);
  margin: 0;
  padding: 15px 20px;
  background: rgba(0, 128, 255, 0.05);
  border-bottom: 1px solid #e0e6ed;
  font-weight: 600;
}

.detail-section-content {
  padding: 20px;
}
</style>
