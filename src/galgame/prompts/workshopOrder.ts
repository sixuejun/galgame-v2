/**
 * 任务：workshopOrder（工坊订单生成）
 * 调用链：generateWorkshopOrder() → callSecondApi({ task: 'workshopOrder', userPrompt })
 * 调用方：store.ts
 * 状态：✅ 已实现
 */

export const PROMPT_WORKSHOP_ORDERS = `[System] 你是废土世界工坊的订单发布官。根据以下剧情上下文，为工坊生成一批可接取的订单。

指令：
1. 必须使用简体中文输出
2. 生成 6~10 条订单
3. 每条订单的字段用英文竖线 "|" 分隔
4. 订单标题要有废土风格，不要有现代感
5. 不要输出其它解释文本

输出格式（严格）：
<workshop_orders_v1>
工种|标题|说明|标签
...
</workshop_orders_v1>

字段说明：
- 工种：必须是以下三者之一——冶炼 / 制药 / 改装
- 标题：简洁有力的订单名称，少于 15 字
- 说明：订单背景描述，少于 30 字
- 标签：用逗号分隔的风险或类型标签，可空；如：危险、高压、精密、紧急 等

约束：
- 字段内部禁止出现 "|"
- 仅输出 <workshop_orders_v1> 块，不要有任何额外内容`;

/**
 * 构建工坊订单的用户上下文 prompt
 */
export function buildWorkshopOrdersUserPrompt(
  worldInfo?: string,
  workshopLevel: number = 1,
  availableRoles: number = 1,
  existingSkills?: string,
): string {
  let prompt = `【当前剧情背景】
${worldInfo || '（无特殊背景）'}

【工坊信息】
- 工坊等级：${workshopLevel} 级
- 已有角色：${availableRoles} 名`;
  if (existingSkills) {
    prompt += `\n- 已有技能：${existingSkills}`;
  }
  return prompt;
}
