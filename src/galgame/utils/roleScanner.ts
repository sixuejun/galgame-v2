/**
 * 角色系统聊天扫描引擎
 *
 * 负责从聊天消息中解析 <Character> 和 <Skill> 标签中的 CMD 指令，
 * 并将角色/技能数据写入酒馆变量。
 *
 * 每次 performScan 都从聊天变量读取当前状态作为起点，
 * 扫描完成后一次性同步回聊天变量。参考物品栏脚本的扫描架构。
 */

import { klona } from 'klona';
import type { 技能, 角色, 角色检查点 } from '../types/role';
import { 技能Schema, 角色Schema, 预定义角色字段列表 } from '../types/role';
import { nextRoleId, nextSkillId } from './roleIdGenerator';
import { checkSingleModLimit, isValidDomainKey, 随机分配效果值 } from './skillEffectWhitelist';

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
// 防抖定时器
// ============================================================================

/** 防抖定时器 */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// ============================================================================
// 扫描完成回调（通知外部 store 更新状态）
// ============================================================================

/** 扫描结果回调类型 */
export type ScanCompleteCallback = (params: {
  roles: Record<string, 角色>;
  roleMaxId: number;
  skillDbMap: Record<string, 技能>;
  skillsInventory: 技能[];
}) => void;

/** 全局回调（由 store 在初始化时注册） */
let onScanComplete: ScanCompleteCallback | null = null;

/**
 * 注册扫描完成回调
 *
 * 由 store 在初始化时调用，确保扫描结果能同步到 pinia ref。
 */
