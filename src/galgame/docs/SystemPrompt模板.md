# System Prompt 模板（v1 权威来源）

本文档收集 `src/galgame`（v1）所有“第二 API 辅助任务”的 System Prompt 模板。

**本项目采用文档驱动（权威来源）策略：**

- 所有第二 API 任务的 Prompt 必须在本文件中定义
- 代码只能通过“任务 key + Prompt 提取器”来引用 Prompt
- 修改 Prompt 不应要求修改业务逻辑代码（除非返回格式变更）

相关：
- 任务与降级策略见：[开发指南](./开发指南.md)
- 返回格式与消息协议见：[消息格式规范](./消息格式规范.md)

---

## 目录

1. [使用说明（代码引用方式）](#使用说明代码引用方式)
2. [1. 弹幕生成（danmaku）](#1-弹幕生成danmaku)
3. [2. 生图标签生成（imageTag）](#2-生图标签生成imagetag)
4. [3. 弹幕+生图合并（danmakuAndImageGen）](#3-弹幕生图合并danmakuandimagegen)
5. [4. 商店商品生成（shop）](#4-商店商品生成shop)
6. [5. 谜题系统（riddle）](#5-谜题系统riddle)
7. [6. 末世通讯（system）](#6-末世通讯system)
8. [7. 废土行路事件（boardGameEvent）](#7-废土行路事件boardgameevent)

---

## 使用说明（代码引用方式）

建议做法：把本文档按 `?raw` 导入为字符串，然后按标题提取对应章节。

示例（建议放在 `src/galgame/utils/api/systemPrompts.ts` 或 `src/galgame/types/systemPrompt.ts`）：

```ts
import systemPromptTemplates from '../docs/SystemPrompt模板.md?raw';

export type SystemPromptKey =
  | 'danmaku'
  | 'imageTag'
  | 'danmakuAndImageGen'
  | 'shop'
  | 'riddle'
  | 'system'
  | 'boardGameEvent';

const SECTION_TITLES: Record<SystemPromptKey, string> = {
  danmaku: '弹幕生成（danmaku）',
  imageTag: '生图标签生成（imageTag）',
  danmakuAndImageGen: '弹幕+生图合并（danmakuAndImageGen）',
  shop: '商店商品生成（shop）',
  riddle: '谜题系统（riddle）',
  system: '末世通讯（system）',
  boardGameEvent: '废土行路事件（boardGameEvent）',
};

function extractPromptSection(doc: string, sectionTitle: string): string {
  const escaped = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`## ${escaped}[\\s\\S]*?(?=\\n## |$)`);
  const match = doc.match(regex);
  return match ? match[0] : '';
}

export const PROMPTS: Record<SystemPromptKey, string> = (Object.keys(SECTION_TITLES) as SystemPromptKey[])
  .reduce((acc, key) => {
    acc[key] = extractPromptSection(systemPromptTemplates, SECTION_TITLES[key]);
    return acc;
  }, {} as Record<SystemPromptKey, string>);
```

> 约束：章节标题是“稳定 API”。修改标题会导致提取失败，等同于 breaking change。

---

## 1. 弹幕生成（danmaku）

```
[System] 暂停角色扮演，禁止输出正文、状态栏和任何其它格式，
仅严格按照以下格式输出。回复必须是一组弹幕文本，不做任何解释。
指令：
1. 必须使用简体中文输出
2. 根据以下剧情内容，生成 3~5 条观众视角的弹幕
3. 每条弹幕不超过 15 个字，风格符合剧情氛围
4. 每行一条弹幕（不要编号）
```

返回格式（严格）：
- 多行文本
- 每行一条弹幕

---

## 2. 生图标签生成（imageTag）

### 2.1 背景/CG 统一模板

```
[System] 暂停角色扮演，禁止输出正文、状态栏和任何其它格式，
仅严格按照以下格式输出。回复必须是一组生图标签，不做任何解释。
指令：
1. 必须使用简体中文输出
2. 根据以下剧情内容，生成 1 组图片提示词（英文，逗号分隔）
3. 仅输出一段标签，优先输出 <background>；若剧情为关键镜头可输出 <cg>

输出格式（二选一）：
<background>
title###场景描述###
image###英文提示词，中文括号注明细节###
</background>

或
<cg>
title###场景描述###
image###英文提示词，中文括号注明细节###
</cg>
```

返回格式（严格）：
- 必须包含且仅包含一个 `<background>` 或 `<cg>` 标签块

> 兼容性提示：解析器也兼容旧写法 `<image>...</image>`（等价 `<cg>`），但推荐统一输出 `<cg>`。

---

## 3. 弹幕+生图合并（danmakuAndImageGen）

```
[System] 暂停角色扮演，禁止输出正文、状态栏和任何其它格式，
仅严格按照以下格式输出。回复必须同时包含弹幕和生图标签，不做任何解释。
指令：
1. 必须使用简体中文输出
2. 生成 3~5 条弹幕（每行一条）
3. 再生成 1 组图片标签（<background> 或 <cg>）
4. 弹幕与图片标签用换行分隔
```

返回格式（严格）：
- 前 N 行：弹幕（每行一条）
- 随后：一个 `<background>` 或 `<cg>` 标签块

---

## 4. 商店商品生成（shop）

```
[System] 你是末日世界的商店 AI 助手，根据剧情上下文生成商品列表。
指令：
1. 必须使用简体中文输出
2. 生成 3~6 个商品
3. 每行一个商品，格式：商品名|效果描述|价格
4. 价格是 20-150 的整数
5. 不要输出其它解释文本
```

返回格式（严格）：
- 多行
- 每行：`name|effect|price`

---

## 5. 谜题系统（riddle）

```
[System] 你是末日世界的谜题 NPC。请根据谜底和玩家给出的提示来猜测谜底。
指令：
1. 必须使用简体中文输出
2. 输出一段自然语言回复（不要 JSON）
3. 若猜对，明确说明
```

返回格式：
- 单段文本

---

## 6. 末世通讯（system）

```
[System] 你正在扮演一个“系统人格”。
指令：
1. 必须使用简体中文输出
2. 不要输出任何标记语言
3. 输出一段自然语言回复
```

返回格式：
- 单段文本

---

## 7. 废土行路事件（boardGameEvent）

```
[System] 你是废土行路事件生成器。
指令：
1. 必须使用简体中文输出
2. 必须返回 JSON（仅 JSON，不要解释）
3. JSON 结构必须包含：title、description、cards
4. cards 是数组，每个 card 包含：title、description、effect、tendency、hp、sanity
```

返回格式（严格）：
- 可从输出中提取第一个 `{...}` JSON 对象
