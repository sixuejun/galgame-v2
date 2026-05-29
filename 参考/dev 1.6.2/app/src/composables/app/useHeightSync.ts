/**
 * @file useHeightSync.ts
 * @description 应用高度同步管理 Composable - 监听状态变化并同步 iframe 高度
 * @author Eden System Team
 */

import { watch, type Ref } from 'vue'
import { useIframeHeightSync } from '../ui/useIframeHeightSync'
import type {
  Story,
  Choice,
  Character,
  ShopData,
  StorageData,
  Achievement,
  Summary,
} from '../../types'

/**
 * 应用高度同步管理 Composable
 *
 * 提供应用高度同步的管理功能，监听各种状态变化并自动触发 iframe 高度同步。
 * 确保在 SillyTavern 中嵌入时，iframe 高度能够正确适应内容变化。
 *
 * 功能：
 * - 监听页面切换，立即同步高度（不防抖）
 * - 监听关键数据变化，触发高度同步（使用防抖）
 * - 监听模态框和加载状态变化，触发高度同步
 *
 * @param options 配置选项
 * @param options.currentPage 当前页面的响应式引用
 * @param options.story 故事数据的响应式引用
 * @param options.choices 选项数据的响应式引用
 * @param options.characters 角色数据的响应式引用
 * @param options.shop 商店数据的响应式引用
 * @param options.storage 仓库数据的响应式引用
 * @param options.achievements 成就数据的响应式引用
 * @param options.summaries 总结数据的响应式引用
 * @param options.modalVisible 模态框是否可见的响应式引用
 * @param options.isLoadingAI AI 是否正在加载的响应式引用
 * @returns 高度同步相关的方法
 *
 * @example
 * ```typescript
 * const currentPage = ref('story')
 * const story = ref<Story>({ ... })
 * const { syncHeight } = useHeightSync({
 *   currentPage,
 *   story,
 *   choices,
 *   characters,
 *   shop,
 *   storage,
 *   achievements,
 *   summaries,
 *   modalVisible,
 *   isLoadingAI
 * })
 *
 * // 手动触发高度同步
 * syncHeight(true) // 立即同步，不防抖
 * ```
 */
export function useHeightSync(options: {
  currentPage: Ref<string>
  story: Ref<Story | undefined>
  choices: Ref<Choice[] | undefined>
  characters: Ref<Record<string, Character> | undefined>
  shop: Ref<ShopData | undefined>
  storage: Ref<StorageData | undefined>
  achievements: Ref<Record<string, Achievement> | undefined>
  summaries: Ref<Summary[] | undefined>
  modalVisible: Ref<boolean>
  isLoadingAI: Ref<boolean>
}) {
  const {
    currentPage,
    story,
    choices,
    characters,
    shop,
    storage,
    achievements,
    summaries,
    modalVisible,
    isLoadingAI,
  } = options

  const { syncHeight } = useIframeHeightSync()

  // 监听页面切换，触发高度同步
  watch(currentPage, () => {
    // 页面切换后，等待 DOM 更新再同步高度
    setTimeout(() => {
      syncHeight(true) // 立即同步，不防抖
    }, 100)
  })

  // 监听关键数据变化，触发高度同步
  watch(
    [story, choices, characters, shop, storage, achievements, summaries],
    () => {
      syncHeight() // 使用防抖
    },
    { deep: true }
  )

  // 监听模态框和加载状态变化，触发高度同步
  watch([modalVisible, isLoadingAI], () => {
    // 模态框和加载状态变化可能影响页面高度
    setTimeout(() => {
      syncHeight()
    }, 50)
  })

  return {
    syncHeight,
  }
}
