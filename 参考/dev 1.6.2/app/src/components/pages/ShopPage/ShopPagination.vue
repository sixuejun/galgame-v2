<!--
  ShopPagination 组件

  商店分页组件，提供分页导航功能。

  功能：
  - 上一页/下一页按钮
  - 显示当前页码和总页数
  - 禁用状态控制
  - 无障碍支持

  Props:
  - currentPage (number): 当前页码
  - totalPages (number): 总页数

  Emits:
  - prevPage(): 点击上一页时触发
  - nextPage(): 点击下一页时触发
-->
<template>
  <nav v-if="totalPages > 1" class="pagination" role="navigation" aria-label="商品分页导航">
    <button
      class="page-btn"
      :disabled="isFirstPage"
      :aria-disabled="isFirstPage"
      aria-label="上一页"
      @click="$emit('prevPage')"
    >
      <i class="fas fa-chevron-left" aria-hidden="true"></i>
      上一页
    </button>
    <span class="page-info" role="status" aria-live="polite" aria-label="当前页码"
      >{{ currentPage }} / {{ totalPages }}</span
    >
    <button
      class="page-btn"
      :disabled="isLastPage"
      :aria-disabled="isLastPage"
      aria-label="下一页"
      @click="$emit('nextPage')"
    >
      下一页
      <i class="fas fa-chevron-right" aria-hidden="true"></i>
    </button>
  </nav>
</template>

<script setup lang="ts">
interface Props {
  currentPage: number
  totalPages: number
  isFirstPage: boolean
  isLastPage: boolean
}

defineProps<Props>()

defineEmits<{
  prevPage: []
  nextPage: []
}>()
</script>

<style scoped>
/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
}

.page-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  color: white;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  transition: all var(--transition-base) ease;
  box-shadow: var(--shadow-sm);
}

.page-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--secondary-blue), var(--primary-blue-light));
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.page-info {
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  min-width: 80px;
  text-align: center;
}
</style>
