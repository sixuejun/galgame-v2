<!--
  ShopPage 组件

  商店页面，用于浏览和购买游戏物品。

  功能：
  - 显示商店物品列表
  - 搜索和筛选物品（按名称、描述、分类）
  - 排序物品（按价格、名称）
  - 分页显示
  - 添加物品到购物车
  - 直接购买物品
  - 显示货币余额和购物车状态
  - 加载状态和空状态处理
  - 错误边界保护

  Props:
  - config (Config, 可选): 游戏配置对象
  - shop (ShopData, 可选): 商店数据，包含货币和物品

  使用示例:
  ```vue
  <ShopPage
    :config="gameConfig"
    :shop="shopData"
  />
  ```
-->
<template>
  <ErrorBoundary @error="handleError">
    <article class="page-shop">
      <!-- 头部 -->
      <ShopHeader
        :page-title="pageTitle"
        :currency="currency"
        :currency-type="currencyType"
        :currency-display-mode="currencyDisplayMode"
        :total-items="totalItems"
        :cart-items-count="cartItemsCount"
        :is-loading="isLoading"
        :cart-button-name="cartButtonName"
        :cart-button-icon="cartButtonIcon"
        @navigate-to-cart="navigateToCart"
      />

      <!-- 空状态 -->
      <ShopEmptyState v-if="!isLoading && itemsArray.length === 0" />

      <!-- 搜索和筛选区 -->
      <ShopFilters
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
        class="shop-items-loading"
        role="status"
        aria-live="polite"
        aria-label="正在加载商品"
      >
        <SkeletonCard v-for="i in 12" :key="i" />
      </section>

      <!-- 实际内容 -->
      <ShopItemGrid
        v-else-if="filteredAndSortedItems.length > 0"
        :paginated-items="paginatedItemsObject"
        @buy="handleBuy"
        @add-to-cart="handleAddToCart"
      />

      <!-- 无搜索结果 -->
      <section v-else-if="itemsArray.length > 0" class="no-results" role="status">
        <i class="fas fa-search" aria-hidden="true"></i>
        <p>未找到匹配的商品</p>
      </section>

      <!-- 分页控件 -->
      <ShopPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :is-first-page="isFirstPage"
        :is-last-page="isLastPage"
        @prev-page="handlePrevPage"
        @next-page="handleNextPage"
      />
    </article>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Config, ShopData } from '../../types'
import ErrorBoundary from '../common/ErrorBoundary.vue'
import SkeletonCard from '../common/SkeletonCard.vue'
import ShopHeader from './ShopPage/ShopHeader.vue'
import ShopEmptyState from './ShopPage/ShopEmptyState.vue'
import ShopFilters from './ShopPage/ShopFilters.vue'
import ShopItemGrid from './ShopPage/ShopItemGrid.vue'
import ShopPagination from './ShopPage/ShopPagination.vue'
import { useShop } from '../../composables/shop/useShop'
import { useShoppingCart } from '../../composables/shop/useShoppingCart'
import { usePageNavigation } from '../../composables/ui/usePageNavigation'
import { useToast } from '../../composables/ui/useToast'
import { usePagination } from '../../composables/ui/usePagination'
import { useShopFilters, type ShopItem } from '../../composables/shop/useShopFilters'
import { debounce } from '../../utils/debounce'
import { logger } from '../../utils/logger'

interface Props {
  config?: Config
  shop?: ShopData
}

const props = withDefaults(defineProps<Props>(), {})

// Composables
const { buyItem } = useShop()
const { addToCart, cartItemsCount } = useShoppingCart()
const { navigateTo } = usePageNavigation()
const { success } = useToast()

// Computed props
// 页面标题 - 使用新数据模型结构
const pageTitle = computed(() => {
  return props.config?.shop?.title || 'UNDO商店'
})
const currency = computed(() => props.shop?.currency || 0)
const currencyType = computed(() => props.shop?.currencyType)
const currencyDisplayMode = computed(() => props.shop?.currencyDisplayMode)
const items = computed(() => props.shop?.items || {})

