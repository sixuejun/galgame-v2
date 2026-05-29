/**
 * API 服务模块 - 统一导出
 *
 * 该模块提供所有外部 API 的统一封装，包括：
 * - AI API（window.generate）
 * - Worldbook API（window.getWorldbook 等）
 * - Character API（window.getCharData 等）
 *
 * 所有 API 调用都经过：
 * - 可用性检测
 * - 统一错误处理
 * - 类型安全保证
 * - 日志记录
 *
 * @module api
 */

export { AIApi } from './aiApi'
export { WorldbookApi } from './worldbookApi'
export { CharacterApi } from './characterApi'
export { MiniMaxApi } from './minimaxApi'
export type { MiniMaxT2ARequest, MiniMaxT2AResponse } from './minimaxApi'
