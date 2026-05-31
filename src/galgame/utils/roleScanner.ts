/**
 * 角色系统聊天扫描引擎
 *
 * 负责从聊天消息中解析 <Character> 和 <Skill> 标签中的 CMD 指令，
 * 并将角色/技能数据写入酒馆变量。
 *
 * 支持全量扫描和增量扫描两种模式，增量扫描通过检查点机制避免重复处理。
 */

import { klona } from 'klona';
import type {
  角色,
  技能,
  角色检查点,
} from '../types/role';
import {
  角色Schema,
  技能Schema,
  预定义角色字段列表,
} from '../types/role';
import {
  nextRoleId,
  nextSkillId,
} from './roleIdGenerator';
import {
  isValidDomainKey,
  随机分配效果值,
  checkSingleModLimit,
} from './skillEffectWhitelist';

// ============================================================================
// 模块级运行时状态
// ============================================================================

/** 角色数据库映射（姓名 → 角色对象） */
let roleDbMap: Record<string, 角色> = {};

/** 角色 ID 计数器 */
let roleMaxId: number = 0;

/** 防抖定时器 */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// ============================================================================
// 配置常量
// ============================================================================

const CONFIG = {
  /** 防抖延迟（毫秒） */
  debounceDelay: 800,
  /** 检查点保存间隔（消息数） */
  checkpointInterval: 25,
};

// ============================================================================
// 正则表达式定义
// ============================================================================

/** 角色块匹配 */
const REGEX_CHAR_BLOCK = /<Character>\s*([\s\S]*?)\s*<\/Character>/gi;

/** 角色 CMD:ADD 匹配 */
const REGEX_CHAR_ADD = /CMD:ADD\s*[|｜]\s*([\s\S]*?)(?=\s*CMD:|$)/gi;

/** 角色 CMD:MOD 匹配 */
const REGEX_CHAR_MOD = /CMD:MOD\s*[|｜]\s*([^\|｜]+?)\s*[|｜]\s*([\s\S]*?)(?=\s*CMD:|$)/gi;

/** 角色 CMD:DEL 匹配 */
const REGEX_CHAR_DEL = /CMD:DEL\s*[|｜]\s*([^\|｜]+?)(?=\s*[|｜]?\s*CMD:|$)/gi;

/** 角色 CMD:EQUIP 匹配 */
const REGEX_CHAR_EQUIP = /CMD:EQUIP\s*[|｜]\s*([^\|｜]+?)\s*[|｜]\s*([^\|｜]+?)(?=\s*[|｜]?\s*CMD:|$)/gi;

/** 角色 CMD:UNEQUIP 匹配 */
const REGEX_CHAR_UNEQUIP = /CMD:UNEQUIP\s*[|｜]\s*([^\|｜]+?)\s*[|｜]\s*([^\|｜]+?)(?=\s*[|｜]?\s*CMD:|$)/gi;

/** 技能块匹配 */
const REGEX_SKILL_BLOCK = /<Skill>\s*([\s\S]*?)\s*<\/Skill>/gi;

/** 技能 CMD:ADD 匹配（名称|emoji|描述|mod:域.键） */
const REGEX_SKILL_ADD = /CMD:ADD\s*[|｜]\s*([^\|｜]+?)\s*[|｜]\s*([^\|｜]+?)\s*[|｜]\s*([^\|｜]+?)(?:\s*[|｜]\s*(.+))?/gi;

/** 技能 CMD:DEL_SKILL 匹配 */
const REGEX_SKILL_DEL = /CMD:DEL_SKILL\s*[|｜]\s*([^\|｜]+?)(?=\s*[|｜]?\s*CMD:|$)/gi;

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 解析键值对字符串
 *
 * 输入: "姓名:星见 | 外貌:银发蓝瞳 | 年龄:28岁"
 * 输出: { "姓名": "星见", "外貌": "银发蓝瞳", "年龄": "28岁" }
 *
 * 支持中英文冒号（: / ：）和竖线（| / ｜）
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

