<!--
  StoragePagination 组件

  仓库分页组件，提供分页导航功能。

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
  <nav v-if="totalPages > 1" class="pagination" role="navigation" aria-label="物品分页导航">
    <button
      class="page-btn"
      :disabled="currentPage === 1"
      :aria-disabled="currentPage === 1"
      aria-label="上一页"
      @click="$emit('prev-page')"
    >
      <i class="fas fa-chevron-left" aria-hidden="true"></i>
      上一页
    </button>
    <span class="page-info" role="status" aria-live="polite" aria-label="当前页码"
      >{{ currentPage }} / {{ totalPages }}</span
    >
    <button
      class="page-btn"
      :disabled="currentPage === totalPages"
      :aria-disabled="currentPage === totalPages"
      aria-label="下一页"
      @click="$emit('next-page')"
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
}

interface Emits {
  (e: 'prev-page'): void
  (e: 'next-page'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
}

.page-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.page-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

@media (max-width: 480px) {
  .pagination {
    gap: var(--spacing-sm);
  }

  .page-btn {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
  }

  .page-info {
    font-size: var(--font-size-xs);
  }
}
</style>
