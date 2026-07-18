# Galgame Bugfix Log

## [2026-07-18] 横屏对话框坍缩成"细横条"：SkinShell 默认 `height: 100%` 找不到显式父高度，最终坍缩回内容高度

### 问题描述

横屏模式下，对话框被压扁成细横条（高度只有文字单行的高度），失去了原本"报纸版面"的对话框质感；设置面板里的滑动条在横屏面板里也显得过于紧凑，标签区只占 5rem。

### 根因

1. **新版 `components/dialogue/DialogueBox.vue` 把 SkinShell 作为容器**（旧版 `DialogueBox.vue` 是把 SkinShell 当绝对定位背景层），直接用 `<SkinShell :shell-style="dialogueOuterStyle">` 包裹所有内容。
2. **`dialogueOuterStyle` 没设 `minHeight`**，注释写"min-height / max-height 不在这里设置，因为 SkinShell 的 height: 100% 模式下这些属性无法正确控制内部 .typewriter-container 的高度"。
3. **SkinShell 默认 `height: '100%'`**，但父元素 `<div data-ui="dialogue-box" class="relative w-full">` 没有显式高度（auto），于是 `height: 100%` 找不到父高度 → 坍缩成内容高度。
4. 即便外层写 `minHeight`，SkinShell 也不会把它透传，SkinShell 仍然 `height: 100%`，结果仍是坍缩。

所以横屏对话框高度 = 一行文字高度 = 图1那种"细横条"。

### 修复

#### 1. `components/dialogue/DialogueBox.vue`：恢复 `minHeight`

```typescript
const dialogueOuterStyle = computed(() => ({
  // ... margin/border/shadow 不变 ...
  width: 'var(--theme-dialogue-width, 100%)',
  // 关键：把 minHeight 加回来。
  // 横屏走 --theme-dialogue-min-height（newspaper 主题默认 10rem）；
  // 竖屏走 --theme-dialogue-min-height-portrait（vmin 单位，与横屏布局隔离）。
  minHeight: props.isPortraitMode
    ? 'var(--theme-dialogue-min-height-portrait, 16vmin)'
    : 'var(--theme-dialogue-min-height, 12em)',
  display: 'flex',
  flexDirection: 'column',
}));
```

`isPortraitMode` 走独立变量，与横屏内容隔离；`display: flex; flex-direction: column` 让内部 TypewriterText 等子组件能用 `h-full` 撑开 SkinShell。

#### 2. `components/common/SkinShell.vue`：把 `minHeight` 透传到 `height`

```typescript
const shellContainerStyle = computed(() => {
  const explicitHeight = props.shellStyle?.height;
  const explicitMinHeight = props.shellStyle?.minHeight;
  // ... 默认 height: skin.shellSize.height ?? '100%' ...
  if (!explicitHeight && explicitMinHeight) {
    style.minHeight = explicitMinHeight;
    style.height = explicitMinHeight;  // 关键：用 minHeight 作为 height，避免 100% 找父高度失败
  }
  // ...
});
```

模板上同时去掉外层 `class="... h-full"`，改为由内联 style 控制高度：

```vue
<div class="skin-shell relative" :style="shellContainerStyle">
  ...
  <div class="skin-shell__content relative h-full w-full" ...>
    <slot />
  </div>
</div>
```

这样：
- 对话框场景：`shellStyle.minHeight = 10rem` → SkinShell `height: 10rem` → `.skin-shell__content` 的 `h-full` 撑满
- 面板场景：没传 `minHeight` → SkinShell 默认 `height: 100%` 继承父级 panel 高度 → 原行为不变

#### 3. `components/common/SliderRow.vue`：横屏专属加宽标签与数值

```vue
<div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2">
  <span class="text-xs sm:w-28 shrink-0" ...>...</span>  <!-- w-20 → w-28 -->
  <div class="flex items-center gap-3 min-w-0">
    <input class="flex-1 slider-vn min-w-0" ... />
    <span class="text-xs font-mono w-12 shrink-0 text-right" ...>...</span>  <!-- w-10 → w-12 -->
  </div>
</div>
```

