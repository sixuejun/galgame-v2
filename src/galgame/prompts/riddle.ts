/**
 * 任务：riddle（猜谜游戏）
 * 调用链：requestRiddleAiReply() → callSecondApi({ task: 'riddle', ... })
 * 调用方：store.ts
 * 状态：✅ 已实现
 */

/**
 * 谜题游戏的 system 指令模板。
 * 模板变量由 buildRiddlePrompt() 在调用时替换：
 * - {{personalityPrompt}} → NPC 的 systemPrompt（人格）
 * - {{chatLogText}}       → 历史对话记录
 * - {{latestHint}}        → 玩家最新输入的提示
 *
 * 实际发送给 AI 时：
 *   system: buildRiddlePrompt(...) 的返回值（包含人格+规则+历史+本次提示）
 *   user:   "请回复你的猜测。"
 */
export const RIDDLE_GAME_PROMPT_TEMPLATE = `{{personalityPrompt}}

————
你正在和用户玩猜谜游戏。

规则：
- 用户会给你提示
- 你需要根据提示猜测一个词（谜底）
- 你只能回复你的猜测或请求更多提示
- 不要重复用户的提示
- 若你猜中了谜底，在回复中自然地说出答案即可

示例对话：
用户：这是一种水果
AI：是苹果吗？
用户：不对，它是黄色的
AI：是香蕉！

————
这是之前的对话记录：
{{chatLogText}}
————
这是这次的提示
{{latestHint}}
你觉得这个可能是什么？`;

export function buildRiddlePrompt(personalityPrompt: string, chatLogText: string, latestHint: string): string {
  return RIDDLE_GAME_PROMPT_TEMPLATE.replace('{{personalityPrompt}}', personalityPrompt)
    .replace('{{chatLogText}}', chatLogText)
    .replace('{{latestHint}}', latestHint);
}
