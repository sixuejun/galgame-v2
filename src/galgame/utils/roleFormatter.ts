/**
 * 角色系统格式化工具
 * 位于 src/galgame/utils/roleFormatter.ts
 *
 * 提供角色、技能的格式化输出函数
 * 用于 AI Prompt 注入、UI 展示、结算报告等场景
 */

import {
  角色,
  技能,
  角色状态,
  属性,
  type DispatchRun,
} from '../types/role';

// ============================================================================
// 预定义字段列表（用于过滤自定义字段）
// ============================================================================

const 预定义角色字段 = new Set([
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

// ============================================================================
// Emoji 辅助函数
// ============================================================================

/**
 * 根据属性值获取星星表情
 * 0 → ☆☆☆☆☆
 * 1 → ★☆☆☆☆
 * 5 → ★★★★★
 */
export function getAttributeEmoji(value: number): string {
  const clamped = Math.max(0, Math.min(5, Math.round(value)));
  const filled = '★'.repeat(clamped);
  const empty = '☆'.repeat(5 - clamped);
  return filled + empty;
}

/**
 * 角色状态对应的 Emoji 映射
 */
const 状态EmojiMap: Record<角色状态, string> = {
  空闲: '🟢',
  派遣中: '🚀',
  工坊中: '🔧',
  逃跑中: '🏃',
  休息中: '😴',
  加班中: '⚡',
  受伤: '💢',
};

/**
 * 根据角色状态获取 Emoji
 */
export function getStatusEmoji(status: 角色状态): string {
  return 状态EmojiMap[status] ?? '❓';
}

/**
 * 根据属性值获取颜色 CSS 类名
 */
export function getAttributeColorClass(value: number): string {
  if (value >= 4) return 'attr-high'; // 红色系
  if (value >= 2) return 'attr-mid'; // 黄色系
  return 'attr-low'; // 灰色系
}

/**
 * 获取属性条形显示（用于 UI）
 * 如: 战力:★★★☆☆
 */
export function getAttributeBar(name: string, value: number): string {
  return `${name}:${getAttributeEmoji(value)}`;
}

// ============================================================================
// formatRoleBasicInfo
// ============================================================================

/**
 * 格式化角色基本信息（人类可读）
 * 用于调试、日志、展示等场景
 *
 * @example
 * ```
 * 【星见 | char_001】
 * 外貌：银发蓝瞳
 * 性格：冷静、理性
 * 战力:3 技巧:2 智慧:1 社交:2 谨慎:1 运气:0
 * 状态：空闲
 * ```
 */
export function formatRoleBasicInfo(role: 角色): string {
  const lines: string[] = [];

  // 标题行：姓名 | ID
  lines.push(`【${role.姓名} | ${role.id}】`);

  // 预定义可选字段
  if (role.外貌) lines.push(`外貌：${role.外貌}`);
  if (role.性格) lines.push(`性格：${role.性格}`);
  if (role.出身) lines.push(`出身：${role.出身}`);
  if (role.定位) lines.push(`定位：${role.定位}`);
  if (role.说话风格) lines.push(`说话风格：${role.说话风格}`);
  if (role.喜好) lines.push(`喜好：${role.喜好}`);
  if (role.特长) lines.push(`特长：${role.特长}`);
  if (role.职业) lines.push(`职业：${role.职业}`);
  if (role.背景故事) lines.push(`背景故事：${role.背景故事}`);

  // 属性（/ 分隔的 key:value 格式）
  const attrParts: string[] = [];
  const attrs: 属性 = role.属性;
  if (attrs.战力 !== undefined) attrParts.push(`战力:${attrs.战力}`);
  if (attrs.技巧 !== undefined) attrParts.push(`技巧:${attrs.技巧}`);
  if (attrs.智慧 !== undefined) attrParts.push(`智慧:${attrs.智慧}`);
  if (attrs.社交 !== undefined) attrParts.push(`社交:${attrs.社交}`);
  if (attrs.谨慎 !== undefined) attrParts.push(`谨慎:${attrs.谨慎}`);
  if (attrs.运气 !== undefined) attrParts.push(`运气:${attrs.运气}`);
  if (attrParts.length > 0) {
    lines.push(attrParts.join(' '));
  }

  // 状态
  lines.push(`状态：${role.状态}`);

  // 当前任务（如果有）
  if (role.当前任务) {
    lines.push(`当前任务：${role.当前任务}`);
  }

  return lines.join('\n');
}

// ============================================================================
// formatSkillInfo
// ============================================================================

/**
 * 格式化技能信息（人类可读）
 *
 * @example
 * ```
 * 【潜行专精 | skill_001】
 * 效果：降低被发现概率
 * mod:派遣.隐蔽加成 80
 * ```
 */
export function formatSkillInfo(skill: 技能): string {
  const lines: string[] = [];

  // 标题行：名称 | ID
  const emoji = skill.emoji ? `${skill.emoji} ` : '';
  lines.push(`【${emoji}${skill.名称} | ${skill.id}】`);

  // 描述
  if (skill.描述) {
    lines.push(`效果：${skill.描述}`);
  }

  // 技能效果（mod:域.键 数值）
  if (skill.效果 && skill.效果.length > 0) {
    for (const effect of skill.效果) {
      lines.push(`mod:${effect.域}.${effect.键} ${effect.值}`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// formatRoleForLlm
// ============================================================================

/**
 * 格式化角色为 LLM 可读的文本
 * 用于注入到 AI Prompt 中
 *
 * @example
 * ```
 * <角色>
 * 姓名：星见
 * ID：char_001
 * 外貌：银发蓝瞳
 * 性格：冷静、理性
 * 属性：战力:3 技巧:2 智慧:1 社交:2 谨慎:1 运气:0
 * 状态：空闲
 * 装备技能：[潜行专精]
 * </角色>
 * ```
 */
export function formatRoleForLlm(
  role: 角色,
  options?: {
    /** 是否包含自定义字段 */
    includeCustomFields?: boolean;
    /** 装备技能名称映射（id → 名称） */
    skillNameMap?: Record<string, string>;
  },
): string {
  const { includeCustomFields = true, skillNameMap = {} } = options ?? {};
  const lines: string[] = [];

  lines.push('<角色>');

  // 基础信息
  lines.push(`姓名：${role.姓名}`);
  lines.push(`ID：${role.id}`);

  // 预定义可选字段
  if (role.外貌) lines.push(`外貌：${role.外貌}`);
  if (role.性格) lines.push(`性格：${role.性格}`);
  if (role.出身) lines.push(`出身：${role.出身}`);
  if (role.定位) lines.push(`定位：${role.定位}`);
  if (role.说话风格) lines.push(`说话风格：${role.说话风格}`);
  if (role.喜好) lines.push(`喜好：${role.喜好}`);
  if (role.特长) lines.push(`特长：${role.特长}`);
  if (role.职业) lines.push(`职业：${role.职业}`);
  if (role.背景故事) lines.push(`背景故事：${role.背景故事}`);

  // 自定义字段（可选）
  if (includeCustomFields) {
    const customEntries = Object.entries(role).filter(([key]) => {
      return (
        !预定义角色字段.has(key) &&
        !key.startsWith('_') &&
        role[key as keyof typeof role] !== undefined &&
        role[key as keyof typeof role] !== null
      );
    });
    for (const [key, value] of customEntries) {
      const valueStr =
        typeof value === 'object' ? JSON.stringify(value) : String(value);
      lines.push(`${key}：${valueStr}`);
    }
  }

  // 属性（空格分隔的 key:value 格式）
  const attrs: 属性 = role.属性;
  const attrParts: string[] = [];
  if (attrs.战力 !== undefined) attrParts.push(`战力:${attrs.战力}`);
  if (attrs.技巧 !== undefined) attrParts.push(`技巧:${attrs.技巧}`);
  if (attrs.智慧 !== undefined) attrParts.push(`智慧:${attrs.智慧}`);
  if (attrs.社交 !== undefined) attrParts.push(`社交:${attrs.社交}`);
  if (attrs.谨慎 !== undefined) attrParts.push(`谨慎:${attrs.谨慎}`);
  if (attrs.运气 !== undefined) attrParts.push(`运气:${attrs.运气}`);
  if (attrParts.length > 0) {
    lines.push(`属性：${attrParts.join(' ')}`);
  }

  // 装备技能（逗号分隔的 [技能名] 格式）
  if (role.已装备技能 && role.已装备技能.length > 0) {
    const skillNames = role.已装备技能.map((id) => {
      const name = skillNameMap[id] ?? id;
      return `[${name}]`;
    });
    lines.push(`装备技能：${skillNames.join('、')}`);
  }

  // 状态
  lines.push(`状态：${role.状态}`);

  // 当前任务
  if (role.当前任务) {
    lines.push(`当前任务：${role.当前任务}`);
  }

  lines.push('</角色>');

  return lines.join('\n');
}

// ============================================================================
// formatSkillsForLlm
// ============================================================================

/**
 * 格式化技能列表为 LLM 可读的文本
 *
 * @example
 * ```
 * <可用技能>
 * 技能1：潜行专精 | 效果：降低被发现概率 | mod:派遣.隐蔽加成 80
 * </可用技能>
 * ```
 */
export function formatSkillsForLlm(
  skills: 技能[],
  options?: {
    /** 标题，默认为"可用技能" */
    title?: string;
  },
): string {
  const { title = '可用技能' } = options ?? {};

  if (skills.length === 0) {
    return `<${title}>\n（无技能）\n</${title}>`;
  }

  const lines: string[] = [];
  lines.push(`<${title}>`);

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    const parts: string[] = [];

    parts.push(skill.名称);
    if (skill.描述) {
      parts.push(`效果：${skill.描述}`);
    }

    // 技能效果
    if (skill.效果 && skill.效果.length > 0) {
      for (const effect of skill.效果) {
        parts.push(`mod:${effect.域}.${effect.键} ${effect.值}`);
      }
    }

    lines.push(`技能${i + 1}：${parts.join(' | ')}`);
  }

  lines.push(`</${title}>`);

  return lines.join('\n');
}

// ============================================================================
// formatDispatchSettlement
// ============================================================================

/**
 * 格式化派遣结算为 Markdown 文本
 *
 * @example
 * ```
 * ## 派遣结算：星见
 *
 * **状态**: 成功归来
 * **获得金币**: 150 (+30 战斗加成)
 * **纪念品**: [旧怀表]
 *
 * ### 小故事
 * 星见在探索废弃工厂时...
 * ```
 */
export function formatDispatchSettlement(
  run: DispatchRun,
  roleName: string,
): string {
  const lines: string[] = [];

  // 标题
  lines.push(`## 派遣结算：${roleName}`);
  lines.push('');

  const settlement = run.结算结果;

  // 状态
  const statusText = settlement?.状态 ?? run.状态;
  const statusDisplay =
    statusText === '成功'
      ? '成功归来'
      : statusText === '强制结算'
        ? '强制撤离'
        : statusText === '失败'
          ? '任务失败'
          : '进行中';
  lines.push(`**状态**: ${statusDisplay}`);
  lines.push('');

  // 金币（如果有结算）
  if (settlement) {
    const total = settlement.总金币 ?? 0;
    const battle = settlement.战斗加成 ?? 0;

    if (total > 0) {
      if (battle > 0) {
        lines.push(`**获得金币**: ${total} (+${battle} 战斗加成)`);
      } else {
        lines.push(`**获得金币**: ${total}`);
      }
    }

    // 纪念品
    if (settlement.纪念品 && settlement.纪念品.length > 0) {
      const items = settlement.纪念品.map((item) => `[${item}]`).join('、');
      lines.push(`**纪念品**: ${items}`);
    }

    lines.push('');

    // 小故事
    if (settlement.小故事) {
      lines.push('### 小故事');
      lines.push(settlement.小故事);
    }
  }

  // 事件统计（可选）
  if (run.触发战斗次数 > 0) {
    lines.push('');
    lines.push(`> 派遣过程中共触发 ${run.触发战斗次数} 次战斗`);
  }

  return lines.join('\n');
}

// ============================================================================
// formatRoleCard
// ============================================================================

/**
 * 格式化角色卡片为 HTML 字符串
 * 用于在角色面板等 UI 中展示
 *
 * @example
 * ```
 * <div class="role-card" data-role-id="char_001">
 *   <div class="role-header">
 *     <span class="role-name">星见</span>
 *     <span class="role-status">🟢 空闲</span>
 *   </div>
 *   <div class="role-attrs">
 *     <div>战力:★★★☆☆</div>
 *     <div>技巧:★★☆☆☆</div>
 *     ...
 *   </div>
 * </div>
 * ```
 */
export function formatRoleCard(
  role: 角色,
  options?: {
    /** 是否包含技能列表 */
    includeSkills?: boolean;
    /** 是否包含属性详情 */
    includeStats?: boolean;
    /** 装备技能名称映射 */
    skillNameMap?: Record<string, string>;
  },
): string {
  const { includeSkills = true, includeStats = true, skillNameMap = {} } =
    options ?? {};

  const parts: string[] = [];

  // 基础容器
  parts.push(`<div class="role-card" data-role-id="${role.id}">`);

  // ===== Header =====
  parts.push('  <div class="role-header">');
  parts.push(`    <span class="role-name">${role.姓名}</span>`);

  // 状态 + Emoji
  const statusEmoji = getStatusEmoji(role.状态);
  parts.push(`    <span class="role-status">${statusEmoji} ${role.状态}</span>`);
  parts.push('  </div>');

  // ===== 基本信息 =====
  if (role.外貌 || role.性格) {
    parts.push('  <div class="role-info">');
    if (role.外貌) {
      parts.push(`    <div class="role-look">${role.外貌}</div>`);
    }
    if (role.性格) {
      parts.push(`    <div class="role-personality">${role.性格}</div>`);
    }
    parts.push('  </div>');
  }

  // ===== 属性条 =====
  if (includeStats) {
    const attrs: 属性 = role.属性;
    parts.push('  <div class="role-attrs">');
    if (attrs.战力 !== undefined) {
      parts.push(
        `    <div class="attr-item ${getAttributeColorClass(attrs.战力)}">${getAttributeBar('战力', attrs.战力)}</div>`,
      );
    }
    if (attrs.技巧 !== undefined) {
      parts.push(
        `    <div class="attr-item ${getAttributeColorClass(attrs.技巧)}">${getAttributeBar('技巧', attrs.技巧)}</div>`,
      );
    }
    if (attrs.智慧 !== undefined) {
      parts.push(
        `    <div class="attr-item ${getAttributeColorClass(attrs.智慧)}">${getAttributeBar('智慧', attrs.智慧)}</div>`,
      );
    }
    if (attrs.社交 !== undefined) {
      parts.push(
        `    <div class="attr-item ${getAttributeColorClass(attrs.社交)}">${getAttributeBar('社交', attrs.社交)}</div>`,
      );
    }
    if (attrs.谨慎 !== undefined) {
      parts.push(
        `    <div class="attr-item ${getAttributeColorClass(attrs.谨慎)}">${getAttributeBar('谨慎', attrs.谨慎)}</div>`,
      );
    }
    if (attrs.运气 !== undefined) {
      parts.push(
        `    <div class="attr-item ${getAttributeColorClass(attrs.运气)}">${getAttributeBar('运气', attrs.运气)}</div>`,
      );
    }
    parts.push('  </div>');
  }

  // ===== 装备技能 =====
  if (includeSkills && role.已装备技能 && role.已装备技能.length > 0) {
    parts.push('  <div class="role-skills">');
    parts.push('    <span class="skills-label">装备：</span>');
    const skillNames = role.已装备技能
      .map((id) => {
        const name = skillNameMap[id] ?? id;
        return `<span class="skill-tag">${name}</span>`;
      })
      .join(' ');
    parts.push(`    <span class="skills-list">${skillNames}</span>`);
    parts.push('  </div>');
  }

  // ===== 自定义字段（如果有）=====
  const customEntries = Object.entries(role).filter(([key]) => {
    return (
      !预定义角色字段.has(key) &&
      !key.startsWith('_') &&
      !['属性', '已装备技能'].includes(key) &&
      role[key as keyof typeof role] !== undefined &&
      role[key as keyof typeof role] !== null &&
      role[key as keyof typeof role] !== ''
    );
  });
  if (customEntries.length > 0) {
    parts.push('  <div class="role-custom">');
    for (const [key, value] of customEntries) {
      const valueStr =
        typeof value === 'object' ? JSON.stringify(value) : String(value);
      parts.push(`    <div class="custom-field"><span class="field-key">${key}：</span><span class="field-value">${valueStr}</span></div>`);
    }
    parts.push('  </div>');
  }

  parts.push('</div>');

  return parts.join('\n');
}

// ============================================================================
// 批量格式化工具
// ============================================================================

/**
 * 格式化角色列表为 LLM 可读文本
 */
export function formatRoleListForLlm(
  roles: 角色[],
  options?: {
    title?: string;
    includeCustomFields?: boolean;
    skillNameMap?: Record<string, string>;
  },
): string {
  const { title = '角色列表', ...rest } = options ?? {};

  if (roles.length === 0) {
    return `<${title}>\n（无角色）\n</${title}>`;
  }

  const lines: string[] = [];
  lines.push(`<${title}>`);
  lines.push(`（共 ${roles.length} 名角色）`);
  lines.push('');

  for (let i = 0; i < roles.length; i++) {
    if (i > 0) lines.push('');
    lines.push(formatRoleForLlm(roles[i], rest));
  }

  lines.push(`</${title}>`);

  return lines.join('\n');
}

/**
 * 格式化角色列表为基本信息的文本块
 */
export function formatRoleListBasicInfo(roles: 角色[]): string {
  if (roles.length === 0) return '（无角色）';

  return roles.map((r) => formatRoleBasicInfo(r)).join('\n\n');
}
