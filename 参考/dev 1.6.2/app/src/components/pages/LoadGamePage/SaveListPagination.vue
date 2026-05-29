<!--
  SaveListPagination 组件

  存档列表分页组件，提供分页导航功能。

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
  <nav v-if="totalPages > 1" class="pagination" role="navigation" aria-label="存档分页导航">
    <button
      class="page-btn"
      :disabled="currentPage === 1"
      :aria-disabled="currentPage === 1"
      aria-label="上一页"
      @click="$emit('prev')"
    >
      <i class="fas fa-chevron-left" aria-hidden="true"></i>
    </button>
    <span class="page-info" role="status" aria-live="polite" aria-label="当前页码">
      第 {{ currentPage }} / {{ totalPages }} 页
    </span>
    <button
      class="page-btn"
      :disabled="currentPage === totalPages"
      :aria-disabled="currentPage === totalPages"
      aria-label="下一页"
      @click="$emit('next')"
    >
      <i class="fas fa-chevron-right" aria-hidden="true"></i>
    </button>
  </nav>
</template>

<script setup lang="ts">
// Props
defineProps<{
  currentPage: number
  totalPages: number
}>()

// Emits
defineEmits<{
  prev: []
  next: []
}>()
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg) 0;
}

.page-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(0, 128, 255, 0.3);
  background: rgba(0, 128, 255, 0.1);
  color: var(--primary-blue);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
}

.page-btn:hover:not(:disabled) {
  background: rgba(0, 128, 255, 0.2);
  border-color: var(--primary-blue);
  transform: translateY(-2px);
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  min-width: 120px;
  text-align: center;
}

/* ========================================
   响应式设计
   ======================================== */

/* 移动端 (≤768px) */
@media (max-width: 768px) {
  .pagination {
    gap: var(--spacing-md);
    padding: var(--spacing-md) 0;
  }

  .page-btn {
    width: 44px;
    height: 44px;
    font-size: var(--text-lg);
  }

  .page-info {
    font-size: var(--text-base);
    min-width: 100px;
  }
}

/* 小屏幕 (≤480px) */
@media (max-width: 480px) {
  .pagination {
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) 0;
  }

  .page-btn {
    width: 40px;
    height: 40px;
    font-size: var(--text-base);
  }

  .page-info {
    font-size: var(--text-sm);
    min-width: 80px;
  }
}
</style>
