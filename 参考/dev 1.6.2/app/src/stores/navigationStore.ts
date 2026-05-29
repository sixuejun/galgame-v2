import { defineStore } from 'pinia'
import { ref } from 'vue'
import { logger } from '../utils/logger'

/**
 * 页面导航 Store
 * 管理页面导航状态和滚动行为
 *
 * 注意:页面导航状态不持久化,每次刷新都从主页开始
 */
export const useNavigationStore = defineStore('navigation', () => {
  // ========== 页面导航 ==========
  const currentPage = ref('home')

  /**
   * 导航到指定页面
   * @param pageId - 目标页面ID
   */
  function navigateTo(pageId: string) {
    currentPage.value = pageId
    scrollToTop()
  }

  /**
   * 滚动到页面顶部
   * 查找当前活动页面的标题元素并平滑滚动到该位置
   */
  function scrollToTop() {
    const activePage = document.querySelector('.page.active')

    if (activePage) {
      const pageTitle = activePage.querySelector('#page-title')

      if (pageTitle) {
        pageTitle.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        })
      } else {
        logger.warn('未找到当前页面的标题元素 #page-title')
      }
    } else {
      logger.warn('未找到活动页面 .page.active')
    }
  }

  /**
   * 重置 Store 到初始状态
   */
  function $reset() {
    currentPage.value = 'home'
    logger.info('🔄 navigationStore 已重置到初始状态')
  }

  return {
    // 状态
    currentPage,

    // 方法
    navigateTo,
    scrollToTop,
    $reset,
  }
})
