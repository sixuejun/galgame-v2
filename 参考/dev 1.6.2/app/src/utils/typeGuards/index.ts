/**
 * 类型守卫统一导出
 *
 * 本文件作为类型守卫的统一入口，所有类型守卫已按功能拆分到独立文件中：
 * - primitives.ts: 基础类型守卫（isObject, isArray, isNonEmptyString, isValidNumber, isNonNegativeInteger）
 * - gameData.ts: 游戏数据类型守卫（isConfig, isStory, isChoice, isCharacter, isShopData, isStorageData, isAchievement, isGameData）
 * - utilities.ts: 工具函数（assertType, safeGet, hasGlobal, getGlobal）
 */

// 基础类型守卫
export {
  isObject,
  isArray,
  isNonEmptyString,
  isValidNumber,
  isNonNegativeInteger,
} from './primitives'

// 游戏数据类型守卫
export {
  isConfig,
  isStory,
  isChoice,
  isChoices,
  isCharacter,
  isCharacters,
  isShopData,
  isStorageData,
  isAchievement,
  isGameData,
} from './gameData'

// 工具函数
export { assertType, safeGet, hasGlobal, getGlobal } from './utilities'