/**
 * 解析属性字段
 *
 * 输入: "战力:3/技巧:2/智慧:1/社交:2/谨慎:1/运气:0"
 * 输出: { "战力": 3, "技巧": 2, "智慧": 1, "社交": 2, "谨慎": 1, "运气": 0 }
 *
 * 数值会被限制在 0~5 范围内
 */
export function parseAttributeField(value: string): Record<string, number> {
  const defaults: Record<string, number> = {
    战力: 0,
    技巧: 0,
    智慧: 0,
    社交: 0,
    谨慎: 0,
    运气: 0,
  };

  if (!value) return { ...defaults };

  const attrParts = value.split(/[/]/);
  for (const part of attrParts) {
    const [key, val] = part.split(':');
    if (key && val !== undefined) {
      const trimmedKey = key.trim();
      const numVal = parseInt(val.trim(), 10);
      if (!isNaN(numVal) && trimmedKey in defaults) {
        defaults[trimmedKey] = Math.min(5, Math.max(0, numVal));
      }
    }
  }

  return defaults;
}

/**
 * 判断字段是否为预定义角色字段
 */
function isPredefinedField(key: string): boolean {
  return (预定义角色字段列表 as readonly string[]).includes(key);
}

// ============================================================================
// 检查点管理
// ============================================================================

/**
 * 获取检查点
 */
export function getCheckpoint(): 角色检查点 | null {
  const vars = getVariables({ type: 'chat' });
  const checkpoint = vars?.role_checkpoint as 角色检查点 | null;
  if (!checkpoint || checkpoint.message_id == null) {
    return null;
  }
  return checkpoint;
}

/**
 * 保存检查点
 */
function saveCheckpoint(): void {
  const allMessages = getChatMessages('all');
  const latestMsg = allMessages[allMessages.length - 1];

  const checkpoint: 角色检查点 = {
    message_id: latestMsg?.message_id ?? 0,
    max_id: roleMaxId,
    db_map: klona(roleDbMap),
  };

  replaceVariables(klona({ role_checkpoint: checkpoint }), { type: 'chat' });
}

/**
 * 清除检查点（作废）
 */
export function clearCheckpoint(): void {
  replaceVariables(klona({ role_checkpoint: null }), { type: 'chat' });
}

/**
 * 检查是否需要保存检查点
 *
 * 全量扫描后始终保存
 * 增量扫描后每隔 checkpointInterval 条消息保存一次
 */
function shouldSaveCheckpoint(): boolean {
  const checkpoint = getCheckpoint();
  if (!checkpoint || checkpoint.message_id == null) {
    return true;
  }

  const allMessages = getChatMessages('all');
  const latestId = allMessages[allMessages.length - 1]?.message_id ?? 0;
  return (latestId - checkpoint.message_id) >= CONFIG.checkpointInterval;
}

/**
 * 获取检查点对应的消息 ID
 */
export function getCheckpointMsgId(): number {
  const checkpoint = getCheckpoint();
  return checkpoint?.message_id ?? 0;
}

// ============================================================================
// 运行时状态同步
// ============================================================================

/**
 * 从酒馆变量恢复运行时状态
 */
function restoreRuntimeState(): void {
  const vars = getVariables({ type: 'chat' });

  // 恢复角色数据库
  const savedRoleDbMap = vars?.role_db_map as Record<string, 角色> | null;
  if (savedRoleDbMap) {
    roleDbMap = klona(savedRoleDbMap);
  }

  // 恢复角色 ID 计数器
  const savedRoleMaxId = vars?.role_max_id as number | null;
  if (savedRoleMaxId != null) {
    roleMaxId = savedRoleMaxId;
  }
}

/**
 * 将运行时状态同步到酒馆变量
 */
function syncRuntimeState(): void {
  replaceVariables(klona({
    role_db_map: roleDbMap,
    role_max_id: roleMaxId,
  }), { type: 'chat' });
}

// ============================================================================
// 角色 CMD 处理器
// ============================================================================

/**
 * 处理 CMD:ADD - 创建角色
 *
 * @param cmdPart - CMD:ADD 后的键值对字符串
 * @param msgId - 消息 ID（用于去重）
 * @returns 创建的角色对象，解析失败返回 null
 */
