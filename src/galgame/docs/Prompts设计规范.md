# Prompts 设计规范：防止 `allPrompts.ts` 退化为死代码

> 创建时间：2026-06-01
> 状态：规划中

## 1. 背景与现状

### 1.1 问题根源

`allPrompts.ts` 中的 prompt 定义与调用方在代码结构上是**完全分离的**：

- Prompt 模板在 `allPrompts.ts` 中孤立地定义
- 调用方在 `store.ts` / `index.ts` / `ShopModule.vue` 等处通过 `import` 引用
- 两边没有任何强制约束——prompt 可以定义后无人引用，调用方也可以绕过 `allPrompts.ts` 直接写字符串

这导致的后果就是：prompt 积累得越多，死代码比例越高，且难以发现。

### 1.2 当前 `allPrompts.ts` 实际使用情况

| 导出项                                                     | 状态                 | 使用方                                                |
| ---------------------------------------------------------- | -------------------- | ----------------------------------------------------- |
| `SYSTEM_PERSONALITIES`                                     | ✅ 使用中             | `store.ts`                                            |
| `RIDDLE_GAME_PROMPT_TEMPLATE` + `buildRiddlePrompt`        | ✅ 使用中             | `store.ts`                                            |
| `PROMPT_BOARD_GAME_EVENT_POOL`                             | ✅ 使用中             | `store.ts`                                            |
| `PROMPT_DANMAKU`                                           | ✅ 使用中             | `store.ts`                                            |
| `PROMPT_DANMAKU_AND_IMAGE`                                 | ✅ 使用中             | `index.ts`                                            |
| `PROMPT_SHOP`                                              | ✅ 使用中             | `store.ts`                                            |
| `PROMPT_WORKSHOP_ORDERS` + `buildWorkshopOrdersUserPrompt` | ✅ 使用中             | `store.ts`                                            |
| `buildDispatchPrompt`                                      | ✅ 使用中             | `store.ts`                                            |
| `buildChatPrompt`                                          | ✅ 使用中             | `CharacterManagementModule.vue`（角色确认后注册人格） |
| `registerAsPersonality`                                    | ✅ 使用中             | `CharacterManagementModule.vue`（角色确认后注册人格） |
| `formatRoleForAI`                                          | ✅ 使用中             | `CharacterManagementModule.vue`（角色确认后注册人格） |
| `formatRoleListForAI`                                      | ⚠️ 已迁移定义但未使用 | —                                                     |
| `PROMPT_IMAGE_TAG`                                         | ❌ 死代码             | —                                                     |
| `buildSkillGenerationSystemPrompt` / `buildBulk...`        | ❌ 死代码             | —                                                     |
| `buildSkillGenerationUserPrompt`                           | ❌ 死代码             | —                                                     |

**结论**：632 行代码中，约 40% 是死代码，且没有任何防止机制保证比例不会继续恶化。

---

## 2. 核心设计原则

### 原则一：每个 task 的 prompt 与调用方同构

不要把 prompt 分散到全局文件中统一管理。要把每个 task 的 **prompt 模板 + 构建函数** 打包到一个单元中。调用方只能使用这个包，无法绕过它。

### 原则二：任务配置对象化，参考 `generate()` 的 config 模式

每个 task 的上下文需求（发不发世界书、发多少聊天历史、用什么 system prompt）收敛到**一个配置对象**中，由 `callSecondApi` 内部统一拼装。调用方只传业务参数，不拼 `ordered_prompts`。

好处：改一个上下文参数只改一处；TypeScript 类型自动校验字段；调用方代码极简。

### 原则三：prompt 包必须包含使用链注释

每个 prompt 定义处必须写清楚：对应哪个 task、什么场景、调用链是什么。这样修改 prompt 时能直接定位到所有使用点。

### 原则四：按 task 拆分文件，不存在"在现有文件中随手加一行"的空间

每新增一个 task，必须新建一个文件。新增 prompt 只能追加到对应 task 文件中，不存在统一大文件的末尾追加空间。

### 原则五：未使用的 prompt 必须有明确的待实现标记

真正规划中但尚未实现的 prompt，不能和已使用的混在一起。必须打上 `@status 待实现` 标记，说明预计在什么功能中使用。

