<!--
  StatusValuesSection 组件

  状态值区块组件,用于显示数值型状态(无最大值)。

  功能:
  - 显示标题
  - 网格布局显示多个状态值
  - 每个状态值包含标签和数值

  Props:
  - title (string, 必需): 区块标题
  - statusValues (Record<string, StatusValue>, 必需): 状态值对象,键为状态ID,值为 StatusValue

  使用示例:
  ```vue
  <StatusValuesSection
    title="货币"
    :status-values="{
      gold: { description: '金币', current: 1000 },
      silver: { description: '银币', current: 500 }
    }"
  />
  ```
-->
<template>
  <div class="detail-section">
    <h4>{{ title }}</h4>
    <div class="detail-section-content">
      <div class="status-values-grid">
        <div v-for="(status, key) in statusValues" :key="key" class="status-value-item">
          <span class="status-value-label">{{ status.description || key }}</span>
          <span class="status-value-number">{{ status.current }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StatusValue } from '../../../types'

defineProps<{
  title: string
  statusValues: { [key: string]: StatusValue }
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

.status-values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.status-value-item {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.status-value-item:hover {
  transform: translateY(-3px);
  border-color: var(--primary-blue);
  box-shadow: 0 4px 10px rgba(0, 128, 255, 0.1);
}

.status-value-label {
  display: block;
  font-size: 0.9em;
  color: #6c757d;
  margin-bottom: 8px;
}

.status-value-number {
  display: block;
  font-size: 1.8em;
  font-weight: bold;
  color: var(--accent-pink);
}
</style>