function handleCharAdd(cmdPart: string, _msgId: number): 角色 | null {
  try {
    const fields = parseKeyValuePairs(cmdPart);

    // 验证必填字段
    if (!fields['姓名']) {
      console.warn('[roleScanner] CMD:ADD 缺少必填字段: 姓名');
      return null;
    }
    if (!fields['属性']) {
      console.warn('[roleScanner] CMD:ADD 缺少必填字段: 属性');
      return null;
    }

    const name = fields['姓名'];

    // 检查同名角色（去重）
    if (roleDbMap[name]) {
      console.info(`[roleScanner] 跳过已存在的角色: ${name}`);
      return null;
    }

    // 生成 ID
    const id = nextRoleId();
    roleMaxId = Math.max(roleMaxId, parseInt(id.replace('char_', ''), 10) || 0);

    // 解析属性
    const 属性 = parseAttributeField(fields['属性']);

    // 构建角色对象
    const rawRole: Record<string, unknown> = {
      id,
      姓名: name,
      属性,
      已装备技能: [],
      状态: '空闲',
      当前任务: null,
      记录: [],
    };

    // 填充预定义可选字段
    const predefinedFields = [
      '外貌', '性格', '出身', '定位', '说话风格',
      '喜好', '特长', '职业', '背景故事',
    ];
    for (const field of predefinedFields) {
      if (fields[field]) {
        rawRole[field] = fields[field];
      }
    }

    // 填充自定义字段（不在预定义列表中的）
    for (const [key, value] of Object.entries(fields)) {
      if (!isPredefinedField(key) && key !== 'id') {
        rawRole[key] = value;
      }
    }

    const role = 角色Schema.parse(rawRole);

    // 写入数据库
    roleDbMap[role.姓名] = role;

    const vars = getVariables({ type: 'chat' });
    const existingRoles = (vars?.roles as Record<string, 角色>) || {};
    existingRoles[role.id] = role;
    replaceVariables(klona({ roles: existingRoles }), { type: 'chat' });

    console.info(`[roleScanner] 添加角色: ${role.姓名} (${role.id})`);
    return role;
  } catch (e) {
    console.error('[roleScanner] CMD:ADD 解析失败:', e);
    return null;
  }
}

/**
 * 处理 CMD:MOD - 修改角色
 *
 * @param name - 角色姓名
 * @param cmdPart - CMD:MOD 后的键值对字符串
 * @returns 是否修改成功
 */
function handleCharMod(name: string, cmdPart: string): boolean {
  const role = roleDbMap[name];
  if (!role) {
    console.warn(`[roleScanner] CMD:MOD 目标角色不存在: ${name}`);
    return false;
  }

  try {
    const fields = parseKeyValuePairs(cmdPart);

    // 复制当前角色
    const updatedRole: Record<string, unknown> = { ...role };

    // 更新每个字段
    for (const [key, value] of Object.entries(fields)) {
      if (key === '属性') {
        // 属性字段需要特殊处理
        updatedRole['属性'] = parseAttributeField(value);
      } else {
        updatedRole[key] = value;
      }
    }

    const validatedRole = 角色Schema.parse(updatedRole);

    // 更新数据库
    roleDbMap[name] = validatedRole;

    // 更新 roles
    const vars = getVariables({ type: 'chat' });
    const existingRoles = (vars?.roles as Record<string, 角色>) || {};
    if (existingRoles[validatedRole.id]) {
      existingRoles[validatedRole.id] = validatedRole;
      replaceVariables(klona({ roles: existingRoles }), { type: 'chat' });
    }

    console.info(`[roleScanner] 修改角色: ${name}`);
    return true;
  } catch (e) {
    console.error('[roleScanner] CMD:MOD 解析失败:', e);
    return false;
  }
}

/**
 * 处理 CMD:DEL - 删除角色
 *
 * @param name - 角色姓名
 * @returns 是否删除成功
 */