---

## 3. 目录结构设计

```
src/galgame/
  prompts/
    index.ts              # 统一导出，所有 task 的 prompt 入口
    danmaku.ts             # 弹幕生成
    shop.ts               # 商店商品
    boardGameEvent.ts      # 废土行路事件
    riddle.ts              # 猜谜游戏
    workshopOrder.ts       # 工坊订单
    dispatch.ts            # 派遣故事
    system.ts              # 末世通讯（NPC 人格 + 角色注册）
    imageTag.ts            # 生图标签（待实现）
    skill.ts               # 技能生成（待实现）
```

> 拆分后删除 `allPrompts.ts`。

---

## 4. 每个 prompt 文件的结构规范

每个 `prompts/*.ts` 必须包含以下两个部分：

### 4.1 文件头注释（使用链锚点）

```typescript
/**
 * 任务：danmaku（弹幕生成）
 * 调用链：triggerDanmakuForMessage() → callSecondApi('danmaku', ...)
 * 调用方：store.ts 第 2985 行
 * 状态：✅ 已实现
 */
```

### 4.2 Prompt 模板 + 构建函数

```typescript
export const PROMPT_DANMAKU = `[System] ...`;

export function buildDanmakuPrompts(
  userContent: string,
  contextPrompts: RolePrompt[],
): RolePrompt[] {
  return [
    ...contextPrompts,
    { role: 'system', content: PROMPT_DANMAKU },
    { role: 'user', content: userContent },
  ];
}
```

> 各 task 的结果处理（AI 输出格式出错时的容错）由调用方自行负责，不要求在 prompt 文件中提供统一的验证函数。

---

## 5. 各文件清单

### 5.1 `prompts/danmaku.ts`

- **状态**：✅ 已实现
- **Prompt**：`PROMPT_DANMAKU`
- **构建函数**：`buildDanmakuPrompts(userContent, contextPrompts)`

### 5.2 `prompts/shop.ts`

- **状态**：✅ 已实现
- **Prompt**：`PROMPT_SHOP`
- **构建函数**：`buildShopPrompts(contextPrompts, userPrompt?)`

### 5.3 `prompts/boardGameEvent.ts`

- **状态**：✅ 已实现
- **Prompt**：`PROMPT_BOARD_GAME_EVENT_POOL`
- **构建函数**：`buildBoardGamePrompts(sceneText, contextPrompts)`

### 5.4 `prompts/riddle.ts`

- **状态**：✅ 已实现
- **Prompt**：`RIDDLE_GAME_PROMPT_TEMPLATE`
- **构建函数**：`buildRiddlePrompts(personalityPrompt, chatLogText, latestHint)`
- **状态**：✅ 已实现（纯文本回复）

### 5.5 `prompts/workshopOrder.ts`

- **状态**：✅ 已实现
- **Prompt**：`PROMPT_WORKSHOP_ORDERS`
- **构建函数**：`buildWorkshopOrderPrompts(contextPrompts, userPrompt)`

### 5.6 `prompts/dispatch.ts`

- **状态**：✅ 已实现
- **Prompt**：`buildDispatchPrompt`（动态构建）
- **构建函数**：`buildDispatchPrompts(派遣角色列表, 派遣结果, 技能效果汇总, userPrompt)`
- **状态**：✅ 已实现（自由文本叙事）

### 5.7 `prompts/system.ts`

- **状态**：⚠️ 部分实现
- **数据**：`SYSTEM_PERSONALITIES`（固定人格，已实现）+ 角色人格注册（规划中）
- **构建函数**：`buildChatPrompt(角色档案文本, 聊天上下文)`
- **注册函数**：`registerAsPersonality(id, config)`
- **状态**：✅ 已实现（纯文本回复）

### 5.8 `prompts/imageTag.ts`

- **状态**：❌ 待实现
- **Prompt**：`PROMPT_IMAGE_TAG`
- **构建函数**：`buildImageTagPrompts(userContent, contextPrompts)`
- **预计使用**：独立生图标签生成功能（当前由 `danmakuAndImageGen` 合并调用）

### 5.9 `prompts/skill.ts`

