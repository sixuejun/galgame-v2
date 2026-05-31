/**
 * Dispatch System Type Definitions
 *
 * Types for the dispatch (废土行路) system API calls.
 */

import { z } from 'zod';
import type { 派遣事件条目 } from '../types/role';

/**
 * 事件类型枚举
 */
export const 事件类型枚举 = z.enum(['遭遇', '战斗', '陷阱', '财富', '插曲']);
export type 事件类型 = z.infer<typeof 事件类型枚举>;

/**
 * 派遣事件影响
 */
export interface 派遣事件影响 {
  hp变化: number;
  金币变化: number;
  理智变化: number;
  获得物品: string | null;
  特殊效果: string | null;
}

/**
 * 派遣事件响应
 */
export interface 派遣事件响应 {
  事件类型: 事件类型;
  事件描述: string;
  节点变化: 1 | -1;
  影响: 派遣事件影响;
  小故事片段: string;
}

/**
 * 派遣事件生成请求
 */
export interface 派遣事件生成请求 {
  /** 当前节点编号 */
  当前节点: number;
  /** 目标节点编号 */
  目标节点: number;
  /** 目的地名称 */
  目的地: string;
  /** 事件类型倾向 */
  事件类型?: string;
  /** 角色列表信息 */
  角色信息: string;
}

/**
 * 派遣结算加成信息
 */
export interface 派遣结算加成 {
  战斗加成: number;
  大成功加成: string | null;
}

/**
 * 派遣结算响应
 */
export interface 派遣结算响应 {
  总金币: number;
  战斗加成: number;
  小故事: string;
  大成功加成?: string;
}

/**
 * 派遣结算生成请求
 */
export interface 派遣结算生成请求 {
  /** 角色信息 */
  角色信息: string;
  /** 目的地 */
  目的地: string;
  /** 事件历史 */
  事件历史: 派遣事件条目[];
  /** 最终HP */
  最终HP: number;
  /** 最大HP */
  最大HP: number;
  /** 最终理智 */
  最终理智: number;
  /** 最大理智 */
  最大理智: number;
  /** 基础金币 */
  基础金币: number;
  /** 战斗次数 */
  战斗次数: number;
  /** 结算状态 */
  结算状态: '成功' | '强制结算' | '失败';
}

/**
 * 地图参数响应
 */
export interface 地图参数响应 {
  步数: number;
  事件分布: string;
}

/**
 * 地图生成请求
 */
export interface 地图生成请求 {
  /** 路线名称 */
  路线: string;
  /** 目的地名称 */
  目的地: string;
}
