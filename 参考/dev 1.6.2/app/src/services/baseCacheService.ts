/**
 * @file baseCacheService.ts
 * @description 通用 IndexedDB 缓存服务基类 - 提供可复用的缓存操作
 * @author Eden System Team
 * @created 2025-11-23
 */

import { logger } from '@/utils/logger'

/**
 * 数据库配置接口
 */
export interface DBConfig {
  /** 数据库名称 */
  name: string
  /** 数据库版本 */
  version: number
  /** 对象存储名称 */
  storeName: string
  /** 主键路径 */
  keyPath: string | string[]
  /** 索引配置 */
  indexes?: Array<{
    name: string
    keyPath: string | string[]
    options?: {
      unique?: boolean
      multiEntry?: boolean
    }
  }>
}

/**
 * 缓存记录基础接口
 */
export interface BaseCacheRecord {
  /** 角色卡名称 */
  characterName: string
  /** 缓存时间戳（毫秒） */
  timestamp: number
}

/**
 * 通用 IndexedDB 缓存服务基类
 *
 * 功能：
 * - 提供通用的 IndexedDB 初始化和连接管理
 * - 提供通用的 CRUD 操作
 * - 提供 LRU 缓存清理策略
 * - 支持按角色卡名称组织数据
 */
export class BaseCacheService<T extends BaseCacheRecord> {
  protected db: IDBDatabase | null = null
  protected initPromise: Promise<void> | null = null
  protected config: DBConfig
  protected logPrefix: string

  /**
   * 构造函数
   *
   * @param config 数据库配置
   * @param logPrefix 日志前缀
   */
  constructor(config: DBConfig, logPrefix: string) {
    this.config = config
    this.logPrefix = logPrefix
  }

