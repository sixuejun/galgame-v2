<!--
  StorageFilters 组件

  仓库筛选器组件，提供搜索、分类筛选和排序功能。

  功能：
  - 搜索物品（按名称或描述）
  - 按分类筛选
  - 排序选择
  - 输入清理（防止 XSS）
  - 支持 v-model 双向绑定

  Props:
  - searchQuery (string): 搜索关键词
  - filterCategory (string): 筛选分类
  - sortBy (string): 排序方式
  - categoryOptions (SelectOption[]): 分类选项
  - sortOptions (SelectOption[]): 排序选项

  Emits:
  - update:searchQuery(value: string): 搜索关键词变化
  - update:filterCategory(value: string): 筛选分类变化
  - update:sortBy(value: string): 排序方式变化
-->
<template>
  <section class="filters-section">
    <div class="search-box">
      <i class="fas fa-search" aria-hidden="true"></i>
      <input
        :value="searchQuery"
        type="text"
        placeholder="搜索物品名称或描述..."
        aria-label="搜索物品"
        class="search-input"
        maxlength="100"
        @input="handleSearchInput"
      />
    </div>
    <div class="filter-controls">
      <CustomSelect
        :model-value="filterCategory"
        :options="categoryOptions"
        aria-label="按分类筛选"
        @update:model-value="$emit('update:filterCategory', $event)"
      />
      <CustomSelect
        :model-value="sortBy"
        :options="sortOptions"
        aria-label="排序方式"
        @update:model-value="$emit('update:sortBy', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import CustomSelect, { type SelectOption } from '../../common/CustomSelect.vue'
import { sanitizeUserInput } from '../../../utils/sanitize'

interface Props {
  searchQuery: string
  filterCategory: string
  sortBy: string
  categoryOptions: SelectOption[]
  sortOptions: SelectOption[]
}

interface Emits {
  (e: 'update:searchQuery', value: string): void
  (e: 'update:filterCategory', value: string): void
  (e: 'update:sortBy', value: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * 处理搜索输入
 */
const handleSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const sanitized = sanitizeUserInput(target.value)
  emit('update:searchQuery', sanitized)
}
</script>

<style scoped>
/* 搜索和筛选区 */
.filters-section {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 250px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-box i {
  position: absolute;
  left: var(--spacing-md);
  color: var(--text-secondary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) calc(var(--spacing-md) * 2.5);
  border: 2px solid rgba(147, 112, 219, 0.2);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  background: white;
  color: var(--text-primary);
  transition: all var(--transition-base);
}

.search-input:focus {
  outline: none;
  border-color: var(--purple);
  box-shadow: 0 0 0 3px rgba(147, 112, 219, 0.1);
}

.filter-controls {
  display: flex;
  gap: var(--spacing-sm);
}

@media (max-width: 768px) {
  .filters-section {
    flex-direction: column;
  }

  .search-box {
    min-width: 100%;
  }

  .filter-controls {
    width: 100%;
  }
}
</style>
