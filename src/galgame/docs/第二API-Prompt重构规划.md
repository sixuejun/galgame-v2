# 第二 API Prompt 重构规划文档

> 创建时间：2026-06-01
> 更新时间：2026-06-02（重写，对齐「第二API调用方式规划」和「Prompts设计规范」）

## 1. 目标

1. 放弃使用"预设"作为系统 prompt 的来源，将所有 AI 任务的系统指令统一收敛到代码中管理
2. 将 `allPrompts.ts` 按 task 拆分为 `prompts/*.ts`，每个 task 的 prompt 模板 + 构建函数打包到一个单元中
3. `callSecondApi` 改为接收配置对象，内部统一拼装 `ordered_prompts`，调用方只传业务参数
4. 修复 `workshopOrder` 和 `dispatchStory` 的 `contentText` 被丢弃的 bug

### 与其他文档的关系


| 文档             | 定位                                                             |
| -------------- | -------------------------------------------------------------- |
| 第二API调用方式规划.md | 各 task 的调用方式（`generate()` / `generateRaw()`）和世界书过滤引擎设计，本文档以此为准 |
| Prompts设计规范.md | `prompts/*.ts` 文件结构和 `callSecondApi` config 对象模式的设计规范，本文档以此为准  |
| 本文档            | 将上述两份规划落地为实际的改造步骤                                              |


---

## 2. 核心设计决策

### 2.1 `ordered_prompts` 内容：实际内容对象，非占位符

`generateRaw()` 的 `ordered_prompts` 中，PlaceholderPrompt 字符串（如 `'world_info_after'`）会被**原样作为文本发给 AI**，不会自动解析。

因此，`buildSecondApiContext()` 返回的是**格式化好的 `RolePrompt[]`**（实际内容），调用方将它们直接塞进 `ordered_prompts`。

### 2.2 世界书过滤：自定义轻量激活引擎

采用文档1 中设计的自实现激活引擎（`buildSecondApiContext` 内部），完整支持：

- `targetApi` 过滤（`'main'` / `'second'` / `'both'`）
- `tags` 标签多选（9种标签，映射到各 task）
- 关键词匹配 + 次要关键词匹配
- 每个条目独立的 `scanDepth`
- 概率控制
- 按 `order` 降序排列

不使用 `generateRaw` 的占位符解析机制，避免酒馆内置引擎的副作用。

### 2.3 `callSecondApi` 职责：配置对象分发器

`callSecondApi` 接收 `SecondApiConfig` 联合类型，内部根据 `task` 分发：

- 调用 `buildSecondApiContext()` 获取过滤后的世界书
- 拼接 `ordered_prompts`
- 调用 `generateRaw()`
- 解析结果

调用方只传业务参数（如 `sceneText`、`userPrompt`），不拼 `ordered_prompts`。

---

## 3. 目录结构

```
src/galgame/
  prompts/
    index.ts              # 统一导出，所有 task 的 prompt 入口
    danmaku.ts            # 弹幕生成
    shop.ts               # 商店商品
    boardGameEvent.ts     # 废土行路事件
    riddle.ts             # 猜谜游戏
    workshopOrder.ts      # 工坊订单
    dispatch.ts          # 派遣故事
    system.ts             # 末世通讯（NPC 人格 + 角色注册）
    imageTag.ts           # 生图标签（待实现）
    skill.ts              # 技能生成（待实现）
    roleFormat.ts         # 角色档案格式化（formatRoleForAI 等）
    role.ts               # 角色档案生成
```

> 拆分后删除 `allPrompts.ts`。

---

## 4. 各 task 改造清单

### 4.1 `dispatchStory`（派遣结算叙事）

- **调用方式**：`generate()`（世界书自动注入）
- **prompt 来源**：`prompts/dispatch.ts` 的 `buildDispatchPrompt()`
- **修复**：`buildDispatchPrompt` 已在 `allPrompts.ts` 定义但从未被调用，改造后启用
- **调用方**：`store.ts`（`generateDispatchStory`）

### 4.2 `workshopOrder`（工坊订单生成）

- **调用方式**：`generateRaw()`
- **上下文**：世界书（过滤后） + 角色设定（`buildSecondApiContext`）
- **prompt 来源**：`prompts/workshopOrder.ts`（`PROMPT_WORKSHOP_ORDERS` + `buildWorkshopOrderPrompts`）
- **修复**：`contentText` 参数被丢弃的 bug —— 改造后通过 config 对象的 `userPrompt` 字段正确传递
- **调用方**：`store.ts`（`generateWorkshopOrder`）

