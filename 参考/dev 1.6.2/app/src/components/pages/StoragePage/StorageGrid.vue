<!--
  StorageGrid 组件

  仓库物品网格组件，以网格形式显示仓库物品。

  功能：
  - 网格布局显示物品
  - 使用 v-memo 优化性能
  - 支持点击查看物品详情

  Props:
  - items (InventoryItem[]): 物品列表

  Emits:
  - item-click(item: InventoryItem): 点击物品时触发
-->
<template>
  <div class="storage-grid" role="grid" aria-label="物品仓库">
    <StorageSlot
      v-for="item in items"
      :key="item.id"
      v-memo="[item.name, item.quantity]"
      :item="item"
      role="gridcell"
      @click="$emit('item-click', item)"
    />
  </div>
</template>

<script setup lang="ts">
import StorageSlot from './StorageSlot.vue'
import type { Item } from '../../../types'

interface Props {
  items: Item[]
}

interface Emits {
  (e: 'item-click', item: Item): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
.storage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

@media (max-width: 768px) {
  .storage-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--spacing-sm);
  }
}

@media (max-width: 480px) {
  .storage-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
