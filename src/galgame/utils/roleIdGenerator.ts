import { klona } from 'klona';

/**
 * 角色与技能 ID 自增管理器
 *
 * 提供线程安全的 ID 生成机制，确保在快速连续调用时不会产生重复 ID。
 * 所有 ID 存储在聊天变量中，支持检查点恢复和强制重置。
 */

/** 角色 ID 自增锁 */
let roleIdLock = false;
/** 技能 ID 自增锁 */
let skillIdLock = false;

/**
 * 格式化 ID 编号为固定长度字符串
 */
function formatId(prefix: string, id: number): string {
  return `${prefix}_${String(id).padStart(3, '0')}`;
}

/**
 * 格式化角色 ID（如 char_001）
 */
function formatRoleId(id: number): string {
  return formatId('char', id);
}

/**
 * 格式化技能 ID（如 skill_001）
 */
function formatSkillId(id: number): string {
  return formatId('skill', id);
}

// ==================== 角色 ID ====================

/**
 * 获取下一个角色 ID
 *
 * 从聊天变量中读取 role_max_id，递增后写回，返回格式化后的 ID。
 * 内部使用锁机制防止快速连续调用时产生重复 ID。
 *
 * @returns 格式化的角色 ID（如 "char_001", "char_002"）
 */
export function nextRoleId(): string {
  // 等待锁释放（简单自旋锁，适用于前端单线程环境）
  while (roleIdLock) {
    // 空循环，等待锁释放
  }
  roleIdLock = true;

  try {
    const vars = getVariables({ type: 'chat' });
    const currentMax = (vars?.role_max_id as number) || 0;
    const newId = currentMax + 1;

    insertOrAssignVariables({ role_max_id: newId }, { type: 'chat' });

    return formatRoleId(newId);
  } finally {
    roleIdLock = false;
  }
}

/**
 * 批量获取多个角色 ID
 *
 * 在批量添加角色时使用，只执行一次 read-modify-write，减少变量写入次数。
 *
 * @param count - 需要生成的角色 ID 数量
 * @returns 格式化的角色 ID 数组（如 ["char_001", "char_002", "char_003"]）
 */
export function nextRoleIds(count: number): string[] {
  if (count <= 0) return [];

  while (roleIdLock) {
    // 空循环，等待锁释放
  }
  roleIdLock = true;

  try {
    const vars = getVariables({ type: 'chat' });
    const currentMax = (vars?.role_max_id as number) || 0;
    const newMax = currentMax + count;

    insertOrAssignVariables({ role_max_id: newMax }, { type: 'chat' });

    const ids: string[] = [];
    for (let i = 1; i <= count; i++) {
      ids.push(formatRoleId(currentMax + i));
    }
    return ids;
  } finally {
    roleIdLock = false;
  }
}

/**
 * 获取当前角色最大 ID（不含递增）
 *
 * 用于检查点恢复等场景，需要读取当前最大值但不希望改变它。
 *
 * @returns 当前最大的角色 ID 编号（不含前缀），如果从未创建过角色则返回 0
 */
export function getCurrentRoleMaxId(): number {
  const vars = getVariables({ type: 'chat' });
  return (vars?.role_max_id as number) || 0;
}

/**
 * 强制重置角色最大 ID
 *
 * 用于恢复场景或修复数据不一致问题。
 * 谨慎使用，可能导致 ID 重复或覆盖。
 *
 * @param newId - 新的最大 ID 值（会作为下一个角色 ID 的基础）
 */
export function resetRoleId(newId: number): void {
  while (roleIdLock) {
    // 空循环，等待锁释放
  }
  roleIdLock = true;

  try {
    insertOrAssignVariables({ role_max_id: newId }, { type: 'chat' });
  } finally {
    roleIdLock = false;
  }
}

// ==================== 技能 ID ====================

/**
 * 获取下一个技能 ID
 *
 * 从聊天变量中读取 skill_max_id，递增后写回，返回格式化后的 ID。
 * 内部使用锁机制防止快速连续调用时产生重复 ID。
 *
 * @returns 格式化的技能 ID（如 "skill_001", "skill_002"）
 */
export function nextSkillId(): string {
  while (skillIdLock) {
    // 空循环，等待锁释放
  }
  skillIdLock = true;

  try {
    const vars = getVariables({ type: 'chat' });
    const currentMax = (vars?.skill_max_id as number) || 0;
    const newId = currentMax + 1;

    insertOrAssignVariables({ skill_max_id: newId }, { type: 'chat' });

    return formatSkillId(newId);
  } finally {
    skillIdLock = false;
  }
}

/**
 * 批量获取多个技能 ID
 *
 * 在批量添加技能时使用，只执行一次 read-modify-write，减少变量写入次数。
 *
 * @param count - 需要生成的技能 ID 数量
 * @returns 格式化的技能 ID 数组（如 ["skill_001", "skill_002", "skill_003"]）
 */
export function nextSkillIds(count: number): string[] {
  if (count <= 0) return [];

  while (skillIdLock) {
    // 空循环，等待锁释放
  }
  skillIdLock = true;

  try {
    const vars = getVariables({ type: 'chat' });
    const currentMax = (vars?.skill_max_id as number) || 0;
    const newMax = currentMax + count;

    insertOrAssignVariables({ skill_max_id: newMax }, { type: 'chat' });

    const ids: string[] = [];
    for (let i = 1; i <= count; i++) {
      ids.push(formatSkillId(currentMax + i));
    }
    return ids;
  } finally {
    skillIdLock = false;
  }
}

/**
 * 获取当前技能最大 ID（不含递增）
 *
 * 用于检查点恢复等场景，需要读取当前最大值但不希望改变它。
 *
 * @returns 当前最大的技能 ID 编号（不含前缀），如果从未创建过技能则返回 0
 */
export function getCurrentSkillMaxId(): number {
  const vars = getVariables({ type: 'chat' });
  return (vars?.skill_max_id as number) || 0;
}

/**
 * 强制重置技能最大 ID
 *
 * 用于恢复场景或修复数据不一致问题。
 * 谨慎使用，可能导致 ID 重复或覆盖。
 *
 * @param newId - 新的最大 ID 值（会作为下一个技能 ID 的基础）
 */
export function resetSkillId(newId: number): void {
  while (skillIdLock) {
    // 空循环，等待锁释放
  }
  skillIdLock = true;

  try {
    insertOrAssignVariables({ skill_max_id: newId }, { type: 'chat' });
  } finally {
    skillIdLock = false;
  }
}
