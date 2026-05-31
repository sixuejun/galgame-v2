/**
 * 派遣系统消息解析协议
 * 位于 src/galgame/dispatch/dispatchMessageProtocol.ts
 *
 * 用于从聊天消息中解析派遣命令（CMD:START/RESULT/FAILED/CANCEL）
 * 和派遣结算响应（DispatchSettlement）
 *
 * 这是一个纯解析模块，不依赖酒馆接口
 */

import type { 派遣结算响应 } from './types';

// ============================================================================
// 正则表达式定义
// ============================================================================

/** 匹配 <Dispatch>...</Dispatch> 块 */
const DISPATCH_BLOCK_REGEX = /<Dispatch>\s*([\s\S]*?)\s*<\/Dispatch>/gi;

/** 匹配 <DispatchSettlement>...</DispatchSettlement> 块 */
const DISPATCH_SETTLEMENT_BLOCK_REGEX = /<DispatchSettlement>\s*([\s\S]*?)\s*<\/DispatchSettlement>/gi;

// ============================================================================
// 类型定义
// ============================================================================

/** 派遣命令类型 */
export type DispatchCommandType = 'START' | 'RESULT' | 'FAILED' | 'CANCEL';

/**
 * 解析后的派遣命令
 */
export interface DispatchCommand {
  type: DispatchCommandType;
  fields: Record<string, string>;
  raw: string;
}

/**
 * 派遣命令解析结果
 */
export type DispatchParseResult =
  | { ok: true; commands: DispatchCommand[] }
  | { ok: false; reason: 'no_content' | 'invalid_format' };

/**
 * 派遣结算解析结果
 */
export type DispatchSettlementParseResult =
  | { ok: true; settlement: 派遣结算响应 }
  | { ok: false; reason: 'no_content' | 'invalid_format' | 'parse_error'; error?: string };

// ============================================================================
// 键值对解析（纯函数，无酒馆依赖）
// ============================================================================

/**
 * 解析键值对字符串（支持任意数量）
 * 输入: "姓名:星见 | 外貌:银发蓝瞳 | 年龄:28岁"
 * 输出: { "姓名": "星见", "外貌": "银发蓝瞳", "年龄": "28岁" }
 *
 * 支持：
 * - 中英文冒号（: ：）
 * - 中英文竖线（| ｜）
 *
 * @param cmdPart - CMD 指令后的字符串部分
 * @returns 解析后的字段映射
 */
export function parseKeyValuePairs(cmdPart: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const parts = cmdPart.split(/[|｜]/);

  for (const part of parts) {
    const colonMatch = part.match(/^(.+?)[:：]\s*([\s\S]*)$/);
    if (colonMatch) {
      const key = colonMatch[1].trim();
      const value = colonMatch[2].trim();
      if (key) {
        fields[key] = value;
      }
    }
  }

  return fields;
}

// ============================================================================
// 派遣命令块解析
// ============================================================================

/**
 * 解析单个 Dispatch 块
 *
 * @param blockContent - <Dispatch>...</Dispatch> 块的内容
 * @returns 解析后的派遣命令，解析失败返回 null
 */
function parseSingleDispatchBlock(blockContent: string): DispatchCommand | null {
  const trimmed = blockContent.trim();
  if (!trimmed) {
    return null;
  }

  // 查找 CMD 类型
  const cmdMatch = trimmed.match(/CMD:(START|RESULT|FAILED|CANCEL)\s*[|｜]/i);
  if (!cmdMatch) {
    return null;
  }

  const type = cmdMatch[1].toUpperCase() as DispatchCommandType;

  // 获取 CMD:TYPE | 之后的内容
  const cmdIndex = trimmed.search(/CMD:(START|RESULT|FAILED|CANCEL)\s*[|｜]/i);
  const afterCmd = trimmed.slice(cmdIndex);
  const cmdPartMatch = afterCmd.match(/CMD:\w+\s*[|｜]\s*([\s\S]*)$/i);

  if (!cmdPartMatch) {
    return null;
  }

  const cmdPart = cmdPartMatch[1].trim();

  // 解析键值对
  const fields = parseKeyValuePairs(cmdPart);

  return {
    type,
    fields,
    raw: trimmed,
  };
}

/**
 * 解析 Dispatch 块
 *
 * @param text - 包含 <Dispatch>...</Dispatch> 块的文本
 * @returns 解析结果
 */
export function parseDispatchBlock(text: string): DispatchParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, reason: 'no_content' };
  }

  // 提取所有 <Dispatch>...</Dispatch> 块
  const matches = [...trimmed.matchAll(DISPATCH_BLOCK_REGEX)];

  if (matches.length === 0) {
    return { ok: false, reason: 'no_content' };
  }

  const commands: DispatchCommand[] = [];

  for (const match of matches) {
    const blockContent = match[1];
    const command = parseSingleDispatchBlock(blockContent);

    if (command) {
      commands.push(command);
    }
  }

  if (commands.length === 0) {
    return { ok: false, reason: 'invalid_format' };
  }

  return { ok: true, commands };
}

