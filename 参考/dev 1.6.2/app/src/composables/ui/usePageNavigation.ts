/**
 * @file usePageNavigation.ts
 * @description 页面导航 Composable - 管理页面切换和滚动
 * @author Eden System Team
 */

import { computed } from 'vue'
import { useNavigationStore } from '../../stores/navigationStore'

/**
 * 页面导航 Composable
 *
 * 管理页面切换和滚动。
 *
 * 注意:此 composable 使用 navigationStore 来管理页面状态,确保全局状态一致。
 *
 * @returns 页面导航状态和方法
 */
export function usePageNavigation() {
  const navigationStore = useNavigationStore()

  /**
   * 当前页面(从 navigationStore 获取)
   */
  const currentPage = computed(() => navigationStore.currentPage)

  /**
   * 导航到指定页面
   * @param pageId - 目标页面ID(home, status, shop, storage, achievements, review, load)
   */
  const navigateTo = (pageId: string) => {
    navigationStore.navigateTo(pageId)
  }

  /**
   * 滚动到页面顶部
   * @description 平滑滚动到页面顶部
   */
  const scrollToTop = () => {
    navigationStore.scrollToTop()
  }

  return {
    currentPage,
    navigateTo,
    scrollToTop,
  }
}
