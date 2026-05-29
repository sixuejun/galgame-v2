<!--
  DetailsSection 组件

  详细信息区块组件,用于显示键值对形式的详细信息。

  功能:
  - 显示标题
  - 显示键值对列表
  - 自动检测敏感内容并应用特殊样式

  Props:
  - title (string, 必需): 区块标题
  - details (Record<string, DetailItem>, 必需): 详细信息对象,键为字段名,值为 DetailItem

  使用示例:
  ```vue
  <DetailsSection
    title="基本信息"
    :details="{
      name: { label: '姓名', value: '张三' },
      age: { label: '年龄', value: '25' }
    }"
  />
  ```
-->
<template>
  <div :class="sectionClass">
    <h4>{{ title }}</h4>
    <div class="detail-section-content">
      <div class="details-list">
        <div v-for="(detail, key) in details" :key="key" class="detail-line">
          <span class="detail-line-label">{{ detail.label || detail.key }}:</span>
          <span class="detail-line-value">{{ detail.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DetailItem } from '../../../types'

const props = defineProps<{
  title: string
  details: { [key: string]: DetailItem }
}>()

const sectionClass = computed(() => {
  const isErotic =
    props.title.includes('情色') || props.title.includes('性器') || props.title.includes('体液')
  return isErotic ? 'detail-section erotic-status' : 'detail-section'
})
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

.details-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f4f8;
}

.detail-line:last-child {
  border-bottom: none;
}

.detail-line-label {
  font-weight: 500;
  color: #5c6c7d;
}

.detail-line-value {
  font-weight: 500;
  color: var(--text-dark);
}

.erotic-status {
  border: 2px solid var(--accent-pink);
  background: rgba(255, 182, 193, 0.05);
}

.erotic-status h4 {
  color: var(--accent-pink);
}
</style>