// ============================================================================
// 派遣结算块解析
// ============================================================================

/**
 * 解析 DispatchSettlement 块
 *
 * @param text - 包含 <DispatchSettlement>...</DispatchSettlement> 块的文本
 * @returns 解析结果
 */
export function parseDispatchSettlementBlock(text: string): DispatchSettlementParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, reason: 'no_content' };
  }

  // 提取 <DispatchSettlement>...</DispatchSettlement> 块
  const match = trimmed.match(DISPATCH_SETTLEMENT_BLOCK_REGEX);

  if (!match) {
    return { ok: false, reason: 'no_content' };
  }

  // 获取块内容（第一对标签内的内容）
  const blockContent = match[1].trim();

  if (!blockContent) {
    return { ok: false, reason: 'no_content' };
  }

  // 尝试解析为 JSON
  try {
    const settlement = JSON.parse(blockContent) as 派遣结算响应;

    // 基本验证：检查必需字段
    if (typeof settlement.总金币 !== 'number' && typeof settlement.总金币 !== 'string') {
      return {
        ok: false,
        reason: 'invalid_format',
        error: '缺少必需字段: 总金币',
      };
    }

    // 确保数值类型
    const result: 派遣结算响应 = {
      总金币: Number(settlement.总金币) || 0,
      战斗加成: Number(settlement.战斗加成) || 0,
      小故事: settlement.小故事 || '',
    };

    if (settlement.大成功加成 !== undefined) {
      result.大成功加成 = settlement.大成功加成;
    }

    return { ok: true, settlement: result };
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      reason: 'parse_error',
      error: errorMsg,
    };
  }
}

// ============================================================================
// 消息提取函数
// ============================================================================

/**
 * 从消息文本中提取所有派遣命令
 *
 * @param msgText - 聊天消息文本
 * @returns 解析结果
 */
export function extractDispatchFromMessage(msgText: string): DispatchParseResult {
  if (!msgText || typeof msgText !== 'string') {
    return { ok: false, reason: 'no_content' };
  }

  return parseDispatchBlock(msgText);
}

/**
 * 从消息文本中提取派遣结算
 *
 * @param msgText - 聊天消息文本
 * @returns 解析结果
 */
export function extractSettlementFromMessage(msgText: string): DispatchSettlementParseResult {
  if (!msgText || typeof msgText !== 'string') {
    return { ok: false, reason: 'no_content' };
  }

  return parseDispatchSettlementBlock(msgText);
}

// ============================================================================
// 序列化函数（用于嵌入 AI 提示词）
// ============================================================================

/**
 * 将派遣命令序列化为字符串格式
 *
 * @param cmd - 不包含 raw 字段的派遣命令
 * @returns 序列化后的字符串
 *
 * @example
 * serializeDispatchCommand({ type: 'START', fields: { 角色: '星见', 目的地: '废弃医院' } })
 * // 返回: "CMD:START | 角色:星见 | 目的地:废弃医院"
 */
export function serializeDispatchCommand(cmd: Omit<DispatchCommand, 'raw'>): string {
  const fieldsStr = Object.entries(cmd.fields)
    .map(([key, value]) => `${key}:${value}`)
    .join(' | ');

  return `CMD:${cmd.type} | ${fieldsStr}`;
}

/**
 * 将派遣命令包装为 Dispatch 块
 *
 * @param cmd - 不包含 raw 字段的派遣命令
 * @returns 包装后的字符串
 *
 * @example
 * wrapDispatchCommand({ type: 'RESULT', fields: { 角色: '星见', 状态: '成功' } })
 * // 返回: "<Dispatch>\nCMD:RESULT | 角色:星见 | 状态:成功\n</Dispatch>"
 */
export function wrapDispatchCommand(cmd: Omit<DispatchCommand, 'raw'>): string {
  return `<Dispatch>\n${serializeDispatchCommand(cmd)}\n</Dispatch>`;
}

/**
 * 将派遣结算响应序列化为 DispatchSettlement 块
 *
 * @param settlement - 派遣结算响应
 * @returns 包装后的字符串
 *
 * @example
 * wrapDispatchSettlement({ 总金币: 150, 战斗加成: 30, 小故事: '...' })
 * // 返回: "<DispatchSettlement>\n{...}\n</DispatchSettlement>"
 */
export function wrapDispatchSettlement(settlement: 派遣结算响应): string {
  return `<DispatchSettlement>\n${JSON.stringify(settlement, null, 2)}\n</DispatchSettlement>`;
}
