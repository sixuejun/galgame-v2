/**
 * 全局类型定义
 * 扩展 Window 接口和其他全局类型
 */

import type { GameData } from './index'
import type DOMPurify from 'dompurify'

/**
 * Marked.js 配置选项类型
 */
interface MarkedOptions {
  breaks?: boolean
  gfm?: boolean
  headerIds?: boolean
  mangle?: boolean
  pedantic?: boolean
  sanitize?: boolean
  silent?: boolean
  smartLists?: boolean
  smartypants?: boolean
  xhtml?: boolean
}

/**
 * 扩展 Window 接口
 */
declare global {
  interface Window {
    /**
     * DOMPurify HTML 清理库（通过 CDN 加载）
     */
    DOMPurify: typeof DOMPurify

    /**
     * Marked.js Markdown 解析库（通过 CDN 加载）
     */
    marked: {
      parse: (markdown: string, options?: MarkedOptions) => string
      parseInline: (markdown: string, options?: MarkedOptions) => string
      setOptions: (options: MarkedOptions) => void
    }

    /**
     * Vue 3 框架（通过 CDN 加载）
     */
    Vue: {
      createApp: (rootComponent: Record<string, unknown>) => {
        mount: (el: string | Element) => void
        unmount: () => void
        use: (plugin: unknown, ...options: unknown[]) => void
      }
      ref: <T>(value: T) => { value: T }
      reactive: <T extends object>(target: T) => T
      computed: <T>(getter: () => T) => { value: T }
      watch: <T>(
        source: T | (() => T),
        callback: (newValue: T, oldValue: T) => void,
        options?: { immediate?: boolean; deep?: boolean }
      ) => void
      watchEffect: (effect: () => void) => void
      onMounted: (callback: () => void) => void
      onUnmounted: (callback: () => void) => void
      nextTick: (callback?: () => void) => Promise<void>
      // 添加其他需要的 Vue API
    }

    /**
     * js-yaml YAML 解析库（通过 CDN 加载）
     */
    jsyaml: {
      load: (str: string, options?: { schema?: unknown; json?: boolean }) => unknown
      dump: (obj: unknown, options?: { indent?: number; lineWidth?: number }) => string
    }

    /**
     * SillyTavern 扩展 API
     */
    SillyTavern?: {
      getContext: () => SillyTavernContext
    }

    /**
     * 游戏数据（全局状态）
     */
    gameData?: GameData
  }

  /**
   * SillyTavern 聊天消息接口
   */
  interface SillyTavernMessage {
    name: string
    is_user: boolean
    is_system: boolean
    mes: string
    swipe_id?: number
    swipes?: string[]
    send_date?: string
    extra?: Record<string, unknown>
  }

  /**
   * SillyTavern 角色接口
   */
  interface SillyTavernCharacter {
    name: string
    avatar?: string
    description?: string
    personality?: string
    scenario?: string
    first_mes?: string
    mes_example?: string
    [key: string]: unknown
  }

  /**
   * SillyTavern 群组接口
   */
  interface SillyTavernGroup {
    id: string
    name: string
    members: string[]
    [key: string]: unknown
  }

  /**
   * SillyTavern 上下文接口
   */
  interface SillyTavernContext {
    chat: SillyTavernMessage[]
    characters: SillyTavernCharacter[]
    groups: SillyTavernGroup[]
    // 添加其他 SillyTavern 上下文属性
  }
}

/**
 * 导出空对象以使此文件成为模块
 */
export {}
