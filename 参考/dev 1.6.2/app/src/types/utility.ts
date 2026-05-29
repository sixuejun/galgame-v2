/**
 * 工具类型定义
 * 提供常用的 TypeScript 工具类型，提升类型操作的便利性
 *
 * 注意: 这些工具类型为未来的类型安全和代码质量提升预留
 * 当前应用中部分类型未被直接使用,但保留它们有以下价值:
 *
 * 1. 类型安全: 提供更严格的类型约束
 * 2. 代码复用: 避免重复定义常用类型模式
 * 3. 可维护性: 统一的类型定义便于维护
 * 4. 未来扩展: 为未来功能开发提供类型基础
 *
 * 使用建议:
 * - 在需要更严格类型约束时使用这些工具类型
 * - 优先使用这些工具类型而不是重新定义
 * - 保持类型定义的一致性
 */

/**
 * 可空类型
 * 将类型 T 转换为可以是 null 的类型
 * 预留: 用于明确表示可以为 null 的值
 */
export type Nullable<T> = T | null

/**
 * 可选类型
 * 将类型 T 转换为可以是 undefined 的类型
 * 预留: 用于明确表示可以为 undefined 的值
 */
export type Optional<T> = T | undefined

/**
 * 可空或可选类型
 * 将类型 T 转换为可以是 null 或 undefined 的类型
 * 预留: 用于明确表示可以为 null 或 undefined 的值
 */
export type Maybe<T> = T | null | undefined

/**
 * 深度部分类型
 * 递归地将类型 T 的所有属性（包括嵌套属性）转换为可选
 * 预留: 用于处理深层嵌套对象的部分更新
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

/**
 * 深度只读类型
 * 递归地将类型 T 的所有属性（包括嵌套属性）转换为只读
 * 预留: 用于创建不可变的深层嵌套对象
 */
export type DeepReadonly<T> = T extends object
  ? {
      readonly [P in keyof T]: DeepReadonly<T[P]>
    }
  : T

/**
 * 深度必需类型
 * 递归地将类型 T 的所有可选属性（包括嵌套属性）转换为必需
 * 预留: 用于确保深层嵌套对象的所有属性都存在
 */
export type DeepRequired<T> = T extends object
  ? {
      [P in keyof T]-?: DeepRequired<T[P]>
    }
  : T

/**
 * 值类型
 * 提取对象类型 T 的所有值的类型
 */
export type ValueOf<T> = T[keyof T]

/**
 * 可写类型
 * 移除类型 T 的所有只读修饰符
 */
export type Writable<T> = {
  -readonly [P in keyof T]: T[P]
}

/**
 * 深度可写类型
 * 递归地移除类型 T 的所有只读修饰符（包括嵌套属性）
 */
export type DeepWritable<T> = T extends object
  ? {
      -readonly [P in keyof T]: DeepWritable<T[P]>
    }
  : T

/**
 * 注意: NonNullable, Extract, Exclude 类型已移除
 * 这些类型与 TypeScript 内置类型重复，请直接使用 TypeScript 内置类型
 *
 * 示例:
 * - NonNullable<T> - TypeScript 内置
 * - Extract<T, U> - TypeScript 内置
 * - Exclude<T, U> - TypeScript 内置
 */

/**
 * 函数类型
 * 表示任意函数类型
 */
export type AnyFunction = (...args: unknown[]) => unknown

/**
 * 异步函数类型
 * 表示返回 Promise 的函数类型
 */
export type AsyncFunction<T = unknown> = (...args: unknown[]) => Promise<T>

/**
 * 构造函数类型
 * 表示可以使用 new 关键字调用的构造函数类型
 */
export type Constructor<T = unknown> = new (...args: unknown[]) => T

/**
 * 抽象构造函数类型
 * 表示抽象类的构造函数类型
 */
export type AbstractConstructor<T = unknown> = abstract new (...args: unknown[]) => T

/**
 * 键值对类型
 * 表示键为字符串、值为类型 T 的对象
 */
export type Dictionary<T = unknown> = Record<string, T>

/**
 * 数字键值对类型
 * 表示键为数字、值为类型 T 的对象
 */
export type NumericDictionary<T = unknown> = Record<number, T>

/**
 * 严格省略类型
 * 从类型 T 中省略指定的键 K（K 必须是 T 的键）
 */
export type StrictOmit<T, K extends keyof T> = Omit<T, K>

/**
 * 严格选择类型
 * 从类型 T 中选择指定的键 K（K 必须是 T 的键）
 */
export type StrictPick<T, K extends keyof T> = Pick<T, K>

/**
 * 可选键类型
 * 提取类型 T 中所有可选属性的键
 */
export type OptionalKeys<T> = {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never
}[keyof T]

/**
 * 必需键类型
 * 提取类型 T 中所有必需属性的键
 */
export type RequiredKeys<T> = {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T]

/**
 * 部分必需类型
 * 将类型 T 中指定的键 K 转换为必需，其余保持不变
 */
export type PartialRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

/**
 * 部分可选类型
 * 将类型 T 中指定的键 K 转换为可选，其余保持不变
 */
export type PartialOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * 可变参数元组类型
 * 表示可变数量的类型 T 的元组
 */
export type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>

/**
 * Promise 解包类型
 * 提取 Promise<T> 中的类型 T
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T

/**
 * 深度 Promise 解包类型
 * 递归地提取嵌套 Promise 中的类型
 */
export type DeepAwaited<T> = T extends Promise<infer U> ? DeepAwaited<U> : T

/**
 * 数组元素类型
 * 提取数组类型 T 的元素类型
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : never

/**
 * 只读数组元素类型
 * 提取只读数组类型 T 的元素类型
 */
export type ReadonlyArrayElement<T> = T extends readonly (infer U)[] ? U : never
