/**
 * @file indexedDB.ts
 * @description IndexedDB 工具类 - 提供类型安全的 IndexedDB 操作封装
 * @author Eden System Team
 * @created 2025-11-10
 * @updated 2025-11-23 - 重构为使用通用基础服务
 */

import { BaseCacheService, type BaseCacheRecord, type DBConfig } from '@/services/baseCacheService'

/**
 * IndexedDB 数据库配置
 */
export const DB_CONFIG = {
  /** 数据库名称 */
  name: 'eden-cache',
  /** 数据库版本 */
  version: 1,
  /** 图片对象存储名称 */
  imageStoreName: 'image-cache',
  /** TTS 对象存储名称 */
  ttsStoreName: 'tts-cache',
} as const

/**
 * 图片缓存记录接口
 */
export interface ImageCacheRecord extends BaseCacheRecord {
  /** 图片描述（提示词） */
  description: string
  /** 图片 data URL */
  imageUrl: string
}

/**
 * 图片缓存数据库配置
 */
const IMAGE_DB_CONFIG: DBConfig = {
  name: DB_CONFIG.name,
  version: DB_CONFIG.version,
  storeName: DB_CONFIG.imageStoreName,
  keyPath: ['characterName', 'description'],
  indexes: [
    { name: 'characterName', keyPath: 'characterName', options: { unique: false } },
    { name: 'timestamp', keyPath: 'timestamp', options: { unique: false } },
  ],
}

/**
 * IndexedDB 工具类（图片缓存）
 * 封装 IndexedDB 操作，提供类型安全的 API
 */
export class IndexedDBHelper extends BaseCacheService<ImageCacheRecord> {
  constructor() {
    super(IMAGE_DB_CONFIG, 'ImageCache')
  }

  /**
   * 初始化数据库连接
   * 如果数据库不存在，会自动创建
   *
   * @returns Promise，resolve 时数据库已就绪
   */
  async init(): Promise<void> {
    return super.init()
  }

  /**
   * 获取单条记录（便捷方法）
   *
   * @param characterName 角色卡名称
   * @param description 图片描述
   * @returns Promise，resolve 时返回记录（如果不存在则返回 undefined）
   */
  async getByKey(
    characterName: string,
    description: string
  ): Promise<ImageCacheRecord | undefined> {
    return super.get([characterName, description])
  }

  /**
   * 删除单条记录（便捷方法）
   *
   * @param characterName 角色卡名称
   * @param description 图片描述
   * @returns Promise，resolve 时记录已删除
   */
  async deleteByKey(characterName: string, description: string): Promise<void> {
    return super.delete([characterName, description])
  }
}

/**
 * TTS 音频缓存记录接口
 */
export interface TTSCacheRecord extends BaseCacheRecord {
  /** 缓存键（文本内容的哈希或文本本身） */
  key: string
  /** 音频数据（hex 字符串或 URL） */
  audioData: string
  /** 音频格式 */
  format: string
  /** 输出格式类型 */
  outputFormat: 'hex' | 'url'
  /** 文本内容（用于调试） */
  text?: string
}

/**
 * TTS 缓存数据库配置
 */
const TTS_DB_CONFIG: DBConfig = {
  name: DB_CONFIG.name,
  version: DB_CONFIG.version,
  storeName: DB_CONFIG.ttsStoreName,
  keyPath: ['characterName', 'key'],
  indexes: [
    { name: 'characterName', keyPath: 'characterName', options: { unique: false } },
    { name: 'timestamp', keyPath: 'timestamp', options: { unique: false } },
  ],
}

/**
 * TTS IndexedDB 工具类
 * 封装 TTS 音频缓存的 IndexedDB 操作
 */
export class TTSIndexedDBHelper extends BaseCacheService<TTSCacheRecord> {
  constructor() {
    super(TTS_DB_CONFIG, 'TTSCache')
  }

  /**
   * 初始化数据库连接
   * 如果数据库不存在，会自动创建
   *
   * @returns Promise，resolve 时数据库已就绪
   */
  async init(): Promise<void> {
    return super.init()
  }

  /**
   * 获取单条记录（便捷方法）
   *
   * @param characterName 角色卡名称
   * @param key 缓存键
   * @returns Promise，resolve 时返回记录（如果不存在则返回 undefined）
   */
  async getByKey(characterName: string, key: string): Promise<TTSCacheRecord | undefined> {
    return super.get([characterName, key])
  }

  /**
   * 删除单条记录（便捷方法）
   *
   * @param characterName 角色卡名称
   * @param key 缓存键
   * @returns Promise，resolve 时记录已删除
   */
  async deleteByKey(characterName: string, key: string): Promise<void> {
    return super.delete([characterName, key])
  }
}

/**
 * 导出单例实例
 */
export const indexedDBHelper = new IndexedDBHelper()
export const ttsIndexedDBHelper = new TTSIndexedDBHelper()
