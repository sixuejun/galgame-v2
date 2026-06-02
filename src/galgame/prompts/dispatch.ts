/**
 * 任务：dispatchStory（派遣结算叙事）
 * 调用链：generateDispatchStory() → generate({ user_input })
 * 调用方：store.ts
 * 状态：✅ 已实现
 */

export function buildDispatchPrompt(
  派遣角色列表: string,
  派遣结果: { 区域: string; 遭遇类型: string; 奖励: string },
  技能效果汇总?: string,
): string {
  return `【派遣角色信息】
${派遣角色列表}

【派遣结果】
- 探索区域：${派遣结果.区域}
- 遭遇类型：${派遣结果.遭遇类型}
- 基础奖励：${派遣结果.奖励}

【技能效果汇总】
${技能效果汇总 || '（无装备技能）'}

请生成符合废土世界观的事件结果，描述派遣角色的行动和遭遇。`;
}