export function setScanCompleteCallback(callback: ScanCompleteCallback | null): void {
  onScanComplete = callback;
}

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
const REGEX_SKILL_ADD =
  /CMD:ADD\s*[|｜]\s*([^\|｜]+?)\s*[|｜]\s*([^\|｜]+?)\s*[|｜]\s*([^\|｜]+?)(?:\s*[|｜]\s*(.+))?/gi;

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
  for (const attrPart of attrParts) {
    const colonIdx = attrPart.indexOf(':');
    if (colonIdx === -1) continue;
    const key = attrPart.slice(0, colonIdx).trim();
    const val = attrPart.slice(colonIdx + 1).trim();
    const numVal = parseInt(val, 10);
    if (!isNaN(numVal) && key in defaults) {
      defaults[key] = Math.min(5, Math.max(0, numVal));
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
// 聊天变量读写工具（所有状态以聊天变量为唯一真源）
// ============================================================================

function getVars() {
  return getVariables({ type: 'chat' }) ?? {};
}

/** 从聊天变量读取角色记录（id → 角色） */
function getRolesFromVars(): Record<string, 角色> {
  const vars = getVars();
  const saved = vars?.roles as Record<string, 角色> | null;
  if (saved) return klona(saved);
  return {};
}

/** 从聊天变量读取角色 ID 最大值 */
function getRoleMaxIdFromVars(): number {
  const vars = getVars();
  return (vars?.role_max_id as number) ?? 0;
}

/** 一次性同步所有状态到聊天变量（performScan 结束时调用） */
function syncAllToVars(params: {
  roles: Record<string, 角色>;
  roleMaxId: number;
  skillDbMap: Record<string, 技能>;
  skillsInventory: 技能[];
}): void {
  const { roles, roleMaxId, skillDbMap, skillsInventory } = params;

  insertOrAssignVariables(
    klona({
      roles,
      role_max_id: roleMaxId,
      skill_db_map: skillDbMap,
      skillsInventory,
    }),
    { type: 'chat' },
  );
}

// ============================================================================
// 检查点管理
// ============================================================================

/**
 * 获取检查点
 */
export function getCheckpoint(): 角色检查点 | null {
  const vars = getVars();
  const checkpoint = vars?.role_checkpoint as 角色检查点 | null;
  if (!checkpoint || checkpoint.message_id == null) return null;
  return checkpoint;
}

/**
 * 保存检查点（由 performScan 末尾调用）
 */
function saveCheckpoint(params: { roles: Record<string, 角色>; roleMaxId: number; latestMsgId: number }): void {
  const checkpoint: 角色检查点 = {
    message_id: params.latestMsgId,
    max_id: params.roleMaxId,
    roles: klona(params.roles),
  };
  insertOrAssignVariables(klona({ role_checkpoint: checkpoint }), { type: 'chat' });
}

/**
 * 清除检查点（删楼等破坏性操作后调用）
 */
export function clearCheckpoint(): void {
  insertOrAssignVariables(klona({ role_checkpoint: null }), { type: 'chat' });
}

/**
 * 检查是否需要保存检查点
 */
function shouldSaveCheckpoint(latestMsgId: number): boolean {
  const checkpoint = getCheckpoint();
  if (!checkpoint || checkpoint.message_id == null) return true;
  return latestMsgId - checkpoint.message_id >= CONFIG.checkpointInterval;
}

/**
 * 获取检查点对应的消息 ID
 */
export function getCheckpointMsgId(): number {
  const checkpoint = getCheckpoint();
  return checkpoint?.message_id ?? 0;
}

// ============================================================================
// 角色 CMD 处理器（操作局部变量，由 performScan 统一同步）
// ============================================================================

function handleCharAdd(
  cmdPart: string,
  _msgId: number,
  state: {
    roles: Record<string, 角色>;
    roleMaxId: number;
  },
): 角色 | null {
  try {
    const fields = parseKeyValuePairs(cmdPart);

    if (!fields['姓名']) {
      console.warn('[roleScanner] CMD:ADD 缺少必填字段: 姓名');
      return null;
    }
    if (!fields['属性']) {
      console.warn('[roleScanner] CMD:ADD 缺少必填字段: 属性');
      return null;
    }

    const name = fields['姓名'];

    // 按姓名查重
    if (Object.values(state.roles).some(r => r.姓名 === name)) {
      console.info(`[roleScanner] 跳过已存在的角色: ${name}`);
      return null;
    }

    const id = nextRoleId();
    state.roleMaxId = Math.max(state.roleMaxId, parseInt(id.replace('char_', ''), 10) || 0);

    const 属性 = parseAttributeField(fields['属性']);

    const rawRole: Record<string, unknown> = {
      id,
      姓名: name,
      属性,
      已装备技能: [],
      状态: '空闲',
      当前任务: null,
      记录: [],
    };

    for (const field of ['外貌', '性格', '出身', '定位', '说话风格', '喜好', '特长', '职业', '背景故事'] as const) {
      if (fields[field]) rawRole[field] = fields[field];
    }
    for (const [key, value] of Object.entries(fields)) {
      if (!isPredefinedField(key) && key !== 'id') rawRole[key] = value;
    }

    const role = 角色Schema.parse(rawRole);
    state.roles[role.id] = role;

    console.info(`[roleScanner] 添加角色: ${role.姓名} (${role.id})`);
    return role;
  } catch (e) {
    console.error('[roleScanner] CMD:ADD 解析失败:', e);
    return null;
  }
}

function handleCharMod(
  name: string,
  cmdPart: string,
  state: { roles: Record<string, 角色> },
): boolean {
  const role = Object.values(state.roles).find(r => r.姓名 === name);
  if (!role) {
    console.warn(`[roleScanner] CMD:MOD 目标角色不存在: ${name}`);
    return false;
  }

  try {
    const fields = parseKeyValuePairs(cmdPart);
    const updatedRole: Record<string, unknown> = { ...role };
    for (const [key, value] of Object.entries(fields)) {
      updatedRole[key] = key === '属性' ? parseAttributeField(value) : value;
    }
    const validatedRole = 角色Schema.parse(updatedRole);
    state.roles[role.id] = validatedRole;
    console.info(`[roleScanner] 修改角色: ${name}`);
    return true;
  } catch (e) {
    console.error('[roleScanner] CMD:MOD 解析失败:', e);
    return false;
  }
}

function handleCharDel(
  name: string,
  state: { roles: Record<string, 角色> },
): boolean {
  const role = Object.values(state.roles).find(r => r.姓名 === name);
  if (!role) {
    console.warn(`[roleScanner] CMD:DEL 目标角色不存在: ${name}`);
    return false;
  }
  delete state.roles[role.id];
  console.info(`[roleScanner] 删除角色: ${name}`);
  return true;
}

function handleCharEquip(
  name: string,
  skillName: string,
  state: { roles: Record<string, 角色>; skillDbMap: Record<string, 技能> },
): boolean {
  const role = Object.values(state.roles).find(r => r.姓名 === name);
  if (!role) {
    console.warn(`[roleScanner] CMD:EQUIP 目标角色不存在: ${name}`);
    return false;
  }
  if (!state.skillDbMap[skillName]) {
    console.warn(`[roleScanner] CMD:EQUIP 技能不存在: ${skillName}`);
    return false;
  }

  const 已装备技能 = [...(role.已装备技能 || [])];
  if (已装备技能.includes(skillName)) {
    console.info(`[roleScanner] 技能 ${skillName} 已装备在 ${name} 上，跳过`);
    return true;
  }
  已装备技能.push(skillName);

  try {
    state.roles[role.id] = 角色Schema.parse({ ...role, 已装备技能 });
    console.info(`[roleScanner] 角色 ${name} 装备技能: ${skillName}`);
    return true;
  } catch (e) {
    console.error('[roleScanner] CMD:EQUIP 解析失败:', e);
    return false;
  }
}

function handleCharUnequip(
  name: string,
  skillName: string,
  state: { roles: Record<string, 角色> },
): boolean {
  const role = Object.values(state.roles).find(r => r.姓名 === name);
  if (!role) {
    console.warn(`[roleScanner] CMD:UNEQUIP 目标角色不存在: ${name}`);
    return false;
  }

  const 已装备技能 = [...(role.已装备技能 || [])];
  const index = 已装备技能.indexOf(skillName);
  if (index === -1) {
    console.info(`[roleScanner] 技能 ${skillName} 未装备在 ${name} 上，跳过`);
    return true;
  }
  已装备技能.splice(index, 1);

  try {
    state.roles[role.id] = 角色Schema.parse({ ...role, 已装备技能 });
    console.info(`[roleScanner] 角色 ${name} 卸下技能: ${skillName}`);
    return true;
  } catch (e) {
    console.error('[roleScanner] CMD:UNEQUIP 解析失败:', e);
    return false;
  }
}

// ============================================================================
// 技能 CMD 处理器
// ============================================================================

function handleSkillAdd(
  cmdPart: string,
  _msgId: number,
  state: {
    skillDbMap: Record<string, 技能>;
    skillsInventory: 技能[];
  },
): 技能 | null {
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
    if (state.skillDbMap[名称]) {
      console.info(`[roleScanner] 跳过已存在的技能: ${名称}`);
      return null;
    }

    const id = nextSkillId();
    const 效果: Array<{ 域: string; 键: string; 值: number }> = [];

    if (extraPart) {
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
        if (值 !== null) 效果.push({ 域, 键, 值 });
      }
    }

    const skill: 技能 = 技能Schema.parse({ id, 名称, emoji: emoji || '', 描述: 描述 || '', 效果 });

    state.skillDbMap[skill.名称] = skill;
    state.skillsInventory = [...state.skillsInventory, skill];

    console.info(`[roleScanner] 添加技能: ${skill.名称} (${skill.id})`);
    return skill;
  } catch (e) {
    console.error('[roleScanner] CMD:ADD 技能解析失败:', e);
    return null;
  }
}

