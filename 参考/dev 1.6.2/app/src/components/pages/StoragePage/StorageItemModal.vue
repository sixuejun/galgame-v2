<!--
  StorageItemModal 组件

  仓库物品详情模态框组件，显示物品详细信息和操作。

  功能：
  - 显示物品详细信息
  - 数量选择器（多个物品时）
  - 使用物品功能
  - 关闭模态框

  Props:
  - isVisible (boolean): 是否显示模态框
  - item (InventoryItem | null): 要显示的物品

  Emits:
  - close(): 关闭模态框时触发
  - use-item(itemId: string, quantity: number): 使用物品时触发
-->
<template>
  <Modal
    :is-visible="isVisible"
    :title="item?.name || ''"
    :buttons="modalButtons"
    @close="handleClose"
  >
    <template #content>
      <p>{{ item?.description }}</p>
      <QuantitySelector v-if="maxQuantity > 1" v-model="selectedQuantity" :max="maxQuantity" />
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Item } from '../../../types'
import QuantitySelector from '../../common/QuantitySelector.vue'
import Modal from '../../layout/Modal.vue'

interface Props {
  isVisible: boolean
  item: Item | null
}

interface Emits {
  (e: 'close'): void
  (e: 'use-item', itemId: string, quantity: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedQuantity = ref(1)

const maxQuantity = computed(() => props.item?.quantity || 1)

const modalButtons = computed(() => [
  { text: '使用', class: 'primary' as const, action: handleUseItem },
  { text: '取消', class: 'secondary' as const, action: handleClose },
])

const handleClose = () => {
  selectedQuantity.value = 1
  emit('close')
}

const handleUseItem = () => {
  if (!props.item) return
  emit('use-item', props.item.id, selectedQuantity.value)
  handleClose()
}

// 当模态框打开时，重置数量为1
watch(
  () => props.isVisible,
  newValue => {
    if (newValue) {
      selectedQuantity.value = 1
    }
  }
)
</script>