- 标签横屏宽度从 5rem (80px) 增加到 7rem (112px)，中文四字标签（如"立绘大小"）不会拥挤
- 数值宽度从 2.5rem (40px) 增加到 3rem (48px)，三位数 + 单位（如 "200%"）也不会紧贴滑块
- 滑块用 `flex-1 min-w-0` 拿到所有剩余空间，更舒展
- 竖屏 `<sm` 仍走 `flex-col`，不受 sm: 影响，与横屏完全隔离

### 验证

通过 chrome-devtools 验证 iframe 内 `data-ui=dialogue-box` 下的 `.skin-shell`：

```json
{ "width": 1283, "height": 160, "minHeight": "160px", "heightStyle": "160px" }
```

- 视口 1283×722 = 16:9 横屏
- SkinShell 高度 160px = 10rem，等于 newspaper 主题 `--theme-dialogue-min-height: 10rem`，与图2一致
- TypewriterText 内容区 96px (6rem) 滚动显示，符合 galgame UI 习惯

设置面板 SliderRow：
- 标签宽度 112px (sm:w-28)
- 数值宽度 48px (w-12)
- 滑块 flex-1 自适应剩余空间

### 教训

**`SkinShell` 的默认 `height: '100%'` 在作为容器（而非背景）使用时会塌缩——它去找父级的显式高度，找不到就回退到内容高度。**

- 当把 SkinShell 重新定位为"容器包裹内容"时，必须保证 shellStyle 同时给出 `minHeight` 或 `height`，否则会坍缩
- 把 SkinShell 改成同时支持把 `minHeight` 透传为 `height`，可以让上层用 `minHeight`（语义更对：内容多了能更长）而不必纠结 `height: 100%` 的坍缩问题
- SliderRow 的 sm: 类只在 `sm` 及以上断点生效，竖屏 `<sm` 完全走 `flex-col`，与横屏天然隔离，不需要在 component 内部判断 portraitMode

防范措施：
1. 把 SkinShell 用作容器时，外层 dialogOuterStyle 一定要带 `minHeight` 或 `height`（不要再依赖默认 `100%`）
2. 凡是提到"minHeight 无法控制 SkinShell 高度"——这都是 SkinShell 的设计缺陷，应该改 SkinShell 而不是绕过 minHeight
3. 修改 SliderRow 时优先用响应式断点（`sm:`）而不是 isPortraitMode prop，让组件保持简单

## [2026-07-17] vue-loader 报错 "Missing semicolon" + "Cannot read properties of null"：SFC 块结尾多了一个 `)` 导致 script 块解析失败

### 问题描述

`pnpm watch` 持续报以下三个错误，TypewriterText.vue 编译失败，连锁导致 DialogueBox.vue、App.vue、index.ts 整条依赖链全部无法编译：

```
ERROR in ./src/galgame/components/dialogue/TypewriterText.vue?vue&type=script&setup=true&lang=ts
Module Error (from vue-loader): [vue/compiler-sfc] Missing semicolon. (39:3)

ERROR in ./src/galgame/components/dialogue/TypewriterText.vue?vue&type=script&setup=true&lang=ts
Module build failed: TypeError: Cannot read properties of null (reading 'content')
  at selectBlock (.../vue-loader/dist/select.js:23:45)

ERROR in ./src/galgame/components/dialogue/TypewriterText.vue?vue&type=template&id=...
Module Error (from templateLoader): [vue/compiler-sfc] Missing semicolon. (39:3)
```

stats 报错中指向的代码片段：

```
63 |    paddingBottom: 'var(--theme-dialogue-text-padding-bottom, 0.8rem)',
64 |    paddingLeft: 'var(--theme-dialogue-text-padding-left, 2.5rem)',
65 |  })));
   |     ^
```

