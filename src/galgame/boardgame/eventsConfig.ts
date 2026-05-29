import type { EventTendency, GameEvent, NodeType } from './types';

/**
 * 统一事件池
 * 所有事件都是独立卡片格式：
 * - title: 事件标题（同时也是选项标题）
 * - description: 事件描述
 * - tendency: 结果倾向（negative/positive/neutral）
 * - effect: 结果效果
 *
 * 格子类型仅作为"结果倾向权重"：
 * - encounter: 所有倾向等概率
 * - trap: 偏负面 (negative 60%, neutral 25%, positive 15%)
 * - fortune: 偏正面 (positive 60%, neutral 25%, negative 15%)
 */

// ===== 统一事件池 =====

export const allEvents: GameEvent[] = [
  // ── Negative 负面事件 ──
  {
    id: 'neg_01_a',
    nodeType: 'encounter',
    title: '锈蚀的地雷：缓慢后退',
    description: '脚下传来不祥的"咔嗒"声。屏住呼吸，一毫米一毫米地抬起脚。',
    tendency: 'neutral',
    effect: { hp: -5, message: '地雷没有爆炸，但脚踝被锈铁割伤了。' },
  },
  {
    id: 'neg_01_b',
    nodeType: 'encounter',
    title: '锈蚀的地雷：猛然跳开',
    description: '脚下传来不祥的"咔嗒"声。用尽全力向前扑去。',
    tendency: 'negative',
    effect: { hp: -14, message: '爆炸声震耳欲聋，弹片留下了新的伤疤。' },
  },
  {
    id: 'neg_02_a',
    nodeType: 'trap',
    title: '坍塌的楼道：冲刺通过',
    description: '头顶传来令人不安的嘎吱声，混凝土开始掉落。低头全力冲刺。',
    tendency: 'negative',
    effect: { hp: -8, message: '碎石砸在肩膀上，但你成功通过了。' },
  },
  {
    id: 'neg_02_b',
    nodeType: 'trap',
    title: '坍塌的楼道：等待观察',
    description: '头顶传来令人不安的嘎吱声，混凝土开始掉落。先观察楼道结构。',
    tendency: 'neutral',
    effect: { hp: -3, sanity: -8, message: '等待加剧了恐惧，坍塌比预想更剧烈。' },
  },
  {
    id: 'neg_02_c',
    nodeType: 'trap',
    title: '坍塌的楼道：绕路',
    description: '头顶传来令人不安的嘎吱声，混凝土开始掉落。放弃这条路，寻找另一条路。',
    tendency: 'neutral',
    effect: { sanity: -5, message: '失去了这条近路，但保住了性命。' },
  },
  {
    id: 'neg_03_a',
    nodeType: 'trap',
    title: '毒气泄漏：屏气冲出',
    description: '鼻尖涌来一股刺鼻的甜味，眼睛开始刺痛。深吸一口气，全力冲出污染区域。',
    tendency: 'negative',
    effect: { hp: -7, sanity: -5, message: '成功逃出，但毒气已损伤了肺部。' },
  },
  {
    id: 'neg_03_b',
    nodeType: 'trap',
    title: '毒气泄漏：用布遮口鼻',
    description: '鼻尖涌来一股刺鼻的甜味，眼睛开始刺痛。撕下衣角，捂住口鼻缓慢通行。',
    tendency: 'neutral',
    effect: { hp: -4, message: '过滤效果有限，但聊胜于无。' },
  },
  {
    id: 'neg_04_a',
    nodeType: 'trap',
    title: '感染区警告：强行通过',
    description: '生锈的标志牌写着：前方感染，进者自负。不相信标志，继续前进。',
    tendency: 'negative',
    effect: { hp: -15, sanity: -10, message: '标志是真实的，你付出了代价。' },
  },
  {
    id: 'neg_04_b',
    nodeType: 'trap',
    title: '感染区警告：绕道而行',
    description: '生锈的标志牌写着：前方感染，进者自负。花费更多体力找到了另一条路。',
    tendency: 'neutral',
    effect: { hp: -5, message: '安全了，但消耗了更多体力。' },
  },
  {
    id: 'neg_05_a',
    nodeType: 'encounter',
    title: '疯狂的士兵：迎战',
    description: '一名穿着破烂军服的人向你冲来，眼神空洞而危险。握紧武器，准备战斗。',
    tendency: 'negative',
    effect: { hp: -12, sanity: -5, message: '激烈的搏斗消耗了体力，但你成功击退了他。' },
  },
  {
    id: 'neg_05_b',
    nodeType: 'encounter',
    title: '疯狂的士兵：逃跑',
    description: '一名穿着破烂军服的人向你冲来，眼神空洞而危险。转身就跑，消失在废墟的阴影里。',
    tendency: 'neutral',
    effect: { sanity: -8, message: '跑掉了，但那双眼睛久久出现在你脑海中。' },
  },
  {
    id: 'neg_05_c',
    nodeType: 'encounter',
    title: '疯狂的士兵：安抚',
    description: '一名穿着破烂军服的人向你冲来，眼神空洞而危险。缓慢举起双手，试图让他冷静。',
    tendency: 'positive',
    effect: { sanity: 6, message: '他突然停下，怔怔地看了你很久，然后转身离去。' },
  },
  {
    id: 'neg_06_a',
    nodeType: 'encounter',
    title: '埋伏：翻滚躲避',
    description: '你踏入了一片视野开阔的死角，脚下的碎石突然不再作响。本能地向侧方翻滚。',
    tendency: 'neutral',
    effect: { hp: -6, sanity: -4, message: '你躲开了致命一击，但肩膀擦伤了。' },
  },
  {
    id: 'neg_06_b',
    nodeType: 'encounter',
    title: '埋伏：强行突破',
    description: '你踏入了一片视野开阔的死角，脚下的碎石突然不再作响。以伤换伤，冲出包围。',
    tendency: 'negative',
    effect: { hp: -12, message: '你撕开了一道口子，但背后多了几道新伤。' },
  },
  {
    id: 'neg_07_a',
    nodeType: 'trap',
    title: '塌陷的地板：抓住边缘',
    description: '脚下的楼板发出不祥的断裂声，黑暗从缝隙中涌上来。拼命抓住附近的残垣。',
    tendency: 'neutral',
    effect: { hp: -5, sanity: -3, message: '你拼命撑住了，指尖渗出血来。' },
  },
  {
    id: 'neg_07_b',
    nodeType: 'trap',
    title: '塌陷的地板：跳向对面',
    description: '脚下的楼板发出不祥的断裂声，黑暗从缝隙中涌上来。赌一把，跳向对面的平台。',
    tendency: 'negative',
    effect: { hp: -10, sanity: -6, message: '你摔了下去，疼痛从脚底一直蔓延到脊椎。' },
  },
  {
    id: 'neg_08_a',
    nodeType: 'encounter',
    title: '野狗群：举起火把',
    description: '低沉的咆哮从阴影中传来，饥饿的眼睛在黑暗中闪烁。用火焰逼退它们。',
    tendency: 'positive',
    effect: { message: '它们退却了，你得以安全通过。' },
  },
  {
    id: 'neg_08_b',
    nodeType: 'encounter',
    title: '野狗群：缓慢后退',
    description: '低沉的咆哮从阴影中传来，饥饿的眼睛在黑暗中闪烁。保持视线接触，慢慢撤离。',
    tendency: 'neutral',
    effect: { hp: -3, sanity: -2, message: '一块碎石滚落，惊动了它们。一阵追逐后你甩开了它们。' },
  },

  // ── Positive 正面事件 ──
  {
    id: 'pos_01_a',
    nodeType: 'fortune',
    title: '被遗忘的补给站：搜刮医疗品',
    description: '在瓦砾之下，你发现了一扇完好的铁门。铁柜里还有未开封的急救包。',
    tendency: 'positive',
    effect: { hp: 18, message: '仔细处理了身上的每一处伤口。好久没有这么奢侈了。' },
  },
  {
    id: 'pos_01_b',
    nodeType: 'fortune',
    title: '被遗忘的补给站：翻阅旧日志',
    description: '在瓦砾之下，你发现了一扇完好的铁门。桌上有一本布满灰尘的日记。',
    tendency: 'positive',
    effect: { sanity: 15, message: '日记记录着末日前的日常。那些平凡的幸福让你想起了曾经的世界。' },
  },
  {
    id: 'pos_02_a',
    nodeType: 'fortune',
    title: '短暂的晴天：晒太阳休息',
    description: '厚重的铅云出现了一道裂缝，久违的阳光洒了下来。找了块干净的石头坐下，闭上眼睛。',
    tendency: 'positive',
    effect: { hp: 8, sanity: 12, message: '温暖的阳光让你的身心得到了片刻安宁。' },
  },
  {
    id: 'pos_02_b',
    nodeType: 'fortune',
    title: '短暂的晴天：收集雨水',
    description: '厚重的铅云出现了一道裂缝，久违的阳光洒了下来。展开容器，趁机收集干净雨水。',
    tendency: 'positive',
    effect: { hp: 6, message: '清澈的水喝下去甘甜无比。你还额外存了一些。' },
  },
  {
    id: 'pos_03_a',
    nodeType: 'fortune',
    title: '神秘的礼物：打开盒子',
    description: '路边有一个精心包装的盒子，上面颤抖地写着：给有缘人。拆开包装，里面是一个铜制怀表。',
    tendency: 'positive',
    effect: { sanity: 8, message: '怀表里装着一张照片，上面的人面带微笑，让你莫名感到温暖。' },
  },
  {
    id: 'pos_03_b',
    nodeType: 'fortune',
    title: '神秘的礼物：不去碰它',
    description: '路边有一个精心包装的盒子，上面颤抖地写着：给有缘人。警惕之下，选择放弃。',
    tendency: 'neutral',
    effect: { message: '继续前行，心里留下了一道悬念。' },
  },
  {
    id: 'pos_04_a',
    nodeType: 'fortune',
    title: '同行者的馈赠：打开纸包',
    description: '一名旅行者擦肩而过，不言不语地留下了一个纸包。里面是几片干净的纱布和消炎药。',
    tendency: 'positive',
    effect: { hp: 10, sanity: 5, message: '这份意外的善意让你感到不孤单。' },
  },
  {
    id: 'pos_05_a',
    nodeType: 'fortune',
    title: '废弃的安全屋：进入休息',
    description: '一扇半掩的门后，是一间出乎意料完整的房间。关上门，好好睡一觉。',
    tendency: 'positive',
    effect: { hp: 12, sanity: 10, message: '一夜无梦的安眠，你的身体恢复了不少。' },
  },
  {
    id: 'pos_05_b',
    nodeType: 'fortune',
    title: '废弃的安全屋：搜刮物资',
    description: '一扇半掩的门后，是一间出乎意料完整的房间。抓紧时间搜索可用物品。',
    tendency: 'positive',
    effect: { hp: 8, sanity: 5, message: '找到了一些罐头和干净的绷带。' },
  },
  {
    id: 'pos_06_a',
    nodeType: 'encounter',
    title: '废墟中的陌生人：伸出援手',
    description: '雾气中浮现一道佝偻的身影，分不清是敌是友。上前搭话，提供帮助。',
    tendency: 'positive',
    effect: { sanity: 8, message: '陌生人分享了一段温暖的记忆，你的精神稍微恢复了。' },
  },
  {
    id: 'pos_06_b',
    nodeType: 'encounter',
    title: '废墟中的陌生人：保持警惕',
    description: '雾气中浮现一道佝偻的身影，分不清是敌是友。握紧武器，远远绕行。',
    tendency: 'neutral',
    effect: { hp: -5, message: '对方突然投来石块，擦伤了你的手臂。' },
  },
  {
    id: 'pos_07_a',
    nodeType: 'fortune',
    title: '发现捷径：走捷径',
    description: '一条隐蔽的小道出现在视野中，比来时的大路短得多。节省时间和体力。',
    tendency: 'positive',
    effect: { sanity: 5, message: '这条小路出奇地平静安全。' },
  },
  {
    id: 'pos_07_b',
    nodeType: 'fortune',
    title: '发现捷径：走大路',
    description: '一条隐蔽的小道出现在视野中，比来时的大路短得多。安全第一，不贪小便宜。',
    tendency: 'neutral',
    effect: { message: '你选择了稳妥的道路，什么也没有发生。' },
  },
  {
    id: 'pos_08_a',
    nodeType: 'encounter',
    title: '末日传教士：驻足聆听',
    description: '一名破衣烂衫的人站在瓦砾上高声布道，声音在废墟间回荡。停下脚步，任由那些词句流入耳中。',
    tendency: 'positive',
    effect: { sanity: 12, message: '不知为何，那些荒诞的教义让你感到一丝平静。' },
  },
  {
    id: 'pos_08_b',
    nodeType: 'encounter',
    title: '末日传教士：嗤之以鼻',
    description: '一名破衣烂衫的人站在瓦砾上高声布道，声音在废墟间回荡。无视声音，加快脚步离开。',
    tendency: 'neutral',
    effect: { message: '你不相信任何神灵。这很理智。' },
  },

  // ── Neutral 中性事件 ──
  {
    id: 'neu_01_a',
    nodeType: 'encounter',
    title: '哭泣的孩童：寻声前往',
    description: '破败的楼房里传来微弱的哭声，在死寂中格外刺耳。循着声音走进黑暗的走廊。',
    tendency: 'neutral',
    effect: { hp: -5, sanity: 10, message: '是一只受伤的猫。你包扎了它的伤口，心里踏实了些。' },
  },
  {
    id: 'neu_01_b',
    nodeType: 'encounter',
    title: '哭泣的孩童：转身离开',
    description: '破败的楼房里传来微弱的哭声，在死寂中格外刺耳。这个世界已经不允许多管闲事了。',
    tendency: 'neutral',
    effect: { sanity: -10, message: '哭声在你身后渐渐消失，但罪恶感像影子一样跟着你。' },
  },
  {
    id: 'neu_02_a',
    nodeType: 'encounter',
    title: '蒙面商人：购买药剂',
    description: '一个戴着防毒面具的人铺开了一块脏兮兮的布，上面摆满了瓶瓶罐罐。用仅有的筹码换了一瓶浑浊的液体。',
    tendency: 'neutral',
    effect: { hp: 12, message: '药剂味道可怕，但伤口确实好了一些。' },
  },
  {
    id: 'neu_02_b',
    nodeType: 'encounter',
    title: '蒙面商人：询问情报',
    description: '一个戴着防毒面具的人铺开了一块脏兮兮的布，上面摆满了瓶瓶罐罐。请求对方分享前方的情况。',
    tendency: 'positive',
    effect: { sanity: 5, message: '商人告诉你前方有条捷径，还有一些需要避开的地方。' },
  },
  {
    id: 'neu_02_c',
    nodeType: 'encounter',
    title: '蒙面商人：抢夺物资',
    description: '一个戴着防毒面具的人铺开了一块脏兮兮的布，上面摆满了瓶瓶罐罐。末日之下，拳头就是道理。',
    tendency: 'negative',
    effect: { hp: -10, message: '商人比看起来强壮得多。你被打倒在地，什么也没得到。' },
  },
  {
    id: 'neu_03_a',
    nodeType: 'encounter',
    title: '失忆的女人：帮她回忆',
    description: '她坐在倒塌的墙边，重复念着一个名字。蹲下来，轻声询问她发生了什么。',
    tendency: 'neutral',
    effect: { hp: -3, sanity: 8, message: '你不知道帮了多少忙，但她的眼神清醒了一些。' },
  },
  {
    id: 'neu_03_b',
    nodeType: 'encounter',
    title: '失忆的女人：留下食物离去',
    description: '她坐在倒塌的墙边，重复念着一个名字。把口粮放在她旁边，然后独自离去。',
    tendency: 'neutral',
    effect: { hp: -5, sanity: 3, message: '你回头看了一眼，她没有动。' },
  },
  {
    id: 'neu_04_a',
    nodeType: 'encounter',
    title: '受伤的困兽：试图安抚',
    description: '角落里蜷缩着一只受伤的动物，眼神里满是警惕与恐惧。慢慢靠近，伸出手掌。',
    tendency: 'neutral',
    effect: { hp: -8, sanity: 5, message: '它还是咬了你。但攻击停止得很快，它摇摇晃晃地离开了。' },
  },
  {
    id: 'neu_04_b',
    nodeType: 'encounter',
    title: '受伤的困兽：绕路而行',
    description: '角落里蜷缩着一只受伤的动物，眼神里满是警惕与恐惧。保持距离，小心地绕过它。',
    tendency: 'neutral',
    effect: { message: '你们互不干扰，各自继续前行。' },
  },
  {
    id: 'neu_05_a',
    nodeType: 'trap',
    title: '时空裂隙：纵身跃入',
    description: '空气突然扭曲，脚下的地面像水面一样泛起涟漪。深吸一口气，跳进裂隙。',
    tendency: 'neutral',
    effect: { transfer: true, sanity: -5, message: '世界旋转、撕裂、重组。当你睁开眼时，一切都变了。' },
  },
  {
    id: 'neu_05_b',
    nodeType: 'trap',
    title: '时空裂隙：试探性触碰',
    description: '空气突然扭曲，脚下的地面像水面一样泛起涟漪。伸出手指轻轻触碰裂隙边缘。',
    tendency: 'neutral',
    effect: { transfer: true, hp: -3, message: '一股力量猛地将你拽了进去。' },
  },
  {
    id: 'neu_06_a',
    nodeType: 'fortune',
    title: '浓雾迷途：顺着感觉走',
    description: '一团不自然的浓雾突然涌来，你在其中迷失了方向。凭直觉在雾中前行。',
    tendency: 'neutral',
    effect: { transfer: true, sanity: -8, message: '浓雾散去时，你发现自己站在一个陌生的地方。' },
  },
  {
    id: 'neu_07_a',
    nodeType: 'encounter',
    title: '神秘的电梯：按下按钮',
    description: '一部看起来不该还能运行的电梯，指示灯闪烁着诡异的光。走进电梯，随手按了一个楼层。',
    tendency: 'neutral',
    effect: { transfer: true, message: '电梯在一阵剧烈摇晃后停下来。这里是……哪里？' },
  },
  {
    id: 'neu_07_b',
    nodeType: 'encounter',
    title: '神秘的电梯：查看线路',
    description: '一部看起来不该还能运行的电梯，指示灯闪烁着诡异的光。打开控制面板，试图弄清楚通往何处。',
    tendency: 'positive',
    effect: { transfer: true, message: '线路图已模糊不清，但你依稀看到了目的地的名字。' },
  },
  {
    id: 'neu_08_a',
    nodeType: 'encounter',
    title: '流浪者营地：加入他们',
    description: '远处的篝火在黑暗中跳动，几个人影在火堆旁忙碌。靠近篝火，分享你的故事。',
    tendency: 'neutral',
    effect: { sanity: 6, message: '他们给你倒了一杯热水，讲述了各自的故事。' },
  },
  {
    id: 'neu_08_b',
    nodeType: 'encounter',
    title: '流浪者营地：远远观察',
    description: '远处的篝火在黑暗中跳动，几个人影在火堆旁忙碌。保持距离，观察他们的行动。',
    tendency: 'neutral',
    effect: { sanity: -3, message: '你不确定他们是敌是友，选择了保持警惕。' },
  },
  {
    id: 'neu_09_a',
    nodeType: 'fortune',
    title: '废弃的便利店：翻找货架',
    description: '玻璃门上贴着褪色的广告，里面货架大多空空如也。仔细搜索每一个角落。',
    tendency: 'neutral',
    effect: { hp: 5, message: '找到了一罐还未过期的罐头和一些糖果。' },
  },
  {
    id: 'neu_09_b',
    nodeType: 'fortune',
    title: '废弃的便利店：离开',
    description: '玻璃门上贴着褪色的广告，里面货架大多空空如也。这里可能已经被搜刮过无数次了。',
    tendency: 'neutral',
    effect: { message: '你转身离开，继续前进。' },
  },
  {
    id: 'neu_10_a',
    nodeType: 'encounter',
    title: '信号弹：循光前行',
    description: '一道白光划破夜空，然后是漫长的寂静。向信号弹的方向走去。',
    tendency: 'neutral',
    effect: { sanity: -5, message: '你找到了一具尸体和散落的物资。' },
  },
  {
    id: 'neu_10_b',
    nodeType: 'encounter',
    title: '信号弹：远离光源',
    description: '一道白光划破夜空，然后是漫长的寂静。在黑暗中避开那个方向。',
    tendency: 'neutral',
    effect: { message: '你不确定那意味着什么，但谨慎总没错。' },
  },
];

