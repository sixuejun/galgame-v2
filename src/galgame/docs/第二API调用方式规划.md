# 第二 API 调用方式规划

## 概述

`generate()` 和 `generateRaw()` 的核心区别：


| 函数            | 世界书/聊天/角色卡                             | 控制粒度                                  | 适用场景                 |
| --------------- | ---------------------------------------------- | ----------------------------------------- | ------------------------ |
| `generate()`    | **自动注入**（走酒馆生成管道）                 | 粗粒度（通过 `injects`/`overrides` 调整） | 需要沉浸感的 NPC 对话    |
| `generateRaw()` | **完全手动**（`ordered_prompts` 原样发给 API） | 细粒度（精确控制每个 prompt 组件）        | 需要格式控制的结构化输出 |


`generateRaw()` 的 `ordered_prompts` 中，PlaceholderPrompt 字符串（如 `'world_info_after'`）会被**原样作为文本发给 AI**，不会自动解析。因此需要手动获取实际内容，构建真实的 `RolePrompt` 对象。

---

## 任务分类

### `generate()`

#### dispatchStory

**任务**：根据派遣结算记录生成叙事文本。

**调用方式**：`generate({ user_input: ..., custom_api, max_chat_history: all })`

**理由**：生成的是故事叙述，不需要精确格式。世界书、聊天历史、角色卡全部走酒馆自动注入，沉浸感最好。只需在 `user_input` 中传入派遣记录的结构化文本即可。

---

### `generateRaw()` + 世界书

#### workshopOrder

**任务**：根据工坊状态和世界背景生成技能订单。

**调用方式**：`generateRaw({ ordered_prompts: [...世界书, ...角色设定, system_prompt, user_prompt], custom_api })`

**理由**：需要世界背景作为题材参考，但不强制需要聊天历史。`buildSecondApiContext()` 负责获取世界书和角色设定，`user_prompt` 传入工坊上下文（当前工坊等级、已有技能等）。

---

### `generateRaw()` + 手动上下文 + 世界书

#### system

**任务**：玩家与 NPC 角色的对话回复。

**调用方式**：`generateRaw({ ordered_prompts: [...世界书, ...聊天历史, system_prompt, user_input], custom_api })`

**理由**：`system` 模块有自己独立的聊天历史管理（`systemChatHistories`），但世界书需要手动注入。`buildSecondApiContext()` 获取世界书，`chat_history` 由调用方手动构建。

#### shop

**任务**：生成商店商品列表（管道分隔格式）。

**调用方式**：`generateRaw({ ordered_prompts: [...世界书, ...聊天历史, system_prompt, user_prompt], custom_api })`

**理由**：需要世界背景和当前聊天上下文来决定商品风格和合理性。格式控制严格（管道分隔），`generateRaw()` 提供精确控制。

#### boardGameEvent

**任务**：生成废土行路事件池（20-30 张卡，管道分隔格式）。

**调用方式**：`generateRaw({ ordered_prompts: [...世界书, ...聊天历史, system_prompt, user_prompt], custom_api })`

**理由**：需要世界背景提供事件题材灵感，聊天上下文提供当前场景信息。格式控制严格，`generateRaw()` 确保 prompt 结构稳定。

#### roleProfile

**任务**：根据场景描述生成角色档案（`<Character>CMD:ADD|...</Character>` 格式）。

**调用方式**：`generateRaw({ ordered_prompts: [...世界书, ...聊天历史, system_prompt, user_prompt], custom_api })`

**理由**：`CMD` 格式必须精确遵循，输出是结构化数据而非自由文本。`generateRaw()` 提供完全控制。场景描述和角色档案模板通过 `user_prompt` 传入。

---

### `generateRaw()` + 角色档案人设

#### riddle

**任务**：猜谜游戏中 AI 角色的回复生成。

**调用方式**：`generateRaw({ ordered_prompts: [system_prompt_with_persona, user_prompt], custom_api })`

**system_prompt 构建方式**：`buildRiddlePrompt(personalityPrompt, chatLogText, latestHint)`

其中 `personalityPrompt` 的来源如下：

```typescript
// 1. 从酒馆变量读取当前 riddle 的角色档案对象
const roleData = getVariables({ type: 'script', script_id: 'riddle' }).roleData;

// 2. 通过格式化函数将角色档案转为 AI 可读人设文本
const personalityPrompt = formatRoleForAI(roleData);

// 3. 将人设文本注入猜谜规则 prompt
const systemPrompt = buildRiddlePrompt(
  personalityPrompt,   // 已格式化的角色人设
  chatLogText,         // 当前猜谜聊天记录摘要
  latestHint           // 最新谜面提示
);
```