酒馆脚本不挂载：dist/galgame/index.js 编译产物为空或残缺，webpack 一直输出 "compiled with 3 errors" 而非 "compiled successfully"。

### 根因

`src/galgame/components/dialogue/TypewriterText.vue` 第 65 行有**多余的右括号**：

```typescript
/** 容器样式 */
const containerStyle = computed(() => ({
  paddingTop:   'var(--theme-dialogue-text-padding-top,    1.5rem)',
  paddingRight: 'var(--theme-dialogue-text-padding-right,  2.5rem)',
  paddingBottom:'var(--theme-dialogue-text-padding-bottom, 0.8rem)',
  paddingLeft:  'var(--theme-dialogue-text-padding-left,   2.5rem)',
})));  // ❌ 多了一个 )
```

`computed(() => ({...}))` 拆括号层数：

| 层 | 含义 | 需要闭合的字符 |
|---|---|---|
| 1 | `computed(` 外的 `(` | `)` |
| 2 | 箭头函数的参数 `()` | （无需闭合，参数是空的）|
| 3 | 包裹对象字面量的 `(` | `)` |
| 4 | 对象 `{...}` | `}` |

正确闭合 = `}` + `)` + `)` + `;` = `}));`，**恰好 3 个右括号**。多打一个就成了 `})));`，后续整个 `<script>` 块都会被 vue/compiler-sfc 当成语法错误。

### 连锁失败的原因

vue/compiler-sfc 报错 `Missing semicolon (39:3)` 之后，vue-loader 内部 `selectBlock()` 在解析 SFC 的各个块时拿不到正确的 descriptor（descriptor.content 为 null），从而抛出 `Cannot read properties of null (reading 'content')`。

**整个 SFC 解析失败 → 该文件的 `?vue&type=script` / `?vue&type=template` 两个子资源都打不出来 → 依赖此文件的 DialogueBox.vue 找不到对应模块 → App.vue 也编译失败 → index.ts 无法产出 bundle**。所以即使只是一个组件的小括号错误，也会让整个 galgame 脚本在酒馆里不挂载。

### 修复

```typescript
// 修复前
const containerStyle = computed(() => ({
  paddingTop:   'var(--theme-dialogue-text-padding-top,    1.5rem)',
  paddingRight: 'var(--theme-dialogue-text-padding-right,  2.5rem)',
  paddingBottom:'var(--theme-dialogue-text-padding-bottom, 0.8rem)',
  paddingLeft:  'var(--theme-dialogue-text-padding-left,   2.5rem)',
})));

// 修复后
const containerStyle = computed(() => ({
  paddingTop:   'var(--theme-dialogue-text-padding-top,    1.5rem)',
  paddingRight: 'var(--theme-dialogue-text-padding-right,  2.5rem)',
  paddingBottom:'var(--theme-dialogue-text-padding-bottom, 0.8rem)',
  paddingLeft:  'var(--theme-dialogue-text-padding-left,   2.5rem)',
}));
```

修复后 `pnpm watch` 输出 `webpack 5.107.2 compiled successfully in 4607 ms`，依赖链全部恢复。

### 教训

**vue-loader 的两个症状——`Missing semicolon` + `Cannot read properties of null (reading 'content')`——几乎总是同一根因：SFC 块内（template / script / style）的代码存在语法错误，vue/compiler-sfc 无法解析 descriptor，导致后续 `selectBlock` 拿到 null。**

- `Missing semicolon (39:3)` 是 *症状*——编译失败抛出的第一个错误
- `Cannot read properties of null (reading 'content')` 是 *副作用*——vue-loader 解析 SFC descriptor 时的连锁崩溃

**不要被 stats 中的 `(39:3)` 误导**，那是从编译产物中得到的行号，不一定对应原 SFC 中的行。**真正有用的线索是 stats 给出的源码片段**（如本例的 `65 | }));`），结合 git diff 对比改动行就能定位。

防范措施：

