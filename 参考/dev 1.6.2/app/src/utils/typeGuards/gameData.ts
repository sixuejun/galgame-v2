/**
 * 游戏数据类型守卫
 * 提供游戏相关数据结构的运行时检查和类型收窄功能
 */

import type {
  GameData,
  Config,
  Story,
  Choice,
  Character,
  ShopData,
  StorageData,
  Achievement,
} from '../../types'
import { isObject, isNonEmptyString, isNonNegativeInteger } from './primitives'

/**
 * 检查是否为有效的 Config 对象
 * 只支持新数据模型结构
 */
export function isConfig(value: unknown): value is Config {
  if (!isObject(value)) return false

  const config = value as Partial<Config>

  // 必需字段：version 和 phase
  if (!isNonEmptyString(config.version) || !isNonEmptyString(config.phase)) {
    return false
  }

  // 新数据模型：检查 config.home.title
  const hasTitle =
    isObject(config.home) && isNonEmptyString((config.home as { title?: string }).title)

  return hasTitle
}

/**
 * 检查是否为有效的 Story 对象
 */
export function isStory(value: unknown): value is Story {
  if (!isObject(value)) return false

  const story = value as Partial<Story>

  // content 是必需的
  if (!isNonEmptyString(story.content)) return false

  // 可选字段的类型检查
  if (story.time !== undefined && typeof story.time !== 'string') return false
  if (story.location !== undefined && typeof story.location !== 'string') return false
  if (story.weather !== undefined && typeof story.weather !== 'string') return false

  return true
}

/**
 * 检查是否为有效的 Choice 对象
 */
export function isChoice(value: unknown): value is Choice {
  if (!isObject(value)) return false

  const choice = value as Partial<Choice>

  return isNonEmptyString(choice.text)
}

/**
 * 检查是否为有效的 Choices 数组
 */
export function isChoices(value: unknown): value is Choice[] {
  if (!Array.isArray(value)) {
    return false
  }

  return value.every(item => isChoice(item))
}

/**
 * 检查是否为有效的 Character 对象
 */
export function isCharacter(value: unknown): value is Character {
  if (!isObject(value)) return false

  const character = value as Partial<Character>

  // 基本字段检查
  return (
    isNonEmptyString(character.name) &&
    (character.level === undefined || isNonNegativeInteger(character.level))
  )
}

/**
 * 检查是否为有效的 Characters 对象
 */
export function isCharacters(value: unknown): value is Record<string, Character> {
  if (!isObject(value)) return false

  return Object.values(value).every(item => isCharacter(item))
}

/**
 * 检查是否为有效的 ShopData 对象
 */
export function isShopData(value: unknown): value is ShopData {
  if (!isObject(value)) return false

  const shop = value as Partial<ShopData>

  // currency 必须是非负整数
  if (shop.currency !== undefined && !isNonNegativeInteger(shop.currency)) {
    return false
  }

  // items 必须是对象
  if (shop.items !== undefined) {
    if (!isObject(shop.items)) return false

    // 检查每个物品
    for (const item of Object.values(shop.items)) {
      if (!isObject(item)) return false

      const shopItem = item as Record<string, unknown>
      if (!isNonEmptyString(shopItem.name)) return false
      if (!isNonNegativeInteger(shopItem.price)) return false
    }
  }

  return true
}

/**
 * 检查是否为有效的 StorageData 对象
 */
export function isStorageData(value: unknown): value is StorageData {
  if (!isObject(value)) return false

  const storage = value as Partial<StorageData>

  // inventory 必须是对象
  if (storage.inventory !== undefined && !isObject(storage.inventory)) {
    return false
  }

  return true
}

/**
 * 检查是否为有效的 Achievement 对象
 */
export function isAchievement(value: unknown): value is Achievement {
  if (!isObject(value)) return false

  const achievement = value as Partial<Achievement>

  return (
    isNonEmptyString(achievement.id) &&
    isNonEmptyString(achievement.name) &&
    typeof achievement.unlocked === 'boolean'
  )
}

/**
 * 检查是否为有效的 GameData 对象
 */
export function isGameData(value: unknown): value is GameData {
  if (!isObject(value)) return false

  const data = value as Partial<GameData>

  // 检查必需字段
  if (data.config && !isConfig(data.config)) return false
  if (data.story && !isStory(data.story)) return false
  if (data.choices && !isChoices(data.choices)) return false
  if (data.characters && !isCharacters(data.characters)) return false
  if (data.shop && !isShopData(data.shop)) return false
  if (data.storage && !isStorageData(data.storage)) return false

  return true
}