**理由**：猜谜游戏有独立的聊天历史系统（`systemChatHistories`），不需要世界书，也不需要全局聊天历史。AI 的人设从角色档案中读取，先经 `formatRoleForAI()` 格式化为纯文本，再注入到 `buildRiddlePrompt()` 生成的 system prompt 中。

> `formatRoleForAI` 定义在 `prompts/roleFormat.ts`（迁移后），调用方需从该文件导入。

---

### `generateRaw()` + 最新剧情文本（变量） + 世界书

#### danmaku（弹幕抽取）

**任务**：从最新剧情文本中抽取弹幕候选。

**调用方式**：`generateRaw({ ordered_prompts: [...世界书, system_prompt_with_recent_plot, user_prompt], custom_api })`

**理由**：`user_input` 即最新楼层的消息内容（`extractContentTag` 提取的 `<content>` 标签文本）。世界书提供题材语境。`system_prompt` 可以注入最近剧情摘要（从酒馆变量读取），帮助 AI 理解当前场景。

#### imageTag（生图标签生成）

**任务**：根据场景描述生成图像标签。

**调用方式**：`generateRaw({ ordered_prompts: [...世界书, system_prompt_with_recent_plot, user_prompt], custom_api })`

**理由**：和 `danmaku` 类似，`user_input` 是场景描述文本。世界书提供图像风格参考。最新剧情文本（酒馆变量）作为 `system_prompt` 上下文。

---

## 上下文构建函数

### `buildSecondApiContext(options?)`

**来源**：`store.ts`

**职责**：手动获取三类实际内容，返回 `RolePrompt[]`

```typescript
async function buildSecondApiContext(options?: {
  worldbookFilter?: (entry: WorldbookEntryEnhanced) => boolean;
  maxChatHistory?: number;
  includeWorldbook?: boolean;
  includeChatHistory?: boolean;
}): Promise<{ role: 'system'; content: string }[]>
```

**行为**：

- **世界书**：`getEnhancedWorldbook()` → 按 `targetApi` 过滤（默认仅 `'second'` 或 `'both'`）→ 按 `【名称】\n内容` 格式拼接
- **角色设定**：`getCharacter('current')` → 取 `description` 字段
- **聊天历史**：`getChatMessages()` → 按 `[角色名] 消息` 格式拼接最近 N 条

### 轻量上下文构建（`system` / `riddle`）

由调用方自行构建，不走 `buildSecondApiContext`：

- `**system`**：使用 `systemChatHistories` 中的独立聊天记录
- `**riddle`**：使用 `systemChatHistories` + 角色档案人设

### 剧情变量注入（`danmaku` / `imageTag`）

从酒馆变量读取最新剧情摘要，注入为 `system` prompt 的一部分。

---

## 世界书管理（过滤）机制

### 设计背景

酒馆本身有一套完整的世界书"绿灯激活机制"（关键词匹配、扫描深度、注入位置、优先级、概率控制），由 `SillyTavern.getWorldInfoPrompt()` 实现。但直接复用该函数存在以下问题：

- **副作用**：会写入 timed-effects 状态（sticky、cooldown、delay），影响后续主 API 生成
- **position 无意义**：主 API 的 `before_char` / `after_char` / `ANTop` / `ANBottom` 注入位置对第二 API 的手动 prompt 结构不适用
- **概率/budget 全局共享**：可能与主 API 调用互相干扰

因此，第二 API 采用**自实现的轻量版激活引擎**，只复刻必要的功能，无副作用，完全可控。

### 现有数据结构

世界书条目通过 `WorldbookEntryEnhanced` 接口扩展了以下自定义字段（存储在酒馆条目原生的 `extra` 对象中）：

```typescript
// store.ts 第 176 行
export interface WorldbookEntryEnhanced {
  uid: number;
  enabled: boolean;
  targetApi: 'main' | 'second' | 'both';  // 目标 API
  tags?: string[];  // 关联功能标签（多选）
  // ... 原有世界书字段（key, keysecondary, scanDepth, order, probability 等）
  [key: string]: any;
}
```

现有 UI（`WorldbookManagerPanel.vue`）中，每条世界书条目已有以下控制项：

| 控制项     | 字段                  | 说明        |
| -------- | ------------------- | --------- |
| 启用/禁用  | `enabled`            | 条目开关      |
| 目标 API  | `targetApi`          | 主 API / 第二 API / 两者都 |
| 关联功能   | `tags`               | 多选标签，决定条目在哪些 task 下生效 |

