<!--
  AchievementsFilters 组件

  成就筛选器组件，提供搜索和筛选功能。

  功能：
  - 搜索成就（按名称或描述）
  - 按状态筛选（全部/已解锁/未解锁）
  - 输入清理（防止 XSS）
  - 支持 v-model 双向绑定

  Props:
  - searchQuery (string): 搜索关键词
  - filterStatus (string): 筛选状态
  - statusOptions (SelectOption[]): 状态选项

  Emits:
  - update:searchQuery(value: string): 搜索关键词变化
  - update:filterStatus(value: string): 筛选状态变化
-->
<template>
  <section class="filters-section">
    <div class="search-box">
      <i class="fas fa-search" aria-hidden="true"></i>
      <input
        :model-value="searchQuery"
        type="text"
        placeholder="搜索成就名称或描述..."
        aria-label="搜索成就"
        class="search-input"
        @input="handleSearchInput"
      />
    </div>
    <div class="filter-controls">
      <CustomSelect
        :model-value="filterRarity"
        :options="rarityOptions"
        aria-label="按稀有度筛选"
        @update:model-value="emit('update:filterRarity', $event)"
      />
      <CustomSelect
        :model-value="filterStatus"
        :options="statusOptions"
        aria-label="按解锁状态筛选"
        @update:model-value="emit('update:filterStatus', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import CustomSelect, { type SelectOption } from '../../common/CustomSelect.vue'

interface Props {
  searchQuery: string
  filterRarity: string
  filterStatus: string
  rarityOptions: SelectOption[]
  statusOptions: SelectOption[]
}

defineProps<Props>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:filterRarity': [value: string]
  'update:filterStatus': [value: string]
}>()

const handleSearchInput = (event: Event) => {
  const target = event.target
  if (target && 'value' in target) {
    emit('update:searchQuery', String(target.value))
  }
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
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) calc(var(--spacing-md) * 2.5);
  border: 2px solid rgba(0, 128, 255, 0.2);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  background: white;
  transition: all var(--transition-base);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(0, 128, 255, 0.1);
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

  .filter-select {
    flex: 1;
  }
}
</style>