### 4.3 `system`（末世通讯）

- **调用方式**：`generateRaw()`
- **上下文**：世界书（过滤后）+ 独立聊天历史（`systemChatHistories`，不走 `buildSecondApiContext` 的聊天历史）
- **prompt 来源**：`prompts/system.ts`（`SYSTEM_PERSONALITIES` + `buildChatPrompt` + `registerAsPersonality`）
- **角色档案注册**：角色确认后自动调用 `registerAsPersonality()`，将角色注册为通讯人格
- **调用方**：`store.ts`

### 4.4 `shop`（商店商品生成）

- **调用方式**：`generateRaw()`
- **上下文**：世界书（过滤后）+ 聊天历史（最近 20 条）
- **prompt 来源**：`prompts/shop.ts`（`PROMPT_SHOP`）
- **修复**：`contentText` 参数被丢弃的 bug
- **调用方**：`ShopModule.vue`

### 4.5 `boardGameEvent`（废土行路事件生成）

- **调用方式**：`generateRaw()`
- **上下文**：世界书（过滤后）+ 聊天历史（最近 20 条）
- **prompt 来源**：`prompts/boardGameEvent.ts`（`PROMPT_BOARD_GAME_EVENT_POOL`）
- **调用方**：`store.ts`（`generateBoardGameEvent`）

### 4.6 `roleProfile`（角色档案生成）

- **调用方式**：`generateRaw()`
- **上下文**：世界书（过滤后）+ 聊天历史（最近 20 条）
- **prompt 来源**：
  - system prompt：`prompts/role.ts`（`ROLE_GENERATION_PROMPT_TEMPLATE` + `buildRoleGenerationPrompt`）
  - 角色档案格式化：`prompts/roleFormat.ts`（`formatRoleForAI`）
- **调用方**：`CharacterManagementModule.vue`（`editablePrompt` computed）、`roleGenerator.ts`

### 4.7 `riddle`（猜谜游戏）

- **调用方式**：`generateRaw()`
- **上下文**：角色档案人设（无世界书）——由调用方传入 `personalityPrompt`
- **prompt 来源**：`prompts/riddle.ts`（`RIDDLE_GAME_PROMPT_TEMPLATE` + `buildRiddlePrompt`）
- **调用方**：`store.ts`（`requestRiddleAiReply`）

### 4.8 `danmaku`（弹幕生成）

- **调用方式**：`generateRaw()`
- **上下文**：无世界书，无聊天历史
- **prompt 来源**：`prompts/danmaku.ts`（`PROMPT_DANMAKU`）
- **调用方**：`index.ts`

### 4.9 `danmakuAndImageGen`（弹幕+生图合并）

- **调用方式**：`generateRaw()`
- **上下文**：无世界书，无聊天历史
- **prompt 来源**：`prompts/danmaku.ts`（`PROMPT_DANMAKU_AND_IMAGE`）
- **调用方**：`index.ts`

### 4.10 `imageTag`（生图标签生成）

- **调用方式**：`generateRaw()`
- **上下文**：无世界书，无聊天历史
- **prompt 来源**：`prompts/imageTag.ts`（`PROMPT_IMAGE_TAG`）
- **状态**：❌ 待实现（只在 `danmakuAndImageGen` 中合并使用）

---

## 5. `callSecondApi` 改造

### 5.1 配置对象类型

```typescript
// ===== 通用 =====

interface BaseTaskConfig {
  task: SecondApiTask;
  silent?: boolean;
}

// ===== 各 task 专属配置 =====

interface DispatchStoryConfig extends BaseTaskConfig {
  task: 'dispatchStory';
  userPrompt: string;
}

interface WorkshopOrderConfig extends BaseTaskConfig {
  task: 'workshopOrder';
  userPrompt: string;
}

interface ShopConfig extends BaseTaskConfig {
  task: 'shop';
}

interface BoardGameEventConfig extends BaseTaskConfig {
  task: 'boardGameEvent';
  sceneText: string;
}

interface RoleProfileConfig extends BaseTaskConfig {
  task: 'roleProfile';
  systemPrompt: string;
}

interface RiddleConfig extends BaseTaskConfig {
  task: 'riddle';
  personalityPrompt: string;
  chatLogText: string;
  latestHint: string;
}

interface SystemConfig extends BaseTaskConfig {
  task: 'system';
  personalityId: string;
  manualHistory: RolePrompt[];
  userInput: string;
}

interface DanmakuConfig extends BaseTaskConfig {
  task: 'danmaku' | 'danmakuAndImageGen';
  contentText: string;
}

interface ImageTagConfig extends BaseTaskConfig {
  task: 'imageTag';
  sceneDescription: string;
}

// ===== 联合类型 =====

type SecondApiConfig =
  | DispatchStoryConfig
  | WorkshopOrderConfig
  | ShopConfig
  | BoardGameEventConfig
  | RoleProfileConfig
  | RiddleConfig
  | SystemConfig
  | DanmakuConfig
  | ImageTagConfig;
```

