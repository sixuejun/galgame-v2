/**
 * 角色系统 CMD 命令解析器
 * 位于 src/galgame/utils/roleParser.ts
 *
 * 负责解析聊天消息中的 Character/Skill CMD 指令
 * 以及 AI 输出的角色/技能档案解析
 */

import type { 角色, 属性 } from '../types/role';
import { 角色Schema } from '../types/role';
import { isValidDomainKey, 随机分配效果值 } from './skillEffectWhitelist';

// ============================================================================
// 正则表达式定义
// ============================================================================

/** Character 块匹配 */
export const regexCharBlock = /<Character>\s*([\s\S]*?)\s*<\/Character>/gi;

/** Character CMD 匹配 */
export const regexCharAdd = /CMD:ADD\s*[|｜]\s*([\s\S]*?)(?=\s*CMD:|$)/gi;
export const regexCharMod = /CMD:MOD\s*[|｜]\s*([^\|｜]+?)\s*[|｜]\s*([\s\S]*?)(?=\s*CMD:|$)/gi;
export const regexCharDel = /CMD:DEL\s*[|｜]\s*([^\|｜]+?)(?=\s*[|｜]?\s*CMD:|$)/gi;
export const regexCharEquip = /CMD:EQUIP\s*[|｜]\s*([^\|｜]+?)\s*[|｜]\s*([^\|｜]+?)(?=\s*[|｜]?\s*CMD:|$)/gi;
export const regexCharUnequip = /CMD:UNEQUIP\s*[|｜]\s*([^\|｜]+?)\s*[|｜]\s*([^\|｜]+?)(?=\s*[|｜]?\s*CMD:|$)/gi;

/** Skill 块匹配 */
export const regexSkillBlock = /<Skill>\s*([\s\S]*?)\s*<\/Skill>/gi;

/** Skill CMD 匹配 */
export const regexSkillAdd = /CMD:ADD\s*[|｜]\s*([^\|｜]+?)\s*[|｜]\s*([^\|｜]+?)\s*[|｜]\s*([^\|｜]+?)(?:\s*[|｜]\s*(.+))?/gi;
export const regexSkillDel = /CMD:DEL_SKILL\s*[|｜]\s*([^\|｜]+?)(?=\s*[|｜]?\s*CMD:|$)/gi;

/** mod: 识别正则 */
export const regexMod = /mod:\s*([^，,\s]+)\.([^，,\s]+)/;

// ============================================================================
// 导出类型
// ============================================================================

/** 解析后的角色 ADD 命令 */
export interface ParsedCharAdd {
  type: 'ADD';
  fields: Record<string, string>;
}

/** 解析后的角色 MOD 命令 */
export interface ParsedCharMod {
  type: 'MOD';
  角色名: string;
  fields: Record<string, string>;
}

/** 解析后的角色 DEL 命令 */
export interface ParsedCharDel {
  type: 'DEL';
  角色名: string;
}

/** 解析后的角色装备命令 */
export interface ParsedCharEquip {
  type: 'EQUIP';
  角色名: string;
  技能名: string;
}

/** 解析后的角色卸下命令 */
export interface ParsedCharUnequip {
  type: 'UNEQUIP';
  角色名: string;
  技能名: string;
}

/** 解析后的角色命令联合类型 */
export type ParsedCharCMD =
  | ParsedCharAdd
  | ParsedCharMod
  | ParsedCharDel
  | ParsedCharEquip
  | ParsedCharUnequip;

/** 解析后的技能 ADD 命令 */
export interface ParsedSkillAdd {
  type: 'ADD';
  名称: string;
  emoji: string;
  描述: string;
  modEntries: Array<{ 域: string; 键: string }>;
}

/** 解析后的技能 DEL 命令 */
export interface ParsedSkillDel {
  type: 'DEL_SKILL';
  技能名: string;
}

/** 解析后的技能命令联合类型 */
export type ParsedSkillCMD = ParsedSkillAdd | ParsedSkillDel;

/** 解析角色命令的结果 */
export interface RoleParseResult {
  success: boolean;
  data?: ParsedCharCMD;
  error?: string;
}

/** 解析技能命令的结果 */
export interface SkillParseResult {
  success: boolean;
  data?: ParsedSkillCMD;
  error?: string;
}

