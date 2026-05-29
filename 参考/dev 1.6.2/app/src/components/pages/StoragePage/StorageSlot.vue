<!--
  StorageSlot 组件

  仓库槽位组件，显示单个仓库物品。

  功能：
  - 显示物品信息（名称、数量）
  - 点击查看详情
  - 空槽位状态
  - 键盘导航支持
  - 无障碍支持

  Props:
  - item (InventoryItem | null): 物品数据对象

  Emits:
  - click(itemId: string): 点击槽位时触发
-->
<template>
  <div
    :class="['storage-slot', { filled: item }]"
    :tabindex="item ? 0 : -1"
    role="button"
    :aria-label="item ? `物品：${item.name}，数量：${item.quantity || 1}` : '空槽位'"
    :aria-disabled="!item"
    @click="item && $emit('click', item.id)"
    @keydown.enter="item && $emit('click', item.id)"
    @keydown.space.prevent="item && $emit('click', item.id)"
  >
    <template v-if="item">
      <div class="storage-icon" aria-hidden="true">
        <Icon :icon-data="item.icon" :alt="`${item.name}图标`" />
      </div>
      <div class="storage-quantity" role="text" :aria-label="`数量：${item.quantity || 1}`">
        {{ item.quantity || 1 }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Item } from '../../../types'
import Icon from '../../common/Icon.vue'

defineProps<{
  item?: Item
}>()

defineEmits<{
  click: [itemId: string]
}>()
</script>

<style scoped>
.storage-slot {
  aspect-ratio: 1;
  background: var(--gray-50);
  border: 2px dashed var(--gray-300);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all var(--transition-base) ease;
  cursor: pointer;
  min-height: 100px;
}

.storage-slot:hover {
  background: var(--gray-100);
  border-color: var(--gray-400);
}

.storage-slot.filled {
  background: white;
  border-style: solid;
  border-color: var(--gray-300);
  box-shadow: var(--shadow-sm);
}

.storage-slot.filled:hover {
  transform: scale(1.08) rotate(2deg);
  border-color: var(--primary-blue);
  box-shadow: 0 0 20px var(--glow-blue);
}

.storage-icon {
  font-size: 48px;
  color: var(--primary-blue);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
  transition: all var(--transition-base) ease;
}

.storage-slot.filled:hover .storage-icon {
  transform: scale(1.1);
}

.storage-icon :deep(.custom-icon) {
  max-width: 100%;
  max-height: 100%;
}

.storage-quantity {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: linear-gradient(135deg, var(--gray-800), var(--gray-900));
  color: white;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  box-shadow: var(--shadow-md);
  border: 2px solid white;
  min-width: 24px;
  text-align: center;
}
</style>
