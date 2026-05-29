import type { GameEvent } from '@/types'

/**
 * Event pools by node type.
 * When a player lands on an event node, a random event from the matching pool is drawn.
 * Each event offers 1~3 tarot-style cards to choose from.
 */

export const encounterEvents: GameEvent[] = [
  {
    id: 'enc_01',
    nodeType: 'encounter',
    title: '废墟中的陌生人',
    flavor: '雾气中浮现一道佝偻的身影，分不清是敌是友。',
    cards: [
      {
        id: 'enc_01_a',
        title: '伸出援手',
        description: '你决定上前搭话，对方似乎松了口气。',
        effect: { sanity: 5, message: '陌生人分享了一段温暖的记忆，你的精神稍微恢复了。' },
      },
      {
        id: 'enc_01_b',
        title: '保持警惕',
        description: '你握紧手中的武器，远远绕过了那个身影。',
        effect: { hp: -3, message: '对方突然投来石块，擦伤了你的手臂。' },
      },
      {
        id: 'enc_01_c',
        title: '交换物资',
        description: '你示意可以交易，对方掏出了一些东西。',
        effect: { luck: 2, message: '你得到了一枚锈迹斑斑的硬币，据说能带来好运。' },
      },
    ],
  },
  {
    id: 'enc_02',
    nodeType: 'encounter',
    title: '哭泣的孩童',
    flavor: '破败的楼房里传来微弱的哭声，在死寂中格外刺耳。',
    cards: [
      {
        id: 'enc_02_a',
        title: '寻声前往',
        description: '你循着声音走进黑暗的走廊。',
        effect: { hp: -5, sanity: 8, message: '是一只受伤的猫。你包扎了它的伤口，心里踏实了些。' },
      },
      {
        id: 'enc_02_b',
        title: '转身离开',
        description: '这个世界已经不允许多管闲事了。',
        effect: { sanity: -8, message: '哭声在你身后渐渐消失，但罪恶感像影子一样跟着你。' },
      },
    ],
  },
  {
    id: 'enc_03',
    nodeType: 'encounter',
    title: '蒙面商人',
    flavor: '一个戴着防毒面具的人铺开了一块脏兮兮的布，上面摆满了瓶瓶罐罐。',
    cards: [
      {
        id: 'enc_03_a',
        title: '购买药剂',
        description: '你用仅有的筹码换了一瓶浑浊的液体。',
        effect: { hp: 10, luck: -1, message: '药剂味道可怕，但伤口确实好了一些。' },
      },
      {
        id: 'enc_03_b',
        title: '询问情报',
        description: '你请求对方分享前方的情况。',
        effect: { sanity: 3, luck: 1, message: '商人告诉你前方有条捷径，还有一些需要避开的地方。' },
      },
      {
        id: 'enc_03_c',
        title: '抢夺物资',
        description: '末日之下，拳头就是道理。',
        effect: { hp: -8, luck: -2, message: '商人比看起来强壮得多。你被打倒在地，什么也没得到。' },
      },
    ],
  },
]

export const trapEvents: GameEvent[] = [
  {
    id: 'trap_01',
    nodeType: 'trap',
    title: '锈蚀的地雷',
    flavor: '脚下传来不祥的"咔嗒"声。',
    cards: [
      {
        id: 'trap_01_a',
        title: '缓慢后退',
        description: '你屏住呼吸，一毫米一毫米地抬起脚。',
        effect: { hp: -5, message: '地雷没有爆炸，但你的脚踝被锈铁割伤了。' },
      },
      {
        id: 'trap_01_b',
        title: '猛然跳开',
        description: '你用尽全力向前扑去。',
        effect: { hp: -12, message: '爆炸声震耳欲聋，弹片在你背上留下了新的伤疤。' },
      },
    ],
  },
  {
    id: 'trap_02',
    nodeType: 'trap',
    title: '坍塌的楼层',
    flavor: '脚下的地板突然发出不堪重负的呻吟。',
    cards: [
      {
        id: 'trap_02_a',
        title: '抓住横梁',
        description: '你在坠落的瞬间抓住了一根暴露的钢筋。',
        effect: { hp: -3, sanity: -5, message: '你悬在半空，恐惧让你的手不停颤抖。最终你爬了上来。' },
      },
      {
        id: 'trap_02_b',
        title: '顺势滑落',
        description: '你放弃挣扎，随着碎石一起下坠。',
        effect: { hp: -10, message: '你摔在了一堆杂物上。浑身酸痛，但还活着。' },
      },
      {
        id: 'trap_02_c',
        title: '分散重量',
        description: '你趴下身体，缓慢地匍匐前进。',
        effect: { sanity: -3, message: '地板最终还是塌了一小块，但你已经爬到了安全的位置。' },
      },
    ],
  },
  {
    id: 'trap_03',
    nodeType: 'trap',
    title: '毒气泄漏',
    flavor: '空气中弥漫着一股刺鼻的甜味，你的眼睛开始流泪。',
    cards: [
      {
        id: 'trap_03_a',
        title: '捂住口鼻快跑',
        description: '你撕下衣角捂住口鼻，拔腿就跑。',
        effect: { hp: -6, sanity: -2, message: '你跑出了毒气区域，但喉咙和肺部火辣辣的疼。' },
      },
      {
        id: 'trap_03_b',
        title: '寻找气源关闭',
        description: '你逆着气流寻找泄漏点。',
        effect: { hp: -15, luck: 3, message: '你找到并关闭了阀门，但吸入了大量毒气。至少后来的人安全了。' },
      },
    ],
  },
]