/** 商城技能货架项 */
export interface SkillShopItem {
  id: string;
  名称: string;
  emoji: string;
  描述: string;
  价格: number;
  modEntries: Array<{ 域: string; 键: string; 值: number }>;
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 解析键值对字符串
 * 输入: "姓名:星见 | 外貌:银发蓝瞳 | 年龄:28岁"
 * 输出: { "姓名": "星见", "外貌": "银发蓝瞳", "年龄": "28岁" }
 */
export function parseKeyValuePairs(cmdPart: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const parts = cmdPart.split(/[|｜]/);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // 支持中文和英文冒号
    const colonMatch = trimmed.match(/^(.+?)[:：]\s*([\s\S]*)$/);
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

/**
 * 解析属性字段
 * 输入: "战力:3/技巧:2/智慧:1/社交:2/谨慎:1/运气:0"
 * 输出: { 战力: 3, 技巧: 2, 智慧: 1, 社交: 2, 谨慎: 1, 运气: 0 }
 * 值会被限制在 0~5 范围内
 */
export function parseAttributeField(attrString: string): 属性 {
  const defaultAttr: 属性 = {
    战力: 0,
    技巧: 0,
    智慧: 0,
    社交: 0,
    谨慎: 0,
    运气: 0,
  };

  if (!attrString) return defaultAttr;

  const parts = attrString.split(/[/]/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    const valStr = trimmed.slice(colonIdx + 1).trim();

    if (key in defaultAttr) {
      const numVal = parseInt(valStr, 10);
      if (!isNaN(numVal)) {
        // 限制在 0~5 范围内
        defaultAttr[key as keyof 属性] = Math.max(0, Math.min(5, numVal)) as any;
      }
    }
  }

  return defaultAttr;
}

/**
 * 解析 mod: 字符串中的域.键
 * @param modStr 包含 mod: 的字符串
 * @returns 解析出的域.键数组
 */
export function parseModEntries(modStr: string): Array<{ 域: string; 键: string }> {
  const results: Array<{ 域: string; 键: string }> = [];
  const matches = modStr.matchAll(regexMod);

  for (const match of matches) {
    const 域 = match[1];
    const 键 = match[2];
    results.push({ 域, 键 });
  }

  return results;
}

// ============================================================================
// Character 块解析
// ============================================================================

/**
 * 解析 Character 块
 * 从原始消息内容中提取所有 <Character>...</Character> 块
 */
export function parseCharacterBlock(content: string): ParsedCharCMD[] {
  const results: ParsedCharCMD[] = [];

  // 重置正则状态
  regexCharBlock.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = regexCharBlock.exec(content)) !== null) {
    const blockContent = match[1];
    const parsed = parseSingleCharacterBlock(blockContent);
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}

/**
 * 解析单个 Character 块内容
 */
function parseSingleCharacterBlock(blockContent: string): ParsedCharCMD | null {
  // 检查 ADD
  regexCharAdd.lastIndex = 0;
  const addMatch = regexCharAdd.exec(blockContent);
  if (addMatch) {
    const fields = parseKeyValuePairs(addMatch[1]);
    return { type: 'ADD', fields };
  }

  // 检查 MOD
  regexCharMod.lastIndex = 0;
  const modMatch = regexCharMod.exec(blockContent);
  if (modMatch) {
    const 角色名 = modMatch[1].trim();
    const fields = parseKeyValuePairs(modMatch[2]);
    return { type: 'MOD', 角色名, fields };
  }

  // 检查 DEL
  regexCharDel.lastIndex = 0;
  const delMatch = regexCharDel.exec(blockContent);
  if (delMatch) {
    const 角色名 = delMatch[1].trim();
    return { type: 'DEL', 角色名 };
  }

  // 检查 EQUIP
  regexCharEquip.lastIndex = 0;
  const equipMatch = regexCharEquip.exec(blockContent);
  if (equipMatch) {
    const 角色名 = equipMatch[1].trim();
    const 技能名 = equipMatch[2].trim();
    return { type: 'EQUIP', 角色名, 技能名 };
  }

  // 检查 UNEQUIP
  regexCharUnequip.lastIndex = 0;
  const unequipMatch = regexCharUnequip.exec(blockContent);
  if (unequipMatch) {
    const 角色名 = unequipMatch[1].trim();
    const 技能名 = unequipMatch[2].trim();
    return { type: 'UNEQUIP', 角色名, 技能名 };
  }

  return null;
}

// ============================================================================
// Skill 块解析
// ============================================================================

/**
 * 解析 Skill 块
 * 从原始消息内容中提取所有 <Skill>...</Skill> 块
 */
export function parseSkillBlock(content: string): ParsedSkillCMD[] {
  const results: ParsedSkillCMD[] = [];

  // 重置正则状态
  regexSkillBlock.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = regexSkillBlock.exec(content)) !== null) {
    const blockContent = match[1];
    const parsed = parseSingleSkillBlock(blockContent);
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}

/**
 * 解析单个 Skill 块内容
 */
function parseSingleSkillBlock(blockContent: string): ParsedSkillCMD | null {
  // 检查 ADD
  regexSkillAdd.lastIndex = 0;
  const addMatch = regexSkillAdd.exec(blockContent);
  if (addMatch) {
    const 名称 = addMatch[1].trim();
    const emoji = addMatch[2].trim();
    const 描述 = addMatch[3].trim();
    const modStr = addMatch[4]?.trim() || '';

    // 解析 mod: 并验证白名单
    const modEntries: Array<{ 域: string; 键: string }> = [];
    const modMatches = modStr.matchAll(regexMod);
    for (const m of modMatches) {
      const 域 = m[1];
      const 键 = m[2];
      // 只添加白名单中存在的
      if (isValidDomainKey(域, 键)) {
        modEntries.push({ 域, 键 });
      }
    }

    return { type: 'ADD', 名称, emoji, 描述, modEntries };
  }

  // 检查 DEL_SKILL
  regexSkillDel.lastIndex = 0;
  const delMatch = regexSkillDel.exec(blockContent);
  if (delMatch) {
    const 技能名 = delMatch[1].trim();
    return { type: 'DEL_SKILL', 技能名 };
  }

  return null;
}

