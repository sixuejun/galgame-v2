---
name: Galgame v1 重构总计划
overview: 基于 v2 设计文档，对现有 Galgame v1 进行保守重构。主要目标：组件拆分与优化、类型系统完善、CSS 变量统一、目录结构整理、新增两个主题包（Animal Island + 液态玻璃）、Live2D 功能集成、第二 API 调用层。Store 保持不变（不拆分文件），但允许修改和维护现有 store.ts。
todos:
  - id: setup-dirs
    content: 建立重构后的目录结构（components/、composables/、utils/api/）
    status: in_progress
  - id: split-dialoguebox
    content: 拆分 DialogueBox.vue（TypewriterText、DialogueNavButton 等子组件）
    status: pending
  - id: split-stagearea
    content: 拆分 StageArea.vue（BackgroundLayer、SpriteLayer）
    status: pending
  - id: 完善类型
    content: 完善类型定义（types/index.ts、消息格式规范）
    status: pending
  - id: 整理css-变量
    content: 整理 CSS 变量系统，建立统一前缀（--theme-*）
    status: pending
  - id: create-api-layer
    content: 建立第二 API 统一调用层（utils/api/secondApiClient.ts）
    status: pending
  - id: refactor-components
    content: 整理现有组件（ChoicePanel、HistoryPanel、SettingsPanel 等）
    status: pending
  - id: create-themes
    content: 新增两个主题包（Animal Island + 液态玻璃）
    status: pending
  - id: live2d-integration
    content: Live2D 功能集成（SpriteLayer 预留接入点）
    status: pending
  - id: integration-test
    content: 集成测试与验证（功能、兼容性、性能）
    status: pending
isProject: false
---

# Galgame v1 重构总计划

> **重构策略**：store 不拆分文件，允许修改和维护现有 `store.ts`。其他重构分阶段进行，每阶段完成后立即测试验证。

## 一、项目现状分析

### 1.1 设计文档中的 v1 vs v2 核心区别


| 方面     | v1（现状）                          | v2（目标）                        |
| -------- | ----------------------------------- | --------------------------------- |
| 渲染层   | `host: 'div'`，每个楼层一个组件实例 | `host: 'iframe'`，只渲染在第 0 层 |
| 数据获取 | 依赖脚本 push 楼层面板变量          | iframe 自主拉取所有楼层数据       |
| 楼层浏览 | 不支持                              | 支持历史楼层浏览                  |
| 块级翻页 | 当前楼层内                          | 当前楼层内 + 自动切楼层           |
| 代码结构 | 功能堆砌，耦合严重                  | 分层清晰，职责明确                |


### 1.2 v1 核心问题


| 问题         | 现状                                  | 影响           | 重构策略                      |
| ------------ | ------------------------------------- | -------------- | ----------------------------- |
| 组件职责不清 | 部分组件承担过多职责                  | 代码复杂       | 拆分组件                      |
| 命名不一致   | `MessageBlock` vs `DialogueLine` 混用 | 可读性差       | 统一类型定义                  |
| CSS 变量混乱 | `--vn-`* 和 `--theme-`* 混用          | 主题切换困难   | 统一变量命名                  |
| 类型约束不足 | 存在隐式 any                          | 运行时错误风险 | 完善类型定义                  |
| 主题数量少   | 只有报纸风和和蝶风                    | 风格单一       | 新增 Animal Island + 液态玻璃 |


### 1.3 Store 处理策略


| 策略             | 说明                                              |
| ---------------- | ------------------------------------------------- |
| **不拆分 Store** | 保持 `store.ts` 单一文件，不拆分成多个 store 文件 |
| **允许修改**     | 可以修改和维护现有 `store.ts` 中的代码            |
| **允许新增**     | 可以在 `store.ts` 中新增状态、方法、类型定义      |


### 1.4 现有主题