### 演进方向：标签系统

将现有的 `linkedFeature` 字段（仅支持 `'danmaku' | 'imageGen'` 二选一）扩展为**标签多选** `tags: string[]`，支持用户为每条世界书条目打上任意多个标签。扩展后的标签列表如下：

| 标签值      | 含义            | 关联的 task            |
| --------- | ------------- | ------------------- |
| `'弹幕'`    | 弹幕生成相关         | `danmaku`            |
| `'生图'`    | 生图标签生成相关        | `imageTag`           |
| `'商店'`    | 商店商品生成相关        | `shop`              |
| `'工坊订单'` | 工坊技能订单生成相关     | `workshopOrder`       |
| `'行路事件'` | 废土行路事件卡生成相关    | `boardGameEvent`      |
| `'角色生成'` | 角色档案生成相关        | `roleProfile`         |
| `'派遣总结'` | 派遣结算叙事生成相关      | `dispatchStory`       |
| `'末世通讯'` | NPC 聊天人设语气相关      | `system`             |
| `'通用'`    | 无特定 task，所有 task 均可使用（等效于空标签） | 所有 task             |

### 与现有 UI 的结合方式

> **重要：targetApi 与 tags 是正交维度**
>
> `targetApi` 和 `tags` 是两个独立的筛选维度，互不依赖：
> - `targetApi` 决定"这个条目给主 API 还是第二 API 用"（`'main'` / `'second'` / `'both'`）
> - `tags` 决定"这个条目在第二 API 的哪些 task 下激活"
>
> 因此：
> - `targetApi='both'` 的条目在第二 API 调用时**继续参与**标签筛选，不会被误判排除
> - `targetApi='second'` 或 `'both'` 的条目，如果没有任何匹配的 tag（且不是"通用"），该条目在该 task 下不激活
> - 两者先并行过滤（任一不满足即排除），再进行关键词匹配等后续激活判断

#### 字段演进

- **`linkedFeature` 迁移至 `tags`**：原有的 `'danmaku'` → `tags: ['弹幕']`，`'imageGen'` → `tags: ['生图']`。迁移时自动将旧值映射到新标签。
- **`autoControl` 字段删除**：标签与功能开关状态无关，不再需要随功能开关自动启用的机制。条目是否生效由 `targetApi` + `enabled` + `tags` 共同决定。
- **导出/导入兼容**：导出格式增加 `tags` 字段，旧格式文件可正常导入。

#### UI 改动（`WorldbookManagerPanel.vue`）

将现有的"关联功能"下拉改造为**多选下拉**，点击展开后可选多个标签，默认选中"通用"。下拉内显示所有可选标签：

```
┌──────────────────────────────────────────────────────────────┐
│  目标 API: [第二 API ▼]   关联功能: [▼ 通用                    │
│                              ┌─────────────────────┐         │
│                              │ ☑ 通用               │         │
│                              │ ☐ 弹幕               │         │
│                              │ ☐ 生图               │         │
│                              │ ☐ 商店               │         │
│                              │ ☐ 工坊订单           │         │
│                              │ ☐ 行路事件           │         │
│                              │ ☐ 角色生成           │         │
│                              │ ☐ 派遣总结           │         │
│                              │ ☐ 末世通讯           │         │
│                              └─────────────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

- **关联功能 = 标签选择**：下拉展开后即为所有可选标签列表
- 默认选中"通用"，即不限制该条目在哪些 task 下生效
- 选中其他标签时，取消"通用"的选中状态（互斥，但可多选其他标签组合）
- 标签可多选，选中多个时表示该条目在这些 task 下均可激活
- "自动控制"功能删除（标签与功能开关状态无关，绑定标签后条目是否生效由 targetApi + enabled + 标签过滤决定）

#### 过滤行为

调用方在调用 `buildSecondApiContext` 时，传入当前 task 标识和 `maxChatHistory`，过滤逻辑如下：

```typescript
// 第二 API 世界书过滤逻辑（伪代码）
function filterSecondApiWorldbook(
  entries: WorldbookEntryEnhanced[],
  task: string,
  maxChatHistory: number,
): WorldbookEntryEnhanced[] {
  return entries.filter(entry => {
    // 1. 先按 targetApi + enabled 过滤
    const target = entry.targetApi ?? 'main';
    if (target === 'main') return false;
    if (!entry.enabled) return false;

    // 2. 标签过滤（默认选中"通用"，即无限制）
    const tags = entry.tags ?? [];
    if (tags.includes('通用')) return true;  // 通用条目始终激活
    if (tags.length === 0) return true;     // 无标签等价于通用
    if (!tags.includes(getTagForTask(task))) return false;  // 有标签则必须匹配当前 task

    // 3. 确定该条目扫描的范围：取 entry.scanDepth 与 maxChatHistory 的较小值
    //    entry.scanDepth 控制"该条目激活前最多扫描多少条聊天历史"
    //    maxChatHistory 是本次 API 调用最多发送的历史条数上限
    const scanDepth = Math.min(entry.scanDepth ?? maxChatHistory, maxChatHistory);
    const textToScan = getChatHistoryText(scanDepth);

    // 4. 常驻条目（无 key）直接激活
    if (!entry.key || entry.key.length === 0) return true;

    // 5. 关键词匹配（在 entry 自己的扫描范围内）
    const keyMatched = entry.key.some((k: string) => textToScan.includes(k));
    if (!keyMatched) return false;

    // 6. 次要关键词匹配
    if (entry.keysecondary?.length > 0) {
      const secondaryMatched = entry.keysecondary.some((k: string) =>
        textToScan.includes(k)
      );
      if (!secondaryMatched) return false;
    }

    // 7. 概率控制
    if (entry.probability !== undefined && entry.probability < 100) {
      if (Math.random() * 100 > entry.probability) return false;
    }

    return true;
  });
}