// 购物车配置
const cartButtonName = computed(() => props.config?.cart?.name)
const cartButtonIcon = computed(() => props.config?.cart?.icon)

// Loading state
const isLoading = ref(false)

// 将商品对象转换为数组
const itemsArray = computed<ShopItem[]>(() => {
  const itemsObj = items.value
  return Object.entries(itemsObj).map(([key, item]) => ({
    ...item,
    id: key,
  }))
})

// 搜索功能（带防抖）
const searchQuery = ref('')
const searchQueryDebounced = ref('')

// 防抖更新搜索查询
const updateSearchQueryDebounced = debounce((value: string) => {
  searchQueryDebounced.value = value
}, 300)

// 监听搜索查询变化，使用防抖更新
watch(searchQuery, newValue => {
  updateSearchQueryDebounced(newValue)
})

// 搜索过滤（基于防抖后的查询）
const searchedItems = computed(() => {
  if (!searchQueryDebounced.value.trim()) {
    return itemsArray.value
  }
  const query = searchQueryDebounced.value.toLowerCase()
  return itemsArray.value.filter(
    item =>
      item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
  )
})

// 使用 useShopFilters composable
const { filterCategory, sortBy, categoryOptions, sortOptions, filteredAndSortedItems } =
  useShopFilters(itemsArray, searchedItems)

// 使用 usePagination composable
const {
  currentPage,
  totalPages,
  paginatedItems,
  isFirstPage,
  isLastPage,
  prevPage,
  nextPage,
  resetPage,
} = usePagination(filteredAndSortedItems, {
  itemsPerPage: 12,
})

// 总商品数
const totalItems = computed(() => filteredAndSortedItems.value.length)

// 将分页后的数组转换回对象格式（为了兼容 ShopItem 组件）
const paginatedItemsObject = computed(() => {
  return paginatedItems.value.reduce(
    (acc, item) => {
      acc[item.id] = item
      return acc
    },
    {} as Record<string, ShopItem>
  )
})

// 当筛选条件变化时，重置到第一页
watch([searchQueryDebounced, filterCategory, sortBy], () => {
  resetPage()
})

/**
 * 处理上一页
 */
const handlePrevPage = () => {
  isLoading.value = true
  setTimeout(() => {
    prevPage()
    isLoading.value = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, 300)
}

/**
 * 处理下一页
 */
const handleNextPage = () => {
  isLoading.value = true
  setTimeout(() => {
    nextPage()
    isLoading.value = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, 300)
}

/**
 * 处理购买
 */
const handleBuy = (itemId: string) => {
  buyItem(itemId)
}

/**
 * 处理添加到购物车
 */
const handleAddToCart = (itemId: string) => {
  const item = props.shop?.items?.[itemId]
  if (item) {
    addToCart(item, 1)
    success(`已将 "${item.name}" 添加到购物车`)
  }
}

/**
 * 导航到购物车页面
 */
const navigateToCart = () => {
  navigateTo('cart')
}

/**
 * 处理错误
 */
const handleError = (error: Error) => {
  logger.error('商店页面发生错误:', error)
}

// 暴露给测试使用
defineExpose({
  isLoading,
  pageTitle,
  currency,
  items,
  handleBuy,
  handleAddToCart,
  navigateToCart,
})
</script>

<style scoped>
.page-shop {
  animation: fadeInUp var(--transition-slow) cubic-bezier(0.4, 0, 0.2, 1);
}

/* 加载状态的商品网格 */
.shop-items-loading {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

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

@media (max-width: 1024px) {
  .shop-items-loading {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  /* 小屏模式下改为双列显示，减少滚动距离 */
  .shop-items-loading {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
  }
}

/* 超小屏模式优化 (300px-500px) - 单列显示 */
@media (max-width: 500px) {
  .shop-items-loading {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
}
</style>