| 主题 ID     | 名称   | 类型         | 说明             |
| ----------- | ------ | ------------ | ---------------- |
| `newspaper` | 报纸风 | CSS 主题     | 复古、纸张感     |
| `hedie`     | 和蝶风 | PNG 皮肤主题 | 图片外壳、装饰感 |


---

## 二、重构目标

### 2.1 核心目标

1. **组件职责明确**：拆分臃肿组件（DialogueBox、StageArea）
2. **类型系统完善**：建立完整的 TypeScript 类型定义
3. **CSS 变量统一**：整理 `--theme-`* 前缀命名空间
4. **目录结构清晰**：按功能模块组织目录
5. **第二 API 调用层**：建立统一的 API 服务
6. **主题包扩展**：新增 Animal Island + 液态玻璃两个主题
7. **Live2D 功能**：集成 Live2D 立绘系统（重要功能，不是偷懒）

### 2.2 不重构的内容

- **Store 文件结构**：保持 `store.ts` 单一文件，不拆分
- **核心玩法逻辑**：ShopModule、InventoryModule 等保持原样
- **现有工具函数**：messageParser、worldbookLoader 保持原样

### 2.3 v2 设计文档四大模块（参考）

```
galgame-v2/
├── [1] VN舞台       — 视觉小说核心体验
├── [2] 世界书联动   — 从世界书获取资源
├── [3] 卡牌与生图   — 生图请求、卡片队列
└── [4] 玩法        — 独立游戏模块（Plugin）
```

本次重构主要聚焦于 **模块一（VN舞台）** 的组件拆分和优化。

---

## 三、参考项目

### 3.1 animal-island-vue UI 库

位置：`参考/animal-island-vue/`

**核心参考价值**：这是一个完整的 **Vue 3 UI 组件库**，提供：

- 圆润的视觉风格
- 柔和的配色方案
- 统一的组件设计语言

**可复用组件**：


| 组件             | 用途       | 参考内容                            |
| ---------------- | ---------- | ----------------------------------- |
| `Typewriter.vue` | 打字机效果 | VNode clip 逻辑、逐字显示算法       |
| `Button.vue`     | 按钮       | 样式、状态（hover/active/disabled） |
| `Card.vue`       | 卡片       | 阴影、边框、圆角                    |
| `Modal.vue`      | 模态框     | 动画、遮罩                          |
| `Switch.vue`     | 开关       | 切换动画                            |
| `Loading.vue`    | 加载动画   | 鲸鱼岛动画                          |


**Animal Island 主题设计要点**：

- 配色：柔和暖色调（浅蓝→粉→橙）
- 圆角：较大圆角（16px+）
- 阴影：柔和阴影
- 图标：圆润可爱风格

### 3.2 Live2dRender

位置：`参考/Live2dRender/`

**重要**：Live2D 是本次重构的重要功能，不是偷懒！

**核心接口**（来源：`src/main.ts`）：

```typescript
interface Live2dRenderConfig {
  CanvasId?: string
  CanvasSize?: { height: number, width: number } | 'auto'
  CanvasPosition?: 'left' | 'right'
  BackgroundRGBA?: [number, number, number, number]
  ResourcesPath?: string
  LoadFromCache?: boolean
  ShowToolBox?: boolean
  MinifiedJSUrl: string
  Live2dCubismcoreUrl: string
}

// 核心函数
load(src: string): Promise<void>
loadLibs(urls: string[]): Promise<void>
initializeLive2D(config: Live2dRenderConfig): Promise<void>
setExpression(name: string): void
startMotion(motionGroup: string): void
setMessageBox(message: string, duration: number): void
```

---

## 四、重构执行顺序

### Phase 1：目录结构整理

**目标**：建立清晰的目录结构