/**
 * 获取运气修正值
 * 从 MVU 变量中读取运气值，返回小幅度修正
 */
export function getLuckModifier(): number {
  try {
    const vars = getVariables({ type: 'chat' });
    const personalAttrs = vars?.['个人属性'];
    if (personalAttrs && typeof personalAttrs === 'object') {
      const luck = (personalAttrs as any)['运气'];
      if (typeof luck === 'number') {
        // 运气 5 为基准，每高 1 点增加 5% 的好结果概率，每低 1 点减少 5%
        return (luck - 5) * 0.05;
      }
    }
  } catch {
    // ignore
  }
  return 0;
}

/**
 * 根据格子类型抽取随机事件
 *
 * 格子类型作为"结果倾向权重"：
 * - encounter: 所有倾向等概率 (各 1/3)
 * - trap: 偏负面 (negative 60%, neutral 25%, positive 15%)
 * - fortune: 偏正面 (positive 60%, neutral 25%, negative 15%)
 * - empty: 空地，无事件
 *
 * 运气会影响抽取结果：
 * - 高运气增加正面事件概率，减少负面事件概率
 * - 低运气则相反
 */
export function getRandomEvent(
  nodeType: NodeType,
  rng: () => number = Math.random,
): GameEvent | null {
  // 空地不触发事件
  if (nodeType === 'empty' || nodeType === 'start' || nodeType === 'end') {
    return null;
  }

  // 获取运气修正
  const luckMod = getLuckModifier();

  // 确定各倾向的基础权重
  let negWeight: number;
  let posWeight: number;
  let neuWeight: number;

  switch (nodeType) {
    case 'encounter':
      // encounter: 所有倾向等概率
      negWeight = 1;
      posWeight = 1;
      neuWeight = 1;
      break;
    case 'trap':
      // trap: 偏负面
      negWeight = 0.6;
      posWeight = 0.15;
      neuWeight = 0.25;
      break;
    case 'fortune':
      // fortune: 偏正面
      negWeight = 0.15;
      posWeight = 0.6;
      neuWeight = 0.25;
      break;
    default:
      return null;
  }

  // 应用运气修正（小幅度调整 ±10%）
  negWeight = Math.max(0.05, negWeight - luckMod * 0.1);
  posWeight = Math.max(0.05, posWeight + luckMod * 0.1);

  const totalWeight = negWeight + posWeight + neuWeight;
  const roll = rng() * totalWeight;

  let selectedTendency: EventTendency;
  if (roll < negWeight) {
    selectedTendency = 'negative';
  } else if (roll < negWeight + posWeight) {
    selectedTendency = 'positive';
  } else {
    selectedTendency = 'neutral';
  }

  // 从事件池中筛选匹配倾向的事件
  const matchingEvents = allEvents.filter(e => e.nodeType === nodeType && e.tendency === selectedTendency);

  if (matchingEvents.length === 0) {
    // 降级：从该类型所有事件中随机选
    const fallback = allEvents.filter(e => e.nodeType === nodeType);
    if (fallback.length === 0) return null;
    return fallback[Math.floor(rng() * fallback.length)!];
  }

  return matchingEvents[Math.floor(rng() * matchingEvents.length)!];
}