function handleCharDel(name: string): boolean {
  const role = roleDbMap[name];
  if (!role) {
    console.warn(`[roleScanner] CMD:DEL 目标角色不存在: ${name}`);
    return false;
  }

  try {
    // 从 db_map 移除
    delete roleDbMap[name];

    // 从 roles 移除
    const vars = getVariables({ type: 'chat' });
    const existingRoles = (vars?.roles as Record<string, 角色>) || {};
    if (existingRoles[role.id]) {
      delete existingRoles[role.id];
      replaceVariables(klona({ roles: existingRoles }), { type: 'chat' });
    }

    console.info(`[roleScanner] 删除角色: ${name}`);
    return true;
  } catch (e) {
    console.error('[roleScanner] CMD:DEL 执行失败:', e);
    return false;
  }
}

/**
 * 处理 CMD:EQUIP - 装备技能
 *
 * @param name - 角色姓名
 * @param skillName - 技能名称
 * @returns 是否装备成功
 */
function handleCharEquip(name: string, skillName: string): boolean {
  const role = roleDbMap[name];
  if (!role) {
    console.warn(`[roleScanner] CMD:EQUIP 目标角色不存在: ${name}`);
    return false;
  }

  try {
    // 检查技能是否存在
    const vars = getVariables({ type: 'chat' });
    const skillDbMap = vars?.skill_db_map as Record<string, 技能> | null;
    if (!skillDbMap || !skillDbMap[skillName]) {
      console.warn(`[roleScanner] CMD:EQUIP 技能不存在: ${skillName}`);
      return false;
    }

    const 已装备技能 = [...(role.已装备技能 || [])];

    // 检查是否已装备
    if (已装备技能.includes(skillName)) {
      console.info(`[roleScanner] 技能 ${skillName} 已装备在 ${name} 上，跳过`);
      return true;
    }

    已装备技能.push(skillName);

    const updatedRole = 角色Schema.parse({
      ...role,
      已装备技能,
    });

    // 更新数据库
    roleDbMap[name] = updatedRole;

    // 更新 roles
    const existingRoles = (vars?.roles as Record<string, 角色>) || {};
    if (existingRoles[updatedRole.id]) {
      existingRoles[updatedRole.id] = updatedRole;
      replaceVariables(klona({ roles: existingRoles }), { type: 'chat' });
    }

    console.info(`[roleScanner] 角色 ${name} 装备技能: ${skillName}`);
    return true;
  } catch (e) {
    console.error('[roleScanner] CMD:EQUIP 执行失败:', e);
    return false;
  }
}

/**
 * 处理 CMD:UNEQUIP - 卸下技能
 *
 * @param name - 角色姓名
 * @param skillName - 技能名称
 * @returns 是否卸下成功
 */
function handleCharUnequip(name: string, skillName: string): boolean {
  const role = roleDbMap[name];
  if (!role) {
    console.warn(`[roleScanner] CMD:UNEQUIP 目标角色不存在: ${name}`);
    return false;
  }

  try {
    const 已装备技能 = [...(role.已装备技能 || [])];
    const index = 已装备技能.indexOf(skillName);

    if (index === -1) {
      console.info(`[roleScanner] 技能 ${skillName} 未装备在 ${name} 上，跳过`);
      return true;
    }

    已装备技能.splice(index, 1);

    const updatedRole = 角色Schema.parse({
      ...role,
      已装备技能,
    });

    // 更新数据库
    roleDbMap[name] = updatedRole;

    // 更新 roles
    const vars = getVariables({ type: 'chat' });
    const existingRoles = (vars?.roles as Record<string, 角色>) || {};
    if (existingRoles[updatedRole.id]) {
      existingRoles[updatedRole.id] = updatedRole;
      replaceVariables(klona({ roles: existingRoles }), { type: 'chat' });
    }

    console.info(`[roleScanner] 角色 ${name} 卸下技能: ${skillName}`);
    return true;
  } catch (e) {
    console.error('[roleScanner] CMD:UNEQUIP 执行失败:', e);
    return false;
  }
}

// ============================================================================
// 技能 CMD 处理器
// ============================================================================

