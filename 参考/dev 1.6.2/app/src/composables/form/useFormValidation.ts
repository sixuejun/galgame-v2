/**
 * @file useFormValidation.ts
 * @description 表单验证 Composable - 提供统一的表单验证接口和便捷方法
 * @author Eden System Team
 */

import { ref, computed, type Ref } from 'vue'
import { validateAndSanitize } from '../../utils/sanitize'
import { isValidNumber, isNonNegativeInteger, isNonEmptyString } from '../../utils/typeGuards/index'

/**
 * 验证规则类型
 *
 * @property validator 验证函数，返回 true 表示验证通过
 * @property message 验证失败时的错误消息
 */
export interface ValidationRule {
  /** 验证函数，返回 true 表示验证通过 */
  validator: (value: unknown) => boolean
  /** 验证失败时的错误消息 */
  message: string
}

/**
 * 字段验证配置
 *
 * @property value 字段值的响应式引用
 * @property rules 验证规则数组
 * @property errorMessage 错误消息的响应式引用
 * @property isValid 是否验证通过的响应式引用
 */
export interface FieldValidation {
  /** 字段值的响应式引用 */
  value: Ref<unknown>
  /** 验证规则数组 */
  rules: ValidationRule[]
  /** 错误消息的响应式引用 */
  errorMessage: Ref<string>
  /** 是否验证通过的响应式引用 */
  isValid: Ref<boolean>
}

/**
 * 表单验证 Composable
 *
 * 提供统一的表单验证接口和便捷方法，包括常用的验证规则创建器和验证方法。
 *
 * 功能：
 * - 提供常用验证规则创建器（必填、长度、数字等）
 * - 提供字段验证方法
 * - 提供输入清理和验证方法
 * - 支持自定义验证规则
 *
 * @returns 验证规则创建器和验证方法
 *
 * @example
 * ```typescript
 * const { required, minLength, validateField, createFieldValidation } = useFormValidation()
 *
 * // 创建验证规则
 * const rules = [required(), minLength(3)]
 *
 * // 验证字段
 * const error = validateField('ab', rules) // "最少需要 3 个字符"
 *
 * // 创建字段验证
 * const username = ref('')
 * const usernameValidation = createFieldValidation(username, rules)
 * console.log(usernameValidation.isValid.value) // false
 * ```
 */
export function useFormValidation() {
  /**
   * 创建必填项验证规则
   *
   * @param message 自定义错误消息（默认："此项为必填项"）
   * @returns 验证规则
   */
  const required = (message: string = '此项为必填项'): ValidationRule => ({
    validator: (value: unknown) => {
      if (typeof value === 'string') {
        return value.trim().length > 0
      }
      return value !== null && value !== undefined
    },
    message,
  })

  /**
   * 创建最小长度验证规则
   *
   * @param min 最小长度
   * @param message 自定义错误消息
   * @returns 验证规则
   */
  const minLength = (min: number, message?: string): ValidationRule => ({
    validator: (value: unknown) => {
      if (typeof value === 'string') {
        return value.length >= min
      }
      return false
    },
    message: message || `最少需要 ${min} 个字符`,
  })

  /**
   * 创建最大长度验证规则
   *
   * @param max 最大长度
   * @param message 自定义错误消息
   * @returns 验证规则
   */
  const maxLength = (max: number, message?: string): ValidationRule => ({
    validator: (value: unknown) => {
      if (typeof value === 'string') {
        return value.length <= max
      }
      return false
    },
    message: message || `最多允许 ${max} 个字符`,
  })

  /**
   * 创建数字验证规则
   *
   * @param message 自定义错误消息（默认："必须是有效数字"）
   * @returns 验证规则
   */
  const number = (message: string = '必须是有效数字'): ValidationRule => ({
    validator: (value: unknown) => isValidNumber(value),
    message,
  })

  /**
   * 创建数字范围验证规则
   *
   * @param min 最小值
   * @param max 最大值
   * @param message 自定义错误消息
   * @returns 验证规则
   */
  const numberRange = (min: number, max: number, message?: string): ValidationRule => ({
    validator: (value: unknown) => {
      if (!isValidNumber(value)) return false
      return value >= min && value <= max
    },
    message: message || `必须在 ${min} 到 ${max} 之间`,
  })

  /**
   * 创建非负整数验证规则
   *
   * @param message 自定义错误消息（默认："必须是非负整数"）
   * @returns 验证规则
   */
  const nonNegativeInteger = (message: string = '必须是非负整数'): ValidationRule => ({
    validator: (value: unknown) => isNonNegativeInteger(value),
    message,
  })

  /**
   * 创建自定义验证规则
   *
   * @param validator 自定义验证函数
   * @param message 错误消息
   * @returns 验证规则
   */
  const custom = (validator: (value: unknown) => boolean, message: string): ValidationRule => ({
    validator,
    message,
  })

  /**
   * 验证单个字段
   *
   * 按顺序执行所有验证规则，返回第一个失败的错误消息。
   *
   * @param value 字段值
   * @param rules 验证规则数组
   * @returns 错误消息（空字符串表示验证通过）
   */
  const validateField = (value: unknown, rules: ValidationRule[]): string => {
    for (const rule of rules) {
      if (!rule.validator(value)) {
        return rule.message
      }
    }
    return ''
  }

  /**
   * 创建字段验证
   *
   * 创建一个包含验证状态的字段验证对象。
   *
   * @param value 字段值的响应式引用
   * @param rules 验证规则数组
   * @returns 字段验证配置对象
   */
  const createFieldValidation = (value: Ref<unknown>, rules: ValidationRule[]): FieldValidation => {
    const errorMessage = ref('')
    const isValid = computed(() => errorMessage.value === '')

    return {
      value,
      rules,
      errorMessage,
      isValid,
    }
  }

  /**
   * 验证并清理用户输入
   * @param input - 用户输入的文本
   * @param maxLength - 最大长度限制
   * @returns 验证结果
   */
  const validateAndSanitizeInput = (input: string, maxLength: number = 500) => {
    return validateAndSanitize(input, maxLength)
  }

  /**
   * 验证非空字符串
   *
   * @param value 待验证的值
   * @returns 是否为非空字符串
   */
  const validateNonEmptyString = (value: unknown): boolean => {
    return isNonEmptyString(value)
  }

  /**
   * 验证数字
   *
   * @param value 待验证的值
   * @returns 是否为有效数字
   */
  const validateNumber = (value: unknown): boolean => {
    return isValidNumber(value)
  }

  /**
   * 验证数字范围
   *
   * @param value 待验证的值
   * @param min 最小值
   * @param max 最大值
   * @returns 是否在指定范围内
   */
  const validateNumberRange = (value: unknown, min: number, max: number): boolean => {
    if (!isValidNumber(value)) return false
    return value >= min && value <= max
  }

  /**
   * 验证非负整数
   *
   * @param value 待验证的值
   * @returns 是否为非负整数
   */
  const validateNonNegativeInteger = (value: unknown): boolean => {
    return isNonNegativeInteger(value)
  }

  return {
    // 验证规则创建器
    required,
    minLength,
    maxLength,
    number,
    numberRange,
    nonNegativeInteger,
    custom,

    // 验证方法
    validateField,
    createFieldValidation,
    validateAndSanitizeInput,
    validateNonEmptyString,
    validateNumber,
    validateNumberRange,
    validateNonNegativeInteger,
  }
}
