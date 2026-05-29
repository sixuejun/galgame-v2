/**
 * @file external-apis.d.ts
 * @description 外部 API 类型定义 - 定义 JS-Slash-Runner 和 SillyTavern 的 API 类型
 * @author Eden System Team
 * @created 2025-10-11
 */

/**
 * SillyTavern v1 角色卡数据结构
 */
export interface SillyTavernCharData {
  /** 角色名称 */
  name: string
  /** 角色描述 */
  description?: string
  /** 角色性格 */
  personality?: string
  /** 场景设定 */
  scenario?: string
  /** 第一条消息 */
  first_mes?: string
  /** 示例对话 */
  mes_example?: string
  /** 创建者备注 */
  creator_notes?: string
  /** 系统提示词 */
  system_prompt?: string
  /** 发布后提示词 */
  post_history_instructions?: string
  /** 标签 */
  tags?: string[]
  /** 创建者 */
  creator?: string
  /** 角色版本 */
  character_version?: string
  /** 其他扩展字段 */
  [key: string]: unknown
}

/**
 * SillyTavern 命名空间（用于全局类型声明）
 */
declare global {
  namespace SillyTavern {
    export type v1CharData = SillyTavernCharData
  }
}

/**
 * 世界书条目类型
 */
export interface WorldbookEntry {
  /** 条目名称 */
  name: string
  /** 条目内容（YAML 格式） */
  content: string
  /** 是否启用 */
  enabled: boolean
  /** 触发策略 */
  strategy: {
    /** 策略类型 */
    type: string
    /** 主要关键词 */
    keys: string[]
    /** 次要关键词 */
    keys_secondary: {
      /** 逻辑运算符 */
      logic: string
      /** 关键词列表 */
      keys: string[]
    }
    /** 扫描深度 */
    scan_depth: string
  }
  /** 插入位置 */
  position: {
    /** 位置类型 */
    type: string
    /** 角色 */
    role: string
    /** 深度 */
    depth: number
    /** 顺序 */
    order?: number
  }
  /** 触发概率 */
  probability?: number
  /** 递归设置 */
  recursion?: {
    /** 阻止传入 */
    prevent_incoming: boolean
    /** 阻止传出 */
    prevent_outgoing: boolean
    /** 延迟到 */
    delay_until: string | null
  }
  /** 效果设置 */
  effect?: {
    /** 粘性 */
    sticky: string | null
    /** 冷却时间 */
    cooldown: string | null
    /** 延迟 */
    delay: string | null
  }
}

/**
 * 角色世界书绑定信息
 */
export interface CharWorldbooks {
  /** 主世界书名称 */
  primary: string | null
  /** 附加世界书名称列表 */
  additional: string[]
}

/**
 * AI 生成选项
 */
export interface GenerateOptions {
  /** 用户输入 */
  user_input: string
  /** 其他选项 */
  [key: string]: unknown
}

/**
 * 世界书更新选项
 */
export interface UpdateWorldbookOptions {
  /** 渲染模式 */
  render?: 'debounced' | 'immediate'
}

/**
 * 世界书更新器函数类型
 */
export type WorldbookUpdater = (worldbook: WorldbookEntry[]) => WorldbookEntry[] | void

/**
 * ST-ChatU8 图片生成请求数据
 */
export interface StChatu8ImageRequest {
  /** 请求 ID */
  id: string
  /** 图片描述提示词 */
  prompt: string
  /** 图片宽度（可为 null） */
  width: number | null
  /** 图片高度（可为 null） */
  height: number | null
}

/**
 * ST-ChatU8 图片生成响应数据
 */
export interface StChatu8ImageResponse {
  /** 请求 ID */
  id: string
  /** 是否成功 */
  success: boolean
  /** Base64 编码的图片数据 */
  imageData?: string
  /** 错误信息（如果失败） */
  error?: string
  /** 原始提示词 */
  prompt?: string
  /** 是否有变化 */
  change?: boolean
}

/**
 * 事件监听器函数类型
 */
export type EventListener = (data: unknown) => void

/**
 * 扩展 Window 接口 - JS-Slash-Runner API 和 ST-ChatU8 API
 */
declare global {
  interface Window {
    /**
     * 生成 AI 响应
     * @param options 生成选项
     * @returns AI 响应文本
     */
    generate(options: GenerateOptions): Promise<string>

    /**
     * 获取所有世界书名称列表
     * @returns 世界书名称数组
     */
    getWorldbookNames(): string[]

    /**
     * 获取角色卡数据
     * @param name 角色名称或头像ID，'current' 表示当前角色
     * @param allowAvatar 是否允许通过头像ID查找
     * @returns 角色卡数据
     */
    // eslint-disable-next-line no-undef
    getCharData(name: 'current' | string, allowAvatar?: boolean): SillyTavern.v1CharData | null

    /**
     * 获取角色头像路径
     * @param name 角色名称或头像ID，'current' 表示当前角色
     * @param allowAvatar 是否允许通过头像ID查找
     * @returns 角色头像路径
     */
    getCharAvatarPath(name: 'current' | string, allowAvatar?: boolean): string | null

    /**
     * 获取角色绑定的世界书信息
     * @param target 目标角色（'current' 表示当前角色）
     * @returns 角色世界书绑定信息
     */
    getCharWorldbookNames(target: 'current' | string): CharWorldbooks

    /**
     * 获取世界书内容
     * @param name 世界书名称
     * @returns 世界书条目数组
     */
    getWorldbook(name: string): Promise<WorldbookEntry[]>

    /**
     * 创建新世界书
     * @param name 世界书名称
     * @param entries 初始条目数组
     */
    createWorldbook(name: string, entries: WorldbookEntry[]): Promise<void>

    /**
     * 重新绑定角色的世界书
     * @param target 目标角色（'current' 表示当前角色）
     * @param worldbooks 世界书绑定信息
     */
    rebindCharWorldbooks(target: string, worldbooks: CharWorldbooks): Promise<void>

    /**
     * 使用更新器函数更新世界书
     * @param name 世界书名称
     * @param updater 更新器函数
     * @param options 更新选项
     */
    updateWorldbookWith(
      name: string,
      updater: WorldbookUpdater,
      options?: UpdateWorldbookOptions
    ): Promise<void>

    /**
     * ST-ChatU8 事件监听 - 注册事件监听器
     * @param eventName 事件名称
     * @param listener 监听器函数
     */
    eventOn?(eventName: string, listener: EventListener): void

    /**
     * ST-ChatU8 事件发送 - 发送事件
     * @param eventName 事件名称
     * @param data 事件数据
     */
    eventEmit?(eventName: string, data: unknown): void

    /**
     * ST-ChatU8 事件移除 - 移除事件监听器
     * @param eventName 事件名称
     * @param listener 监听器函数
     */
    eventRemoveListener?(eventName: string, listener: EventListener): void
  }
}

/**
 * 导出空对象以使此文件成为模块
 */
export {}
