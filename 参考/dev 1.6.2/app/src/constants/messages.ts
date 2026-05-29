/**
 * 应用消息常量
 * 集中管理所有错误消息、成功消息和提示消息，便于维护和国际化
 *
 * 注意: 这些消息常量为未来的国际化和统一消息管理预留
 * 当前应用中大部分消息直接硬编码在组件中,未来可以逐步迁移到使用这些常量
 *
 * 使用场景:
 * - 统一错误消息格式
 * - 支持多语言国际化
 * - 便于消息内容的统一修改和维护
 *
 * 未来改进:
 * - 将组件中硬编码的消息迁移到这些常量
 * - 添加多语言支持 (i18n)
 * - 支持消息模板和参数替换
 */

/**
 * 错误消息常量
 * 预留: 用于统一管理错误消息
 */
export const ERROR_MESSAGES = {
  // AI 相关错误
  AI_NOT_AVAILABLE: 'AI 接口不可用',
  AI_REQUEST_FAILED: 'AI 请求失败',
  AI_RESPONSE_INVALID: 'AI 响应格式不正确',
  AI_MAX_RETRIES_REACHED: '达到最大重试次数，AI 通信失败',

  // 网络相关错误
  NETWORK_ERROR: '网络连接失败',
  NETWORK_TIMEOUT: '网络请求超时',

  // 数据验证错误
  DATA_VALIDATION_FAILED: '数据验证失败',
  INVALID_GAME_DATA: '游戏数据格式不正确',
  INVALID_STORY_DATA: 'Story 数据格式不正确',
  INVALID_PLAYER_DATA: 'Player 数据格式不正确',
  INVALID_CHARACTER_DATA: 'Character 数据格式不正确',

  // 存档相关错误
  SAVE_FAILED: '存档失败',
  LOAD_FAILED: '读档失败',
  DELETE_SAVE_FAILED: '删除存档失败',
  SAVE_NOT_FOUND: '未找到存档',
  SAVE_DATA_CORRUPTED: '存档数据已损坏',

  // Worldbook 相关错误
  WORLDBOOK_API_NOT_AVAILABLE: 'Worldbook API 不可用',
  WORLDBOOK_NOT_FOUND: '未找到世界书',
  WORLDBOOK_CREATE_FAILED: '创建世界书失败',
  WORLDBOOK_UPDATE_FAILED: '更新世界书失败',
  WORLDBOOK_DELETE_FAILED: '删除世界书失败',

  // 输入验证错误
  INPUT_EMPTY: '输入内容不能为空',
  INPUT_TOO_LONG: '输入内容过长',
  INPUT_CONTAINS_DANGEROUS_CONTENT: '输入内容包含危险字符',

  // DOMPurify 相关错误
  DOMPURIFY_NOT_LOADED: 'DOMPurify 未加载，无法清理 HTML 内容',

  // 通用错误
  UNKNOWN_ERROR: '未知错误',
  OPERATION_FAILED: '操作失败',
  PERMISSION_DENIED: '权限不足',
  NOT_FOUND: '未找到资源',
} as const

/**
 * 成功消息常量
 * 预留: 用于统一管理成功消息
 */
export const SUCCESS_MESSAGES = {
  // 存档相关成功消息
  SAVE_SUCCESS: '存档成功',
  LOAD_SUCCESS: '读档成功',
  DELETE_SAVE_SUCCESS: '删除存档成功',
  CLEAR_ALL_SAVES_SUCCESS: '已清空所有存档',

  // Worldbook 相关成功消息
  WORLDBOOK_CREATE_SUCCESS: '创建世界书成功',
  WORLDBOOK_UPDATE_SUCCESS: '更新世界书成功',
  WORLDBOOK_DELETE_SUCCESS: '删除世界书成功',

  // 设置相关成功消息
  SETTINGS_SAVED: '设置已保存',
  SETTINGS_RESET: '设置已恢复为默认值',

  // 购物相关成功消息
  ITEM_ADDED_TO_CART: '已添加到购物车',
  ITEM_REMOVED_FROM_CART: '已从购物车移除',
  PURCHASE_SUCCESS: '购买成功',

  // 通用成功消息
  OPERATION_SUCCESS: '操作成功',
} as const

/**
 * 提示消息常量
 * 预留: 用于统一管理提示消息
 */
export const INFO_MESSAGES = {
  // 加载提示
  LOADING: '加载中...',
  LOADING_GAME_DATA: '正在加载游戏数据...',
  LOADING_SAVE: '正在读取存档...',

  // 处理提示
  PROCESSING: '处理中...',
  SAVING: '正在保存...',
  DELETING: '正在删除...',

  // AI 相关提示
  AI_GENERATING: 'AI 正在生成内容...',
  AI_RETRYING: 'AI 请求失败，正在重试...',

  // 数据验证提示
  VALIDATING_DATA: '正在验证数据...',

  // 通用提示
  PLEASE_WAIT: '请稍候...',
  NO_DATA: '暂无数据',
  EMPTY_CART: '购物车为空',
} as const

/**
 * 警告消息常量
 * 预留: 用于统一管理警告消息
 */
export const WARNING_MESSAGES = {
  // 数据警告
  DATA_INCOMPLETE: '数据不完整',
  DATA_TOO_LARGE: '数据过大',

  // 输入警告
  INPUT_APPROACHING_LIMIT: '输入内容接近长度限制',

  // 存档警告
  SAVE_WILL_BE_OVERWRITTEN: '存档将被覆盖',
  UNSAVED_CHANGES: '有未保存的更改',

  // 通用警告
  OPERATION_IRREVERSIBLE: '此操作不可撤销',
  CONFIRM_DELETE: '确认删除？',
} as const

/**
 * 验证错误消息生成器
 * 预留: 用于生成动态的验证错误消息
 * 未来可以在数据验证模块中使用这些函数生成友好的错误提示
 */
export const VALIDATION_ERROR_MESSAGES = {
  /**
   * 生成字段缺失错误消息
   */
  fieldMissing: (fieldName: string) => `${fieldName} 字段缺失`,

  /**
   * 生成字段类型错误消息
   */
  fieldTypeMismatch: (fieldName: string, expectedType: string) =>
    `${fieldName} 必须是${expectedType}`,

  /**
   * 生成字段过长错误消息
   */
  fieldTooLong: (fieldName: string, maxLength: number) =>
    `${fieldName} 内容过长（超过${maxLength}字符）`,

  /**
   * 生成字段过短错误消息
   */
  fieldTooShort: (fieldName: string, minLength: number) =>
    `${fieldName} 内容过短（少于${minLength}字符）`,

  /**
   * 生成字段值无效错误消息
   */
  fieldInvalid: (fieldName: string) => `${fieldName} 值无效`,

  /**
   * 生成字段值超出范围错误消息
   */
  fieldOutOfRange: (fieldName: string, min: number, max: number) =>
    `${fieldName} 值必须在 ${min} 到 ${max} 之间`,
} as const

/**
 * 消息类型
 */
export type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES]
export type SuccessMessage = (typeof SUCCESS_MESSAGES)[keyof typeof SUCCESS_MESSAGES]
export type InfoMessage = (typeof INFO_MESSAGES)[keyof typeof INFO_MESSAGES]
export type WarningMessage = (typeof WARNING_MESSAGES)[keyof typeof WARNING_MESSAGES]