/**
 * 处理 CMD:ADD - 添加技能
 *
 * @param cmdPart - CMD:ADD 后的字符串（名称|emoji|描述|mod:域.键）
 * @param msgId - 消息 ID
 * @returns 创建的技能对象，解析失败返回 null
 */
function handleSkillAdd(cmdPart: string, _msgId: number): 技能 | null {
  try {
    const parts = cmdPart.split(/[|｜]/).map(s => s.trim());

    if (parts.length < 3) {
      console.warn('[roleScanner] CMD:ADD 技能格式错误，需要至少 名称|emoji|描述');
      return null;
    }

    const [名称, emoji, 描述, ...rest] = parts;
    const extraPart = rest.join('|');

    if (!名称) {
      console.warn('[roleScanner] CMD:ADD 缺少技能名称');
      return null;
    }

    // 检查同名技能（去重）
    const vars = getVariables({ type: 'chat' });
    let skillDbMap = vars?.skill_db_map as Record<string, 技能> | null;
    if (!skillDbMap) {
      skillDbMap = {};
    }

    if (skillDbMap[名称]) {
      console.info(`[roleScanner] 跳过已存在的技能: ${名称}`);
      return null;
    }

    // 生成 ID
    const id = nextSkillId();

    // 解析 mod:域.键
    const 效果: Array<{ 域: string; 键: string; 值: number }> = [];

    if (extraPart) {
      // 检查单 mod 限制
      if (!checkSingleModLimit(extraPart)) {
        console.warn(`[roleScanner] 技能 ${名称} 包含多个 mod:，违反单 mod 限制`);
        return null;
      }

      const modMatch = extraPart.match(/mod:\s*([^\s,，]+)\.([^\s,，]+)/);
      if (modMatch) {
        const 域 = modMatch[1];
        const 键 = modMatch[2];

        if (!isValidDomainKey(域, 键)) {
          console.warn(`[roleScanner] 技能 ${名称} 的 mod: ${域}.${键} 不在白名单中`);
          return null;
        }

        const 值 = 随机分配效果值(域, 键);
        if (值 !== null) {
          效果.push({ 域, 键, 值 });
        }
      }
    }

    const skill: 技能 = 技能Schema.parse({
      id,
      名称,
      emoji: emoji || '',
      描述: 描述 || '',
      效果,
    });

    // 写入数据库
    skillDbMap[skill.名称] = skill;

    let skillsInventory = (vars?.skillsInventory as 技能[]) || [];
    skillsInventory = [...skillsInventory, skill];

    replaceVariables(klona({
      skill_db_map: skillDbMap,
      skillsInventory,
    }), { type: 'chat' });

    console.info(`[roleScanner] 添加技能: ${skill.名称} (${skill.id})`);
    return skill;
  } catch (e) {
    console.error('[roleScanner] CMD:ADD 技能解析失败:', e);
    return null;
  }
}

/**
 * 处理 CMD:DEL_SKILL - 删除技能
 *
 * @param name - 技能名称
 * @returns 是否删除成功
 */
function handleSkillDel(name: string): boolean {
  const vars = getVariables({ type: 'chat' });
  let skillDbMap = vars?.skill_db_map as Record<string, 技能> | null;
  if (!skillDbMap) {
    skillDbMap = {};
  }

  const skill = skillDbMap[name];
  if (!skill) {
    console.warn(`[roleScanner] CMD:DEL_SKILL 目标技能不存在: ${name}`);
    return false;
  }

  try {
    // 从 skill_db_map 移除
    delete skillDbMap[name];

    // 从 skillsInventory 移除
    let skillsInventory = (vars?.skillsInventory as 技能[]) || [];
    skillsInventory = skillsInventory.filter(s => s.名称 !== name);

    replaceVariables(klona({
      skill_db_map: skillDbMap,
      skillsInventory,
    }), { type: 'chat' });

    console.info(`[roleScanner] 删除技能: ${name}`);
    return true;
  } catch (e) {
    console.error('[roleScanner] CMD:DEL_SKILL 执行失败:', e);
    return false;
  }
}