1. **修改 `<script setup>` 时逐个 computed 块检查括号闭合**：`computed(() => ({...}))` 永远是 `}));`，多打少打都错
2. **`pnpm watch` 出现 `compiled with N errors` 必须立刻处理**——vue-loader 错误会**整链失败**（即使错在 TypewriterText，也会导致 index.ts 整个 bundle 不产出）
3. **酒馆脚本不挂载时，先看 watch 是否 compiled successfully**——dist/index.js 不更新 = 脚本不挂载 = 编译有问题
4. 在 IDE 里打开文件时使用 `File > Reopen with Encoding > UTF-8 (No BOM)`，避免 PowerShell 等工具以 UTF-8 BOM 写入文件（BOM 也会让 vue-loader 解析失败）

## [2026-06-01] CharacterManagementModule 详情 Tab 崩溃：v-show 无法阻止 null 访问

### 问题描述

点击玩法面板的「角色管理」入口后，界面只有顶栏，主体内容完全不显示。Console 报错：

```
TypeError: Cannot read properties of null (reading '姓名')
  at lm (vue.runtime.global.prod.min.js)
```

### 根因

`CharacterManagementModule.vue` 第 254 行，详情 Tab 的条件使用了 `v-show`：

```vue
<div v-show="activeTab === 'detail' && selectedRole" class="cm-content">
  ...
  {{ selectedRole!.姓名?.charAt(0) || '?' }}
```

`v-show` 只控制 CSS `display` 属性的显示/隐藏，DOM 节点**始终会被渲染**，Vue 仍会执行其中的模板表达式。当 `activeTab === 'detail'` 但 `selectedRole` 为 `null` 时，`selectedRole!.姓名` 在非生产环境断言通过后访问 `.charAt(0)`，导致空指针崩溃。

### 修复

将 `v-show` 改为 `v-if`，让条件不满足时**完全不渲染**该区块：

```vue
<!-- 修复前 -->
<div v-show="activeTab === 'detail' && selectedRole" class="cm-content">

<!-- 修复后 -->
<div v-if="activeTab === 'detail' && selectedRole" class="cm-content">
```

### 教训

**`v-show` vs `v-if` 的根本区别不在于"性能"，而在于是否会触发子组件/模板初始化：**

- `v-show`：始终渲染 DOM，只是切换 `display`，模板内所有表达式仍会求值
- `v-if`：条件为假时**完全不渲染**，不会执行子组件的 `setup()`，不会求值模板内任何表达式

当模板内部有对可选对象的属性访问（如 `selectedRole!.姓名`）时，必须确保该对象非空才能渲染。用 `v-show` 不能达到这个目的——它只是隐藏 DOM，不阻止渲染阶段的求值。

防范措施：

1. **凡模板中有 `obj!.prop` 或 `obj.prop` 断言的地方，外层必须用 `v-if` 包裹**，不能用 `v-show`
2. `v-show` 仅适合那些**不需要条件跳过初始化**的场景（如简单的加载/完成状态切换）
3. 对可选对象使用可选链 `obj?.prop ?? default` 是更健壮的防御手段，即使换了 `v-if` 也建议加上

## [2026-05-31] DispatchModule.vue 所有 import 路径多写了一级 `../`

### 问题描述

DispatchModule.vue 在酒馆中加载时，控制台大量报错：

```
Cannot find module '../../store'
webpackMissingModule @ DispatchModule.vue:7
```

进而导致整个 galgame 界面级联崩溃，所有依赖的组件（ModuleView → GameplayPanel → App → index）全部报错。

### 根因

`src/galgame/dispatch/DispatchModule.vue` 中的 import 路径全部多写了一级 `../`。

文件目录结构：

```
src/galgame/
├── store.ts                      ← 需要导入
├── boardgame/
│   ├── boardGameStore.ts
│   ├── mapGenerator.ts
│   └── types.ts
├── types/
│   └── role.ts
└── dispatch/
    └── DispatchModule.vue        ← 当前文件
```

