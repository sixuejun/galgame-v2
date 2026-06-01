/**
 * 角色系统 AI 生成器
 * 位于 src/galgame/utils/roleGenerator.ts
 *
 * 负责通过第二 API 生成角色档案和技能标签
 * 支持批量生成、去重、错误处理和重试逻辑
 */

import { useVNStore } from '../store';
import type { 技能, 角色 } from '../types/role';
import { 技能Schema, 角色Schema } from '../types/role';
import { nextRoleId, nextSkillId } from './roleIdGenerator';
import { fieldsToRole, parseKeyValuePairs } from './roleParser';
import { isValidDomainKey, 随机分配效果值 } from './skillEffectWhitelist';

// ============================================================================
// 常量定义
// ============================================================================

/** 最大重试次数 */
const MAX_RETRIES = 2;

/** 重试基础延迟（毫秒） */
const RETRY_BASE_DELAY_MS = 1000;

// ============================================================================
// 系统 Prompt
// ============================================================================

/**
 * 角色生成系统 Prompt
 * 指导 AI 生成符合角色系统规范的角色档案和技能标签
 */
const ROLE_GENERATION_SYSTEM_PROMPT = `【角色生成器】

你是末日废土世界的角色设计师，负责生成独特的角色档案和技能标签。

## 角色生成规则

1. **角色姓名**：必须使用简体中文，且不得与已有角色姓名重复
2. **属性系统**：每项属性值为 0~5 的整数
   - 战力：角色的战斗能力
   - 技巧：角色的技术/手艺熟练度
   - 智慧：角色的知识水平/分析能力
   - 社交：角色的人际交往/说服能力
   - 谨慎：角色的风险评估/安全意识
   - 运气：角色的运气/随机事件成功率
3. **背景风格**：废土末世风格，可以是流浪者、拾荒者、避难所居民、佣兵、商人等
4. **字段要求**：姓名、属性必填；外貌、性格、出身、定位、说话风格等为可选

## 技能生成规则

1. **技能数量**：每个角色生成 2~4 个技能
2. **技能格式**：名称 | emoji | 描述 | mod:域.键
3. **mod:域.键 格式**：每个技能必须包含 1 个有效的 mod 效果
4. **允许的 mod 域**：
   - 派遣：trap负面率降低、fortune正面率提高、encounter趋向中性、多抽一张卡、重抽一次、hp损失减免、sanity损失减免、hp回复加成、sanity回复加成、安全撤离保底、金币加成、纪念品数量+1、纪念品稀有度提升、空手而归保护、胜率加成、伤害减免、再战减免、每步回复、初始HP加成、初始Sanity加成
   - 工坊：通用产量加成、通用开局倍速、通用偏好满足加成、通用正向tick权重、通用负向tick权重减免、通用疲劳增长减免、通用加班启动概率、通用加班额外收益系数、订单刷新费用减免、车间氛围上限提升、冶炼生产速度、冶炼产量加成、制药生产速度、制药产量加成、改装生产速度、改装产量加成
   - 猜谜：奖励加成
5. **mod 效果数值**：由系统根据白名单范围自动分配，AI 输出时无需附带具体数值

## 输出格式（严格遵守）

### 角色输出格式
<Character>
CMD:ADD | 姓名：角色姓名 | 外貌：外貌描述 | 性格：性格关键词 | 出身：背景出身 | 定位：定位描述 | 说话风格：语气特点 | 属性：战力:X/技巧:X/智慧:X/社交:X/谨慎:X/运气:X
</Character>

### 技能输出格式
<Skill>
CMD:ADD | 技能名称 | 🔥 | 技能描述 | mod:域.键
</Skill>

## 重要提醒

- 只输出角色档案和技能标签，不要输出其他解释文本
- 确保角色姓名唯一，不与已有角色重复
- 每个技能必须有且仅有一个 mod:域.键 效果
- 属性数值必须严格在 0~5 范围内`;

