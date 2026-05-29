<!--
  AchievementsPage 组件

  成就页面，显示游戏成就列表和完成进度。

  功能：
  - 显示成就总数和已解锁数量
  - 显示完成率
  - 支持按稀有度筛选
  - 支持按状态筛选（全部/已解锁/未解锁）
  - 支持搜索成就
  - 空状态提示

  Props:
  - config (Config, 可选): 游戏配置对象
  - achievements (Record<string, Achievement>, 默认: {}): 成就数据对象

  Emits:
  无

  使用示例:
  ```vue
  <AchievementsPage
    :config="gameConfig"
    :achievements="gameAchievements"
  />
  ```
-->
<template>
  <ErrorBoundary @error="handleError">
    <article class="page-achievements">
      <!-- 标题和统计区 -->
      <AchievementsHeader
        :page-title="pageTitle"
        :total-count="totalCount"
        :unlocked-count="unlockedCount"
        :completion-rate="completionRate"
      />

      <!-- 空状态 -->
      <AchievementsEmptyState
        v-if="achievementsList.length === 0"
        @navigate-to-home="navigateToHome"
      />

      <!-- 搜索和筛选区 -->
      <AchievementsFilters
        v-else
        v-model:search-query="searchQuery"
        v-model:filter-rarity="filterRarity"
        v-model:filter-status="filterStatus"
        :rarity-options="rarityOptions"
        :status-options="statusOptions"
      />

      <!-- 成就列表或无搜索结果 -->
      <AchievementsGrid v-if="achievementsList.length > 0" :achievements="filteredAchievements" />
    </article>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Config, Achievement } from '../../types'
import type { SelectOption } from '../common/CustomSelect.vue'
import ErrorBoundary from '../common/ErrorBoundary.vue'
import AchievementsHeader from './AchievementsPage/AchievementsHeader.vue'
import AchievementsEmptyState from './AchievementsPage/AchievementsEmptyState.vue'
import AchievementsFilters from './AchievementsPage/AchievementsFilters.vue'
import AchievementsGrid from './AchievementsPage/AchievementsGrid.vue'
import { usePageNavigation } from '../../composables/ui/usePageNavigation'
import { logger } from '../../utils/logger'

interface Props {
  config?: Config
  achievements?: { [key: string]: Achievement }
}

const props = withDefaults(defineProps<Props>(), {
  achievements: () => ({}),
})

const { navigateTo } = usePageNavigation()

// 搜索和筛选状态
const searchQuery = ref('')
const filterRarity = ref('all')
const filterStatus = ref('all')

// 下拉菜单选项
const rarityOptions: SelectOption[] = [
  { value: 'all', label: '全部稀有度' },
  { value: 'common', label: '普通' },
  { value: 'rare', label: '稀有' },
  { value: 'epic', label: '史诗' },
  { value: 'legendary', label: '传说' },
]

const statusOptions: SelectOption[] = [
  { value: 'all', label: '全部状态' },
  { value: 'unlocked', label: '已解锁' },
  { value: 'locked', label: '未解锁' },
]

// 页面标题 - 使用新数据模型结构
const pageTitle = computed(() => {
  return props.config?.achievements?.title || '成就记录'
})

const achievementsList = computed(() => {
  return Object.values(props.achievements || {})
})

// 统计数据
const totalCount = computed(() => achievementsList.value.length)
const unlockedCount = computed(() => achievementsList.value.filter(a => a.unlocked).length)
const completionRate = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((unlockedCount.value / totalCount.value) * 100)
})

// 筛选后的成就列表
const filteredAchievements = computed(() => {
  let result = achievementsList.value

  // 按搜索关键词筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      a => a.name.toLowerCase().includes(query) || a.desc.toLowerCase().includes(query)
    )
  }

  // 按稀有度筛选
  if (filterRarity.value !== 'all') {
    result = result.filter(a => (a.rarity || 'common').toLowerCase() === filterRarity.value)
  }

  // 按解锁状态筛选
  if (filterStatus.value === 'unlocked') {
    result = result.filter(a => a.unlocked)
  } else if (filterStatus.value === 'locked') {
    result = result.filter(a => !a.unlocked)
  }

  return result
})

const navigateToHome = () => {
  navigateTo('home')
}

/**
 * 处理错误
 */
const handleError = (error: Error) => {
  logger.error('成就页面发生错误:', error)
}
</script>

<style scoped>
.page-achievements {
  animation: fadeInUp var(--transition-slow) cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
