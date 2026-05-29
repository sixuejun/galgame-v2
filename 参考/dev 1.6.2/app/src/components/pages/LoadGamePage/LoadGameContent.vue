<!--
  LoadGameContent 组件

  读取存档页面的内容区域，包含加载状态、错误状态、空状态和存档列表

  Props:
  - isLoading: 是否正在加载
  - errorMessage: 错误消息
  - paginatedSaves: 当前页的存档列表
  - isOperating: 是否正在操作中
  - currentPage: 当前页码
  - totalPages: 总页数
  - getSaveIcon: 获取存档图标的函数
  - getSaveTypeText: 获取存档类型文本的函数
  - formatTime: 格式化时间的函数

  Emits:
  - load: 加载存档
  - export: 导出存档
  - delete: 删除存档
  - retry: 重试加载
  - prev-page: 上一页
  - next-page: 下一页
-->
<template>
  <div class="load-content">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state" role="status" aria-live="polite">
      <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
      <span>正在加载存档列表...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="errorMessage" class="error-state" role="alert" aria-live="assertive">
      <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
      <span>{{ errorMessage }}</span>
      <button class="retry-btn" aria-label="重新加载存档列表" @click="emit('retry')">
        <i class="fas fa-redo" aria-hidden="true"></i>
        重试
      </button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="paginatedSaves.length === 0" class="empty-state">
      <i class="fas fa-inbox"></i>
      <p>暂无存档</p>
      <p class="empty-hint">开始游戏后会自动创建存档</p>
    </div>

    <!-- 存档列表 -->
    <div v-else class="saves-content">
      <SaveListTable
        :saves="paginatedSaves"
        :is-operating="isOperating"
        :get-save-icon="getSaveIcon"
        :get-save-type-text="getSaveTypeText"
        :format-time="formatTime"
        @load="emit('load', $event)"
        @export="emit('export', $event)"
        @delete="emit('delete', $event)"
      />

      <SaveListPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        @prev="emit('prev-page')"
        @next="emit('next-page')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import SaveListTable from './SaveListTable.vue'
import SaveListPagination from './SaveListPagination.vue'
import type { SaveInfo } from '../../../services/worldbook'

// Props
defineProps<{
  isLoading: boolean
  errorMessage: string
  paginatedSaves: SaveInfo[]
  isOperating: boolean
  currentPage: number
  totalPages: number
  getSaveIcon: (saveType: string) => string
  getSaveTypeText: (saveType: string) => string
  formatTime: (timeStr: string) => string
}>()

// Emits
const emit = defineEmits<{
  load: [saveName: string]
  export: [saveName: string]
  delete: [saveName: string]
  retry: []
  'prev-page': []
  'next-page': []
}>()
</script>

<style scoped>
.load-content {
  margin-top: var(--spacing-lg);
}

/* 状态显示 */
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-secondary);
}

.loading-state i,
.error-state i,
.empty-state i {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
  display: block;
}

.loading-state i {
  color: var(--primary-blue);
}

.error-state i {
  color: #dc2626;
}

.empty-state i {
  color: var(--text-tertiary);
}

.empty-hint {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  margin-top: var(--spacing-sm);
}

.retry-btn {
  margin-top: var(--spacing-md);
  background: var(--primary-blue);
  border: none;
  color: white;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-lg);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: all var(--transition-base);
}

.retry-btn:hover {
  background: var(--secondary-blue);
  transform: translateY(-2px);
}

.saves-content {
  margin-top: var(--spacing-lg);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .loading-state,
  .error-state,
  .empty-state {
    padding: var(--spacing-xl);
  }

  .loading-state i,
  .error-state i,
  .empty-state i {
    font-size: 2.5rem;
  }

  .saves-content {
    margin-top: var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .loading-state,
  .error-state,
  .empty-state {
    padding: var(--spacing-lg);
  }

  .loading-state i,
  .error-state i,
  .empty-state i {
    font-size: 2rem;
    margin-bottom: var(--spacing-sm);
  }

  .empty-hint {
    font-size: var(--text-xs);
  }

  .retry-btn {
    padding: var(--spacing-xs) var(--spacing-md);
    font-size: var(--text-sm);
  }
}
</style>