```
src/galgame/
├── index.ts
├── App.vue
├── store.ts              # 保持不变
├── theme.css            # 保持不变
│
├── components/           # 组件目录
│   ├── dialogue/        # 对话相关
│   │   ├── DialogueBox.vue
│   │   ├── TypewriterText.vue   # 新增
│   │   ├── DialogueNavButton.vue
│   │   └── BlacktextOverlay.vue
│   ├── stage/           # 舞台层
│   │   ├── StageArea.vue
│   │   ├── BackgroundLayer.vue   # 新增
│   │   └── SpriteLayer.vue       # 新增（含 Live2D 接入点）
│   └── panel/           # 覆盖层面板
│       └── ...
│
├── composables/          # 组合式函数
│   ├── useTypewriter.ts
│   ├── useAutoPlay.ts
│   ├── useLive2D.ts           # 新增：Live2D 封装
│   └── useTouchInteraction.ts
│
├── utils/
│   ├── api/            # API 调用
│   │   ├── secondApiClient.ts    # 新增
│   │   ├── danmakuApi.ts        # 新增
│   │   └── imageGenApi.ts       # 新增
│   ├── messageParser.ts
│   └── worldbookLoader.ts
│
├── types/
│   ├── index.ts        # 统一导出
│   ├── message.ts
│   └── dialogue.ts
│
├── themes/              # 主题
│   ├── index.ts
│   ├── newspaper.ts     # 保留
│   ├── hedie.ts        # 保留
│   ├── animalIsland.ts  # 新增：Animal Island 主题
│   ├── liquidGlass.ts   # 新增：液态玻璃主题
│   └── types.ts
│
└── boardgame/
```

---

### Phase 2：组件拆分与优化

#### 2.1 设计文档中的 VN 舞台组件清单

```
VN舞台/
├── components/
│   ├── DialogueBox.vue        # 对话框主组件
│   │   ├── TypewriterText.vue  # 打字机效果（可选独立）
│   │   └── DialogueNavButton.vue # 翻页箭头按钮
│   ├── BlacktextOverlay.vue    # 黑屏文字转场
│   ├── ChoicePanel.vue         # 选项面板
│   ├── StageArea.vue           # 舞台区
│   │   ├── BackgroundLayer.vue # 背景层
│   │   ├── SpriteLayer.vue     # 立绘层（静态图片 + Live2D 双模式）
│   │   └── (Live2DLayer.vue) # Live2D 层——后续迭代
│   └── DanmakuLayer.vue        # 弹幕层
│
└── store/
    ├── navigationStore.ts      # 翻页/导航状态
    └── danmakuStore.ts        # 弹幕状态
```

#### 2.2 DialogueBox 拆分

**新建文件**：

```typescript
// components/dialogue/TypewriterText.vue
// 功能：逐字显示文本，支持跳过
// 参考：animal-island-vue/src/components/Typewriter/Typewriter.vue
```

```typescript
// components/dialogue/DialogueNameTag.vue
// 功能：角色名字标签渲染
```

```typescript
// components/dialogue/DialoguePortrait.vue
// 功能：头像/立绘渲染
```

**重构 DialogueBox.vue**：

- 移除打字机逻辑 → 委托给 `TypewriterText.vue`
- 移除名字标签逻辑 → 委托给 `DialogueNameTag.vue`
- 移除头像逻辑 → 委托给 `DialoguePortrait.vue`

#### 2.3 StageArea 拆分

**新建文件**：

```typescript
// components/stage/BackgroundLayer.vue
// 功能：背景图片渲染
// 行为：
//   - 有背景图时显示图片
//   - 无背景图时显示默认大气渐变背景
```

```typescript
// components/stage/SpriteLayer.vue
// 功能：角色立绘渲染
// 重要：预留 Live2D 接入点
// 实现：
//   1. 静态立绘（图片）
//   2. Live2D 模型（WebGL canvas）
//   3. 根据角色配置自动选择渲染模式
```

#### 2.4 其他组件优化


| 组件                | 优化方向                                    |
| ------------------- | ------------------------------------------- |
| `ChoicePanel.vue`   | 保持原样，添加空白区域穿透注释              |
| `HistoryPanel.vue`  | 添加虚拟滚动支持（按需）                    |
| `SettingsPanel.vue` | 复用 SectionHeader、ToggleSwitch、SliderRow |


