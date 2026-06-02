/**
 * 任务：boardGameEvent（废土行路事件生成）
 * 调用链：generateBoardGameEvent() → callSecondApi({ task: 'boardGameEvent', sceneText })
 * 调用方：store.ts
 * 状态：✅ 已实现
 */

/**
 * 事件节点类型
 */
export type BoardGameNodeType = 'trap' | 'fortune' | 'encounter';

export const PROMPT_BOARD_GAME_EVENT_POOL = `[System] 暂停角色扮演，禁止输出正文、状态栏和任何其它格式，
仅严格按照以下格式输出。回复必须是一组事件卡，不做任何解释。
指令：
1. 必须使用简体中文输出
2. 根据以下剧情内容，生成一组适合当下情境的探索事件
3. 事件要求：
   - 与当前剧情环境相符，保留"可行动 / 遭遇"感
   - 风格统一，不跳脱世界观
   - 事件应增加随机性、探索感与剧情趣味
4. 每个事件必须有 tendency 字段：
   - negative：负面 / 危险（偏损失，如危险区域、误触装置、埋伏、污染、人员失散、地形风险等）
   - positive：正面 / 有利（偏收益，如补给、捷径、情报、可利用资源、成功逃脱、意外相遇等）
   - neutral：中性 / 不确定（带随机性或风险交换，如遇见新的人物、动物、势力、异常现象、临时交易、求助、对峙等）
5. 总数 9~12 条，tendency 可以自由分配，但整体上要有正面、负面、中性三种结果

输出格式（严格）：
- 每张事件卡占一行，使用英文竖线 "|" 分隔
- 字段顺序：title|description|tendency|effect|hp|sanity
- 字段说明：
  * title：事件标题，少于 6 字
  * description：事件描述，少于 30 字
  * tendency：只能是 negative / positive / neutral
  * effect：结果说明，少于 60 字
  * hp：整数，可正负，可为 0
  * sanity：整数，可正负，可为 0

重要规则：
- 不要输出 JSON / Markdown / 解释
- 每行必须严格使用英文竖线 "|" 分隔，字段内部不要再出现 "|"
- 仅输出 20~30 行事件卡，不要有任何额外内容`;
