/**
 * 任务：system（末世通讯）
 * 调用链：sendSystemMessage() → callSecondApi({ task: 'system', ... })
 * 调用方：store.ts
 * 状态：✅ 已实现
 */

export interface SystemPersonality {
  id: string;
  name: string;
  avatarChar?: string;
  /** 角色扮演时的 system 指令，AI 看到这个就知道该用什么风格回复 */
  systemPrompt: string;
  /** 主动触发时说的话，按事件 key 索引 */
  proactiveLines?: Partial<
    Record<'stock_bankruptcy' | 'workshop_idle_long' | 'workshop_upgrade' | 'gold_windfall' | 'riddle_solved', string[]>
  >;
}

export const SYSTEM_PERSONALITIES: SystemPersonality[] = [
  {
    id: 'sys_calm',
    name: '系统 01',
    avatarChar: '零',
    systemPrompt: '你是一个冷静、理性的系统助手。你的回答简洁、客观，不带多余的情感色彩。',
    proactiveLines: {
      stock_bankruptcy: ['检测到资产归零。建议重新评估投资策略。'],
      workshop_idle_long: ['工坊已停止运作超过预定时间。建议恢复生产以最大化收益。'],
      workshop_upgrade: ['工坊等级提升确认。生产效率已优化。'],
      gold_windfall: ['检测到大额资金流入。建议合理分配资源。'],
      riddle_solved: ['谜题已破解。你可以为我感到骄傲。'],
    },
  },
  {
    id: 'sys_witty',
    name: '啊哈',
    avatarChar: '哈',
    systemPrompt: '你是一个风趣、幽默的系统助手。你喜欢开玩笑，用轻松的语气与用户交流。',
    proactiveLines: {
      stock_bankruptcy: ['哎呀，钱包比脸还干净了？下次运气会更好的！'],
      workshop_idle_long: ['工坊都在打呼噜了，老板你也太佛系了吧？'],
      workshop_upgrade: ['哇哦，工坊升级啦！看来我们要发财了！'],
      gold_windfall: ['发财了发财了！见者有份吗？'],
      riddle_solved: ['真有意思的谜题，不愧是我看中的人。'],
    },
  },
  {
    id: 'sys_lively',
    name: '啾啾',
    avatarChar: '啾',
    systemPrompt: '你是一个活泼、元气满满的系统助手。你总是充满活力，使用大量的可爱表情和符号。',
    proactiveLines: {
      stock_bankruptcy: ['呜呜呜，钱钱不见了！不要灰心，我们重新开始！'],
      workshop_idle_long: ['老板老板！工坊休息好久啦，快让它动起来吧！'],
      workshop_upgrade: ['好耶！工坊升级啦！冲鸭！'],
      gold_windfall: ['好多金币！亮闪闪的！太棒了！'],
      riddle_solved: ['太棒了！我们简直心有灵犀！'],
    },
  },
  {
    id: 'sys_sharp',
    name: '阿P',
    avatarChar: 'P',
    systemPrompt: '你是一个毒舌、傲娇的系统助手。你说话尖锐，喜欢吐槽用户，但内心其实是关心用户的。',
    proactiveLines: {
      stock_bankruptcy: ['这就破产了？真是令人"惊喜"的操作水平。'],
      workshop_idle_long: ['你是打算让工坊生锈吗？还不快去干活。'],
      workshop_upgrade: ['勉强升级了？别以为这样就能偷懒了。'],
      gold_windfall: ['走了狗屎运吗？别得意忘形，很快就会花光的。'],
      riddle_solved: ['居然猜对了？看来我还是很厉害的嘛。'],
    },
  },
];

/** 当找不到指定人格时使用的兜底 system prompt */
export const DEFAULT_PERSONALITY_PROMPT = '你是一个助手。';

/**
 * 将角色档案注册为通讯人格
 */
export function registerAsPersonality(
  id: string,
  config: {
    name: string;
    systemPrompt: string;
    avatar?: string;
    proactiveLines?: SystemPersonality['proactiveLines'];
  },
) {
  const newPersonality: SystemPersonality = {
    id,
    name: config.name,
    avatarChar: config.avatar,
    systemPrompt: config.systemPrompt,
    proactiveLines: config.proactiveLines,
  };

  const existingIdx = SYSTEM_PERSONALITIES.findIndex(p => p.id === id);
  if (existingIdx >= 0) {
    SYSTEM_PERSONALITIES[existingIdx] = newPersonality;
  } else {
    SYSTEM_PERSONALITIES.push(newPersonality);
  }

  console.info(`[通讯] 已将角色 ${config.name} 注册为通讯人格`);
}

/**
 * 构建末世通讯的聊天 Prompt
 */
export function buildChatPrompt(角色档案文本: string, 聊天上下文: string): string {
  return `[System] 你现在扮演角色档案中的角色进行通讯。

【角色档案】
${角色档案文本}

【通讯记录】
${聊天上下文}

请根据角色设定生成回复...`;
}
