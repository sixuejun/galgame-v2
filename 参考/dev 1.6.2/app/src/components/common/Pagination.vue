<!--
  Pagination 组件

  通用分页组件，用于列表数据的分页导航。

  功能：
  - 显示当前页码和总页数
  - 上一页/下一页按钮
  - 自动禁用边界按钮（第一页/最后一页）
  - 支持双向绑定（v-model:currentPage）
  - 支持页码变化事件
  - 无障碍支持（ARIA 属性）
  - 开发环境下的 Props 验证

  Props:
  - currentPage: 当前页码（从 1 开始）
  - totalPages: 总页数
  - ariaLabel: 导航区域的 ARIA 标签（可选，默认为"分页导航"）

  Emits:
  - update:currentPage: 当页码变化时触发（用于 v-model）
  - page-change: 当页码变化时触发

  使用示例：
  <Pagination
    v-model:current-page="currentPage"
    :total-pages="totalPages"
    @page-change="handlePageChange"
  />
-->
<template>
  <nav v-if="totalPages > 1" class="pagination" role="navigation" :aria-label="ariaLabel">
    <button
      class="page-btn"
      :disabled="currentPage === 1"
      :aria-disabled="currentPage === 1"
      aria-label="上一页"
      @click="goToPrevPage"
    >
      <i class="fas fa-chevron-left" aria-hidden="true"></i>
      上一页
    </button>
    <span class="page-info" role="status" aria-live="polite" aria-label="当前页码">
      {{ currentPage }} / {{ totalPages }}
    </span>
    <button
      class="page-btn"
      :disabled="currentPage === totalPages"
      :aria-disabled="currentPage === totalPages"
      aria-label="下一页"
      @click="goToNextPage"
    >
      下一页
      <i class="fas fa-chevron-right" aria-hidden="true"></i>
    </button>
  </nav>
</template>

<script setup lang="ts">
/**
 * Props 定义
 * @property {number} currentPage - 当前页码（从 1 开始）
 * @property {number} totalPages - 总页数
 * @property {string} [ariaLabel='分页导航'] - 导航区域的 ARIA 标签
 */
interface Props {
  /** 当前页码（从 1 开始） */
  currentPage: number
  /** 总页数 */
  totalPages: number
  /** 导航区域的 ARIA 标签 */
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: '分页导航',
})

/**
 * Emits 定义
 * @event update:currentPage - 当页码变化时触发（用于 v-model）
 * @event page-change - 当页码变化时触发
 */
const emit = defineEmits<{
  'update:currentPage': [page: number]
  'page-change': [page: number]
}>()

// Props 验证
if (import.meta.env.DEV) {
  if (props.currentPage < 1) {
    console.warn(`[Pagination] Props 验证失败: currentPage (${props.currentPage}) 应该 >= 1`)
  }

  if (props.totalPages < 0) {
    console.warn(`[Pagination] Props 验证失败: totalPages (${props.totalPages}) 应该 >= 0`)
  }

  if (props.currentPage > props.totalPages && props.totalPages > 0) {
    console.warn(
      `[Pagination] Props 验证失败: currentPage (${props.currentPage}) 不应该大于 totalPages (${props.totalPages})`
    )
  }
}

const goToPrevPage = () => {
  if (props.currentPage > 1) {
    const newPage = props.currentPage - 1
    emit('update:currentPage', newPage)
    emit('page-change', newPage)
  }
}

const goToNextPage = () => {
  if (props.currentPage < props.totalPages) {
    const newPage = props.currentPage + 1
    emit('update:currentPage', newPage)
    emit('page-change', newPage)
  }
}
</script>

<style scoped>
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
  padding: var(--spacing-sm) var(--spacing-lg);
  background: white;
  border: 2px solid var(--primary-blue);
  border-radius: var(--radius-lg);
  color: var(--primary-blue);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-base);
  min-width: 100px;
}

.page-btn:hover:not(:disabled) {
  background: var(--primary-blue);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 128, 255, 0.3);
}

.page-btn:active:not(:disabled) {
  transform: translateY(0);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: var(--gray-300);
  color: var(--gray-400);
}

.page-btn i {
  font-size: var(--text-sm);
}

.page-info {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: linear-gradient(135deg, rgba(0, 128, 255, 0.1), rgba(0, 191, 255, 0.1));
  border-radius: var(--radius-lg);
  color: var(--primary-blue);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  min-width: 80px;
  text-align: center;
}

@media (max-width: 768px) {
  .pagination {
    gap: var(--spacing-md);
    padding: var(--spacing-md);
  }

  .page-btn {
    min-width: 80px;
    padding: var(--spacing-xs) var(--spacing-md);
    font-size: var(--text-sm);
  }

  .page-info {
    min-width: 60px;
    font-size: var(--text-sm);
  }
}
</style>
