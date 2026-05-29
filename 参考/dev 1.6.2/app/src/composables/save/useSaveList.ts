/**
 * @file useSaveList.ts
 * @description 存档列表 Composable - 管理存档列表的加载、刷新和分页
 * @author Eden System Team
 */

import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { usePagination } from '../ui/usePagination'
import { WorldbookSaveService, type SaveInfo } from '../../services/worldbook'
import { useGameStore } from '../../stores/gameStore'
import { logger } from '../../utils/logger'
import { TIMING } from '../../constants'

/**
 * 存档列表配置选项
 */
export interface UseSaveListOptions {
  /**
   * 每页显示的存档数量
   * @default 20
   */
  itemsPerPage?: number
  /**
   * 是否在挂载时自动加载
   * @default true
   */
  autoLoad?: boolean
}

/**
 * 存档列表返回值
 */
export interface UseSaveListReturn {
  /**
   * 存档列表
   */
  saves: Ref<SaveInfo[]>
  /**
   * 是否正在加载
   */
  isLoading: Ref<boolean>
  /**
   * 错误消息
   */
  errorMessage: Ref<string>
  /**
   * 当前页码
   */
  currentPage: Ref<number>
  /**
   * 总页数
   */
  totalPages: Ref<number>
  /**
   * 当前页的存档列表
   */
  paginatedSaves: Ref<SaveInfo[]>
  /**
   * 跳转到指定页
   */
  goToPage: (page: number) => void
  /**
   * 跳转到下一页
   */
  nextPage: () => void
  /**
   * 跳转到上一页
   */
  prevPage: () => void
  /**
   * 加载存档列表
   */
  loadSaves: () => Promise<void>
  /**
   * 刷新存档列表
   */
  refreshSaves: () => Promise<void>
  /**
   * 获取存档图标
   */
  getSaveIcon: (saveType: string) => string
  /**
   * 获取存档类型文本
   */
  getSaveTypeText: (saveType: string) => string
  /**
   * 格式化时间
   */
  formatTime: (timeStr: string) => string
}

/**
 * 存档列表管理 Composable
 *
 * 提供存档列表的加载、分页等功能
 *
 * @param options 配置选项
 * @returns 存档列表相关的状态和方法
 *
 * @example
 * ```ts
 * const {
 *   saves,
 *   isLoading,
 *   paginatedSaves,
 *   currentPage,
 *   totalPages,
 *   goToPage,
 *   loadSaves
 * } = useSaveList({ itemsPerPage: 20 })
 * ```
 */
export function useSaveList(options: UseSaveListOptions = {}): UseSaveListReturn {
  const { itemsPerPage = 20, autoLoad = true } = options

  // State
  const saves = ref<SaveInfo[]>([])
  const isLoading = ref(false)
  const errorMessage = ref('')

  // 获取 gameStore 以监听存档事件
  const gameStore = useGameStore()
  const { lastSaveTimestamp } = storeToRefs(gameStore)

  // 使用分页 Composable
  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedSaves,
    goToPage,
    nextPage,
    prevPage,
  } = usePagination(saves, { itemsPerPage })

  // Methods
  /**
   * 加载存档列表
   */
  const loadSaves = async () => {
    isLoading.value = true
    errorMessage.value = ''
    try {
      saves.value = await WorldbookSaveService.getAllSaves()
      logger.info(`✅ 加载了 ${saves.value.length} 个存档`)
    } catch (error) {
      logger.error('❌ 加载存档列表失败:', error)
      errorMessage.value = error instanceof Error ? error.message : '加载失败'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 刷新存档列表
   */
  const refreshSaves = async () => {
    await loadSaves()
  }

  /**
   * 获取存档图标
   */
  const getSaveIcon = (saveType: string): string => {
    switch (saveType) {
      case 'auto':
        return 'fa-save'
      case 'manual':
        return 'fa-bookmark'
      case 'init':
        return 'fa-seedling'
      default:
        return 'fa-file'
    }
  }

  /**
   * 获取存档类型文本
   */
  const getSaveTypeText = (saveType: string): string => {
    switch (saveType) {
      case 'auto':
        return '自动存档'
      case 'manual':
        return '手动存档'
      case 'init':
        return '初始化'
      default:
        return '未知'
    }
  }

  /**
   * 格式化时间
   */
  const formatTime = (timeStr: string): string => {
    try {
      const date = new Date(timeStr)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return timeStr
    }
  }

  // Lifecycle
  if (autoLoad) {
    onMounted(() => {
      loadSaves()
    })
  }

  // 监听存档时间戳变化以自动刷新存档列表
  // 当自动存档、手动存档或初始化存档完成时，gameStore 会更新 lastSaveTimestamp
  // 这样可以实时刷新读档页面，无需手动触发
  const stopWatch = watch(lastSaveTimestamp, (newTimestamp, oldTimestamp) => {
    // 只有在时间戳真正变化且不为初始值时才刷新
    if (newTimestamp > 0 && newTimestamp !== oldTimestamp) {
      logger.debug('🔄 检测到存档事件，刷新存档列表')
      // 使用 setTimeout 避免在 watch 回调中立即执行异步操作
      // 同时给世界书一点时间完成写入操作
      setTimeout(() => {
        refreshSaves()
      }, TIMING.WORLDBOOK_WRITE_DELAY)
    }
  })

  // 组件卸载时停止监听
  onUnmounted(() => {
    stopWatch()
  })

  return {
    saves,
    isLoading,
    errorMessage,
    currentPage,
    totalPages,
    paginatedSaves,
    goToPage,
    nextPage,
    prevPage,
    loadSaves,
    refreshSaves,
    getSaveIcon,
    getSaveTypeText,
    formatTime,
  }
}
