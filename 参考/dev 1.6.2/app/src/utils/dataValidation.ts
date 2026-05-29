/**
 * 数据验证工具 - 验证 AI 返回的游戏数据格式和内容
 */

import { VALIDATION_LIMITS } from '../constants'
import { logger } from './logger'
import { isObject, isNonEmptyString, isValidNumber, isNonNegativeInteger } from './typeGuards/index'

/**
 * 验证结果接口
 */
export interface DataValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 验证游戏数据的完整性和有效性
 * @param data - 游戏数据对象
 * @returns 验证结果
 */
export function validateGameData(data: unknown): DataValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 1. 基本类型检查
  if (!isObject(data)) {
    errors.push('游戏数据必须是一个对象')
    return { valid: false, errors, warnings }
  }

  // 2. 验证 config 字段
  if (data.config) {
    if (!isObject(data.config)) {
      errors.push('config 字段必须是对象')
    } else {
      // 验证 config 的必需字段
      // 新数据模型：title 字段位于 config.home.title
      if (!isObject(data.config.home) || !isNonEmptyString(data.config.home.title)) {
        warnings.push('config.home.title 字段缺失或为空')
      }

      if (!isNonEmptyString(data.config.version)) {
        warnings.push('config.version 字段缺失或为空')
      }
      if (!isNonEmptyString(data.config.phase)) {
        warnings.push('config.phase 字段缺失或为空')
      }
    }
  } else {
    warnings.push('缺少 config 配置字段')
  }

  // 3. 验证 story 字段
  if (data.story) {
    const storyValidation = validateStory(data.story)
    errors.push(...storyValidation.errors)
    warnings.push(...storyValidation.warnings)
  }

  // 4. 验证 choices 字段
  if (data.choices) {
    const choicesValidation = validateChoices(data.choices)
    errors.push(...choicesValidation.errors)
    warnings.push(...choicesValidation.warnings)
  }

  // 5. 验证 characters 字段
  if (data.characters) {
    const charactersValidation = validateCharacters(data.characters)
    errors.push(...charactersValidation.errors)
    warnings.push(...charactersValidation.warnings)
  }

  // 6. 验证 shop 字段
  if (data.shop) {
    const shopValidation = validateShop(data.shop)
    errors.push(...shopValidation.errors)
    warnings.push(...shopValidation.warnings)
  }

  // 7. 验证 storage 字段
  if (data.storage) {
    const storageValidation = validateStorage(data.storage)
    errors.push(...storageValidation.errors)
    warnings.push(...storageValidation.warnings)
  }

  // 8. 验证 achievements 字段
  if (data.achievements) {
    if (typeof data.achievements !== 'object') {
      errors.push('achievements 字段必须是对象')
    }
  }

  // 9. 验证 summaries 字段
  if (data.summaries) {
    if (!Array.isArray(data.summaries)) {
      errors.push('summaries 字段必须是数组')
    } else {
      data.summaries.forEach((summary: unknown, index: number) => {
        const summaryObj = summary as Record<string, unknown>
        if (!summaryObj.time) {
          warnings.push(`summaries[${index}] 缺少 time 字段`)
        }
        if (!summaryObj.content) {
          warnings.push(`summaries[${index}] 缺少 content 字段`)
        }
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * 验证 Story 数据
 */
function validateStory(story: unknown): DataValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!isObject(story)) {
    errors.push('story 字段必须是对象')
    return { valid: false, errors, warnings }
  }

  // 验证 content 字段（最重要）
  if (!story.content) {
    errors.push('story.content 字段缺失')
  } else if (typeof story.content !== 'string') {
    errors.push('story.content 必须是字符串')
  } else if (story.content.length > VALIDATION_LIMITS.STORY_CONTENT_MAX_LENGTH) {
    warnings.push(`story.content 内容过长（超过${VALIDATION_LIMITS.STORY_CONTENT_MAX_LENGTH}字符）`)
  }

  // 验证可选字段的类型
  if (story.time && typeof story.time !== 'string') {
    errors.push('story.time 必须是字符串')
  }
  if (story.location && typeof story.location !== 'string') {
    errors.push('story.location 必须是字符串')
  }
  if (story.weather && typeof story.weather !== 'string') {
    errors.push('story.weather 必须是字符串')
  }

  return { valid: errors.length === 0, errors, warnings }
}

/**
 * 验证 Choices 数据
 */
function validateChoices(choices: unknown): DataValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // choices 必须是数组
  if (!Array.isArray(choices)) {
    errors.push('choices 必须是数组')
  } else {
    if (choices.length === 0) {
      warnings.push('choices 数组为空')
    }

    choices.forEach((choice: unknown, index: number) => {
      if (!isObject(choice)) {
        errors.push(`choices[${index}] 必须是对象`)
      } else if (!isNonEmptyString(choice.text)) {
        errors.push(`choices[${index}] 缺少 text 字段或为空`)
      }
    })
  }

  return { valid: errors.length === 0, errors, warnings }
}

/**
 * 验证 Characters 数据
 */
function validateCharacters(characters: unknown): DataValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!isObject(characters)) {
    errors.push('characters 字段必须是对象')
    return { valid: false, errors, warnings }
  }

  const characterIds = Object.keys(characters)
  if (characterIds.length === 0) {
    warnings.push('characters 对象为空')
  }

  // 验证每个角色的数据结构
  characterIds.forEach(id => {
    const character = characters[id]
    if (!isObject(character)) {
      errors.push(`characters.${id} 必须是对象`)
    }
  })

  return { valid: errors.length === 0, errors, warnings }
}