/**
 * 批量角色生成系统 Prompt
 */
const BULK_ROLE_GENERATION_SYSTEM_PROMPT = `【批量角色生成器】

你是末日废土世界的角色设计师，负责同时生成多个独特的角色档案和技能标签。

## 生成规则

1. **角色数量**：按要求生成指定数量的角色（每个角色独立一个 <Character> 块）
2. **角色姓名**：必须使用简体中文，每个角色姓名唯一，不得重复
3. **属性系统**：每项属性值为 0~5 的整数，总和建议在 8~18 之间
4. **背景风格**：废土末世风格，角色类型多样化（流浪者、拾荒者、避难所居民、佣兵、商人、医生、工匠等）
5. **技能数量**：每个角色生成 2~4 个技能

## 技能 mod:域.键 格式

每个技能必须包含 1 个有效的 mod 效果，可选的有：
- 派遣类：派遣.trap负面率降低、派遣.fortune正面率提高、派遣.胜率加成、派遣.金币加成、派遣.hp损失减免 等
- 工坊类：工坊.通用产量加成、工坊.冶炼产量加成 等
- 猜谜类：猜谜.奖励加成

## 输出格式（严格遵守）

对于每个角色，依次输出：
1. <Character> 块（包含角色信息）
2. 对应的 <Skill> 块（每个技能一个）

示例：
<Character>
CMD:ADD | 姓名：星见 | 外貌：银发蓝瞳 | 性格：冷静、寡言 | 出身：废土流浪者 | 定位：侦察 | 属性：战力:2/技巧:3/智慧:3/社交:1/谨慎:2/运气:1
</Character>

<Skill>
CMD:ADD | 潜行专精 | 🐾 | 降低被敌人发现的概率 | mod:派遣.trap负面率降低
</Skill>

<Skill>
CMD:ADD | 追踪术 | 🔍 | 发现隐藏线索的能力 | mod:派遣.fortune正面率提高
</Skill>

## 重要提醒

- 确保所有角色姓名互不重复
- 每个技能必须有且仅有一个有效的 mod:域.键 效果
- 不要输出其他解释文本`;

// ============================================================================
// Prompt 构建函数
// ============================================================================

/**
 * 构建角色生成系统 Prompt
 */
export function buildRoleGenerationSystemPrompt(): string {
  return ROLE_GENERATION_SYSTEM_PROMPT;
}

/**
 * 构建批量角色生成系统 Prompt
 */
export function buildBulkRoleGenerationSystemPrompt(): string {
  return BULK_ROLE_GENERATION_SYSTEM_PROMPT;
}

/**
 * 构建角色生成用户 Prompt
 *
 * @param params.scene 场景描述
 * @param params.existingRoles 已有角色列表（用于去重）
 * @param params.existingSkills 已有技能列表（用于去重）
 * @param params.count 要生成的角色数量
 */
export function buildRoleGenerationUserPrompt(
  params: {
    scene?: string;
    existingRoles?: string;
    existingSkills?: string;
    count?: number;
  } = {},
): string {
  const { scene, existingRoles, existingSkills, count = 1 } = params;

  let prompt = '';

  // 场景描述
  if (scene) {
    prompt += `【当前场景】\n${scene}\n\n`;
  }

  // 已有角色（用于去重）
  if (existingRoles) {
    prompt += `【已有角色】（姓名不得重复）\n${existingRoles}\n\n`;
  }

  // 已有技能（用于参考）
  if (existingSkills) {
    prompt += `【已有技能】（技能风格可参考）\n${existingSkills}\n\n`;
  }

  // 生成要求
  prompt += `【生成要求】\n请生成 ${count} 个独特的角色，每个角色配备 2~4 个技能。\n`;

  // 格式要求
  prompt += `\n【格式要求】\n每个角色输出一个 <Character> 块和对应的 <Skill> 块。`;

  return prompt;
}