错误写法用了 `../../`，会退到 `src/` 一级，但实际目标都在 `src/galgame/` 同级目录下：

```typescript
import { useVNStore } from '../../store';              // 错：退到了 src/，store.ts 在 src/galgame/
import { useBoardGameStore } from '../../boardgame/...'; // 同上
import { generateMap } from '../../boardgame/...';       // 同上
import type { ... } from '../../types/...';              // 同上
```

### 修复

```typescript
import { useVNStore } from '../store';
import { useBoardGameStore } from '../boardgame/boardGameStore';
import { generateMap } from '../boardgame/mapGenerator';
import type { MapNode, MapConfig, NodeType } from '../boardgame/types';
import type { DispatchRun, 结算结果 } from '../types/role';
```

### 教训

**`dispatch/` 是 `galgame/` 的子目录，只需 `../` 一级回退即可到达同级模块。**

- `../../` 退两级 → `src/`
- `../` 退一级 → `src/galgame/`

这是同一个模块中多行 import 路径同时写错的典型场景。防范措施：新增独立子目录后，统一检查该目录下所有文件的 import 路径是否与实际目录层级匹配。

## [2026-05-29] 界面部分初始化失败：两处 import 路径错误

### 问题描述

Galgame 界面在酒馆中**能显示但无法操作**，点击、输入均无响应，Vue 响应式系统实际处于半瘫痪状态。

Console 中出现：
```
Cannot find module './store'        ← 某个组件
Cannot find module './SkinShell'   ← 另一个组件
Cannot read properties of undefined (reading 'length')
```

HTML 渲染成功、CSS 加载完成，但 JS 逻辑在 import 阶段即崩溃，导致 Vue setup() 中途失败、reactive 链断裂。

### 根因

Webpack 对 `./xxx` 相对路径的解析基于**当前文件所在目录**，而非 TypeScript 类型检查时的路径。

两处组件中的 import 路径写错了层级：

**1. `components/common/SkinShell.vue`**（第 19 行）：
```typescript
import type { ComponentSkin } from './themes';
// 错：./themes 在 common/ 下不存在
// 对：../../themes 才是根目录的 themes/
```

**2. `components/module/BoardGameModule.vue`**（第 346 行）：
```typescript
import type { GameEvent, MapNode } from './boardgame/types';
// 错：./boardgame 在 module/ 下不存在
// 对：../../boardgame/types 才是根目录的 boardgame/types
```

### 修复

```typescript
// SkinShell.vue
import type { ComponentSkin } from '../../themes';

// BoardGameModule.vue
import type { GameEvent, MapNode } from '../../boardgame/types';
```

### 教训

**Webpack 的 `Cannot find module` 在构建产物中表现为运行时异常，导致 Vue setup() 中断，界面看起来"活着"但所有响应式全部失效。**

- TypeScript 类型检查不会验证模块文件是否真实存在
- 相对路径 `../xxx` 中的 `./` 指向**当前文件所在目录**，不是"看起来近似的目录"
- `components/common/` 下的文件引用 `themes/` 需要 `../../themes`（两级回退）
- `components/module/` 下的文件引用 `boardgame/` 需要 `../../boardgame`（两级回退）

防范措施：
1. 每次新增组件后，用 webpack 构建确认无 `Cannot find module` 错误
2. 构建产物中若出现 `webpackMissingModule` 运行时异常，说明某处 import 路径仍然错误
3. 优先使用 TsconfigPathsPlugin 配置的 `@/` 别名路径，避免手写多层 `../..`

## [2026-05-29] 界面无法渲染：undefined.length 崩溃

### 问题描述

Galgame 界面在酒馆中完全不渲染，game iframe 的 body 始终为空，Vue app 无法挂载。

### 根因

`App.vue` 第 222 行引用了 `store.currentMessageBlocks`：

```typescript
if (store.currentMessageBlocks.length === 0) {
  return parseChoices(context.message);
}
```

