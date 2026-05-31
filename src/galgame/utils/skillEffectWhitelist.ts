/**
 * 技能效果 mod:域.键 白名单校验与随机分配系统
 *
 * 依据: docs/技能mod白名单.md
 * 配合: docs/玩法总计划.md Phase 0
 */

export type WhitelistValueType = 'percent' | 'integer' | 'boolean';

export interface WhitelistEntry {
  域: string;
  键: string;
  类型: WhitelistValueType;
  最小值: number;
  最大值: number;
}

/** 派遣域白名单 (A~E) */
const DISPATCH_WHITELIST: WhitelistEntry[] = [
  // A. 抽卡层
  { 域: '派遣', 键: 'trap负面率降低', 类型: 'percent', 最小值: 5, 最大值: 25 },
  { 域: '派遣', 键: 'fortune正面率提高', 类型: 'percent', 最小值: 5, 最大值: 25 },
  { 域: '派遣', 键: 'encounter趋向中性', 类型: 'percent', 最小值: 5, 最大值: 25 },
  { 域: '派遣', 键: '多抽一张卡', 类型: 'boolean', 最小值: 0, 最大值: 1 },
  { 域: '派遣', 键: '重抽一次', 类型: 'percent', 最小值: 5, 最大值: 25 },
  // B. 过程结算层
  { 域: '派遣', 键: 'hp损失减免', 类型: 'percent', 最小值: 5, 最大值: 20 },
  { 域: '派遣', 键: 'sanity损失减免', 类型: 'percent', 最小值: 5, 最大值: 20 },
  { 域: '派遣', 键: 'hp回复加成', 类型: 'percent', 最小值: 10, 最大值: 30 },
  { 域: '派遣', 键: 'sanity回复加成', 类型: 'percent', 最小值: 10, 最大值: 30 },
  { 域: '派遣', 键: '安全撤离保底', 类型: 'boolean', 最小值: 0, 最大值: 1 },
  // C. 终点结算层
  { 域: '派遣', 键: '金币加成', 类型: 'percent', 最小值: 5, 最大值: 25 },
  { 域: '派遣', 键: '纪念品数量+1', 类型: 'integer', 最小值: 1, 最大值: 1 },
  { 域: '派遣', 键: '纪念品稀有度提升', 类型: 'percent', 最小值: 5, 最大值: 20 },
  { 域: '派遣', 键: '空手而归保护', 类型: 'boolean', 最小值: 0, 最大值: 1 },
  // D. 战斗能力类
  { 域: '派遣', 键: '胜率加成', 类型: 'percent', 最小值: 0, 最大值: 20 },
  { 域: '派遣', 键: '伤害减免', 类型: 'percent', 最小值: 0, 最大值: 30 },
  { 域: '派遣', 键: '再战减免', 类型: 'integer', 最小值: 0, 最大值: 50 },
  // E. 生存能力补充
  { 域: '派遣', 键: '每步回复', 类型: 'integer', 最小值: 0, 最大值: 10 },
  { 域: '派遣', 键: '初始HP加成', 类型: 'percent', 最小值: 0, 最大值: 30 },
  { 域: '派遣', 键: '初始Sanity加成', 类型: 'percent', 最小值: 0, 最大值: 30 },
];

/** 工坊域白名单 - 通用 */
const WORKSHOP_COMMON_WHITELIST: WhitelistEntry[] = [
  { 域: '工坊', 键: '通用产量加成', 类型: 'percent', 最小值: 5, 最大值: 20 },
  { 域: '工坊', 键: '通用开局倍速', 类型: 'percent', 最小值: 5, 最大值: 20 },
  { 域: '工坊', 键: '通用偏好满足加成', 类型: 'percent', 最小值: 10, 最大值: 30 },
  { 域: '工坊', 键: '通用正向tick权重', 类型: 'percent', 最小值: 10, 最大值: 35 },
  { 域: '工坊', 键: '通用负向tick权重减免', 类型: 'percent', 最小值: 10, 最大值: 35 },
  { 域: '工坊', 键: '通用疲劳增长减免', 类型: 'percent', 最小值: 15, 最大值: 40 },
  { 域: '工坊', 键: '通用加班启动概率', 类型: 'percent', 最小值: 10, 最大值: 30 },
  { 域: '工坊', 键: '通用加班额外收益系数', 类型: 'percent', 最小值: 10, 最大值: 25 },
  { 域: '工坊', 键: '订单刷新费用减免', 类型: 'percent', 最小值: 10, 最大值: 40 },
  { 域: '工坊', 键: '车间氛围上限提升', 类型: 'percent', 最小值: 5, 最大值: 15 },
];