- **状态**：❌ 待实现
- **Prompt**：`buildSkillGenerationSystemPrompt`、`buildBulkSkillGenerationSystemPrompt`
- **构建函数**：`buildSkillGenerationUserPrompt(params)`
- **预计使用**：技能标签生成（依赖角色生成系统完善后）

### 5.10 `prompts/role.ts` — 角色档案生成

- **状态**：✅ 已实现（代码在 `CharacterManagementModule.vue` 内）
- **Prompt 模板**：`ROLE_GENERATION_PROMPT_TEMPLATE`（骨架）
- **构建函数**：
  - `buildRoleGenerationPrompt(selectedFields, sceneDescription, extraRequirements)` — 组合骨架 + 动态参数
  - `buildRoleOutputFormatLine(selectedFields)` — 动态拼接 `CMD:ADD | 姓名 | 外貌 | ...` 格式行
- **调用方**：`CharacterManagementModule.vue` 第 571-593 行（`editablePrompt` computed）

**设计亮点：prompt 是数据驱动的 computed，不是静态字符串。**

当前实现中，`editablePrompt` 是一个 `computed`，根据用户选择的字段集合动态生成 prompt 骨架：

```typescript
const editablePrompt = computed(() => {
  const fields = ['属性', ...selectedFields.value].join('、');
  const extra = extraFieldRequirements.value.trim() || '...';
  const scene = sceneDescription.value.trim() ? `\n当前场景：...` : '';

  return `<system>
暂停角色扮演，禁止输出正文...
需要生成的字段：${fields}
${scene}
额外要求：
${extra}
输出格式（严格遵守，仅输出一组角色档案）：
<Character>
CMD:ADD | 姓名： | 外貌： | 性格： | ...
</Character>
格式说明：属性数值范围 0~5...
</system>`;
});
```

迁移策略：**骨架模板提取到 `prompts/role.ts`，动态逻辑留在 Vue 里**。这样做的好处是 UI 状态（字段选择、场景描述）无需迁移，而 prompt 模板的"说什么"部分集中管理。

迁移后 `prompts/role.ts` 提供：

```typescript
export const ROLE_GENERATION_PROMPT_TEMPLATE = `...`;

/** 模板变量：{{FIELDS}} {{SCENE}} {{EXTRA}} */
export function buildRoleGenerationPrompt(
  selectedFields: string[],
  sceneDescription: string,
  extraRequirements: string,
): string;

export function buildRoleOutputFormatLine(selectedFields: string[]): string;
```

`CharacterManagementModule.vue` 改造后：

```typescript
import { buildRoleGenerationPrompt } from '../../prompts/role';

// 骨架模板在 prompts/role.ts，Vue 只负责传 UI 状态参数
const editablePrompt = computed(() =>
  buildRoleGenerationPrompt(
    ['属性', ...selectedFields.value],
    sceneDescription.value,
    extraFieldRequirements.value,
  )
);
```

`system.ts` 中的 `buildChatPrompt` 和 `registerAsPersonality` 按原职责迁入；`formatRoleForAI` 和 `formatRoleListForAI` 迁入新建的 `prompts/roleFormat.ts`。

### 5.11 `prompts/roleFormat.ts` — 角色档案格式化

- **状态**：❌ 待实现（相关函数已在 `allPrompts.ts` 中定义）
- **文件**：新建 `prompts/roleFormat.ts`，与 `prompts/system.ts`（NPC 人格）、`prompts/role.ts`（角色档案生成）**职责严格分离**
- **职责边界**：
  - `prompts/roleFormat.ts` — 负责将角色档案（JSON/对象）格式化为 AI 可读的文本，专为需要人设注入的 task（如 `system`、`riddle`）提供格式化能力
  - `prompts/system.ts` — 负责 NPC 人格 system prompt 的定义与构建、角色注册逻辑
  - `prompts/role.ts` — 负责角色档案生成 prompt 骨架的构建
- **迁移函数**：`formatRoleForAI(role)`、`formatRoleListForAI(roles, 标题)` — 从 `allPrompts.ts` 迁入 `prompts/roleFormat.ts`
- **导出结构**：