---

### Phase 3：类型系统完善

#### 3.1 设计文档中的消息格式

```
对话块格式：
[[character||角色名：xxx||场景：xxx||台词：xxx]]

叙述块格式：
[[narration||旁白文本]]

黑屏转场格式：
[[blacktext||黑屏文字]]

选择框格式：
[[choice||选项1||选项2||选项3]]

弹幕格式：
<dm>弹幕1|弹幕2|弹幕3</dm>

背景生图格式：
<background>
title###场景名###
image###生图提示词###
</background>
```

#### 3.2 建立统一导出

```typescript
// types/index.ts
export * from './message';
export * from './dialogue';
```

#### 3.3 命名规范


| 类型        | 规范       | 示例                   |
| ----------- | ---------- | ---------------------- |
| 组件文件    | PascalCase | `DialogueBox.vue`      |
| 工具文件    | camelCase  | `messageParser.ts`     |
| CSS 变量    | kebab-case | `--dialogue-name-top`  |
| 类型/接口   | PascalCase | `MessageBlock`         |
| Store State | camelCase  | `currentDialogueIndex` |


---

### Phase 4：CSS 变量整理

#### 4.1 设计文档中的变量规范

采用**主题变量 + 组件变量**双层命名空间：

```css
:root {
  /* 主题层变量 */
  --theme-bg: #f5f0e8;
  --theme-fg: #4a4a4a;
  --theme-accent: #e67e22;

  /* 组件变量 */
  --theme-dialogue-name-top: 0.5em;
  --theme-dialogue-text-padding-top: 2.5em;
}
```

#### 4.2 变量映射策略

**不强制迁移旧变量**，而是采用兼容策略：

```css
:root {
  /* 新变量（主要使用） */
  --theme-bg: #f5f0e8;
  --theme-fg: #4a4a4a;

  /* 兼容旧变量 */
  --vn-bg: var(--theme-bg);
  --vn-fg: var(--theme-fg);
}
```

---

### Phase 5：第二 API 统一调用层

#### 5.1 设计文档中的 API 调用层

```typescript
// 共享/utils/api/secondApiClient.ts
interface SecondApiConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export async function callSecondApi(
  task: 'danmaku' | 'imageTag' | 'shop' | 'riddle' | 'comms' | 'boardGameEvent',
  payload: {
    contentText?: string;
    keyword?: string;
    lastMessage?: string;
    chatHistory?: string;
  }
): Promise<string | string[]>
```

#### 5.2 System Prompt 模板

所有 System Prompt 集中存放在 `docs/SystemPrompt模板.md`：


| 功能         | 用途                    |
| ------------ | ----------------------- |
| 弹幕生成     | 生成 3~5 条观众视角弹幕 |
| 生图标签生成 | 生成背景/CG 生图提示词  |
| 商店商品生成 | AI 动态生成末日风格商品 |
| 谜题系统     | 情报交换 NPC 对话       |
| 末世通讯     | 系统人格对话            |
| 废土行路事件 | AI 生成地图事件列表     |


---

### Phase 6：主题包扩展

#### 6.1 设计文档中的主题方向


| 主题            | 风格描述                                       |
| --------------- | ---------------------------------------------- |
| Animal Island   | 柔和渐变（浅蓝→粉→橙）、圆润云朵装饰、可爱字体 |
| 液态玻璃/Linear | 毛玻璃效果、渐变半透明、简洁线条               |


#### 6.2 主题列表


| 主题 ID         | 名称     | 类型     | 状态     |
| --------------- | -------- | -------- | -------- |
| `newspaper`     | 报纸风   | CSS 主题 | 保留     |
| `hedie`         | 和蝶风   | PNG 皮肤 | 保留     |
| `animal-island` | 动物之森 | CSS 主题 | **新增** |
| `liquid-glass`  | 液态玻璃 | CSS 主题 | **新增** |


#### 6.3 Animal Island 主题