但 `useVNStore()` 中根本不存在 `currentMessageBlocks` 这个 computed/属性。Pinia 对不存在的状态属性返回 `undefined`，直接调用 `.length` 导致：

```
Cannot read properties of undefined (reading 'length')
```

该错误在 Vue 渲染阶段抛出，导致整个 App.vue 的 setup 执行失败，Vue app 永远无法挂载到 `#app` 元素上。

### 修复

改为安全的存在性判断：

```typescript
// 只有在没有当前结构块时，才回退到旧的 <roleplay_options> 格式
if (!store.currentBlock) {
  return parseChoices(context.message);
}
```

### 教训

**Pinia store 中不存在的属性返回 `undefined`，绝不会报错——直到你在它上面调用方法。**

- `store.missingProperty` → `undefined`（不报错）
- `store.missingProperty.length` → `TypeError: Cannot read properties of undefined`（运行时崩溃）

防范措施：

1. **TypeScript 类型检查**：在 store 的 return 语句中显式列出所有导出属性，缺少的属性会在编译时报错
2. **可选链**：`store.foo?.length ?? 0`
3. **默认值**：`ref([])` 而不是 `ref()`（`ref()` 初始值是 `undefined`，`ref([])` 初始值是空数组）
4. **每次引用 store 属性前，先确认它存在于 store 的 return 语句中**

## [2026-05-29] 界面无法挂载：组件 import 路径全部写错

### 问题描述

Galgame 界面在酒馆中完全不渲染，game iframe 的 body 始终为空，Vue app 无法挂载。检查构建输出发现大量 `Cannot find module` 错误。

### 根因

大量 Vue 组件文件中的相对 import 路径使用了错误的基础路径。

项目目录结构如下（`store.ts` 在根目录，`SkinShell.vue` 在 `components/common/`）：

```
src/galgame/
├── store.ts                     ← 根目录
├── components/
│   ├── common/
│   │   ├── SkinShell.vue      ← 错误地用 ./SkinShell.vue 导入
│   │   ├── CapsuleButton.vue   ← 错误地用 ./store 导入
│   │   └── ...
│   ├── dialogue/
│   │   ├── DialogueBox.vue     ← 错误地用 ./store、./components/dialogue/BlacktextOverlay.vue 导入
│   │   └── ...
│   ├── panel/
│   │   ├── SettingsPanel.vue   ← 错误地用 ./store、./themes、./ApiTaskConfigPanel.vue 导入
│   │   └── ...
│   ├── stage/
│   │   └── StageArea.vue       ← 错误地用 ./components/stage/BackgroundLayer.vue 导入
│   └── module/
│       └── BoardGameModule.vue ← 错误地用 ./boardgame/boardGameStore 导入
└── index.ts                    ← 错误地用 ./theme.css 导入（应为 ./styles/theme.css）
```

所有 `src/galgame/components/**/*.vue` 中的 import 路径都用了错误的基础路径 `./`，导致 webpack 构建时大量 `Cannot find module` 错误。这些错误在 webpack 构建产物中表现为 `webpackMissingModule` 运行时异常，导致整个 bundle 加载失败，Vue app 无法挂载。

### 修复

统一修正所有 import 路径，遵循相对路径原则：

| 文件位置 | 导入目标 | 正确路径 |
|---|---|---|
| `components/**/*.vue` | `store.ts`（根目录） | `../../store` |
| `components/**/*.vue` | `SkinShell.vue`（`common/`） | `../common/SkinShell.vue` |
| `components/**/*.vue` | 同目录 Vue 组件 | `./ComponentName.vue` |
| `components/**/*.vue` | 主题模块（根目录） | `../../themes` |
| `components/**/*.vue` | 类型定义（根目录） | `../../types/message` |
| `index.ts` | `styles/theme.css` | `./styles/theme.css` |

### 教训

**webpack 的 `Cannot find module` 错误在构建产物中表现为 `webpackMissingModule` 运行时异常——即使 TypeScript 类型检查通过，构建时也可能失败。**