/**
 * 验证 Shop 数据
 */
function validateShop(shop: unknown): DataValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!isObject(shop)) {
    errors.push('shop 字段必须是对象')
    return { valid: false, errors, warnings }
  }

  // 验证 currency 字段
  if (shop.currency !== undefined) {
    if (!isValidNumber(shop.currency)) {
      errors.push('shop.currency 必须是有效数字')
    } else if (shop.currency < 0) {
      errors.push('shop.currency 不能为负数')
    } else if (!Number.isInteger(shop.currency)) {
      warnings.push('shop.currency 应该是整数')
    }
  }

  // 验证 items 字段
  if (shop.items) {
    if (!isObject(shop.items)) {
      errors.push('shop.items 必须是对象')
    } else {
      Object.entries(shop.items).forEach(([itemId, item]: [string, unknown]) => {
        if (!isObject(item)) {
          errors.push(`shop.items.${itemId} 必须是对象`)
        } else {
          // 验证物品的必需字段
          if (!isNonEmptyString(item.name)) {
            errors.push(`shop.items.${itemId} 缺少 name 字段或为空`)
          }
          if (item.price === undefined) {
            errors.push(`shop.items.${itemId} 缺少 price 字段`)
          } else if (!isNonNegativeInteger(item.price)) {
            errors.push(`shop.items.${itemId}.price 必须是非负整数`)
          }
        }
      })
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

/**
 * 验证 Storage 数据
 */
function validateStorage(storage: unknown): DataValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!isObject(storage)) {
    errors.push('storage 字段必须是对象')
    return { valid: false, errors, warnings }
  }

  // 验证 inventory 字段
  if (storage.inventory) {
    if (!isObject(storage.inventory)) {
      errors.push('storage.inventory 必须是对象')
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

/**
 * 验证并记录游戏数据
 * @param data - 游戏数据对象
 * @param throwOnError - 是否在验证失败时抛出错误（默认 false）
 * @returns 验证结果
 */
export function validateAndLogGameData(
  data: unknown,
  throwOnError: boolean = false
): DataValidationResult {
  const result = validateGameData(data)

  // 记录验证结果
  if (result.valid) {
    logger.info('✅ 游戏数据验证通过')
  } else {
    logger.error('❌ 游戏数据验证失败:')
    result.errors.forEach(error => logger.error(`  - ${error}`))
  }

  // 记录警告
  if (result.warnings.length > 0) {
    logger.warn('⚠️ 游戏数据验证警告:')
    result.warnings.forEach(warning => logger.warn(`  - ${warning}`))
  }

  // 如果需要，抛出错误
  if (!result.valid && throwOnError) {
    throw new Error(`数据验证失败: ${result.errors.join(', ')}`)
  }

  return result
}