/**
 * 构建批量生成用户 Prompt
 *
 * @param params.count 要生成的角色数量
 * @param params.scene 场景描述
 * @param params.existingRoleNames 已有角色姓名列表（用于去重）
 */
export function buildBulkGenerationUserPrompt(
  params: {
    count: number;
    scene?: string;
    existingRoleNames?: string[];
  } = { count: 1 },
): string {
  const { count, scene, existingRoleNames } = params;

  let prompt = '';

  // 场景描述
  if (scene) {
    prompt += `【当前场景】\n${scene}\n\n`;
  }

  // 已有角色姓名
  if (existingRoleNames && existingRoleNames.length > 0) {
    prompt += `【已有角色姓名】（必须避免重复）\n${existingRoleNames.join('、')}\n\n`;
  }

  // 生成要求
  prompt += `【生成要求】\n请生成 ${count} 个独特的角色，每个角色配备 2~4 个技能。\n`;
  prompt += `确保所有角色姓名互不重复。\n`;

  return prompt;
}

// ============================================================================
// LLM 输出解析
// ============================================================================

/**
 * 解析单个角色的 Character 块
 * @param blockContent Character 块内容
 * @returns 解析后的字段记录
 */
function parseCharacterBlockContent(blockContent: string): Record<string, string> | null {
  // 匹配 CMD:ADD
  const addMatch = blockContent.match(/CMD:ADD\s*[|｜]\s*([\s\S]*?)(?=\s*CMD:|$)/i);
  if (!addMatch) return null;

  const cmdPart = addMatch[1].trim();
  return parseKeyValuePairs(cmdPart);
}

/**
 * 解析单个技能的 Skill 块
 * @param blockContent Skill 块内容
 * @returns 解析后的技能数据
 */
function parseSkillBlockContent(blockContent: string): {
  名称: string;
  emoji: string;
  描述: string;
  modEntries: Array<{ 域: string; 键: string }>;
} | null {
  // 匹配 CMD:ADD | 名称 | emoji | 描述 | mod:域.键
  const match = blockContent.match(
    /CMD:ADD\s*[|｜]\s*([^\|｜]+?)\s*[|｜]\s*([^\|｜]+?)\s*[|｜]\s*([^\|｜]+?)(?:\s*[|｜]\s*(.+))?/i,
  );

  if (!match) return null;

  const 名称 = match[1].trim();
  const emoji = match[2].trim();
  const 描述 = match[3].trim();
  const modStr = match[4]?.trim() || '';

  // 解析 mod: 效果
  const modEntries: Array<{ 域: string; 键: string }> = [];
  const modMatches = modStr.matchAll(/mod:\s*([^，,\s]+)\.([^，,\s]+)/gi);

  for (const m of modMatches) {
    const 域 = m[1];
    const 键 = m[2];
    // 只添加白名单中存在的
    if (isValidDomainKey(域, 键)) {
      modEntries.push({ 域, 键 });
    }
  }

  return { 名称, emoji, 描述, modEntries };
}

/**
 * 解析 LLM 生成的角色和技能
 *
 * @param llmOutput LLM 输出文本
 * @returns 解析后的角色字段数组和技能数据数组
 */
export function parseGeneratedRoles(llmOutput: string): {
  rawRoleFields: Record<string, string>[];
  rawSkills: Array<{ 名称: string; emoji: string; 描述: string; modEntries: Array<{ 域: string; 键: string }> }>;
} {
  const rawRoleFields: Record<string, string>[] = [];
  const rawSkills: Array<{ 名称: string; emoji: string; 描述: string; modEntries: Array<{ 域: string; 键: string }> }> =
    [];

  // 解析 Character 块
  const charMatches = llmOutput.matchAll(/<Character>\s*([\s\S]*?)\s*<\/Character>/gi);
  for (const match of charMatches) {
    const blockContent = match[1];
    const fields = parseCharacterBlockContent(blockContent);
    if (fields && fields['姓名']) {
      rawRoleFields.push(fields);
    }
  }

  // 解析 Skill 块
  const skillMatches = llmOutput.matchAll(/<Skill>\s*([\s\S]*?)\s*<\/Skill>/gi);
  for (const match of skillMatches) {
    const blockContent = match[1];
    const skillData = parseSkillBlockContent(blockContent);
    if (skillData) {
      rawSkills.push(skillData);
    }
  }

  return { rawRoleFields, rawSkills };
}