- TypeScript 只做静态类型检查，不验证模块文件是否真实存在
- 相对路径写错时，TypeScript 编译器不会报错（类型检查通过），但 webpack 打包时会失败
- 构建产物（dist/index.js）中的 `webpackMissingModule` 函数调用会导致运行时崩溃

防范措施：

1. **保持 TypeScript 类型与实际文件结构同步**：模块移动后，所有 import 路径必须同步更新
2. **使用绝对路径或别名**：将 `@/store`、`@/components` 等配置为 webpack alias，避免长串相对路径
3. **构建后检查产物**：运行 `pnpm build` 后，确认构建成功且无 `webpackMissingModule` 关键字
4. **IDE 实时反馈**：确保 IDE 的 TypeScript/语言服务正确配置了 `tsconfig.json` 的 `paths` 和 `baseUrl`，以便在编写时就能发现路径错误

## [2026-05-30] 界面能显示但不能操作：Mvu 全局变量未等待初始化

### 问题描述

Galgame 界面在酒馆中**能显示但无法操作**，点击、输入均无响应，Vue 响应式系统处于半瘫痪状态。

Console 中出现：
```
ReferenceError: Mvu is not defined
  at latestMvuStore.ts:46
Cannot read properties of undefined (reading 'currentBlock')
```

后续还有大量 `store.xxx` 为 undefined 的报错，但这些都是连锁反应。

### 根因

`Mvu` 是 MVU 变量框架脚本在**运行时**注入的全局变量（`window.Mvu`），它通过 `waitGlobalInitialized('Mvu')` 控制初始化顺序。

`latestMvuStore.ts` 第 43 行（修复前）在 `startAutoSync()` 中直接调用：

```typescript
eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, () => {
  refresh();
});
```

但 `Mvu` 并未等待初始化完毕就立即被访问。当 galgame 界面先于 MVU 脚本加载完成时，`Mvu` 就是 `undefined`，导致：
1. `Mvu.events` → `Cannot read properties of undefined`
2. `useLatestMvuStore()` 初始化失败
3. `store.currentBlock` 为 undefined
4. 界面半死不活

### 修复

```typescript
// latestMvuStore.ts
async function startAutoSync() {
  if (ready.value) return;
  ready.value = true;

  refresh();

  // Mvu 是运行时全局变量，必须等待其初始化完毕才能订阅事件
  await waitGlobalInitialized('Mvu');

  // 当新楼层变量更新完毕时刷新 latest
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, () => {
    refresh();
  });
}
```

`startAutoSync` 改为 `async`，在订阅事件前 `await waitGlobalInitialized('Mvu')`。`waitGlobalInitialized` 已在 `@types/function/global.d.ts` 中全局声明，无需 import。

### 教训

**`Mvu` 是运行时注入的全局变量，不存在于代码模块中——必须显式等待初始化。**

- `Mvu` 不是通过 `import` 引入的模块，而是 MVU 脚本在酒馆中执行时动态挂载到 `window` 上的全局对象
- TypeScript 的 `@types` 只提供类型提示，不影响运行时行为
- `@types/iframe/exported.mvu.d.ts` 第 51 行明确说明：**在使用它之前，你应该先通过 `await waitGlobalInitialized('Mvu')` 来等待 Mvu 初始化完毕**
- `store` 初始化失败会级联导致所有依赖它的 computed/watch 全部失效，表现为"界面活着但不能交互"

防范措施：

1. **所有依赖运行时全局变量的代码，必须先等待其初始化**：`await waitGlobalInitialized('GlobalName')`
2. **store 中引用外部全局变量时，优先用懒加载而非同步访问**：把 `eventOn(Mvu.events.xxx)` 放到 `startXxx()` 这样的显式调用函数中，而不是 store setup 同步阶段
3. **排查"界面能显示但不能操作"时，优先检查 store 初始化阶段**的报错——这往往是 Vue 响应式链断裂的根源