// ============================================================================
// 消息扫描
// ============================================================================

/**
 * 扫描单条消息，提取并执行 CMD 指令
 *
 * @param msg - 聊天消息对象
 */
export function scanMessage(msg: any): void {
  if (!msg || !msg.content) return;

  const content = msg.content;
  const msgId = msg.message_id;

  // 扫描角色块
  let charMatch;
  REGEX_CHAR_BLOCK.lastIndex = 0;
  while ((charMatch = REGEX_CHAR_BLOCK.exec(content)) !== null) {
    const blockContent = charMatch[1];

    // CMD:ADD
    let addMatch;
    REGEX_CHAR_ADD.lastIndex = 0;
    while ((addMatch = REGEX_CHAR_ADD.exec(blockContent)) !== null) {
      handleCharAdd(addMatch[1].trim(), msgId);
    }

    // CMD:MOD
    let modMatch;
    REGEX_CHAR_MOD.lastIndex = 0;
    while ((modMatch = REGEX_CHAR_MOD.exec(blockContent)) !== null) {
      const name = modMatch[1].trim();
      const cmdPart = modMatch[2].trim();
      handleCharMod(name, cmdPart);
    }

    // CMD:DEL
    let delMatch;
    REGEX_CHAR_DEL.lastIndex = 0;
    while ((delMatch = REGEX_CHAR_DEL.exec(blockContent)) !== null) {
      const name = delMatch[1].trim();
      handleCharDel(name);
    }

    // CMD:EQUIP
    let equipMatch;
    REGEX_CHAR_EQUIP.lastIndex = 0;
    while ((equipMatch = REGEX_CHAR_EQUIP.exec(blockContent)) !== null) {
      const name = equipMatch[1].trim();
      const skillName = equipMatch[2].trim();
      handleCharEquip(name, skillName);
    }

    // CMD:UNEQUIP
    let unequipMatch;
    REGEX_CHAR_UNEQUIP.lastIndex = 0;
    while ((unequipMatch = REGEX_CHAR_UNEQUIP.exec(blockContent)) !== null) {
      const name = unequipMatch[1].trim();
      const skillName = unequipMatch[2].trim();
      handleCharUnequip(name, skillName);
    }
  }

  // 扫描技能块
  let skillMatch;
  REGEX_SKILL_BLOCK.lastIndex = 0;
  while ((skillMatch = REGEX_SKILL_BLOCK.exec(content)) !== null) {
    const blockContent = skillMatch[1];

    // CMD:ADD
    let addMatch;
    REGEX_SKILL_ADD.lastIndex = 0;
    while ((addMatch = REGEX_SKILL_ADD.exec(blockContent)) !== null) {
      const cmdPart = [
        addMatch[1].trim(),
        addMatch[2].trim(),
        addMatch[3].trim(),
        addMatch[4]?.trim() || '',
      ].join('|');
      handleSkillAdd(cmdPart, msgId);
    }

    // CMD:DEL_SKILL
    let delMatch;
    REGEX_SKILL_DEL.lastIndex = 0;
    while ((delMatch = REGEX_SKILL_DEL.exec(blockContent)) !== null) {
      const name = delMatch[1].trim();
      handleSkillDel(name);
    }
  }
}

// ============================================================================
// 扫描执行
// ============================================================================

/**
 * 执行扫描
 *
 * @param mode - 扫描模式
 *   - 'full': 全量扫描，从第一条消息开始
 *   - 'incremental': 增量扫描，从检查点之后开始
 */