function handleSkillDel(
  name: string,
  state: { skillDbMap: Record<string, 技能>; skillsInventory: 技能[] },
): boolean {
  const skill = state.skillDbMap[name];
  if (!skill) {
    console.warn(`[roleScanner] CMD:DEL_SKILL 目标技能不存在: ${name}`);
    return false;
  }
  delete state.skillDbMap[name];
  state.skillsInventory = state.skillsInventory.filter(s => s.名称 !== name);
  console.info(`[roleScanner] 删除技能: ${name}`);
  return true;
}

// ============================================================================
// 消息扫描
// ============================================================================

function scanMessage(
  msg: any,
  state: {
    roles: Record<string, 角色>;
    roleMaxId: number;
    skillDbMap: Record<string, 技能>;
    skillsInventory: 技能[];
  },
): void {
  if (!msg?.message) return;

  const content = msg.message;

  // 扫描角色块
  let charMatch;
  REGEX_CHAR_BLOCK.lastIndex = 0;
  while ((charMatch = REGEX_CHAR_BLOCK.exec(content)) !== null) {
    const blockContent = charMatch[1];

    let addMatch;
    REGEX_CHAR_ADD.lastIndex = 0;
    while ((addMatch = REGEX_CHAR_ADD.exec(blockContent)) !== null) {
      handleCharAdd(addMatch[1].trim(), msg.message_id, state);
    }

    let modMatch;
    REGEX_CHAR_MOD.lastIndex = 0;
    while ((modMatch = REGEX_CHAR_MOD.exec(blockContent)) !== null) {
      handleCharMod(modMatch[1].trim(), modMatch[2].trim(), state);
    }

    let delMatch;
    REGEX_CHAR_DEL.lastIndex = 0;
    while ((delMatch = REGEX_CHAR_DEL.exec(blockContent)) !== null) {
      handleCharDel(delMatch[1].trim(), state);
    }

    let equipMatch;
    REGEX_CHAR_EQUIP.lastIndex = 0;
    while ((equipMatch = REGEX_CHAR_EQUIP.exec(blockContent)) !== null) {
      handleCharEquip(equipMatch[1].trim(), equipMatch[2].trim(), state);
    }

    let unequipMatch;
    REGEX_CHAR_UNEQUIP.lastIndex = 0;
    while ((unequipMatch = REGEX_CHAR_UNEQUIP.exec(blockContent)) !== null) {
      handleCharUnequip(unequipMatch[1].trim(), unequipMatch[2].trim(), state);
    }
  }

  // 扫描技能块
  let skillMatch;
  REGEX_SKILL_BLOCK.lastIndex = 0;
  while ((skillMatch = REGEX_SKILL_BLOCK.exec(content)) !== null) {
    const blockContent = skillMatch[1];

    let addMatch;
    REGEX_SKILL_ADD.lastIndex = 0;
    while ((addMatch = REGEX_SKILL_ADD.exec(blockContent)) !== null) {
      const cmdPart = [addMatch[1].trim(), addMatch[2].trim(), addMatch[3].trim(), addMatch[4]?.trim() || ''].join('|');
      handleSkillAdd(cmdPart, msg.message_id, state);
    }

    let delMatch;
    REGEX_SKILL_DEL.lastIndex = 0;
    while ((delMatch = REGEX_SKILL_DEL.exec(blockContent)) !== null) {
      handleSkillDel(delMatch[1].trim(), state);
    }
  }
}