```typescript
// themes/animalIsland.ts
export const animalIslandTheme: ThemeDefinition = {
  id: 'animal-island',
  name: '动物之森',
  description: '柔和可爱的森系风格',
  usesImageShell: false,
  cssVars: {
    '--theme-bg': '#f5f0e8',
    '--theme-fg': '#4a4a4a',
    '--theme-accent': '#e67e22',
    '--theme-radius': '16px',
  },
};
```

#### 6.4 液态玻璃主题

```typescript
// themes/liquidGlass.ts
export const liquidGlassTheme: ThemeDefinition = {
  id: 'liquid-glass',
  name: '液态玻璃',
  description: '毛玻璃质感的现代风格',
  usesImageShell: false,
  cssVars: {
    '--theme-bg': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '--theme-fg': '#ffffff',
    '--theme-accent': '#60a5fa',
    '--theme-panel-bg': 'rgba(255,255,255,0.15)',
    '--theme-backdrop-blur': '20px',
  },
};
```

---

### Phase 7：Live2D 功能集成

#### 7.1 设计文档中的 Live2D 设计

**渲染模式**：


| spriteType | 渲染方式                        | 说明            |
| ---------- | ------------------------------- | --------------- |
| `image`    | `<img>` 标签                    | 静态立绘图片    |
| `live2d`   | `<canvas>` + WebGL + Cubism SDK | Live2D 模型渲染 |
| `none`     | 无                              | 不显示          |


**实现参考**：基于 `@Live2dRender`（Cubism Native SDK）

#### 7.2 集成位置

**SpriteLayer.vue** 是 Live2D 的主要集成点：

```
components/stage/SpriteLayer.vue
├── 静态立绘模式（默认）
│   └── <img> 标签显示立绘图片
└── Live2D 模式（可选）
    └── <canvas> + WebGL 渲染 Live2D 模型
```

#### 7.3 Live2D 初始化流程

```typescript
// composables/useLive2D.ts
import { initializeLive2D, setExpression, startMotion } from '@live2d-render';

export function useLive2D() {
  async function initModel(config: Live2dModelConfig) {
    await initializeLive2D({
      modelPath: config.modelPath,
      textures: config.textures,
    });
  }

  function setCharacterExpression(expression: string) {
    setExpression(expression);
  }

  function playMotion(motionGroup: string) {
    startMotion(motionGroup);
  }

  return { initModel, setCharacterExpression, playMotion };
}
```

#### 7.4 与消息块联动

```typescript
// SpriteLayer.vue - 与设计文档一致的联动逻辑
watch(() => currentBlock.value, (block) => {
  if (!block.character || !block.motion) return;

  // 匹配动作
  const motion = findMotion(block.character, block.motion);
  if (motion) {
    live2d.playMotion(motion.motionGroup);
  }

  // 匹配表情
  if (block.expression) {
    const expr = findExpression(block.character, block.expression);
    if (expr) {
      live2d.setCharacterExpression(expr);
    }
  }
});
```

---

### Phase 8：集成测试与验证

#### 8.1 设计文档中的功能验证清单


| 功能       | 验证方法                           |
| ---------- | ---------------------------------- |
| 对话框显示 | 查看对话框是否正常显示             |
| 打字机效果 | 触发新消息，查看打字机是否工作     |
| 翻页功能   | 点击对话框，查看是否正常翻页       |
| 背景/立绘  | 触发带场景的消息，查看图片是否显示 |
| 弹幕显示   | 发送带 `<dm>` 标签的消息，查看弹幕 |
| 选择框     | 触发选择，查看选项是否正常显示     |
| 历史面板   | 打开历史面板，查看是否正常         |
| 设置保存   | 修改设置后刷新，查看是否保持       |
| 主题切换   | 切换 Animal Island / 液态玻璃主题  |
| Live2D     | 配置 Live2D 模型，查看是否正常渲染 |


#### 8.2 热重载验证

确保酒馆助手的"实时监听"已开启，修改代码后直接在酒馆网页查看效果。

