/**
 * 角色系统类型定义
 * 位于 src/galgame/types/role.ts
 *
 * 包含所有 Zod Schema 定义和 TypeScript 类型别名
 * 用于角色系统的数据验证和类型推导
 */

import { z } from 'zod';

// ============================================================================
// 属性定义
// ============================================================================

/** 属性值范围：0~5 整数 */
const 属性值 = z.number().int().min(0).max(5);

/** 属性对象 Schema */
const 属性Schema = z.object({
  战力: 属性值.default(0),
  技巧: 属性值.default(0),
  智慧: 属性值.default(0),
  社交: 属性值.default(0),
  谨慎: 属性值.default(0),
  运气: 属性值.default(0),
});
export type 属性 = z.infer<typeof 属性Schema>;

// ============================================================================
// 角色状态枚举
// ============================================================================

/** 角色状态枚举 */
export const 角色状态枚举 = z.enum([
  '空闲',
  '派遣中',
  '工坊中',
  '逃跑中',
  '休息中',
  '加班中',
  '受伤',
]);
export type 角色状态 = z.infer<typeof 角色状态枚举>;

// ============================================================================
// 记录条目
// ============================================================================

/** 记录类型枚举 */
const 记录类型枚举 = z.enum(['派遣', '工坊', '通讯', '其他']);

/** 角色记录条目 Schema */
const 角色记录条目Schema = z.object({
  时间: z.number(),
  类型: 记录类型枚举.default('其他'),
  内容: z.string().default(''),
});
export type 角色记录条目 = z.infer<typeof 角色记录条目Schema>;

// ============================================================================
// 技能效果
// ============================================================================

/** 技能效果 Schema */
const 技能效果Schema = z.object({
  域: z.string(),
  键: z.string(),
  值: z.number(),
});
export type 技能效果 = z.infer<typeof 技能效果Schema>;

// ============================================================================
// 技能标签
// ============================================================================

/** 技能标签 Schema */
export const 技能Schema = z
  .object({
    id: z.string(),
    名称: z.string(),
    emoji: z.string().default(''),
    描述: z.string().default(''),
    效果: z.array(技能效果Schema).default([]),
  });
export type 技能 = z.infer<typeof 技能Schema>;

// ============================================================================
// 角色对象
// ============================================================================

/**
 * 角色 Schema
 * - 姓名、属性固定必填
 * - 其它字段均为可选，支持用户自定义扩展
 * - 使用 catchall(z.any()) 存储任意键值对
 */
export const 角色Schema = z
  .object({
    // ---- 必需字段 ----
    id: z.string(), // 唯一标识（系统生成）
    姓名: z.string(), // 固定必填
    属性: 属性Schema, // 固定必填

    // ---- 预定义可选字段 ----
    外貌: z.string().optional(),
    性格: z.string().optional(),
    出身: z.string().optional(),
    定位: z.string().optional(),
    说话风格: z.string().optional(),
    喜好: z.string().optional(),
    特长: z.string().optional(),
    职业: z.string().optional(),
    背景故事: z.string().optional(),

    // ---- 装备层 ----
    已装备技能: z.array(z.string()).default([]),

    // ---- 状态层 ----
    状态: 角色状态枚举.default('空闲'),
    当前任务: z.string().nullable().default(null),

    // ---- 记录层 ----
    记录: z.array(角色记录条目Schema).default([]),
  })
  .catchall(z.any()) // 允许额外自定义字段（如年龄、特殊能力等）
  ;
export type 角色 = z.infer<typeof 角色Schema>;

// ============================================================================
// 扫描检查点
// ============================================================================

/** 角色扫描检查点 Schema */
export const 角色检查点Schema = z
  .object({
    message_id: z.number().default(0),
    max_id: z.number().default(0),
    roles: z.record(z.string(), 角色Schema).default({}),
  })
  ;
export type 角色检查点 = z.infer<typeof 角色检查点Schema>;

// ============================================================================
// 派遣相关类型
// ============================================================================

/**
 * 派遣事件条目
 * 记录派遣过程中的单个事件
 */
export const 派遣事件条目Schema = z.object({
  时间戳: z.number(),
  节点: z.string(),
  事件类型: z.string(),
  描述: z.string(),
});
export type 派遣事件条目 = z.infer<typeof 派遣事件条目Schema>;

/**
 * 地图配置
 * 用于派遣的地图设置
 */
