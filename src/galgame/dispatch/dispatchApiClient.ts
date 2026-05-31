/**
 * Dispatch System API Client
 *
 * API client for calling the Second API to generate dispatch events,
 * settlements, and map parameters for the 废土行路 system.
 */

import { callSecondApi, getSecondApiConfig, type SecondApiResponse } from '../utils/api/secondApiClient';
import { useVNStore } from '../store';
import type {
  派遣事件响应,
  派遣事件生成请求,
  派遣结算响应,
  派遣结算生成请求,
  地图参数响应,
} from './types';

/**
 * Dispatch event generation system prompt
 */
const DISPATCH_SYSTEM_PROMPT = `你是一个专业的文字冒险游戏事件生成器。
根据提供的角色信息和当前情境，生成合理的游戏事件描述。

规则：
- 事件应该有戏剧性和连贯性
- 根据角色属性(战力/技巧/智慧/社交/谨慎/运气)影响事件结果
- 战斗事件的结果应与战力相关
- 陷阱事件应与谨慎相关
- 社交事件应与社交属性相关
- 所有数值影响应在合理范围内(-20~+20)
- 返回JSON格式的结果

返回格式：
{
  "事件类型": "遭遇|战斗|陷阱|财富|插曲",
  "事件描述": "详细的事件叙述...",
  "节点变化": 1或-1,
  "影响": {
    "hp变化": 数字,
    "金币变化": 数字,
    "理智变化": 数字,
    "获得物品": "物品名或null",
    "特殊效果": "描述或null"
  },
  "小故事片段": "一小段叙述..."
}`;

/**
 * Dispatch settlement generation system prompt
 */
const SETTLEMENT_SYSTEM_PROMPT = `你是一个专业的文字冒险游戏结算生成器。
根据派遣过程的记录，生成完整的结算报告。

规则：
- 大成功(经历>10步且hp>50%)额外奖励金币+30~+50
- 失败(hp<=0)基础金币减半
- 失踪(理智<=0)基础金币-80%
- 撤退有基本收益但无额外奖励
- 小故事应该连贯有趣，体现角色特点
- 返回JSON格式

返回格式：
{
  "总金币": 数字,
  "战斗加成": 数字,
  "小故事": "完整的结算叙述...",
  "大成功加成": "大成功时额外描述..."
}`;

/**
 * Dispatch map generation system prompt
 */
const MAP_SYSTEM_PROMPT = `你是一个专业的文字冒险游戏地图生成器。
根据路线和目的地信息，生成地图参数。

规则：
- 步数应该在8-15步之间
- 事件分布描述应该简洁明了
- 返回JSON格式

返回格式：
{
  "步数": 数字,
  "事件分布": "如:陷阱3,财富2,遭遇5"
}`;

/**
 * Format characters information for dispatch AI prompts
 */
function formatCharactersForDispatch(): string {
  const store = useVNStore();
  const roles = store.getAllRoles();
  const skills = store.getAllSkills();

  return roles
    .filter(r => r.状态 === '派遣中')
    .map(r => {
      const equipped = r.已装备技能
        .map(sid => {
          const skill = skills.find(s => s.id === sid);
          return skill?.名称 || sid;
        })
        .join(', ');
      const attrs = Object.entries(r.属性)
        .map(([k, v]) => `${k}:${v}`)
        .join('/');
      return `【${r.姓名}】职业:${r.职业 || '未知'} 性格:${r.性格 || '未知'} 装备:${equipped || '无'} 属性(${attrs})`;
    })
    .join('\n');
}

/**
 * Build user prompt for dispatch event generation
 */
function buildEventPrompt(ctx: 派遣事件生成请求, characterInfo: string): string {
  return `【当前情境】
- 当前位置：第 ${ctx.当前节点} 节点
- 目标节点：第 ${ctx.目标节点} 节点
- 目的地：${ctx.目的地}
${ctx.事件类型 ? `- 事件类型：${ctx.事件类型}` : ''}

【派遣角色信息】
${characterInfo}

请根据以上信息生成一个合理的派遣事件。`;
}

/**
 * Build user prompt for dispatch settlement generation
 */