/**
 * 将原始技能数据转换为技能对象
 * @param rawSkill 原始技能数据
 * @param skillId 技能 ID
 */
function buildSkillFromRaw(
  rawSkill: { 名称: string; emoji: string; 描述: string; modEntries: Array<{ 域: string; 键: string }> },
  skillId: string,
): 技能 | null {
  const 效果 = rawSkill.modEntries.map(mod => {
    const 值 = 随机分配效果值(mod.域, mod.键);
    return {
      域: mod.域,
      键: mod.键,
      值: 值 ?? 0,
    };
  });

  const rawSkillObj = {
    id: skillId,
    名称: rawSkill.名称,
    emoji: rawSkill.emoji || '',
    描述: rawSkill.描述 || '',
    效果,
  };

  const result = 技能Schema.safeParse(rawSkillObj);
  if (!result.success) {
    console.warn('[roleGenerator] 技能验证失败', result.error.issues);
    return null;
  }

  return result.data;
}

// ============================================================================
// 错误类
// ============================================================================

/**
 * 角色生成错误
 */
export class RoleGenerationError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, code: string = 'GENERATION_ERROR', details?: unknown) {
    super(message);
    this.name = 'RoleGenerationError';
    this.code = code;
    this.details = details;
  }
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 提取角色姓名列表
 * @param roles 角色数组
 */
function extractRoleNames(roles: 角色[]): string[] {
  return roles.map(r => r.姓名);
}

/**
 * 提取技能名称列表
 * @param skills 技能数组
 */
function extractSkillNames(skills: 技能[]): string[] {
  return skills.map(s => s.名称);
}

/**
 * 检查姓名是否重复（不区分大小写）
 */
function hasDuplicateName(name: string, existingNames: string[]): boolean {
  const lowerName = name.toLowerCase();
  return existingNames.some(existing => existing.toLowerCase() === lowerName);
}

/**
 * 从 LLM 输出中提取角色姓名列表
 */
function extractNamesFromOutput(llmOutput: string): string[] {
  const names: string[] = [];
  const charMatches = llmOutput.matchAll(/<Character>[\s\S]*?CMD:ADD[\s\S]*?姓名[：:]\s*([^\|｜<\n]+)/gi);

  for (const match of charMatches) {
    const name = match[1].trim();
    if (name) {
      names.push(name);
    }
  }

  return names;
}

/**
 * 等待指定时间
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// 核心生成函数
// ============================================================================

/**
 * 生成单个角色及其技能
 *
 * @param params.scene 场景描述
 * @param params.existingRoles 已有角色列表（用于去重）
 * @param params.existingSkills 已有技能列表（用于去重）
 * @returns 生成的角色和技能数组
 */
