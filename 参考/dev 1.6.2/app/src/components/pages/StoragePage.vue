<!--
  StoragePage 组件

  仓库页面，用于查看和管理玩家的物品库存。

  功能：
  - 显示仓库物品列表
  - 搜索和筛选物品（按名称、描述、分类）
  - 排序物品（按数量、名称）
  - 分页显示
  - 查看物品详情
  - 使用物品
  - 显示物品统计信息
  - 加载状态和空状态处理
  - 错误边界保护

  Props:
  - config (Config, 可选): 游戏配置对象
  - storage (StorageData, 可选): 仓库数据，包含物品库存

  使用示例:
  ```vue
  <StoragePage
    :config="gameConfig"
    :storage="storageData"
  />
  ```
-->
<template>
  <ErrorBoundary @error="handleError">
    <article class="page-storage">
      <header class="storage-header">
        <h2 id="page-title">{{ pageTitle }}</h2>
        <div class="storage-info" role="status" aria-live="polite" aria-label="仓库物品统计">
          <i class="fas fa-box" aria-hidden="true"></i>
          <span>共 {{ inventoryArray.length }} 种物品</span>
          <span v-if="totalPages > 1" class="page-indicator"
            >第 {{ currentPage }} / {{ totalPages }} 页</span
          >
        </div>
      </header>

      <!-- 空状态 -->
      <StorageEmptyState
        v-if="!isLoading && inventoryArray.length === 0"
        @navigate-to-shop="navigateToShop"
      />

      <!-- 搜索和筛选区 -->
      <StorageFilters
        v-else-if="!isLoading"
        v-model:search-query="searchQuery"
        v-model:filter-category="filterCategory"
        v-model:sort-by="sortBy"
        :category-options="categoryOptions"
        :sort-options="sortOptions"
      />

      <!-- 加载状态 -->
      <section
        v-if="isLoading"
        class="storage-grid"
        role="status"
        aria-live="polite"
        aria-label="正在加载物品"
      >
        <SkeletonCard v-for="i in 24" :key="i" />
      </section>

      <!-- 实际内容 -->
      <section v-else-if="filteredInventory.length > 0">
        <StorageGrid :items="paginatedInventory" @item-click="handleItemClick" />

        <!-- 分页控件 -->
        <StoragePagination
          :current-page="currentPage"
          :total-pages="totalPages"
          @prev-page="goToPage(currentPage - 1)"
          @next-page="goToPage(currentPage + 1)"
        />
      </section>

      <!-- 无搜索结果 -->
      <section v-else-if="inventoryArray.length > 0 && !isLoading" class="no-results" role="status">
        <i class="fas fa-search" aria-hidden="true"></i>
        <p>未找到匹配的物品</p>
      </section>

      <!-- 物品使用模态框 -->
      <StorageItemModal
        :is-visible="itemModalVisible"
        :item="selectedItem"
        @close="hideItemModal"
        @use-item="handleUseItem"
      />
    </article>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Config, StorageData, Item } from '../../types'
import ErrorBoundary from '../common/ErrorBoundary.vue'
import SkeletonCard from '../common/SkeletonCard.vue'
import StorageFilters from './StoragePage/StorageFilters.vue'
import StorageGrid from './StoragePage/StorageGrid.vue'
import StoragePagination from './StoragePage/StoragePagination.vue'
import StorageEmptyState from './StoragePage/StorageEmptyState.vue'
import StorageItemModal from './StoragePage/StorageItemModal.vue'
import { useStorageFiltering } from '../../composables/game/useStorageFiltering'
import { useItemEffects } from '../../composables/game/useItemEffects'
import { usePageNavigation } from '../../composables/ui/usePageNavigation'
import { logger } from '../../utils/logger'

interface Props {
  config?: Config
  storage?: StorageData
}

const props = withDefaults(defineProps<Props>(), {})

const { useItem } = useItemEffects()
const { navigateTo } = usePageNavigation()

// 页面标题 - 使用新数据模型结构
const pageTitle = computed(() => {
  return props.config?.storage?.title || '物品存储'
})

const inventoryArray = computed(() => {
  return Object.values(props.storage?.inventory || {})
})

// 使用筛选和分页 composable
const {
  searchQuery,
  filterCategory,
  sortBy,
  currentPage,
  isLoading,
  categoryOptions,
  sortOptions,
  filteredInventory,
  paginatedInventory,
  totalPages,
  goToPage,
} = useStorageFiltering(inventoryArray)

const navigateToShop = () => {
  logger.info('🛒 用户点击前往商店按钮')
  navigateTo('shop')
}

// 物品模态框状态
const itemModalVisible = ref(false)
const selectedItem = ref<Item | null>(null)

const hideItemModal = () => {
  itemModalVisible.value = false
  selectedItem.value = null
}

const handleItemClick = (item: Item) => {
  selectedItem.value = item
  itemModalVisible.value = true
}

const handleUseItem = async (itemId: string, quantity: number) => {
  await useItem(itemId, quantity)
  hideItemModal()
}

/**
 * 处理错误
 */
const handleError = (error: Error) => {
  logger.error('物品存储页面发生错误:', error)
}

// 暴露方法供测试使用
defineExpose({
  handleUseItem,
  navigateToShop,
})
</script>

<style scoped>
.page-storage {
  animation: fadeInUp var(--transition-slow) cubic-bezier(0.4, 0, 0.2, 1);
}

.storage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.page-storage h2 {
  color: var(--primary-blue);
  margin: 0;
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  background: linear-gradient(135deg, var(--primary-blue), var(--purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.storage-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: linear-gradient(135deg, rgba(147, 112, 219, 0.1), rgba(138, 43, 226, 0.1));
  border: 2px solid var(--purple);
  border-radius: var(--radius-full);
  color: var(--purple);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
}

/* 筛选区样式已移至 StorageFilters.vue */
/* 空状态样式已移至 StorageEmptyState.vue */

/* 网格样式已移至 StorageGrid.vue */

/* 无搜索结果 */
.no-results {
  text-align: center;
  padding: var(--spacing-3xl);
  color: var(--text-muted);
}

.no-results i {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
  opacity: 0.3;
}

.no-results p {
  font-size: var(--text-lg);
}

.page-indicator {
  margin-left: var(--spacing-md);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

/* 分页样式已移至 StoragePagination.vue */

@media (max-width: 768px) {
  .storage-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-storage h2 {
    font-size: var(--text-2xl);
  }

  .storage-info {
    font-size: var(--text-sm);
    padding: var(--spacing-xs) var(--spacing-md);
  }
}
</style>
