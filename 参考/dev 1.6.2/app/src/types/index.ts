/**
 * 类型定义统一导出
 *
 * 本文件作为类型定义的统一入口，所有类型已按功能拆分到独立文件中：
 * - api.ts: API 相关类型（YamlUpdateOperation, AIPromptData）
 * - common.ts: 通用类型（UserAction, AppSettings）
 * - config.ts: 配置相关类型（Config, PageConfig, NavButton, StatusTab等）
 * - gameData.ts: 游戏核心数据类型（GameData, Story, Character等）
 * - shop.ts: 商店相关类型（Item, ShopData, StorageData, ItemEffect, CouponEffect等）
 * - ui.ts: UI 相关类型（DataBlock, ProgressBar, StatusValue, Trait, DetailItem, ModalButton等）
 * - utility.ts: 工具类型（Nullable, Optional, DeepPartial, DeepReadonly等）
 */

// API 相关类型
export type { YamlUpdateOperation, AIPromptData } from './api'

// 外部 API 类型
export type {
  WorldbookEntry,
  CharWorldbooks,
  GenerateOptions,
  UpdateWorldbookOptions,
  WorldbookUpdater,
} from './external-apis'

// 通用类型
export type {
  UserAction,
  AppSettings,
  ImageGenerationService,
  ThemeType,
  MiniMaxVoiceModel,
  MiniMaxOutputFormat,
} from './common'

// 配置相关类型
export type {
  NavButton,
  StatusTab,
  PageConfig,
  HomePageConfig,
  StatusPageConfig,
  CartConfig,
  Config,
} from './config'

// 游戏核心数据类型
export type { Story, Choice, Character, Achievement, Summary, GameData } from './gameData'

// 商店相关类型
export type {
  ItemEffect,
  CouponEffect,
  Item,
  CurrencyDisplayMode,
  ShopData,
  StorageData,
} from './shop'

// UI 相关类型
export type {
  ProgressBar,
  StatusValue,
  Trait,
  DetailItem,
  DataBlock,
  DataBlockType,
  DataBlockContent,
  ModalButton,
} from './ui'

// 工具类型
// 注意: NonNullable, Extract, Exclude 已移除，请直接使用 TypeScript 内置类型
export type {
  Nullable,
  Optional,
  Maybe,
  DeepPartial,
  DeepReadonly,
  DeepRequired,
  ValueOf,
  Writable,
  DeepWritable,
  AnyFunction,
  AsyncFunction,
  Constructor,
  AbstractConstructor,
  Dictionary,
  NumericDictionary,
  StrictOmit,
  StrictPick,
  OptionalKeys,
  RequiredKeys,
  PartialRequired,
  PartialOptional,
  Tuple,
  Awaited,
  DeepAwaited,
  ArrayElement,
  ReadonlyArrayElement,
} from './utility'