export async function generateRoles(
  params: {
    scene?: string;
    existingRoles?: 角色[];
    existingSkills?: 技能[];
  } = {},
): Promise<{ roles: 角色[]; skills: 技能[] }> {
  const { scene, existingRoles = [], existingSkills = [] } = params;

  // 构建已有角色信息
  const existingRoleNames = extractRoleNames(existingRoles);
  const existingSkillNames = extractSkillNames(existingSkills);

  // 构建已有角色/技能描述（用于 LLM 参考）
  const existingRolesText =
    existingRoles.length > 0 ? existingRoles.map(r => `${r.姓名}（${r.定位 || '未定位'}）`).join('\n') : undefined;

  const existingSkillsText =
    existingSkills.length > 0 ? existingSkills.map(s => `${s.名称}：${s.描述}`).join('\n') : undefined;

  // 构建提示词
  const systemPrompt = buildRoleGenerationSystemPrompt();
  const userPrompt = buildRoleGenerationUserPrompt({
    scene,
    existingRoles: existingRolesText,
    existingSkills: existingSkillsText,
    count: 1,
  });

  // 调用 LLM 并重试
  let lastError: Error | null = null;

  for (let retry = 0; retry <= MAX_RETRIES; retry++) {
    try {
      const store = useVNStore();

      // 调用第二 API
      const result = await store.callSecondApi('roleProfile', {
        ordered_prompts: [
          { role: 'system', content: 'world_info' },
          { role: 'system', content: 'char_persona' },
          { role: 'system', content: 'chat_history' },
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const llmOutput = result as string;

      if (!llmOutput || typeof llmOutput !== 'string') {
        throw new RoleGenerationError('LLM 返回为空或格式错误', 'EMPTY_RESPONSE');
      }

      // 解析输出
      const { rawRoleFields, rawSkills } = parseGeneratedRoles(llmOutput);

      if (rawRoleFields.length === 0) {
        throw new RoleGenerationError('未能从 LLM 输出中解析出角色', 'PARSE_ERROR', { llmOutput });
      }

      // 处理角色数据
      const validatedRoles: 角色[] = [];
      const validatedSkills: 技能[] = [];

      for (const fields of rawRoleFields) {
        // 验证姓名唯一性
        if (hasDuplicateName(fields['姓名'] || '', [...existingRoleNames, ...extractNamesFromOutput(llmOutput)])) {
          console.warn(`[roleGenerator] 跳过重复角色：${fields['姓名']}`);
          continue;
        }

        // 使用 roleParser 的 fieldsToRole
        const role = fieldsToRole(fields);
        if (!role) {
          console.warn(`[roleGenerator] 角色验证失败：${fields['姓名']}`);
          continue;
        }

        // 分配 ID
        const roleId = nextRoleId();
        const roleWithId = { ...role, id: roleId };

        // 验证角色
        const validated = 角色Schema.safeParse(roleWithId);
        if (!validated.success) {
          console.warn('[roleGenerator] 角色 Schema 验证失败', validated.error.issues);
          continue;
        }

        validatedRoles.push(validated.data);

        // 为该角色分配技能（从 rawSkills 中分配 2~4 个）
        const skillsPerRole = Math.floor(Math.random() * 3) + 2; // 2~4
        const roleSkills = rawSkills.splice(0, skillsPerRole);

        for (const rawSkill of roleSkills) {
          // 验证技能唯一性
          if (hasDuplicateName(rawSkill.名称, [...existingSkillNames, ...extractSkillNames(validatedSkills)])) {
            continue;
          }

          const skillId = nextSkillId();
          const skill = buildSkillFromRaw(rawSkill, skillId);

          if (skill) {
            validatedSkills.push(skill);
          }
        }
      }

      if (validatedRoles.length === 0) {
        throw new RoleGenerationError('未能生成任何有效角色', 'NO_VALID_ROLES');
      }

      return { roles: validatedRoles, skills: validatedSkills };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      console.warn(`[roleGenerator] 生成尝试 ${retry + 1} 失败：`, lastError.message);

      if (retry < MAX_RETRIES) {
        const backoffDelay = RETRY_BASE_DELAY_MS * Math.pow(2, retry);
        console.info(`[roleGenerator] 等待 ${backoffDelay}ms 后重试...`);
        await delay(backoffDelay);
      }
    }
  }

  throw new RoleGenerationError(`角色生成失败：${lastError?.message || '未知错误'}`, 'GENERATION_FAILED', {
    lastError,
  });
}

/**
 * 批量生成多个角色
 *
 * @param params.count 要生成的角色数量
 * @param params.scene 场景描述
 * @returns 生成的角色数组
 */
export async function generateMultipleRoles(
  params: {
    count: number;
    scene?: string;
  } = { count: 1 },
): Promise<角色[]> {
  const { count, scene } = params;

  if (count <= 0) {
    return [];
  }

  // 构建提示词
  const systemPrompt = buildBulkRoleGenerationSystemPrompt();
  const userPrompt = buildBulkGenerationUserPrompt({
    count,
    scene,
    existingRoleNames: [],
  });

  let lastError: Error | null = null;

  for (let retry = 0; retry <= MAX_RETRIES; retry++) {
    try {
      const store = useVNStore();

      // 调用第二 API
      const result = await store.callSecondApi('roleProfile', {
        ordered_prompts: [
          { role: 'system', content: 'world_info' },
          { role: 'system', content: 'char_persona' },
          { role: 'system', content: 'chat_history' },
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const llmOutput = result as string;

      if (!llmOutput || typeof llmOutput !== 'string') {
        throw new RoleGenerationError('LLM 返回为空或格式错误', 'EMPTY_RESPONSE');
      }

      // 解析输出
      const { rawRoleFields } = parseGeneratedRoles(llmOutput);

      if (rawRoleFields.length === 0) {
        throw new RoleGenerationError('未能从 LLM 输出中解析出角色', 'PARSE_ERROR', { llmOutput });
      }

      // 提取已生成的姓名（用于去重）
      const generatedNames: string[] = [];
      const validatedRoles: 角色[] = [];

      for (const fields of rawRoleFields) {
        const name = fields['姓名'] || '';

        // 检查去重
        if (hasDuplicateName(name, generatedNames)) {
          console.warn(`[roleGenerator] 跳过重复角色：${name}`);
          continue;
        }

        // 使用 fieldsToRole
        const role = fieldsToRole(fields);
        if (!role) {
          console.warn(`[roleGenerator] 角色验证失败：${name}`);
          continue;
        }

        // 分配 ID
        const roleId = nextRoleId();
        const roleWithId = { ...role, id: roleId };

        // 验证角色
        const validated = 角色Schema.safeParse(roleWithId);
        if (!validated.success) {
          console.warn('[roleGenerator] 角色 Schema 验证失败', validated.error.issues);
          continue;
        }

        generatedNames.push(name);
        validatedRoles.push(validated.data);
      }

      if (validatedRoles.length === 0) {
        throw new RoleGenerationError('未能生成任何有效角色', 'NO_VALID_ROLES');
      }

      return validatedRoles;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      console.warn(`[roleGenerator] 批量生成尝试 ${retry + 1} 失败：`, lastError.message);

      if (retry < MAX_RETRIES) {
        const backoffDelay = RETRY_BASE_DELAY_MS * Math.pow(2, retry);
        console.info(`[roleGenerator] 等待 ${backoffDelay}ms 后重试...`);
        await delay(backoffDelay);
      }
    }
  }

  throw new RoleGenerationError(`批量角色生成失败：${lastError?.message || '未知错误'}`, 'BULK_GENERATION_FAILED', {
    lastError,
  });
}

/**
 * 生成角色（带技能分配）
 *
 * 与 generateMultipleRoles 不同，此函数会为每个角色分配独立的技能组
 *
 * @param params.count 要生成的角色数量
 * @param params.scene 场景描述
 * @param params.existingRoles 已有角色（用于去重）
 * @param params.existingSkills 已有技能（用于去重）
 * @returns 生成的角色和技能
 */
export async function generateRolesWithSkills(
  params: {
    count: number;
    scene?: string;
    existingRoles?: 角色[];
    existingSkills?: 技能[];
  } = { count: 1 },
): Promise<{ roles: 角色[]; skills: 技能[] }> {
  const { count, scene, existingRoles = [], existingSkills = [] } = params;

  if (count <= 0) {
    return { roles: [], skills: [] };
  }

  // 收集已有姓名
  const allRoleNames = [
    ...extractRoleNames(existingRoles),
    ...extractRoleNames([]), // 后续添加
  ];
  const allSkillNames = [...extractSkillNames(existingSkills)];

  const validatedRoles: 角色[] = [];
  const validatedSkills: 技能[] = [];
  const generatedNames: string[] = [];

  // 逐个生成角色（每个角色独立生成技能）
  for (let i = 0; i < count; i++) {
    try {
      // 构建提示词
      const systemPrompt = buildRoleGenerationSystemPrompt();
      const userPrompt = buildRoleGenerationUserPrompt({
        scene,
        existingRoles: generatedNames.length > 0 ? generatedNames.join('、') : undefined,
        existingSkills: allSkillNames.length > 0 ? allSkillNames.join('、') : undefined,
        count: 1,
      });

      const store = useVNStore();

      const result = await store.callSecondApi('roleProfile', {
        ordered_prompts: [
          { role: 'system', content: 'world_info' },
          { role: 'system', content: 'char_persona' },
          { role: 'system', content: 'chat_history' },
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const llmOutput = result as string;

      if (!llmOutput || typeof llmOutput !== 'string') {
        console.warn(`[roleGenerator] 第 ${i + 1} 个角色生成失败：LLM 返回为空`);
        continue;
      }

      // 解析输出
      const { rawRoleFields, rawSkills } = parseGeneratedRoles(llmOutput);

      if (rawRoleFields.length === 0) {
        console.warn(`[roleGenerator] 第 ${i + 1} 个角色解析失败`);
        continue;
      }

      // 处理角色
      const fields = rawRoleFields[0];
      const name = fields['姓名'] || '';

      if (hasDuplicateName(name, [...allRoleNames, ...generatedNames])) {
        console.warn(`[roleGenerator] 跳过重复角色：${name}`);
        continue;
      }

      const role = fieldsToRole(fields);
      if (!role) {
        console.warn(`[roleGenerator] 第 ${i + 1} 个角色验证失败`);
        continue;
      }

      const roleId = nextRoleId();
      const roleWithId = { ...role, id: roleId };

      const validated = 角色Schema.safeParse(roleWithId);
      if (!validated.success) {
        console.warn('[roleGenerator] 角色 Schema 验证失败', validated.error.issues);
        continue;
      }

      generatedNames.push(name);
      validatedRoles.push(validated.data);

      // 为该角色分配技能
      const skillsPerRole = Math.floor(Math.random() * 3) + 2; // 2~4
      for (let j = 0; j < Math.min(skillsPerRole, rawSkills.length); j++) {
        const rawSkill = rawSkills[j];

        if (hasDuplicateName(rawSkill.名称, [...allSkillNames, ...extractSkillNames(validatedSkills)])) {
          continue;
        }

        const skillId = nextSkillId();
        const skill = buildSkillFromRaw(rawSkill, skillId);

        if (skill) {
          allSkillNames.push(skill.名称);
          validatedSkills.push(skill);
        }
      }
    } catch (error) {
      console.warn(`[roleGenerator] 第 ${i + 1} 个角色生成异常：`, error);
      // 继续生成下一个角色
    }
  }

  return { roles: validatedRoles, skills: validatedSkills };
}

// ============================================================================
// 便捷函数
// ============================================================================

/**
 * 生成单个角色（简化接口）
 *
 * @param scene 场景描述
 * @returns 生成的角色或 null
 */
export async function generateSingleRole(scene?: string): Promise<角色 | null> {
  try {
    const { roles } = await generateRoles({ scene });
    return roles[0] || null;
  } catch (error) {
    console.error('[roleGenerator] 生成单个角色失败', error);
    return null;
  }
}

/**
 * 检查第二 API 是否可用
 */
export function isGenerationAvailable(): boolean {
  try {
    const store = useVNStore();
    return store.secondApiStatus !== 'disabled';
  } catch {
    return false;
  }
}
