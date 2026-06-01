# Galgame Bugfix Log

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