export const 地图配置Schema = z.object({
  区域: z.string(),
  路线: z.array(z.string()).default([]),
  附加剧情: z.string().optional(),
});
export type 地图配置 = z.infer<typeof 地图配置Schema>;

/**
 * 结算结果
 * 派遣结算时的收益信息
 */
export const 结算结果Schema = z.object({
  状态: z.enum(['成功', '强制结算', '失败']).default('成功'),
  基础金币: z.number().default(0),
  战斗加成: z.number().default(0),
  总金币: z.number().default(0),
  纪念品: z.array(z.string()).default([]),
  小故事: z.string().optional(),
});
export type 结算结果 = z.infer<typeof 结算结果Schema>;

/**
 * 派遣结算记录
 * 存储已完成的派遣记录
 */
export const DispatchRunSchema = z
  .object({
    // ---- 基础信息 ----
    派遣id: z.string(),
    角色id: z.string(),
    状态: z.enum(['成功', '强制结算', '失败', '进行中']).default('进行中'),

    // ---- 时间信息 ----
    开始时间: z.number(),
    结束时间: z.number().nullable().default(null),

    // ---- 地图配置 ----
    地图配置: 地图配置Schema,

    // ---- 过程数据 ----
    事件历史: z.array(派遣事件条目Schema).default([]),
    触发战斗次数: z.number().default(0),

    // ---- 结算结果 ----
    结算结果: 结算结果Schema.nullable().default(null),
  });
export type DispatchRun = z.infer<typeof DispatchRunSchema>;

/**
 * 派遣进行中状态
 * 存储正在进行的派遣状态
 */
export const DispatchActiveSchema = z
  .object({
    // ---- 基础信息 ----
    派遣id: z.string(),
    角色id: z.string(),
    状态: 角色状态枚举.default('派遣中'),

    // ---- 时间信息 ----
    开始时间: z.number(),

    // ---- 地图配置 ----
    地图配置: 地图配置Schema,

    // ---- 当前位置 ----
    当前节点: z.number().default(0),
    步数: z.number().default(0),

    // ---- 角色状态 ----
    hp: z.number().default(100),
    sanity: z.number().default(100),

    // ---- 过程数据 ----
    事件历史: z.array(派遣事件条目Schema).default([]),
    触发战斗次数: z.number().default(0),
  });
export type DispatchActive = z.infer<typeof DispatchActiveSchema>;

// ============================================================================
// 角色系统顶层变量
// ============================================================================

/**
 * 角色系统顶层变量 Schema
 * 包含角色系统的所有持久化变量
 */
export const 角色系统变量Schema = z
  .object({
    // ---- 扫描管理 ----
    role_checkpoint: 角色检查点Schema.default(() => ({ message_id: 0, max_id: 0, roles: {} })),

    // ---- 角色数据 ----
    roles: z.record(z.string(), 角色Schema).default({}),
    role_max_id: z.number().default(0),

    // ---- 技能数据 ----
    skillsInventory: z.array(技能Schema).default([]),
    skill_max_id: z.number().default(0),
    skill_db_map: z.record(z.string(), 技能Schema).default({}),

    // ---- 派遣数据 ----
    dispatchRuns: z.array(DispatchRunSchema).default([]),
  });
export type 角色系统变量 = z.infer<typeof 角色系统变量Schema>;

// ============================================================================
// 辅助工具类型
// ============================================================================

/** 角色对象索引类型（用于快速查找） */
export type 角色字典 = Record<string, 角色>;

/** 技能标签索引类型（用于快速查找） */
export type 技能字典 = Record<string, 技能>;

/** 角色 ID 生成函数返回类型 */
export type RoleIdGenerator = () => string;

/** 技能 ID 生成函数返回类型 */
export type SkillIdGenerator = () => string;

// ============================================================================
// 预设字段名列表（用于格式化/解析时的过滤）
// ============================================================================

/**
 * 预定义角色字段名列表
 * 用于在格式化输出时过滤自定义字段
 */
export const 预定义角色字段列表 = [
  'id',
  '姓名',
  '外貌',
  '性格',
  '出身',
  '定位',
  '说话风格',
  '喜好',
  '特长',
  '职业',
  '背景故事',
  '属性',
  '已装备技能',
  '状态',
  '当前任务',
  '记录',
] as const;

export type 预定义角色字段 = (typeof 预定义角色字段列表)[number];
