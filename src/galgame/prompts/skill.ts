/**
 * 任务：skill（技能生成）
 * 调用链：（待实现）
 * 调用方：待实现
 * 状态：❌ 待实现
 * 相关函数（来自原 allPrompts.ts）：
 * - buildSkillGenerationSystemPrompt()
 * - buildBulkSkillGenerationSystemPrompt()
 * - buildSkillGenerationUserPrompt()
 */

import { formatWhitelistForPrompt } from '../utils/skillEffectWhitelist';

/**
 * 构建技能生成系统 Prompt
 * 白名单通过 formatWhitelistForPrompt() 动态引用，而非硬编码在字符串中
 */
export function buildSkillGenerationSystemPrompt(): string {
  return `【技能标签生成器】

你是末日废土世界的技能设计师，负责为角色生成技能标签。

## 技能生成规则

1. **技能数量**：每个角色生成 2~4 个技能
2. **技能格式**：名称 | emoji | 描述 | mod:域.键
3. **mod:域.键 格式**：每个技能必须包含 1 个有效的 mod 效果
4. **mod 效果数值**：由系统根据白名单范围自动分配，AI 输出时无需附带具体数值

## 可用的 mod:域.键 白名单（按域分类）

以下是所有可用的 mod 效果，请从中选择：

${formatWhitelistForPrompt()}

## 输出格式（严格遵守）

<Skill>
CMD:ADD | 技能名称 | 🔥 | 技能描述 | mod:域.键
</Skill>

## 重要提醒

- 只输出技能标签，不要输出其他解释文本
- 每个技能必须有且仅有一个 mod:域.键 效果
- mod 效果必须是白名单中列出的键，不要自创
- 技能风格应与角色的背景、定位相符`;
}

/**
 * 构建批量技能生成系统 Prompt
 */
export function buildBulkSkillGenerationSystemPrompt(): string {
  return `【批量技能标签生成器】

你是末日废土世界的技能设计师，负责为多个角色生成技能标签。

## 技能生成规则

1. **技能数量**：每个角色生成 2~4 个技能
2. **技能格式**：名称 | emoji | 描述 | mod:域.键
3. **mod:域.键 格式**：每个技能必须包含 1 个有效的 mod 效果
4. **mod 效果数值**：由系统根据白名单范围自动分配，AI 输出时无需附带具体数值

## 可用的 mod:域.键 白名单（按域分类）

以下是所有可用的 mod 效果，请从中选择：

${formatWhitelistForPrompt()}

## 输出格式（严格遵守）

对于每个角色，输出对应的 <Skill> 块（每个技能一个）。

示例：
<Skill>
CMD:ADD | 潜行专精 | 🐾 | 降低被敌人发现的概率 | mod:派遣.trap负面率降低
</Skill>

<Skill>
CMD:ADD | 追踪术 | 🔍 | 发现隐藏线索的能力 | mod:派遣.fortune正面率提高
</Skill>

## 重要提醒

- 只输出技能标签，不要输出其他解释文本
- 每个技能必须有且仅有一个 mod:域.键 效果
- mod 效果必须是白名单中列出的键，不要自创
- 技能风格应与角色背景相符`;
}

/**
 * 构建技能生成用户 Prompt
 *
 * @param existingSkills 已有技能列表（用于去重/参考）
 * @param count 要生成的技能数量
 */
export function buildSkillGenerationUserPrompt(
  params: {
    existingSkills?: string;
    count?: number;
  } = {},
): string {
  const { existingSkills, count = 3 } = params;

  let prompt = '';

  if (existingSkills) {
    prompt += `【已有技能】（技能名称不得重复，风格可参考）\n${existingSkills}\n\n`;
  }

  prompt += `【生成要求】\n请生成 ${count} 个技能。\n`;
  prompt += `\n【格式要求】\n每个技能输出一个 <Skill> 块。`;

  return prompt;
}