export const fortuneEvents: GameEvent[] = [
  {
    id: 'fort_01',
    nodeType: 'fortune',
    title: '被遗忘的补给站',
    flavor: '在瓦砾之下，你发现了一扇完好的铁门。',
    cards: [
      {
        id: 'fort_01_a',
        title: '搜刮医疗品',
        description: '铁柜里还有未开封的急救包。',
        effect: { hp: 15, message: '你仔细处理了身上的每一处伤口。好久没有这么奢侈了。' },
      },
      {
        id: 'fort_01_b',
        title: '翻阅旧日志',
        description: '桌上有一本布满灰尘的日记。',
        effect: { sanity: 12, message: '日记的主人记录着末日前的日常。那些平凡的幸福让你想起了曾经的世界。' },
      },
      {
        id: 'fort_01_c',
        title: '搜索隐藏物',
        description: '你敲击墙壁，发现了一个暗格。',
        effect: { luck: 5, message: '暗格里有一枚刻着奇怪符号的护身符。你把它挂在了脖子上。' },
      },
    ],
  },
  {
    id: 'fort_02',
    nodeType: 'fortune',
    title: '短暂的晴天',
    flavor: '厚重的铅云出现了一道裂缝，久违的阳光洒下来。',
    cards: [
      {
        id: 'fort_02_a',
        title: '晒太阳休息',
        description: '你找了块干净的石头坐下，闭上眼睛。',
        effect: { hp: 8, sanity: 8, message: '温暖的阳光让你的身心都得到了片刻的安宁。' },
      },
      {
        id: 'fort_02_b',
        title: '收集雨水',
        description: '你展开容器，趁机收集从屋檐滴落的干净雨水。',
        effect: { hp: 5, luck: 2, message: '清澈的水喝下去甘甜无比。你还额外存了一些。' },
      },
    ],
  },
]

export const transferEvents: GameEvent[] = [
  {
    id: 'trans_01',
    nodeType: 'transfer',
    title: '时空裂隙',
    flavor: '空气突然扭曲，你脚下的地面像水面一样泛起涟漪。',
    cards: [
      {
        id: 'trans_01_a',
        title: '纵身跃入',
        description: '你深吸一口气，跳进了裂隙。',
        effect: { transfer: true, sanity: -5, message: '世界旋转、撕裂、重组。当你睁开眼时，一切都变了。' },
      },
      {
        id: 'trans_01_b',
        title: '试探性触碰',
        description: '你伸出手指轻轻触碰裂隙的边缘。',
        effect: { transfer: true, hp: -3, message: '一股力量猛地将你拽了进去。你被甩到了一个完全陌生的地方。' },
      },
      {
        id: 'trans_01_c',
        title: '绕道而行',
        description: '你不想冒险，决定找其他路走。',
        effect: { sanity: -3, message: '裂隙突然扩大并将你吞没。命运，不可抗拒。', transfer: true },
      },
    ],
  },
  {
    id: 'trans_02',
    nodeType: 'transfer',
    title: '神秘电梯',
    flavor: '一部看起来不该还能运行的电梯，指示灯闪烁着诡异的光。',
    cards: [
      {
        id: 'trans_02_a',
        title: '按下按钮',
        description: '你走进电梯，随手按了一个楼层。',
        effect: { transfer: true, message: '电梯在一阵剧烈摇晃后停下来，门开了。这里是……哪里？' },
      },
      {
        id: 'trans_02_b',
        title: '查看线路',
        description: '你打开控制面板，试图弄清楚这东西通往何处。',
        effect: { transfer: true, luck: 1, message: '线路图上的标记已经模糊不清，但你隐约看到了目的地的名字。' },
      },
    ],
  },
]

/** Get a random event for a given node type */
export function getRandomEvent(nodeType: 'encounter' | 'trap' | 'fortune' | 'transfer'): GameEvent {
  const pools: Record<string, GameEvent[]> = {
    encounter: encounterEvents,
    trap: trapEvents,
    fortune: fortuneEvents,
    transfer: transferEvents,
  }
  const pool = pools[nodeType]
  return pool[Math.floor(Math.random() * pool.length)]
}