export function performScan(mode: 'full' | 'incremental'): void {
  const allMessages = getChatMessages('all');
  let scanFromIndex = 0;

  // 增量扫描：尝试从检查点恢复状态
  if (mode === 'incremental') {
    const checkpoint = getCheckpoint();

    if (checkpoint && checkpoint.message_id != null) {
      const cpMsgId = checkpoint.message_id;
      scanFromIndex = allMessages.findIndex(m => m.message_id > cpMsgId);

      if (scanFromIndex === -1) {
        // 没有新消息，提前返回
        console.info('[roleScanner] 无新消息，跳过扫描');
        return;
      }

      // 从检查点快照恢复已处理的数据
      roleDbMap = klona(checkpoint.db_map);
      roleMaxId = checkpoint.max_id ?? 0;

      console.info(`[roleScanner] 增量扫描: 从消息索引 ${scanFromIndex} 开始（检查点: ${cpMsgId}）`);
    } else {
      // 没有检查点，退化为全量扫描
      mode = 'full';
      scanFromIndex = 0;
      console.info('[roleScanner] 无检查点，退化为全量扫描');
    }
  }

  // 全量扫描：重置状态
  if (mode === 'full') {
    roleDbMap = {};
    roleMaxId = 0;
    scanFromIndex = 0;

    // 从酒馆变量恢复之前的数据（用于合并场景）
    restoreRuntimeState();

    console.info(`[roleScanner] 全量扫描: 共 ${allMessages.length} 条消息`);
  }

  // 执行扫描
  const messagesToScan = allMessages.slice(scanFromIndex);
  for (const msg of messagesToScan) {
    scanMessage(msg);
  }

  // 同步状态到酒馆变量
  syncRuntimeState();

  // 保存检查点
  if (shouldSaveCheckpoint()) {
    saveCheckpoint();
  }

  console.info(`[roleScanner] 扫描完成: 处理 ${messagesToScan.length} 条消息`);
}

/**
 * 防抖调度扫描
 *
 * @param mode - 扫描模式
 */
export function scheduleScan(mode: 'full' | 'incremental'): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    performScan(mode);
    debounceTimer = null;
  }, CONFIG.debounceDelay);
}

/**
 * 手动触发全量扫描
 * 供 UI 按钮调用
 */
export function manualFullScan(): void {
  console.info('[roleScanner] 手动触发全量扫描');
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  performScan('full');
}

/**
 * 手动触发增量扫描
 * 供 UI 按钮调用
 */
export function manualIncrementalScan(): void {
  console.info('[roleScanner] 手动触发增量扫描');
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  performScan('incremental');
}

// ============================================================================
// 初始化与事件绑定
// ============================================================================

/**
 * 初始化角色扫描器
 *
 * 在 DOM 加载完成后调用，设置事件监听
 */
export function initRoleScanner(): void {
  // 恢复运行时状态
  restoreRuntimeState();

  // 监听酒馆事件
  if (typeof tavern_events !== 'undefined') {
    // 新消息到来 → 增量扫描
    eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, () => {
      scheduleScan('incremental');
    });

    // 删楼/回滚/修改楼层 → 全量扫描
    [
      tavern_events.MESSAGE_DELETED,
      tavern_events.MESSAGE_SWIPED,
      tavern_events.MESSAGE_UPDATED,
    ].forEach(e => {
      eventOn(e, () => {
        clearCheckpoint();
        scheduleScan('full');
      });
    });

    // 切换聊天 → 全量扫描
    eventOn(tavern_events.CHAT_CHANGED, () => {
      clearCheckpoint();
      scheduleScan('full');
    });
  }

  // 监听生成开始事件
  eventOn('generation_started', () => {
    const checkpoint = getCheckpoint();
    if (checkpoint && checkpoint.message_id != null) {
      scheduleScan('incremental');
    } else {
      performScan('full');
    }
  });

  // 初始化扫描
  const checkpoint = getCheckpoint();
  if (checkpoint && checkpoint.message_id != null) {
    scheduleScan('incremental');
  } else {
    performScan('full');
  }

  console.info('[roleScanner] 角色扫描器初始化完成');
}

// ============================================================================
// 导出运行时状态访问器（供其他模块使用）
// ============================================================================

/**
 * 获取当前角色数据库映射
 */
export function getRoleDbMap(): Record<string, 角色> {
  return klona(roleDbMap);
}

/**
 * 获取单个角色
 */
export function getRole(name: string): 角色 | null {
  return roleDbMap[name] ?? null;
}

/**
 * 获取所有角色列表
 */
export function getAllRoles(): 角色[] {
  return Object.values(roleDbMap);
}
