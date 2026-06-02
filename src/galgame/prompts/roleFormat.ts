/**
 * 任务：roleFormat（角色档案格式化）
 * 职责：将角色档案（JSON/对象）格式化为 AI 可读的文本
 * 关联：system、riddle 等需要人设注入的 task
 * 调用方：store.ts、prompts/system.ts
 * 状态：✅ 已实现
 */

import type { 角色 } from '../types/role';

const 预定义字段集 = new Set([
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

let _skillDbMapRef: Record<string, { 名称: string }> = {};

/** 设置技能数据库引用（用于格式化装备技能名称） */
export function setSkillDbMapForFormatting(dbMap: Record<string, { 名称: string }>) {
  _skillDbMapRef = dbMap;
}

/**
 * 格式化单个角色为 AI 可读的文本
 * 支持预定义字段 + 动态自定义字段
 */
export function formatRoleForAI(role: 角色): string {
  const lines: string[] = [];

  lines.push(`【角色：${role.姓名}】`);

  if (role.外貌) lines.push(`- 外貌：${role.外貌}`);
  if (role.性格) lines.push(`- 性格：${role.性格}`);
  if (role.出身) lines.push(`- 出身：${role.出身}`);
  if (role.定位) lines.push(`- 定位：${role.定位}`);
  if (role.职业) lines.push(`- 职业：${role.职业}`);
  if (role.说话风格) lines.push(`- 说话风格：${role.说话风格}`);
  if (role.喜好) lines.push(`- 喜好：${role.喜好}`);
  if (role.特长) lines.push(`- 特长：${role.特长}`);
  if (role.背景故事) lines.push(`- 背景：${role.背景故事}`);

  const customFields = Object.entries(role).filter(([key]) => !预定义字段集.has(key) && !key.startsWith('_'));
  for (const [key, value] of customFields) {
    if (value !== undefined && value !== null && value !== '') {
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      lines.push(`- ${key}：${valueStr}`);
    }
  }

  const attrs = Object.entries(role.属性)
    .map(([k, v]) => `${k}:${v}`)
    .join(' / ');
  lines.push(`- 属性：${attrs}`);

  if (role.已装备技能 && role.已装备技能.length > 0) {
    const skills = role.已装备技能
      .map(s => {
        const skill = _skillDbMapRef[s];
        return skill ? `${skill.名称}` : s;
      })
      .join('、');
    lines.push(`- 装备技能：${skills}`);
  }

  lines.push(`- 状态：${role.状态 || '空闲'}`);

  return lines.join('\n');
}

/**
 * 格式化角色列表为 AI 可读的文本
 */
export function formatRoleListForAI(roles: 角色[], 标题: string): string {
  if (roles.length === 0) return '';
  const header = `【${标题}】\n（共 ${roles.length} 名角色）`;
  const body = roles.map(r => formatRoleForAI(r)).join('\n\n');
  return `${header}\n${body}`;
}
