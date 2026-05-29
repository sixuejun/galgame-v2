/**
 * 应用常量定义
 */

// ========== 消息常量 ==========
// 注意: 这些消息常量为未来的国际化和统一消息管理预留
// 当前应用中大部分消息直接硬编码在组件中,未来可以逐步迁移到使用这些常量
export {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  INFO_MESSAGES,
  WARNING_MESSAGES,
  VALIDATION_ERROR_MESSAGES,
} from './messages'
export type { ErrorMessage, SuccessMessage, InfoMessage, WarningMessage } from './messages'

// ========== UI 常量 ==========

/**
 * 响应式断点
 * 用于响应式布局和媒体查询
 * 当前使用: StatusPage.vue
 */
export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1440,
} as const

/**
 * Toast 提示持续时间（毫秒）
 * 用于控制 Toast 通知的显示时长
 * 当前使用: useToast.ts
 */
export const TOAST_DURATION = {
  SHORT: 2000,
  NORMAL: 3000,
  LONG: 5000,
} as const

/**
 * 输入限制
 * 预留: 用于统一管理各种输入框的长度限制
 * 未来可以在更多输入组件中使用这些常量
 */
export const INPUT_LIMITS = {
  CUSTOM_ACTION_MAX_LENGTH: 500,
  CUSTOM_ACTION_WARNING_THRESHOLD: 450,
} as const

/**
 * 数据验证限制
 * 用于数据验证和清理
 * 当前使用: sanitize.ts
 */
export const VALIDATION_LIMITS = {
  /** Story 内容最大长度 */
  STORY_CONTENT_MAX_LENGTH: 50000,
  /** 用户输入默认最大长度 */
  USER_INPUT_MAX_LENGTH: 500,
  /** DOMPurify 失败时的文本截断长度 */
  SANITIZE_FALLBACK_MAX_LENGTH: 1000,
} as const

/**
 * 重试配置
 * 预留: 用于统一管理重试相关的配置
 * 未来可以在设置页面中使用这些常量作为输入限制
 */
export const RETRY_CONFIG = {
  /** 重试延迟最小值（毫秒） */
  DELAY_MIN: 500,
  /** 重试延迟最大值（毫秒） */
  DELAY_MAX: 5000,
  /** 重试延迟步长（毫秒） */
  DELAY_STEP: 100,
} as const

/**
 * 动画持续时间（毫秒）
 * 预留: 用于统一管理动画和过渡效果的持续时间
 * 未来可以在 CSS 过渡和 JavaScript 动画中使用
 */
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
} as const

/**
 * Z-Index 层级
 * 预留: 用于统一管理 UI 层级
 * 未来可以在 CSS 中使用 CSS 变量引用这些值
 */
export const Z_INDEX = {
  MODAL_BACKDROP: 1000,
  MODAL: 1001,
  TOAST: 1002,
  DROPDOWN: 100,
} as const

/**
 * 默认值
 * 预留: 用于统一管理各种默认值
 * 未来可以在更多组件中使用这些常量
 */
export const DEFAULTS = {
  ITEM_QUANTITY: 1,
  PAGE_SIZE: 20,
} as const

/**
 * 时间相关常量（毫秒）
 * 用于统一管理各种延迟、超时等时间参数
 */
export const TIMING = {
  /** 世界书写入延迟 - 给世界书一点时间完成写入操作后再刷新存档列表 */
  WORLDBOOK_WRITE_DELAY: 200,
  /** ST-ChatU8 图片生成超时最小值 */
  ST_CHATU8_TIMEOUT_MIN: 5000,
  /** ST-ChatU8 图片生成超时最大值 */
  ST_CHATU8_TIMEOUT_MAX: 120000,
  /** ST-ChatU8 图片生成超时步长 */
  ST_CHATU8_TIMEOUT_STEP: 1000,
} as const

/**
 * 导航按钮默认配置
 * 所有按钮默认启用且始终显示，外部数据仅用于自定义显示文本和图标
 * 当前使用: NavBar.vue
 */
export const DEFAULT_NAV_BUTTONS = {
  home: {
    id: 'home',
    name: '主页',
    icon: 'fa-home',
  },
  status: {
    id: 'status',
    name: '状态',
    icon: 'fa-chart-line',
  },
  shop: {
    id: 'shop',
    name: '购物',
    icon: 'fa-shopping-cart',
  },
  storage: {
    id: 'storage',
    name: '存储',
    icon: 'fa-box',
  },
  achievements: {
    id: 'achievements',
    name: '成就',
    icon: 'fa-trophy',
  },
  review: {
    id: 'review',
    name: '回顾',
    icon: 'fa-history',
  },
  settings: {
    id: 'settings',
    name: '设置',
    icon: 'fa-cog',
  },
} as const