---

## 五、执行中的常见问题

### 5.1 组件拆分后 Props 类型问题

```typescript
// ✅ 使用 defineProps 泛型
const props = defineProps<{
  character: string;
  text: string;
  isTyping: boolean;
}>();
```

### 5.2 移动文件后 Import 路径问题

- 检查 Webpack alias 配置
- 更新 `App.vue` 中的 import 路径
- 检查 `tsconfig.json` 中的路径映射

### 5.3 Live2D 加载失败处理

```typescript
async function loadLive2D(config: Live2dModelConfig) {
  try {
    await initModel(config);
  } catch (error) {
    console.warn('Live2D 加载失败，回退到静态立绘', error);
    spriteType.value = 'image';
  }
}
```

### 5.4 Store 修改注意事项

- **不拆分文件**：保持 `store.ts` 单一文件
- **允许修改**：可以修改现有状态、方法、类型定义
- **保持兼容**：修改时注意向后兼容，避免破坏现有功能
- **记录变更**：在 BUGFIX.md 中记录对 store.ts 的重要修改

---

## 六、参考文件汇总


| 文件                                     | 用途                                      |
| ---------------------------------------- | ----------------------------------------- |
| `src/galgamev2/docs/设计文档.md`         | 架构设计参考、模块划分、数据结构          |
| `src/galgamev2/docs/UI规划文档.md`       | 组件设计参考、布局参考、主题设计          |
| `src/galgamev2/docs/消息格式规范.md`     | 格式定义参考、正则表达式                  |
| `src/galgamev2/docs/SystemPrompt模板.md` | System Prompt 参考                        |
| `src/galgame/BUGFIX.md`                  | 已修复问题记录（教训）                    |
| `src/galgame/themes/`                    | 现有主题实现参考                          |
| `参考/animal-island-vue/`                | **UI 组件库参考**：Animal Island 风格设计 |
| `参考/Live2dRender/`                     | **Live2D 集成参考**：Cubism SDK 封装      |


---

## 七、任务清单


| ID  | 任务                               | 优先级 | 风险 | 阶段    |
| --- | ---------------------------------- | ------ | ---- | ------- |
| 1   | 目录结构整理                       | P0     | 低   | Phase 1 |
| 2   | 拆分 DialogueBox                   | P1     | 中   | Phase 2 |
| 3   | 拆分 StageArea（含 Live2D 接入点） | P1     | 中   | Phase 2 |
| 4   | 完善类型定义                       | P1     | 低   | Phase 3 |
| 5   | CSS 变量整理                       | P2     | 低   | Phase 4 |
| 6   | 建立 API 调用层                    | P2     | 中   | Phase 5 |
| 7   | 新增 Animal Island 主题            | P1     | 中   | Phase 6 |
| 8   | 新增液态玻璃主题                   | P1     | 中   | Phase 6 |
| 9   | **Live2D 功能集成**                | P1     | 高   | Phase 7 |
| 10  | 集成测试验证                       | P0     | -    | Phase 8 |


---

## 八、Store 处理策略（补充说明）

### 8.1 什么是不做的

- ❌ 不拆分 `store.ts` 为多个文件（如 `navigationStore.ts`、`settingsStore.ts`）
- ❌ 不创建 `store/` 目录来存放多个 store 文件

### 8.2 什么是可以做的

- ✅ 修改 `store.ts` 中的现有状态定义
- ✅ 修改 `store.ts` 中的现有方法
- ✅ 在 `store.ts` 中新增状态和方法
- ✅ 在 `store.ts` 中新增类型定义
- ✅ 重构 `store.ts` 内部的代码结构（但保持单文件）

### 8.3 未来可能的 Store 拆分

如果后续需要拆分 Store，可以考虑：

1. 先在 `store.ts` 中按模块用注释分隔代码
2. 确认拆分稳定后，再考虑拆分成多文件
3. 拆分时参考设计文档中的 Store 拆分方案