// ============================================================================
// 扫描执行
// ============================================================================

/**
 * 执行扫描
 *
 * 每次都从聊天变量读取当前状态，扫描完成后一次性同步回去。
 *
 * @param mode - 'full': 全量扫描 | 'incremental': 增量扫描
 */
export function performScan(mode: 'full' | 'incremental'): void {
  const lastId = getLastMessageId();
  const allMessages = getChatMessages(`0-${lastId}`);
  let scanFromIndex = 0;

  // 始终从聊天变量读取当前状态作为扫描起点
  const state = {
    roles: getRolesFromVars(),
    roleMaxId: getRoleMaxIdFromVars(),
    skillDbMap: getVars()?.skill_db_map as Record<string, 技能> ?? {},
    skillsInventory: (getVars()?.skillsInventory as 技能[]) ?? [],
  };

  // 增量扫描：从检查点恢复扫描起点
  if (mode === 'incremental') {
    const checkpoint = getCheckpoint();

    if (checkpoint && checkpoint.message_id != null) {
      const cpMsgId = checkpoint.message_id;
      scanFromIndex = allMessages.findIndex(m => m.message_id > cpMsgId);

      if (scanFromIndex === -1) {
        console.info('[roleScanner] 无新消息，跳过扫描');
        return;
      }

      // 从检查点恢复已处理的数据
      state.roles = klona(checkpoint.roles ?? {});
      state.roleMaxId = checkpoint.max_id ?? 0;

      console.info(`[roleScanner] 增量扫描: 从消息索引 ${scanFromIndex} 开始（检查点: ${cpMsgId}）`);
    } else {
      // 无检查点，退化为全量扫描
      mode = 'full';
      scanFromIndex = 0;
      console.info('[roleScanner] 无检查点，退化为全量扫描');
    }
  }

  if (mode === 'full') {
    scanFromIndex = 0;
    console.info(`[roleScanner] 全量扫描: 共 ${allMessages.length} 条消息`);
  }

  // 执行扫描
  const messagesToScan = allMessages.slice(scanFromIndex);
  for (const msg of messagesToScan) {
    scanMessage(msg, state);
  }

  // 一次性同步所有状态到聊天变量
  syncAllToVars({
    roles: state.roles,
    roleMaxId: state.roleMaxId,
    skillDbMap: state.skillDbMap,
    skillsInventory: state.skillsInventory,
  });

  // 通知外部（store）更新状态
  if (onScanComplete) {
    onScanComplete({
      roles: state.roles,
      roleMaxId: state.roleMaxId,
      skillDbMap: state.skillDbMap,
      skillsInventory: state.skillsInventory,
    });
  }

  // 保存检查点
  const latestMsg = allMessages[allMessages.length - 1];
  const latestMsgId = latestMsg?.message_id ?? 0;
  if (shouldSaveCheckpoint(latestMsgId)) {
    saveCheckpoint({ roles: state.roles, roleMaxId: state.roleMaxId, latestMsgId });
  }

  console.info(`[roleScanner] 扫描完成: 处理 ${messagesToScan.length} 条消息`);
}

