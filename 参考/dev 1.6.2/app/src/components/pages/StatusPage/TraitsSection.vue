<!--
  TraitsSection 组件

  特质区块组件,用于显示角色特质列表。

  功能:
  - 显示标题
  - 显示特质列表
  - 区分已激活和未激活状态
  - 显示特质图标、名称、描述

  Props:
  - title (string, 必需): 区块标题
  - traits (Record<string, Trait>, 必需): 特质对象,键为特质ID,值为 Trait

  使用示例:
  ```vue
  <TraitsSection
    title="特质"
    :traits="{
      brave: { name: '勇敢', description: '面对危险不退缩', unlocked: true, icon: '🛡️' },
      wise: { name: '智慧', description: '善于思考和学习', unlocked: false, icon: '📚' }
    }"
  />
  ```
-->
<template>
  <div class="detail-section">
    <h4>{{ title }}</h4>
    <div class="detail-section-content">
      <div class="traits-list">
        <div
          v-for="(trait, key) in traits"
          :key="key"
          :class="['trait-item', trait.unlocked ? 'unlocked' : 'locked']"
        >
          <div class="trait-icon">
            <Icon
              :icon-data="trait.icon || (trait.unlocked ? 'fa-lock-open' : 'fa-lock')"
              :alt="`${trait.name}特质图标`"
            />
          </div>
          <div class="trait-content">
            <div class="trait-header">
              <span class="trait-name">{{ trait.name }}</span>
              <span class="trait-status">{{ trait.unlocked ? '已激活' : '未激活' }}</span>
            </div>
            <div class="trait-description">
              {{ trait.description }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Trait } from '../../../types'
import Icon from '../../common/Icon.vue'

defineProps<{
  title: string
  traits: { [key: string]: Trait }
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

.traits-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
}

.trait-item {
  background-color: #fff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s ease;
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.trait-item.locked {
  background-color: #f8f9fa;
}

.trait-item.unlocked {
  border-left: 4px solid var(--primary-blue);
}

.trait-item.locked {
  border-left: 4px solid #6c757d;
  opacity: 0.8;
}

.trait-icon {
  font-size: 1.8em;
  flex-shrink: 0;
  width: 40px;
  text-align: center;
  margin-top: 5px;
}

.trait-item.unlocked .trait-icon {
  color: var(--primary-blue);
}

.trait-item.locked .trait-icon {
  color: #6c757d;
}

.trait-content {
  flex-grow: 1;
}

.trait-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.trait-name {
  font-weight: bold;
  color: var(--text-dark);
  font-size: 1.1em;
}

.trait-status {
  font-size: 0.8em;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 500;
}

.trait-item.unlocked .trait-status {
  background-color: rgba(0, 128, 255, 0.1);
  color: var(--primary-blue);
}

.trait-item.locked .trait-status {
  background-color: #e9ecef;
  color: #6c757d;
}

.trait-description {
  font-size: 0.9em;
  color: #555;
  line-height: 1.5;
}
</style>