  /**
   * 初始化数据库连接
   *
   * @returns Promise，resolve 时数据库已就绪
   */
  protected async init(): Promise<void> {
    // 如果已经初始化过，直接返回
    if (this.initPromise) {
      return this.initPromise
    }

    // 创建初始化 Promise
    this.initPromise = new Promise<void>((resolve, reject) => {
      // 检查浏览器是否支持 IndexedDB
      if (!window.indexedDB) {
        const error = new Error('当前浏览器不支持 IndexedDB')
        logger.error(`❌ [${this.logPrefix}]`, error.message)
        reject(error)
        return
      }

      // 打开数据库
      const request = indexedDB.open(this.config.name, this.config.version)

      // 数据库升级（创建对象存储和索引）
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 如果对象存储不存在，创建它
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          const objectStore = db.createObjectStore(this.config.storeName, {
            keyPath: this.config.keyPath,
          })

          // 创建索引
          if (this.config.indexes) {
            for (const index of this.config.indexes) {
              objectStore.createIndex(index.name, index.keyPath, index.options)
            }
          }

          logger.info(`✅ [${this.logPrefix}] 数据库结构已创建`)
        }
      }

      // 数据库打开成功
      request.onsuccess = (event: Event) => {
        this.db = (event.target as IDBOpenDBRequest).result
        logger.info(`✅ [${this.logPrefix}] 数据库连接成功`)
        resolve()
      }

      // 数据库打开失败
      request.onerror = (event: Event) => {
        const error = (event.target as IDBOpenDBRequest).error
        logger.error(`❌ [${this.logPrefix}] 数据库打开失败:`, error)
        reject(error)
      }
    })

    return this.initPromise
  }

  /**
   * 确保数据库已初始化
   */
  protected async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }
    if (!this.db) {
      throw new Error('数据库初始化失败')
    }
    return this.db
  }

  /**
   * 添加或更新记录
   *
   * @param record 缓存记录
   * @returns Promise，resolve 时记录已保存
   */
  async put(record: T): Promise<void> {
    const db = await this.ensureDB()

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([this.config.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.config.storeName)
      const request = objectStore.put(record)

      request.onsuccess = () => {
        logger.debug(`✅ [${this.logPrefix}] 记录已保存`)
        resolve()
      }

      request.onerror = (event: Event) => {
        const error = (event.target as IDBRequest).error
        logger.error(`❌ [${this.logPrefix}] 保存记录失败:`, error)
        reject(error)
      }
    })
  }

  /**
   * 获取单条记录
   *
   * @param key 主键
   * @returns Promise，resolve 时返回记录（如果不存在则返回 undefined）
   */
  async get(key: string | string[]): Promise<T | undefined> {
    const db = await this.ensureDB()

    return new Promise<T | undefined>((resolve, reject) => {
      const transaction = db.transaction([this.config.storeName], 'readonly')
      const objectStore = transaction.objectStore(this.config.storeName)
      const request = objectStore.get(key)

      request.onsuccess = (event: Event) => {
        const result = (event.target as IDBRequest<T>).result
        if (result) {
          logger.debug(`✅ [${this.logPrefix}] 记录已找到`)
        } else {
          logger.debug(`⚠️ [${this.logPrefix}] 记录不存在`)
        }
        resolve(result)
      }

      request.onerror = (event: Event) => {
        const error = (event.target as IDBRequest).error
        logger.error(`❌ [${this.logPrefix}] 获取记录失败:`, error)
        reject(error)
      }
    })
  }

  /**
   * 删除单条记录
   *
   * @param key 主键
   * @returns Promise，resolve 时记录已删除
   */
  async delete(key: string | string[]): Promise<void> {
    const db = await this.ensureDB()

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([this.config.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.config.storeName)
      const request = objectStore.delete(key)

      request.onsuccess = () => {
        logger.debug(`✅ [${this.logPrefix}] 记录已删除`)
        resolve()
      }

      request.onerror = (event: Event) => {
        const error = (event.target as IDBRequest).error
        logger.error(`❌ [${this.logPrefix}] 删除记录失败:`, error)
        reject(error)
      }
    })
  }

  /**
   * 获取指定角色卡的所有记录
   *
   * @param characterName 角色卡名称
   * @returns Promise，resolve 时返回记录数组
   */
  async getAllByCharacter(characterName: string): Promise<T[]> {
    const db = await this.ensureDB()

    return new Promise<T[]>((resolve, reject) => {
      const transaction = db.transaction([this.config.storeName], 'readonly')
      const objectStore = transaction.objectStore(this.config.storeName)
      const index = objectStore.index('characterName')
      const request = index.getAll(characterName)

      request.onsuccess = (event: Event) => {
        const results = (event.target as IDBRequest<T[]>).result
        logger.debug(
          `✅ [${this.logPrefix}] 找到 ${results.length} 条记录 (角色: ${characterName})`
        )
        resolve(results)
      }

      request.onerror = (event: Event) => {
        const error = (event.target as IDBRequest).error
        logger.error(`❌ [${this.logPrefix}] 获取记录失败:`, error)
        reject(error)
      }
    })
  }

  /**
   * 获取所有记录
   *
   * @returns Promise，resolve 时返回所有记录
   */
  async getAll(): Promise<T[]> {
    const db = await this.ensureDB()

    return new Promise<T[]>((resolve, reject) => {
      const transaction = db.transaction([this.config.storeName], 'readonly')
      const objectStore = transaction.objectStore(this.config.storeName)
      const request = objectStore.getAll()

      request.onsuccess = (event: Event) => {
        const results = (event.target as IDBRequest<T[]>).result
        logger.debug(`✅ [${this.logPrefix}] 找到 ${results.length} 条记录`)
        resolve(results)
      }

      request.onerror = (event: Event) => {
        const error = (event.target as IDBRequest).error
        logger.error(`❌ [${this.logPrefix}] 获取所有记录失败:`, error)
        reject(error)
      }
    })
  }

  /**
   * 清空指定角色卡的所有记录
   *
   * @param characterName 角色卡名称
   * @returns Promise，resolve 时返回删除的记录数
   */
  async clearByCharacter(characterName: string): Promise<number> {
    const db = await this.ensureDB()

    return new Promise<number>((resolve, reject) => {
      const transaction = db.transaction([this.config.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.config.storeName)
      const index = objectStore.index('characterName')
      const request = index.openCursor(IDBKeyRange.only(characterName))

      let deleteCount = 0

      request.onsuccess = (event: Event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          cursor.delete()
          deleteCount++
          cursor.continue()
        } else {
          logger.info(
            `✅ [${this.logPrefix}] 已删除 ${deleteCount} 条记录 (角色: ${characterName})`
          )
          resolve(deleteCount)
        }
      }

      request.onerror = (event: Event) => {
        const error = (event.target as IDBRequest).error
        logger.error(`❌ [${this.logPrefix}] 清空记录失败:`, error)
        reject(error)
      }
    })
  }

  /**
   * 清空所有记录
   *
   * @returns Promise，resolve 时返回是否清空成功
   */
  async clear(): Promise<boolean> {
    const db = await this.ensureDB()

    return new Promise<boolean>((resolve, reject) => {
      const transaction = db.transaction([this.config.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.config.storeName)
      const request = objectStore.clear()

      request.onsuccess = () => {
        logger.info(`✅ [${this.logPrefix}] 所有缓存已清空`)
        resolve(true)
      }

      request.onerror = (event: Event) => {
        const error = (event.target as IDBRequest).error
        logger.error(`❌ [${this.logPrefix}] 清空缓存失败:`, error)
        reject(error)
      }
    })
  }

  /**
   * 清理超出上限的旧缓存（LRU 淘汰策略）
   *
   * @param characterName 角色卡名称
   * @param limit 缓存上限
   * @returns Promise，resolve 时返回删除的记录数
   */
  async cleanupOldCache(characterName: string, limit: number): Promise<number> {
    const records = await this.getAllByCharacter(characterName)
    const count = records.length

    if (count <= limit) {
      return 0
    }

    // 按时间戳排序（从旧到新）
    records.sort((a, b) => a.timestamp - b.timestamp)

    // 计算需要删除的数量
    const deleteCount = count - limit

    // 删除最旧的记录
    const db = await this.ensureDB()
    const transaction = db.transaction([this.config.storeName], 'readwrite')
    const objectStore = transaction.objectStore(this.config.storeName)

    for (let i = 0; i < deleteCount; i++) {
      const record = records[i]
      const key = this.getRecordKey(record)
      objectStore.delete(key)
      logger.debug(`🗑️ [${this.logPrefix}] 已删除旧缓存`)
    }

    return new Promise<number>((resolve, reject) => {
      transaction.oncomplete = () => {
        logger.info(`✅ [${this.logPrefix}] 已清理 ${deleteCount} 条旧缓存，当前缓存数: ${limit}`)
        resolve(deleteCount)
      }

      transaction.onerror = (event: Event) => {
        const error = (event.target as IDBTransaction).error
        logger.error(`❌ [${this.logPrefix}] 清理缓存失败:`, error)
        reject(error)
      }
    })
  }

  /**
   * 获取指定角色卡的缓存统计信息
   *
   * @param characterName 角色卡名称
   * @returns Promise，resolve 时返回统计信息
   */
  async getStatsByCharacter(characterName: string): Promise<{ count: number; totalSize: number }> {
    const records = await this.getAllByCharacter(characterName)
    const count = records.length

    // 估算总大小（字节）
    let totalSize = 0
    try {
      totalSize = new Blob([JSON.stringify(records)]).size
    } catch (error) {
      logger.error(`❌ [${this.logPrefix}] 计算缓存大小失败:`, error)
    }

    return { count, totalSize }
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      this.initPromise = null
      logger.info(`✅ [${this.logPrefix}] 数据库连接已关闭`)
    }
  }

  /**
   * 获取记录的主键（子类需要实现）
   *
   * @param record 缓存记录
   * @returns 主键
   */
  protected getRecordKey(record: T): string | string[] {
    // 默认实现：如果 keyPath 是字符串，直接返回对应的值
    if (typeof this.config.keyPath === 'string') {
      return (record as unknown as Record<string, string>)[this.config.keyPath]
    }
    // 如果 keyPath 是数组，返回对应的值数组
    return this.config.keyPath.map(key => (record as unknown as Record<string, string>)[key])
  }
}