// task → 标签映射
function getTagForTask(task: string): string {
  const map: Record<string, string> = {
    danmaku: '弹幕',
    imageTag: '生图',
    shop: '商店',
    workshopOrder: '工坊订单',
    boardGameEvent: '行路事件',
    roleProfile: '角色生成',
    dispatchStory: '派遣总结',
    system: '末世通讯',
  };
  return map[task] ?? '通用';
}
```

> **重要：两个 `scanDepth` 概念的区分**
> - **`maxChatHistory`（调用方参数）**：本次 `callSecondApi` 调用最多向 AI 发送的历史消息条数上限
> - **`entry.scanDepth`（世界书条目字段）**：该条目被激活前，扫描聊天历史时最多扫描的条数上限
> 两者的关系：每个世界书条目按自己的 `scanDepth` 扫描（不超过 `maxChatHistory`），而非所有条目共用一个扫描范围。如果条目未设置 `scanDepth`，则默认以 `maxChatHistory` 为限。

### 激活引擎核心逻辑

在 `buildSecondApiContext` 内部实现，核心逻辑如下：

```typescript
async function buildSecondApiContext(options: {
  task?: string;  // 当前调用方 task
  maxChatHistory?: number;  // 本次调用最多传多少条历史（作为各 entry scanDepth 的上限）
  includeWorldbook?: boolean;
  includeChatHistory?: boolean;
}) {
  const entries = await getEnhancedWorldbook();
  const fullChatHistory = getChatHistoryText(options.maxChatHistory ?? 20);
  const worldbookPrompts: { role: 'system'; content: string }[] = [];

  for (const entry of entries) {
    // 1. targetApi + enabled 过滤（两个维度是正交的，targetApi 确定"给谁用"，tags 确定"给哪些 task 用"）
    const target = entry.targetApi ?? 'main';
    if (target === 'main') continue;
    if (!entry.enabled) continue;

    // 2. 标签过滤（默认"通用"，即无限制）
    //    targetApi='both' 的条目在此继续参与筛选，不会被误判
    const tags = entry.tags ?? [];
    const isUniversal = tags.includes('通用') || tags.length === 0;
    if (!isUniversal) {
      const requiredTag = getTagForTask(options.task ?? '');
      if (!tags.includes(requiredTag)) continue;
    }

    // 3. 确定该条目扫描的范围：取 entry.scanDepth 与 maxChatHistory 的较小值
    const scanDepth = Math.min(entry.scanDepth ?? options.maxChatHistory ?? 20, options.maxChatHistory ?? 20);
    const textToScan = getChatHistoryText(scanDepth);

    // 4. 常驻条目（无 key）直接激活
    if (!entry.key || entry.key.length === 0) {
      worldbookPrompts.push({ role: 'system', content: `【${entry.name}】\n${entry.content}` });
      continue;
    }

    // 5. 关键词匹配
    const keyMatched = entry.key.some((k: string) => textToScan.includes(k));
    if (!keyMatched) continue;

    // 6. 次要关键词匹配
    if (entry.keysecondary?.length > 0) {
      const secondaryMatched = entry.keysecondary.some((k: string) =>
        textToScan.includes(k)
      );
      if (!secondaryMatched) continue;
    }

    // 7. 概率控制
    if (entry.probability !== undefined && entry.probability < 100) {
      if (Math.random() * 100 > entry.probability) continue;
    }

    worldbookPrompts.push({ role: 'system', content: `【${entry.name}】\n${entry.content}` });
  }

  // 8. 按 order 降序排列后拼接
  worldbookPrompts.sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
  return worldbookPrompts;
}
```

### 支持的激活字段

| 用户描述的字段 | 世界书条目字段            | 说明                                    |
| ---------- | ------------------- | ------------------------------------- |
| 关键词匹配     | `key: string[]`     | 主关键词列表                                |
| keysecondary | `keysecondary: string[]` | 次要关键词列表（选择性匹配）                    |
| 扫描深度      | `scanDepth`          | 只扫描最近 N 条消息                         |
| 注入位置      | `position`          | 对第二 API 统一注入为 `system` prompt，不细分位置 |
| 优先级/顺序    | `order: number`      | 激活后按 order 降序排列                     |
| 概率控制      | `probability: number` | 0-100，激活概率                           |
| 标签过滤      | `tags: string[]`     | 多选标签，控制条目在哪些 task 下生效              |

### task → 标签映射关系

| task            | 对应标签    | 说明                                        |
| --------------- | ------- | ----------------------------------------- |
| `danmaku`      | `'弹幕'`    | 弹幕生成                                        |
| `imageTag`     | `'生图'`    | 生图标签生成                                      |
| `shop`         | `'商店'`    | 商店商品生成                                      |
| `workshopOrder` | `'工坊订单'` | 工坊技能订单生成                                  |
| `boardGameEvent` | `'行路事件'` | 废土行路事件卡生成                                  |
| `roleProfile`  | `'角色生成'` | 角色档案生成                                      |
| `dispatchStory` | `'派遣总结'` | 派遣结算叙事生成                                  |
| `system`       | `'末世通讯'` | NPC 聊天人设语气，可与其他标签组合                 |
| `riddle`       | 不注入     | 不使用世界书                                       |

### 与酒馆激活机制的对比

| 功能点                         | 酒馆 `getWorldInfoPrompt` | 第二 API 轻量引擎              |
| ---------------------------- | ---------------------- | -------------------------- |
| 关键词匹配（key/keysecondary） | ✅                      | ✅                          |
| 扫描深度（scanDepth）         | ✅                      | ✅（通过 getChatMessages 限制） |
| 注入位置（position）          | ✅（before/after/AN）   | ❌（统一注入 system）          |
| 优先级排序（order）           | ✅                      | ✅                          |
| 概率控制（probability）        | ✅                      | ✅                          |
| 标签过滤（tags）              | ❌                      | ✅（新增）                    |
| Sticky / Cooldown / Delay    | ✅                      | ❌（暂不需要）                 |
| 递归扫描（Recursive）         | ✅                      | ❌（暂不需要）                 |
| Token Budget                 | ✅                      | ❌（暂不需要）                 |
| 无副作用                       | ❌                      | ✅                          |


---

## task → 调用方式速查表


| task             | 调用方式        | 上下文来源               | system_prompt                          | user_prompt     |
| ---------------- | --------------- | ------------------------ | -------------------------------------- | --------------- |
| `dispatchStory`  | `generate()`    | 酒馆自动注入             | `buildDispatchPrompt` 注入到 `injects` | 派遣结算记录    |
| `workshopOrder`  | `generateRaw()` | 世界书 + 角色设定        | `PROMPT_WORKSHOP_ORDERS`               | 工坊上下文      |
| `system`         | `generateRaw()` | 世界书 + 独立聊天历史    | NPC 人设 + 游戏规则                    | 用户输入        |
| `shop`           | `generateRaw()` | 世界书 + 聊天历史        | `PROMPT_SHOP`                          | 商品需求描述    |
| `boardGameEvent` | `generateRaw()` | 世界书 + 聊天历史        | `PROMPT_BOARD_GAME_EVENT_POOL`         | 场景描述        |
| `roleProfile`    | `generateRaw()` | 世界书 + 聊天历史        | 角色生成指令                           | 场景 + 字段需求 |
| `riddle`         | `generateRaw()` | 角色档案人设（无世界书） | 猜谜规则 + 人设                        | 用户猜测        |
| `danmaku`        | `generateRaw()` | 世界书 + 剧情变量        | `PROMPT_DANMAKU` + 剧情摘要            | 最新消息内容    |
| `imageTag`       | `generateRaw()` | 世界书 + 剧情变量        | 生图指令 + 剧情摘要                    | 场景描述        |


