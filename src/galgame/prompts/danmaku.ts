/**
 * 任务：danmaku（弹幕生成）
 * 调用链：triggerDanmakuForMessage() → callSecondApi({ task: 'danmaku', contentText })
 * 调用方：store.ts
 *
 * 设计变更说明：
 * - 弹幕 / 生图（CG + 背景）的具体规则全部由"世界书"承载
 * （世界书条目通过 extra.linkedFeature = 'danmaku' | 'imageGen' 标记，
 *   callSecondApi 在 buildSecondApiContext 中按维度过滤注入）。
 * - 本文件只保留极简的"输出格式与硬约束"，作为兜底系统提示
 *   —— 即便用户世界书里没放规则，第二 API 仍能输出可被解析的格式。
 * - 在世界书命中规则时，这些 hint 会作为附加系统提示追加在
 *   【世界书条目】之后、用户剧情文本之前，不替换世界书内容。
 */

export const PROMPT_DANMAKU_HINT = `[System] 暂停角色扮演，切换为"弹幕生成器"。
严格基于下方 <content> 标签内的正文生成：互不重复，不得复读前文已有的弹幕；语气贴近实时观看者的反应。`;

export const PROMPT_DANMAKU_AND_IMAGE_HINT = `[System] 暂停角色扮演，切换为"弹幕 + 生图 tag 生成器"。
严格基于下方 <content> 标签内的正文生成：
- 弹幕必须反映正文中实际出现的人物互动、场景氛围、剧情节奏
- 生图 tag 必须严格遵循上面世界书里 <background> / <image> 标签的格式与字段（含 title / image###...### 等）
- 仅在正文出现场景切换或 CG 时刻才输出对应的生图 tag；正文未发生场景变化时不要输出生图 tag
- 不得在 <content> 正文之外引入未出现的人物、地点或事件

按上面世界书里的弹幕 / 生图规则输出：
- 场景切换时输出 <background> 标签块，CG 场景时输出 <image> 标签块
- 严禁在结尾外出现自由文本，标签格式严格按世界书示例`;