```typescript
// prompts/roleFormat.ts
export function formatRoleForAI(role: RoleData): string;
export function formatRoleListForAI(roles: RoleData[], title?: string): string;
```

> `system.ts` 和 `riddle.ts` 按需导入 `roleFormat.ts`，不直接持有格式化逻辑。

---

## 6. 任务配置对象：向 `generate()` 看齐

### 6.1 问题

当前调用方式：

```typescript
// store.ts
const contextPrompts = await store.buildSecondApiContext({ includeChatHistory: true });
const raw = await store.callSecondApi('boardGameEvent', {
  ordered_prompts: [
    ...contextPrompts,
    { role: 'system', content: PROMPT_BOARD_GAME_EVENT_POOL },
    { role: 'user', content: `当前场景：${sceneText}` },
  ],
});

// CharacterManagementModule.vue
const contextPrompts = await store.buildSecondApiContext({ includeChatHistory: true });
const result = (await store.callSecondApi('roleProfile', {
  ordered_prompts: [
    ...contextPrompts,
    { role: 'system', content: editablePrompt.value },
  ],
})) as string;
```

每个调用方都要：
1. 手动调用 `buildSecondApiContext()`
2. 手动决定要不要聊天历史、要多少条
3. 手动拼 `ordered_prompts` 数组
4. 手动写死 system prompt

同一个 task 的上下文配置逻辑散落在多处，改一个参数（如"弹幕要不要发聊天历史"）要改多个文件。

### 6.2 改造目标

参考 `generate()` 的 config 模式，为每个 task 定义一个**任务配置对象**，调用方只需要：

```typescript
// 改造后（示例）
const raw = await store.callSecondApi('boardGameEvent', {
  scene: sceneText,
});
```

所有上下文构建（世界书过滤、聊天历史条数、system prompt 拼装）由 `callSecondApi` 内部完成。调用方只关心业务参数，不关心 prompt 拼装细节。

### 6.3 各 task 的上下文需求矩阵

|| task | 需要世界书 | 需要聊天历史 | 历史上限 | system prompt 来源 | user input 字段 |
|| --- | --- | --- | --- | --- | --- |
| `dispatchStory` | 自动注入（generate） | — | — | `buildDispatchPrompt()` | `userPrompt` |
| `workshopOrder` | ✅ 过滤后 | ❌ | — | `PROMPT_WORKSHOP_ORDERS` | `userPrompt` |
| `system` | ✅ 过滤后 | ❌ 自拼 | — | `personality.systemPrompt` | `userInput` |
| `shop` | ✅ 过滤后 | ✅ | 20 | `PROMPT_SHOP` | `'请生成废土风格的商店商品列表。'` |
| `boardGameEvent` | ✅ 过滤后 | ✅ | 20 | `PROMPT_BOARD_GAME_EVENT_POOL` | `sceneText` |
| `roleProfile` | ✅ 过滤后 | ✅ | 20 | 调用方构建 | `editablePrompt`（computed） |
| `riddle` | ❌ | ❌ 自拼 | — | `buildRiddlePrompt()` | `latestHint` |
| `danmaku` | ❌ | ❌ | — | `PROMPT_DANMAKU` | `contentText` |
| `danmakuAndImageGen` | ❌ | ❌ | — | `PROMPT_DANMAKU_AND_IMAGE` | `contentText` |
| `imageTag` | ❌ | ❌ | — | `PROMPT_IMAGE_TAG` | `sceneDescription` |

### 6.4 任务配置类型设计