/** 工坊域白名单 - 工种专用 */
const WORKSHOP_CRAFT_WHITELIST: WhitelistEntry[] = [
  { 域: '工坊', 键: '冶炼生产速度', 类型: 'percent', 最小值: 8, 最大值: 25 },
  { 域: '工坊', 键: '冶炼产量加成', 类型: 'percent', 最小值: 5, 最大值: 20 },
  { 域: '工坊', 键: '制药生产速度', 类型: 'percent', 最小值: 8, 最大值: 25 },
  { 域: '工坊', 键: '制药产量加成', 类型: 'percent', 最小值: 5, 最大值: 20 },
  { 域: '工坊', 键: '改装生产速度', 类型: 'percent', 最小值: 8, 最大值: 25 },
  { 域: '工坊', 键: '改装产量加成', 类型: 'percent', 最小值: 5, 最大值: 20 },
];

/** 猜谜域白名单 */
const GUESS_WHITELIST: WhitelistEntry[] = [
  { 域: '猜谜', 键: '奖励加成', 类型: 'percent', 最小值: 5, 最大值: 20 },
];

/** 全部白名单数据 */
export const SKILL_EFFECT_WHITELIST: WhitelistEntry[] = [
  ...DISPATCH_WHITELIST,
  ...WORKSHOP_COMMON_WHITELIST,
  ...WORKSHOP_CRAFT_WHITELIST,
  ...GUESS_WHITELIST,
];

// 快速查找 Map: "域.键" -> entry
const whitelistMap = new Map<string, WhitelistEntry>();
for (const entry of SKILL_EFFECT_WHITELIST) {
  whitelistMap.set(`${entry.域}.${entry.键}`, entry);
}

/**
 * 获取白名单条目
 * @param 域 域名称
 * @param 键 键名称
 * @returns 白名单条目，若不存在返回 null
 */
export function getWhitelistEntry(域: string, 键: string): WhitelistEntry | null {
  return whitelistMap.get(`${域}.${键}`) ?? null;
}

/**
 * 检查域.键是否在白名单中
 * @param 域 域名称
 * @param 键 键名称
 * @returns 是否存在
 */
export function isValidDomainKey(域: string, 键: string): boolean {
  return whitelistMap.has(`${域}.${键}`);
}

/**
 * 校验并截断值到白名单范围
 * @param 域 域名称
 * @param 键 键名称
 * @param 值 原始数值
 * @returns 截断后的数值，若键不在白名单中返回 null
 */
export function validateAndClampValue(域: string, 键: string, 值: number): number | null {
  const entry = getWhitelistEntry(域, 键);
  if (!entry) return null;

  if (entry.类型 === 'boolean') {
    return 值 > 0 ? 1 : 0;
  }

  return Math.round(Math.max(entry.最小值, Math.min(entry.最大值, 值)));
}

/**
 * 在白名单范围内生成随机值
 * @param 域 域名称
 * @param 键 键名称
 * @returns 随机分配的数值，若键不在白名单中返回 null
 */
export function 随机分配效果值(域: string, 键: string): number | null {
  const entry = getWhitelistEntry(域, 键);
  if (!entry) return null;

  const { 最小值, 最大值, 类型 } = entry;

  if (类型 === 'boolean') {
    return Math.random() > 0.5 ? 1 : 0;
  }

  if (类型 === 'percent' || 类型 === 'integer') {
    const raw = 最小值 + Math.random() * (最大值 - 最小值);
    return Math.round(raw);
  }

  return null;
}

/** mod: 命令正则 */
const MOD_PATTERN = /mod:\s*([^\s,，]+)/gi;

/**
 * 检查技能描述/cmd 字符串中是否包含超过一个 mod: 入口
 * @param cmdStr 技能描述或 cmd 字符串
 * @returns 若只有一个或零个 mod: 返回 true，超过一个返回 false
 */
export function checkSingleModLimit(cmdStr: string): boolean {
  const matches = cmdStr.match(MOD_PATTERN);
  if (!matches) return true;
  return matches.length <= 1;
}

/**
 * 从技能 cmd 字符串中解析出 mod:域.键
 * @param cmdStr 技能描述或 cmd 字符串
 * @returns 解析出的 (域, 键) 数组，若无或不符合白名单则为空数组
 */
export function parseModEntries(cmdStr: string): Array<{ 域: string; 键: string }> {
  const results: Array<{ 域: string; 键: string }> = [];
  const regex = /mod:\s*([^,\s，]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(cmdStr)) !== null) {
    const parts = match[1].split('.');
    if (parts.length === 2) {
      const [域, 键] = parts;
      if (isValidDomainKey(域, 键)) {
        results.push({ 域, 键 });
      }
    }
  }

  return results;
}

/**
 * 根据白名单为技能生成随机效果值
 * 用于商城生成时随机分配 mod:域.键 的具体数值
 * @param 域 域名称
 * @param 键 键名称
 * @returns 随机分配的数值，若键不在白名单中返回 null
 */
export function generateRandomEffectValue(域: string, 键: string): number | null {
  return 随机分配效果值(域, 键);
}