### 5.2 `callSecondApi` 内部逻辑

```typescript
async function callSecondApi(config: SecondApiConfig) {
  const { task, silent = false } = config;

  switch (task) {
    case 'danmaku':
    case 'danmakuAndImageGen': {
      const { contentText } = config;
      const ordered_prompts = [
        { role: 'system', content: task === 'danmaku' ? PROMPT_DANMAKU : PROMPT_DANMAKU_AND_IMAGE },
        { role: 'user', content: contentText },
      ];
      return rawCall(task, ordered_prompts, silent);
    }

    case 'shop': {
      const context = await buildSecondApiContext({ maxChatHistory: 20 });
      const ordered_prompts = [
        ...context,
        { role: 'system', content: PROMPT_SHOP },
        { role: 'user', content: '请生成废土风格的商店商品列表。' },
      ];
      return rawCall(task, ordered_prompts, silent);
    }

    case 'boardGameEvent': {
      const { sceneText } = config;
      const context = await buildSecondApiContext({ maxChatHistory: 20 });
      const ordered_prompts = [
        ...context,
        { role: 'system', content: PROMPT_BOARD_GAME_EVENT_POOL },
        { role: 'user', content: `当前场景：${sceneText}` },
      ];
      return rawCall(task, ordered_prompts, silent);
    }

    case 'roleProfile': {
      const { systemPrompt } = config;
      const context = await buildSecondApiContext({ maxChatHistory: 20 });
      return rawCall(task, [...context, { role: 'system', content: systemPrompt }], silent);
    }

    case 'riddle': {
      const { personalityPrompt, chatLogText, latestHint } = config;
      const systemPrompt = buildRiddlePrompt(personalityPrompt, chatLogText, latestHint);
      return rawCall(task, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: '请回复你的猜测。' },
      ], silent);
    }

    case 'system': {
      const personality = SYSTEM_PERSONALITIES.find(p => p.id === config.personalityId);
      if (!personality) return silent ? '' : [];
      const context = await buildSecondApiContext({ includeWorldbook: true });
      const ordered_prompts: RolePrompt[] = [
        ...context,
        { role: 'system', content: personality.systemPrompt },
        ...config.manualHistory,
        { role: 'user', content: config.userInput },
      ];
      return rawCall(task, ordered_prompts, silent);
    }

    case 'workshopOrder': {
      const { userPrompt } = config;
      const context = await buildSecondApiContext({ includeWorldbook: true, includeCharDescription: true });
      const ordered_prompts = [
        ...context,
        { role: 'system', content: PROMPT_WORKSHOP_ORDERS },
        { role: 'user', content: userPrompt },
      ];
      return rawCall(task, ordered_prompts, silent);
    }

    case 'dispatchStory': {
      const { userPrompt } = config;
      // dispatchStory 走 generate()，世界书自动注入
      const result = await generate({ user_input: userPrompt });
      return result;
    }

    default:
      throw new Error(`Unknown task: ${(config as any).task}`);
  }
}
```

其中 `rawCall` 封装了 API 配置、超时、重试、结果解析的通用逻辑。

### 5.3 调用方改造

改造后调用方干净得多：

```typescript
// store.ts — 废土行路
const raw = await callSecondApi({
  task: 'boardGameEvent',
  sceneText: sceneText,
});

// store.ts — 商店
const items = await callSecondApi({ task: 'shop' });

// store.ts — 猜谜
const reply = await callSecondApi({
  task: 'riddle',
  personalityPrompt: personality.systemPrompt,
  chatLogText: chatLogText,
  latestHint: hint,
});

// CharacterManagementModule.vue — 角色生成
const result = await store.callSecondApi({
  task: 'roleProfile',
  systemPrompt: editablePrompt.value,
});
```

