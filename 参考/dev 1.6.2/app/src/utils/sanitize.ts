/**
 * HTML 清理工具 - 防止 XSS 攻击
 * 使用 DOMPurify 清理用户输入和 AI 生成的 HTML 内容
 */

import { VALIDATION_LIMITS } from '../constants'

/**
 * 清理 HTML 内容，防止 XSS 攻击
 *
 * 由于所有内容都是由大模型生成的，我们采用宽松的安全策略：
 * - 允许大部分常用HTML标签和样式属性
 * - 仅禁止真正危险的标签（script、iframe、object、embed等）
 * - 仅禁止危险的属性（on*事件处理器、javascript:协议等）
 *
 * @param dirty - 待清理的 HTML 字符串
 * @param options - 可选配置
 * @param options.throwOnError - 当 DOMPurify 不可用时是否抛出错误（默认 true）
 * @param options.maxLength - 降级处理时的最大长度限制（默认 1000 字符）
 * @returns 清理后的安全 HTML 字符串
 * @throws {Error} 当 DOMPurify 不可用且 throwOnError 为 true 时抛出错误
 */
export function sanitizeHTML(
  dirty: string,
  options: { throwOnError?: boolean; maxLength?: number } = {}
): string {
  const { throwOnError = true, maxLength = 1000 } = options

  // 检查 DOMPurify 是否已加载
  if (typeof window === 'undefined' || !window.DOMPurify) {
    const errorMessage = '❌ DOMPurify 未加载，无法清理 HTML 内容。请检查网络连接或 CDN 可用性。'
    console.error(errorMessage)

    if (throwOnError) {
      throw new Error('DOMPurify 未加载')
    }

    // 降级处理：移除所有 HTML 标签，并限制长度
    // 使用更安全的方式处理，避免简单正则可能遗漏的安全问题
    let cleaned = dirty
      .replace(/<[^>]*>/g, '') // 移除所有 HTML 标签
      .replace(/javascript:/gi, '') // 移除 javascript: 协议
      .replace(/on\w+\s*=/gi, '') // 移除事件处理器
      .trim()

    // 限制长度，防止过长内容
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength) + '...'
    }

    return cleaned
  }

  try {
    // 使用 DOMPurify 清理 HTML - 宽松模式，仅过滤危险内容
    return window.DOMPurify.sanitize(dirty, {
      // 禁止的标签（真正危险的标签）
      FORBID_TAGS: [
        'script', // 脚本标签
        'iframe', // 内嵌框架
        'object', // 对象标签
        'embed', // 嵌入标签
        'applet', // Java小程序
        'link', // 外部资源链接（可能加载恶意CSS）
        'style', // 内联样式（可能包含恶意CSS）
        'base', // 基础URL（可能劫持相对路径）
        'meta', // 元数据（可能重定向）
        'form', // 表单（可能提交数据到恶意服务器）
        'input', // 输入框（可能收集用户数据）
        'button', // 按钮（可能触发恶意操作）
        'textarea', // 文本域（可能收集用户数据）
      ],
      // 禁止的属性（危险的事件处理器和协议）
      FORBID_ATTR: [
        'onerror',
        'onload',
        'onclick',
        'onmouseover',
        'onmouseout',
        'onmouseenter',
        'onmouseleave',
        'onfocus',
        'onblur',
        'onchange',
        'onsubmit',
        'onkeydown',
        'onkeyup',
        'onkeypress',
        'ondblclick',
        'oncontextmenu',
        'oninput',
        'onpaste',
        'oncopy',
        'oncut',
        'ondrag',
        'ondrop',
      ],
      // 允许的URI协议（仅允许安全协议）
      ALLOWED_URI_REGEXP:
        /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
      // 保留文本内容
      KEEP_CONTENT: true,
      // 允许所有其他标签和属性（除了上面禁止的）
      // 这样可以支持大模型生成的各种HTML内容
    })
  } catch (error) {
    const errorMessage = '❌ HTML 清理失败'
    console.error(errorMessage, error)

    if (throwOnError) {
      throw new Error('HTML 清理失败')
    }

    // 降级处理：移除所有 HTML 标签，并限制长度
    let cleaned = dirty
      .replace(/<[^>]*>/g, '') // 移除所有 HTML 标签
      .replace(/javascript:/gi, '') // 移除 javascript: 协议
      .replace(/on\w+\s*=/gi, '') // 移除事件处理器
      .trim()

    // 限制长度，防止过长内容
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength) + '...'
    }

    return cleaned
  }
}

/**
 * 清理用户输入的文本，移除所有 HTML 标签
 * @param input - 用户输入的文本
 * @returns 清理后的纯文本
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return ''

  // 移除所有 HTML 标签
  let cleaned = input.replace(/<[^>]*>/g, '')

  // 移除潜在的脚本内容
  cleaned = cleaned.replace(/javascript:/gi, '')
  cleaned = cleaned.replace(/on\w+\s*=/gi, '')

  return cleaned.trim()
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
  valid: boolean
  error?: string
  sanitized?: string
}

/**
 * 验证用户输入
 * @param input - 用户输入的文本
 * @param maxLength - 最大长度限制（默认500）
 * @returns 验证结果
 */
export function validateUserInput(
  input: string,
  maxLength: number = VALIDATION_LIMITS.USER_INPUT_MAX_LENGTH
): ValidationResult {
  // 空值检查
  if (!input || input.trim().length === 0) {
    return {
      valid: false,
      error: '输入内容不能为空',
    }
  }

  // 长度验证
  if (input.length > maxLength) {
    return {
      valid: false,
      error: `输入内容过长，最多允许 ${maxLength} 个字符`,
    }
  }

  // 危险字符验证 - 检测潜在的脚本注入
  const dangerousPatterns = [
    /<script/i, // script 标签
    /javascript:/i, // javascript: 协议
    /on\w+\s*=/i, // 事件处理器 (onclick=, onerror=, etc.)
    /<iframe/i, // iframe 标签
    /<object/i, // object 标签
    /<embed/i, // embed 标签
    /eval\s*\(/i, // eval 函数
    /expression\s*\(/i, // CSS expression
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      return {
        valid: false,
        error: '输入包含非法字符或潜在的安全风险',
      }
    }
  }

  // 清理输入
  const sanitized = sanitizeUserInput(input)

  return {
    valid: true,
    sanitized,
  }
}

/**
 * 验证并清理用户输入（组合函数）
 * @param input - 用户输入的文本
 * @param maxLength - 最大长度限制
 * @returns 验证结果，如果验证通过则包含清理后的文本
 */
export function validateAndSanitize(input: string, maxLength: number = 500): ValidationResult {
  const validation = validateUserInput(input, maxLength)

  if (!validation.valid) {
    return validation
  }

  return {
    valid: true,
    sanitized: validation.sanitized,
  }
}