/**
 * 防抖调度扫描
 */
export function scheduleScan(mode: 'full' | 'incremental'): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    performScan(mode);
    debounceTimer = null;
  }, CONFIG.debounceDelay);
}

/**
 * 手动触发全量扫描（UI 按钮调用）
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
 * 手动触发增量扫描（UI 按钮调用）
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
  // 监听酒馆事件
  if (typeof tavern_events !== 'undefined') {
    // 新消息到来 → 增量扫描
    eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, () => {
      scheduleScan('incremental');
    });

    // 删楼/回滚/修改楼层 → 清检查点 + 全量扫描
    [tavern_events.MESSAGE_DELETED, tavern_events.MESSAGE_SWIPED, tavern_events.MESSAGE_UPDATED].forEach(e => {
      eventOn(e, () => {
        clearCheckpoint();
        scheduleScan('full');
      });
    });

    // 切换聊天 → 清检查点 + 全量扫描
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
// 运行时状态访问器（供其他模块使用，始终从聊天变量读取）
// ============================================================================

/**
 * 获取当前所有角色列表（始终从聊天变量读取）
 */
export function getAllRoles(): 角色[] {
  return Object.values(getRolesFromVars());
}

/**
 * 获取单个角色（始终从聊天变量读取）
 */
export function getRole(name: string): 角色 | null {
  return Object.values(getRolesFromVars()).find(r => r.姓名 === name) ?? null;
}