---

## 6. `allPrompts.ts` 迁移清单


| 序号  | 名称                                                         | 当前状态                              | 改造后状态       | 迁移目标文件                      |
| --- | ---------------------------------------------------------- | --------------------------------- | ----------- | --------------------------- |
| 1   | `SYSTEM_PERSONALITIES`                                     | 已存在，使用中                           | 保留使用        | `prompts/system.ts`         |
| 2   | `RIDDLE_GAME_PROMPT_TEMPLATE` + `buildRiddlePrompt`        | 已存在，使用中                           | 保留使用        | `prompts/riddle.ts`         |
| 3   | `PROMPT_BOARD_GAME_EVENT_POOL`                             | 已存在，使用中                           | 保留使用        | `prompts/boardGameEvent.ts` |
| 4   | `PROMPT_DANMAKU`                                           | 已定义，未使用                           | 改为使用        | `prompts/danmaku.ts`        |
| 5   | `PROMPT_DANMAKU_AND_IMAGE`                                 | 已定义，未使用                           | 改为使用        | `prompts/danmaku.ts`        |
| 6   | `PROMPT_IMAGE_TAG`                                         | 已定义，未使用                           | 待实现（拆分结构即可） | `prompts/imageTag.ts`       |
| 7   | `PROMPT_SHOP`                                              | 已定义，未使用                           | 改为使用        | `prompts/shop.ts`           |
| 8   | `PROMPT_RIDDLE_SYSTEM`                                     | 已定义，未使用                           | 可删除         | —                           |
| 9   | `PROMPT_SYSTEM`                                            | 已定义，未使用                           | 可删除         | —                           |
| 10  | `PROMPT_WORKSHOP_ORDERS` + `buildWorkshopOrdersUserPrompt` | 已定义，未使用                           | 改为使用        | `prompts/workshopOrder.ts`  |
| 11  | `buildDispatchPrompt`                                      | 已定义，未使用                           | 改为使用        | `prompts/dispatch.ts`       |
| 12  | `buildChatPrompt` + `registerAsPersonality`                | 部分存在，未完成                          | 完善并使用       | `prompts/system.ts`         |
| 13  | `formatRoleForAI` + `formatRoleListForAI`                  | 在角色系统详细设计中                        | 迁移使用        | `prompts/roleFormat.ts`     |
| 14  | `ROLE_GENERATION_PROMPT_TEMPLATE`                          | 在 `roleGenerator.ts`              | 迁移使用        | `prompts/role.ts`           |
| 15  | `buildRoleGenerationPrompt` + `buildRoleOutputFormatLine`  | 在 `CharacterManagementModule.vue` | 迁移使用        | `prompts/role.ts`           |
| 16  | `buildSkillGenerationSystemPrompt` 等                       | 已定义，未使用                           | 待实现         | `prompts/skill.ts`          |


---

## 7. `store.ts` 改造要点

### 7.1 简化 `callSecondApi` 函数

删除以下逻辑：

1. 预设加载/切换逻辑（`presetName`、`loadPreset`、`getLoadedPresetName` 相关代码）
2. 任务控制变量逻辑（`secondApiTaskControl` 的设置与恢复）
3. 各 task 的 `ordered_prompts` 分支处理——改为在 `callSecondApi` 内部按 config 对象拼装
4. `usePreset` 判断逻辑

### 7.2 世界书过滤引擎（保持不变）

`filterAndApplyWorldbookForSecondApi()` 的行为不变，改为在 `buildSecondApiContext` 内部实现（见文档1 第 4-5 节）。

### 7.3 修复 `workshopOrder` 和 `dispatchStory` 的 bug

当前这两个 task 传入的 `contentText`（即 `userPrompt`）被丢弃，改造后通过 config 对象的 `userPrompt` 字段正确传递。

---

## 8. 死代码清理

### 删除文件

以下文件已无任何调用方，可删除：

- `src/galgame/utils/api/secondApiClient.ts`
- `src/galgame/utils/api/danmakuApi.ts`
- `src/galgame/utils/api/imageGenApi.ts`
- `src/galgame/dispatch/dispatchApiClient.ts`

### 删除 `store.ts` 中的代码

