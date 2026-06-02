/**
 * 任务：danmaku（弹幕生成）
 * 调用链：triggerDanmakuForMessage() → callSecondApi({ task: 'danmaku', contentText })
 * 调用方：store.ts
 * 状态：✅ 已实现
 */
export const PROMPT_DANMAKU = `[System] 暂停角色扮演，禁止输出正文、状态栏和任何其它格式，
仅严格按照以下格式输出。回复必须是一组弹幕文本，不做任何解释。
指令：
1. 必须使用简体中文输出
2. 根据以下剧情内容，生成 3~5 条观众视角的弹幕
3. 每条弹幕不超过 15 个字，风格符合剧情氛围
4. 每行一条弹幕（不要编号）

返回格式（严格）：
- 多行文本
- 每行一条弹幕`;

export const PROMPT_DANMAKU_AND_IMAGE = `[System] 暂停角色扮演，禁止输出正文、状态栏和任何其它格式，
仅严格按照以下格式输出。回复必须同时包含弹幕和生图标签，不做任何解释。
指令：
1. 必须使用简体中文输出
2. 生成 3~5 条弹幕（每行一条）
3. 再生成 1 组图片标签（<background> 或 <cg>）
4. 弹幕与图片标签用换行分隔

返回格式（严格）：
- 前 N 行：弹幕（每行一条）
- 随后：一个 <background> 或 <cg> 标签块`;