// ============================================================================
// AI 输出解析（用于角色生成预览）
// ============================================================================

/**
 * 从 AI 输出中解析 <Character>CMD:ADD|...</Character> 块
 * 用于角色生成预览
 */
export function parseCharacterCMD(raw: string): { cmdString: string; fields: Record<string, string> } | null {
  // 匹配 <Character>...</Character> 块
  const match = raw.match(/<Character>([\s\S]*?)<\/Character>/i);
  if (!match) return null;

  const content = match[1].trim();

  // 提取 CMD:ADD 部分
  const cmdMatch = content.match(/CMD:ADD\s*[|｜]\s*([\s\S]*?)(?=\s*CMD:|$)/i);
  if (!cmdMatch) return null;

  const cmdPart = cmdMatch[1].trim();
  const fields = parseKeyValuePairs(cmdPart);

  return {
    cmdString: `<Character>\nCMD:ADD | ${cmdPart}\n</Character>`,
    fields,
  };
}

// ============================================================================
// 字段转角色对象
// ============================================================================

/** 预定义角色字段列表（用于过滤自定义字段） */
const 预定义字段列表 = new Set([
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
]);

/**
 * 将解析后的字段转换为角色对象
 * 用于预览角色生成结果
 */
export function fieldsToRole(fields: Record<string, string>): 角色 | null {
  // 解析属性字段
  const 属性 = parseAttributeField(fields['属性'] || '');

  // 构建基础角色对象
  const rawRole: Record<string, unknown> = {
    id: '', // ID 由调用方生成
    姓名: fields['姓名'] || '',
    外貌: fields['外貌'] || undefined,
    性格: fields['性格'] || undefined,
    出身: fields['出身'] || undefined,
    定位: fields['定位'] || undefined,
    说话风格: fields['说话风格'] || undefined,
    喜好: fields['喜好'] || undefined,
    特长: fields['特长'] || undefined,
    职业: fields['职业'] || undefined,
    背景故事: fields['背景故事'] || undefined,
    属性,
    已装备技能: [],
    状态: '空闲',
    当前任务: null,
    记录: [],
  };

  // 添加自定义字段（不在预定义列表中的）
  for (const [key, value] of Object.entries(fields)) {
    if (!预定义字段列表.has(key)) {
      rawRole[key] = value;
    }
  }

  try {
    return 角色Schema.parse(rawRole);
  } catch (e) {
    console.error('[roleParser] fieldsToRole 转换失败', e);
    return null;
  }
}

// ============================================================================
// 商城技能解析
// ============================================================================

/**
 * 解析商城技能行
 * 输入: "潜行专精|🔥|降低被发现概率|80|mod:派遣.隐蔽加成"
 * 输出: SkillShopItem 或 null
 */
export function parseSkillShopLine(line: string): SkillShopItem | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const parts = trimmed.split('|').map(s => s.trim());
  if (parts.length < 4) return null;

  const [名称, emoji, 描述, 价格Str, ...extraParts] = parts;

  if (!名称) return null;

  const 价格 = parseInt(价格Str, 10);
  if (isNaN(价格)) return null;

  // 解析 mod: 并验证白名单
  const modEntries: Array<{ 域: string; 键: string; 值: number }> = [];
  const modStr = extraParts.join('|');
  const modMatches = modStr.matchAll(regexMod);

  for (const match of modMatches) {
    const 域 = match[1];
    const 键 = match[2];

    // 验证白名单并随机分配数值
    if (isValidDomainKey(域, 键)) {
      const 值 = 随机分配效果值(域, 键);
      if (值 !== null) {
        modEntries.push({ 域, 键, 值 });
      }
    }
  }

  // 生成临时 ID
  const id = `skill_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  return {
    id,
    名称,
    emoji: emoji || '',
    描述: 描述 || '',
    价格,
    modEntries,
  };
}

/**
 * 解析多行商城技能文本
 * 输入: 多行技能文本，每行一个技能
 * 输出: SkillShopItem[] 数组
 */
export function parseSkillShopText(text: string): SkillShopItem[] {
  const lines = text.split('\n');
  const results: SkillShopItem[] = [];

  for (const line of lines) {
    const parsed = parseSkillShopLine(line);
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}

// ============================================================================
// 便捷封装函数
// ============================================================================

/**
 * 解析消息中的角色命令
 * @param content 消息内容
 * @returns 解析结果
 */
export function parseRoleCommands(content: string): RoleParseResult[] {
  const commands = parseCharacterBlock(content);
  return commands.map(cmd => ({ success: true, data: cmd }));
}

/**
 * 解析消息中的技能命令
 * @param content 消息内容
 * @returns 解析结果
 */
export function parseSkillCommands(content: string): SkillParseResult[] {
  const commands = parseSkillBlock(content);
  return commands.map(cmd => ({ success: true, data: cmd }));
}
