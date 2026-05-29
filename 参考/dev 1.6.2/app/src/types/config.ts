/**
 * 导航按钮配置（外部数据仅包含 name 和 icon）
 */
export interface NavButton {
  id: string
  name: string
  icon: string
}

/**
 * 状态页面 Tab 配置
 */
export interface StatusTab {
  id: string
  name: string
  icon?: string
}

/**
 * 页面配置接口
 */
export interface PageConfig {
  title?: string
}

/**
 * 主页配置接口
 */
export interface HomePageConfig extends PageConfig {
  subtitle?: string
  choiceHeader?: string
}

/**
 * 状态页配置接口
 */
export interface StatusPageConfig extends PageConfig {
  tabs?: {
    [tabId: string]: StatusTab
  }
}

/**
 * 购物车配置接口
 */
export interface CartConfig {
  name?: string // 购物车按钮名称，默认 "购物车"
  icon?: string // 购物车图标，默认 "fa-shopping-cart"
  title?: string // 购物车页面标题，默认 "购物车"
}

/**
 * 配置数据
 */
export interface Config {
  version: string
  phase: string
  navButtons?: {
    [key: string]: {
      name?: string
      icon?: string
    }
  }
  cart?: CartConfig // 购物车配置
  home?: HomePageConfig
  status?: StatusPageConfig
  shop?: PageConfig
  storage?: PageConfig
  achievements?: PageConfig
  review?: PageConfig
}
