/**
 * @file useTheme.ts
 * @description 主题管理 Composable - 提供主题切换和管理功能
 * @author Eden System Team
 */

import { watch, onMounted } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore'
import type { ThemeType } from '../../types'
import { logger } from '../../utils/logger'

/**
 * 应用主题到 DOM
 */
function applyTheme(theme: ThemeType): void {
  // 移除所有主题类
  document.documentElement.removeAttribute('data-theme')

  // 应用新主题
  document.documentElement.setAttribute('data-theme', theme)

  logger.info(`✅ 主题已切换为: ${theme}`)
}

/**
 * 主题管理 Hook
 */
export function useTheme() {
  const settingsStore = useSettingsStore()

  /**
   * 切换主题
   */
  const setTheme = (theme: ThemeType): void => {
    settingsStore.updateSetting('theme', theme)
    applyTheme(theme)
  }

  /**
   * 获取当前主题
   */
  const getCurrentTheme = (): ThemeType => {
    return settingsStore.settings.theme
  }

  /**
   * 初始化主题
   */
  const initTheme = (): void => {
    const currentTheme = settingsStore.settings.theme
    applyTheme(currentTheme)
  }

  // 监听主题变化
  watch(
    () => settingsStore.settings.theme,
    newTheme => {
      applyTheme(newTheme)
    }
  )

  // 组件挂载时初始化主题
  onMounted(() => {
    initTheme()
  })

  return {
    setTheme,
    getCurrentTheme,
    initTheme,
  }
}