```typescript
// ===== 通用 =====

/** 基础配置，所有 task 共用 */
interface BaseTaskConfig {
  /** 任务标识 */
  task: SecondApiTask;
  /** 是否静默（不透传 toast）；默认 false */
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
  /** system prompt 骨架（computed 拼出来的完整字符串） */
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
  /** 手动拼接的通讯历史 */
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

### 6.5 `callSecondApi` 内部改造

改造后 `callSecondApi` 接收 `SecondApiConfig` 联合类型，内部根据 `task` 分发：

```typescript
async function callSecondApi(config: SecondApiConfig) {
  const { task, silent = false } = config;

  switch (task) {
    case 'danmaku':
    case 'danmakuAndImageGen': {
      const { contentText } = config;
      const ordered_prompts = [
        { role: 'system', content: config.task === 'danmaku' ? PROMPT_DANMAKU : PROMPT_DANMAKU_AND_IMAGE },
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
      return rawCall(task, [{ role: 'system', content: systemPrompt }, { role: 'user', content: '请回复你的猜测。' }], silent);
    }

    case 'system': {
      const personality = SYSTEM_PERSONALITIES.find(p => p.id === config.personalityId);
      if (!personality) return silent ? '' : [];
      const ordered_prompts: RolePrompt[] = [
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

### 6.6 调用方改造

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

### 6.7 好处

1. **上下文需求一目了然** — 每个 task 的配置类型里清楚写了要不要世界书、要多少聊天历史，TypeScript 自动提示
2. **改一个参数只改一处** — 比如"所有需要聊天历史的 task 都改成 30 条"，只需要改 `callSecondApi` 内部的 `maxChatHistory` 常量
3. **消除重复拼装代码** — `buildSecondApiContext` 调用、`ordered_prompts` 拼装逻辑全部收敛到 `callSecondApi` 内部
4. **TypeScript 类型安全** — 传错字段（`sceneText` 写成 `scene`）直接报错，不用等到运行时才发现
5. **可选参数有默认值** — `silent` 等辅助字段不需要每次都传

---

## 7. 调用方改造要求

改造后，调用方使用 prompt 的方式：

```typescript
// ❌ 旧方式（绕过 prompt 包）
import { PROMPT_DANMAKU } from '../prompts/danmaku';
callSecondApi('danmaku', {
  ordered_prompts: [
    ...contextPrompts,
    { role: 'system', content: PROMPT_DANMAKU },
    { role: 'user', content: contentText },
  ],
});

// ✅ 新方式（通过构建函数）
import { buildDanmakuPrompts } from '../prompts/danmaku';
const ordered_prompts = buildDanmakuPrompts(contentText, contextPrompts);
const result = await callSecondApi('danmaku', { ordered_prompts });
const lines = validateDanmakuOutput(result as string);
```

好处：
- 构建逻辑和 prompt 模板在同一文件，修改 prompt 时上下文一目了然
- 如果 `buildDanmakuPrompts` 不被任何地方调用，TypeScript 的 `--noUnusedLocals` 会报警

---

## 8. 迁移计划

### 第一阶段：任务配置对象改造（高优先级）

`callSecondApi` 从接收 `SecondApiPayload`（裸 `ordered_prompts` 数组）改为接收 `SecondApiConfig` 联合类型，拆分两个文件：

1. 新建 `src/galgame/prompts/` 目录
2. 从 `allPrompts.ts` 迁移已实现的 prompt（danmaku、shop、boardGameEvent、riddle、workshopOrder、dispatch）
3. 将 `SYSTEM_PERSONALITIES` + `buildChatPrompt` + `registerAsPersonality` 移入 `prompts/system.ts`
4. 新建 `prompts/roleFormat.ts`，迁入 `formatRoleForAI` + `formatRoleListForAI`（职责：角色档案→AI可读文本，专为 `system`、`riddle` 等 task 提供格式化能力）
5. 从 `CharacterManagementModule.vue` 抽取角色档案生成的骨架模板到 `prompts/role.ts`：
   - `ROLE_GENERATION_PROMPT_TEMPLATE` — 提取骨架
   - `buildRoleGenerationPrompt()` — 组合骨架 + 动态参数
   - `buildRoleOutputFormatLine()` — 动态拼接 CMD 格式行
6. 定义 `SecondApiConfig` 联合类型，将上下文构建逻辑（`buildSecondApiContext` 调用、`ordered_prompts` 拼装）全部收敛到 `callSecondApi` 内部
7. 更新所有调用方，改用任务配置对象
8. 删除 `allPrompts.ts`

### 第二阶段：清理死代码（低优先级）

确认 `imageTag`、`skill` 两个文件中的待实现 prompt 是否仍有规划价值，若无则删除。

---

## 9. 相关文档

- `第二API-Prompt重构规划.md` — 已有改造路线图
- `第二API调用方式规划.md` — 各 task 的调用方式速查