function buildSettlementPrompt(ctx: 派遣结算生成请求, characterInfo: string): string {
  const 事件列表 = ctx.事件历史
    .map((e, i) => `${i + 1}. [${e.节点}] ${e.事件类型} - ${e.描述}`)
    .join('\n');

  const hp百分比 = Math.round((ctx.最终HP / ctx.最大HP) * 100);
  const sanity百分比 = Math.round((ctx.最终理智 / ctx.最大理智) * 100);

  return `【派遣信息】
- 目的地：${ctx.目的地}
- 最终HP：${ctx.最终HP}/${ctx.最大HP} (${hp百分比}%)
- 最终理智：${ctx.最终理智}/${ctx.最大理智} (${sanity百分比}%)
- 结算状态：${ctx.结算状态}
- 战斗次数：${ctx.战斗次数}
- 基础金币：${ctx.基础金币}

【事件历史】
${事件列表 || '（无事件）'}

【派遣角色信息】
${characterInfo}

请根据以上信息生成完整的结算报告。`;
}

/**
 * Build user prompt for map generation
 */
function buildMapPrompt(route: string, destination: string): string {
  return `【路线信息】
- 路线名称：${route}
- 目的地：${destination}

请根据路线特点生成合适的地图参数。`;
}

/**
 * Parse JSON response safely
 */
function parseJsonResponse<T>(content: string, context: string): T | null {
  try {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();

    return JSON.parse(jsonStr) as T;
  } catch (error) {
    console.warn(`[DispatchApi] Failed to parse ${context} JSON:`, error);
    return null;
  }
}

/**
 * Generate dispatch event via Second API
 *
 * @param ctx - Event generation context
 * @returns Generated event or null on error
 */
export async function generateDispatchEvent(
  ctx: 派遣事件生成请求,
): Promise<派遣事件响应 | null> {
  try {
    const characterInfo = ctx.角色信息 || formatCharactersForDispatch();
    const userPrompt = buildEventPrompt(ctx, characterInfo);

    const response: SecondApiResponse = await callSecondApi('dispatchStory', DISPATCH_SYSTEM_PROMPT, userPrompt);

    if (!response.success || !response.content) {
      console.warn('[DispatchApi] Failed to generate dispatch event:', response.error);
      return null;
    }

    const parsed = parseJsonResponse<派遣事件响应>(response.content, 'dispatch event');
    return parsed;
  } catch (error) {
    console.warn('[DispatchApi] Error generating dispatch event:', error);
    return null;
  }
}

/**
 * Generate dispatch settlement via Second API
 *
 * @param ctx - Settlement generation context
 * @returns Generated settlement or null on error
 */
export async function generateDispatchSettlement(
  ctx: 派遣结算生成请求,
): Promise<派遣结算响应 | null> {
  try {
    const characterInfo = ctx.角色信息 || formatCharactersForDispatch();
    const userPrompt = buildSettlementPrompt(ctx, characterInfo);

    const response: SecondApiResponse = await callSecondApi('dispatchStory', SETTLEMENT_SYSTEM_PROMPT, userPrompt);

    if (!response.success || !response.content) {
      console.warn('[DispatchApi] Failed to generate dispatch settlement:', response.error);
      return null;
    }

    const parsed = parseJsonResponse<派遣结算响应>(response.content, 'dispatch settlement');
    return parsed;
  } catch (error) {
    console.warn('[DispatchApi] Error generating dispatch settlement:', error);
    return null;
  }
}

/**
 * Generate dispatch map parameters via Second API
 *
 * @param route - Route name
 * @param destination - Destination name
 * @returns Generated map parameters or null on error
 */
export async function generateDispatchMap(
  route: string,
  destination: string,
): Promise<地图参数响应 | null> {
  try {
    const userPrompt = buildMapPrompt(route, destination);

    const response: SecondApiResponse = await callSecondApi('dispatchStory', MAP_SYSTEM_PROMPT, userPrompt);

    if (!response.success || !response.content) {
      console.warn('[DispatchApi] Failed to generate dispatch map:', response.error);
      return null;
    }

    const parsed = parseJsonResponse<地图参数响应>(response.content, 'dispatch map');
    return parsed;
  } catch (error) {
    console.warn('[DispatchApi] Error generating dispatch map:', error);
    return null;
  }
}

/**
 * Check if dispatch API is available
 *
 * @returns True if Second API is configured
 */
export function isDispatchApiAvailable(): boolean {
  return getSecondApiConfig() !== null;
}