- `secondApiTaskControl` ref 及其 watchEffect
- `secondApiTaskControl` 的设置/恢复代码
- 预设加载/切换相关代码
- 任务控制变量相关的注释
- `buildBoardGamePrompts` 函数（不再需要，调用方只传 sceneText）
- 已迁移到 `prompts/*.ts` 的所有 prompt 定义

---

## 9. 改造顺序

### 第一阶段：准备（prompt 迁移）

1. 新建 `src/galgame/prompts/` 目录
2. 从 `allPrompts.ts` 迁移已实现的 prompt（danmaku、shop、boardGameEvent、riddle、workshopOrder、dispatch）
3. 将 `SYSTEM_PERSONALITIES` + `buildChatPrompt` + `registerAsPersonality` 移入 `prompts/system.ts`
4. 新建 `prompts/roleFormat.ts`，迁入 `formatRoleForAI` + `formatRoleListForAI`
5. 从 `CharacterManagementModule.vue` 抽取角色档案生成的骨架模板到 `prompts/role.ts`
6. 定义 `SecondApiConfig` 联合类型（放在 `prompts/index.ts` 或新建 `types/secondApi.ts`）

### 第二阶段：`callSecondApi` 改造（核心）

1. 改造 `store.ts` 的 `callSecondApi` 函数——接收 `SecondApiConfig`，内部按 task 分发拼装 `ordered_prompts`
2. 改造所有调用方（`index.ts`、`ShopModule.vue`、`CharacterManagementModule.vue`、`store.ts` 内部各函数）
3. 删除所有 task 专属的旧 payload 类型

### 第三阶段：通讯系统升级

1. 在角色确认后调用 `registerAsPersonality()` 实现自动注册
2. 在角色类型中新增可选的 `主动发言` 字段

### 第四阶段：收尾

1. 删除死代码文件（`secondApiClient.ts` 等）
2. 删除 `store.ts` 中的废弃代码
3. 删除 `allPrompts.ts`
4. 更新 `SecondApiPayload` 相关类型定义

---

## 10. 各 task 上下文需求速查


| task                 | 调用方式            | 世界书   | 聊天历史  | system_prompt 来源               | user input 字段      |
| -------------------- | --------------- | ----- | ----- | ------------------------------ | ------------------ |
| `dispatchStory`      | `generate()`    | 自动注入  | —     | `buildDispatchPrompt()`        | `userPrompt`       |
| `workshopOrder`      | `generateRaw()` | ✅ 过滤后 | ❌     | `PROMPT_WORKSHOP_ORDERS`       | `userPrompt`       |
| `system`             | `generateRaw()` | ✅ 过滤后 | ❌ 自拼  | `personality.systemPrompt`     | `userInput`        |
| `shop`               | `generateRaw()` | ✅ 过滤后 | ✅ 20条 | `PROMPT_SHOP`                  | 固定指令               |
| `boardGameEvent`     | `generateRaw()` | ✅ 过滤后 | ✅ 20条 | `PROMPT_BOARD_GAME_EVENT_POOL` | `sceneText`        |
| `roleProfile`        | `generateRaw()` | ✅ 过滤后 | ✅ 20条 | 调用方构建                          | `systemPrompt`     |
| `riddle`             | `generateRaw()` | ❌     | ❌ 自拼  | `buildRiddlePrompt()`          | `latestHint`       |
| `danmaku`            | `generateRaw()` | ❌     | ❌     | `PROMPT_DANMAKU`               | `contentText`      |
| `danmakuAndImageGen` | `generateRaw()` | ❌     | ❌     | `PROMPT_DANMAKU_AND_IMAGE`     | `contentText`      |
| `imageTag`           | `generateRaw()` | ❌     | ❌     | `PROMPT_IMAGE_TAG`             | `sceneDescription` |


---

## 11. 参考资料

- 第二API调用方式规划.md — 各 task 的调用方式和世界书过滤引擎设计
- Prompts设计规范.md — prompts 目录结构和 config 对象模式设计规范
- 参考实现：`参考/regex-💎同层系统_-_独立api版@鹊知风.json`
- 核心调用入口：`src/galgame/store.ts` 第 2781 行（`callSecondApi`）
- 世界书过滤：`store.ts` `buildSecondApiContext`
- 角色生成 prompt：`src/galgame/utils/roleGenerator.ts`
- 角色档案格式化：角色系统详细设计.md 第 6.2 节

