# `galgame` 自定义 CSS 参考文档

## 这份文档能做什么

这是一份给玩家用的自定义 CSS 参考文档。它的目标不是讲代码实现，而是告诉你：

- 可以改哪里
- 推荐怎么改
- 哪些 CSS 变量可以直接覆盖
- 如何安全地让自己的 CSS 只影响 `galgame` 界面

如果你只是想换个外观，最推荐的方式是：

1. 打开设置页
2. 在“主题系统”里粘贴 CSS
3. 或者导入一个 `.css` 文件
4. 保存后立即生效

---

## 快速开始

最小示例：

```css
[data-ui='app-root'] {
  --theme-bg: #1d1916;
  --theme-fg: #f1e6d0;
  --theme-accent: #c48b5a;
}

[data-ui='dialogue-box'] {
  border-radius: 16px;
  --theme-dialogue-bg: rgba(25, 20, 16, 0.92);
  --theme-dialogue-border: rgba(196, 139, 90, 0.45);
}
```

这段 CSS 会把主界面背景、前景色和对话框外观改成更暖的风格。

---

## 核心原则

### 1. 主题只负责视觉，不影响业务逻辑

组件层只能关心：

- 组件是否存在
- 组件是否开启
- 组件内容是什么
- 当前状态是什么

不能写成下面这种逻辑：

- “某主题下按钮是圆形，所以这里要特殊判断”
- “某主题下对话框更高，所以滚动逻辑要改”
- “某主题下 toast 在顶部居中，所以点击区域不同”

### 2. 所有主要视觉属性尽量变量化

把颜色、边框、圆角、阴影、字体、间距、背景材质等尽量抽成 theme token / CSS variables。

### 3. 组件根节点提供稳定 `data-ui`

为后续主题 CSS 精准覆盖提供稳定挂点，避免主题依赖内部 DOM 结构。

### 4. 用户 CSS 优先级高于默认主题

默认主题提供基础可用外观，用户粘贴的 CSS / 导入的 CSS 文件可以覆盖默认样式。

---

## 可以改什么

下面这些区域都已经预留了稳定的挂点，你可以直接用 `data-ui` 和 CSS 变量覆盖。

### 1. 根容器

建议选择器：

```css
[data-ui='app-root']
```

适合修改：
- 整体背景色
- 全局前景色
- 字体组合
- 全局装饰变量

常用变量：
- `--theme-bg`
- `--theme-fg`
- `--theme-muted`
- `--theme-accent`
- `--theme-font-body`
- `--theme-font-ui`

### 2. 舞台背景区

建议选择器：

```css
[data-ui='stage-area']
[data-ui='stage-background']
```

适合修改：
- 背景渐变
- 噪点层
- 暗角强度
- 加载态风格

常用变量：
- `--theme-bg-gradient`
- `--theme-bg-noise-opacity`
- `--theme-bg-vignette-opacity`
- `--theme-bg-overlay`

### 3. 对话框

建议选择器：

```css
[data-ui='dialogue-box']
```

适合修改：
- 背景材质
- 边框颜色和粗细
- 圆角
- 阴影
- 内边距
- 角色名颜色
- 正文颜色

常用变量：
- `--theme-dialogue-bg`
- `--theme-dialogue-border`
- `--theme-dialogue-radius`
- `--theme-dialogue-shadow`
- `--theme-dialogue-padding`
- `--theme-dialogue-name-color`
- `--theme-dialogue-text-color`

### 4. 选项按钮

建议选择器：

```css
[data-ui='choice-panel'] [data-ui='button']
```

适合修改：
- 按钮背景
- 悬停效果
- 边框
- 圆角
- 选中态

常用变量：
- `--theme-button-bg`
- `--theme-button-border`
- `--theme-button-radius`
- `--theme-button-color`
- `--theme-button-padding`

### 5. toast

建议选择器：

```css
[data-ui='toast']
```

适合修改：
- toast 背景
- 边框
- 阴影
- 圆角
- 文字颜色
- 位置

常用变量：
- `--theme-toast-bg`
- `--theme-toast-border`
- `--theme-toast-radius`
- `--theme-toast-color`
- `--theme-toast-shadow`

### 6. 面板类弹窗

建议选择器：

```css
[data-ui='panel']
[data-ui='panel-backdrop']
```

适合修改：
- 历史记录面板
- 设置面板
- 角色面板
- 游戏面板
- 面板遮罩

常用变量：
- `--theme-panel-bg`
- `--theme-panel-border`
- `--theme-panel-radius`
- `--theme-panel-shadow`
- `--theme-panel-backdrop`

### 7. 其他入口

建议选择器：

```css
[data-ui='image-deck']
[data-ui='achievement-notch']
```

适合修改：
- 扇形卡牌队列
- 成就刘海入口
- 小型装饰区域

---

## 已完成的改造

### 1. `src/galgame/App.vue`

- 已补充统一的 `data-ui="app-root"`
- 已把主题 CSS 注入到页面 `<head>`，并限制在 `#galgame-shell, [data-ui="app-root"]` 作用域内
- 已补全默认主题 token，toast / 背景 / 对话框样式开始 token 化

### 2. `src/galgame/StageArea.vue`

- 已补充 `data-ui="stage-area"`、`data-ui="stage-background"`
- 默认背景渐变已改为 `--theme-bg-gradient`
- 作用域样式改为基于 `data-ui` 的选择器

### 3. `src/galgame/DialogueBox.vue`

- 已补充 `data-ui="dialogue-box"`
- 对话框边框、圆角、阴影、padding 接入主题 token

### 4. `src/galgame/SettingsPanel.vue`

- 已补充 `data-ui="panel"`
- 已新增主题模块：启用开关、CSS 粘贴、`.css` 导入、重置按钮、清空导入 CSS、来源说明

### 5. `src/galgame/ChoicePanel.vue`

- 已补充 `data-ui="choice-panel"`、`data-ui="choice-panel-list"`、`data-ui="choice-panel-backdrop"`、`data-ui="button"`
- 选项背景与边框已开始接入主题 token

### 6. `src/galgame/HistoryPanel.vue`

- 已补充 `data-ui="history-panel"`、`data-ui="panel-backdrop"`、`data-ui="panel"`

### 7. `src/galgame/CharacterPanel.vue`

- 已补充 `data-ui="character-panel"`、`data-ui="panel-backdrop"`

### 8. `src/galgame/GameplayPanel.vue`

- 已补充 `data-ui="gameplay-panel"`、`data-ui="panel-backdrop"`

### 9. `src/galgame/ImageDeck.vue`

- 已补充 `data-ui="image-deck"`

### 10. `src/galgame/AchievementNotch.vue`

- 已补充 `data-ui="achievement-notch"`

## 怎么改

### 方式 1：直接粘贴 CSS

在设置页的“主题系统”里选择“粘贴 CSS”，然后把你的样式贴进去即可。

适合：
- 快速试样式
- 小范围改色
- 临时调试

### 方式 2：导入 `.css` 文件

在设置页切换到“导入 CSS 文件”，选择一个本地 `.css` 文件即可。

适合：
- 你已经写好了完整主题
- 想复用本地文件
- 想长期保存一套风格

### 方式 3：覆盖 CSS 变量

如果你只是改颜色、圆角、阴影，优先改变量，而不是直接写很深的选择器。

示例：

```css
[data-ui='app-root'] {
  --theme-bg: #201914;
  --theme-fg: #f2e8d8;
  --theme-accent: #d18a5b;
  --theme-toast-radius: 10px;
}
```

### 方式 4：按区域精确覆盖

如果你只想改某个区域，可以直接针对 `data-ui` 写样式：

```css
[data-ui='dialogue-box'] {
  border-radius: 18px;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.35);
}

[data-ui='choice-panel'] [data-ui='button'] {
  border-radius: 12px;
}
```

## 当前待继续项

- 继续扩展更多模块内部细粒度 token（例如部分玩法模块内部按钮与输入框）
- 继续补充主题示例片段（按“对话框 / 面板 / toast / 按钮”分类）

## 现有代码中，优先需要改的区域

### 1. `src/galgame/App.vue`

建议改造：

- 给根节点增加统一的 `data-ui="app-root"`
- 引入全局主题 class / attribute（如 `data-theme`）
- 把 toast 相关样式改成 token 驱动
- 让 `App.vue` 只负责 shell 布局，不写具体视觉风格

### 2. `src/galgame/StageArea.vue`

建议改造：

- 将背景、噪点、暗角、加载态抽象为主题可覆盖层
- 使用 CSS variables 控制背景材质、叠层透明度、字体风格
- 给关键节点增加 `data-ui` 标识，例如：
  - `data-ui="stage-area"`
  - `data-ui="stage-background"`
  - `data-ui="stage-overlay"`
  - `data-ui="stage-loading"`

### 3. `src/galgame/DialogueBox.vue`

建议改造：

- 将对话框拆为“结构层 + 主题层”
- 所有材质、边缘处理、字体组合、装饰线条改用 token
- 给标题区、正文区、页脚区提供稳定 `data-ui`
- 让主题可以单独覆写对话框边缘、边框厚度、背景透明度等

### 4. `src/galgame/SettingsPanel.vue`

建议改造：

- 新增“主题”独立模块
- 在模块内提供：
  - 当前主题选择
  - 自定义 CSS 粘贴框
  - `.css` 文件导入
  - 重置为默认主题
  - 可选的主题预览 / 启用状态
- 主题设置应和普通玩法设置分组展示，不混在一起

### 5. `src/galgame/store.ts`

建议改造：

- 在现有 `settings` schema 里新增独立 `theme` 子模块
- 主题配置至少包括：
  - `themeId`
  - `themeEnabled`
  - `themeCustomCss`
  - `themeCustomCssSource`（粘贴 / 导入）
  - `themeImportedCssName`
  - `themeImportedCssContent` 或对应的持久化引用
  - `themeOverrides`（如按钮、对话框、toast 的局部覆写开关）
- 保持向后兼容：旧设置能自动迁移到默认值

---

## 建议新增的主题能力

### 1. 默认主题体系

先保留一套官方默认主题，作为所有功能的兜底。

默认主题应该提供：

- 全局背景风格
- 面板材质感
- 按钮风格
- 字体组合
- 装饰图层
- 提示条样式
- 对话框边缘处理
- 选项区排版密度
- 是否显示纹理叠层

### 2. 用户自定义 CSS 注入

支持用户在设置页直接粘贴 CSS，注入到当前界面。

建议规则：

- 作用域尽量限制在 `galgame` 根容器下
- 默认提供一层安全的包裹选择器，避免全站污染
- 用户 CSS 优先级高于默认主题
- 支持实时预览、保存后自动恢复

### 3. 导入 `.css` 文件

支持用户导入外部 CSS 文件，作为主题样式来源。

建议规则：

- 仅支持 `.css`
- 导入后保存文件内容或保存引用信息到 `settings`
- 导入失败要有明确提示
- 导入 CSS 应和粘贴 CSS 采用同一注入管线

### 4. 局部覆写能力

用户 CSS 需要能单独针对以下区域覆盖样式：

- 按钮
- 对话框
- toast
- 面板
- 选项区
- 提示条
- 背景层
- 装饰层

---

## 主题 token 规划方向

### 全局基础

- `--theme-bg`
- `--theme-fg`
- `--theme-muted`
- `--theme-accent`
- `--theme-accent-strong`
- `--theme-border`
- `--theme-shadow`

### 背景层

- `--theme-bg-image`
- `--theme-bg-gradient`
- `--theme-bg-overlay`
- `--theme-bg-noise-opacity`
- `--theme-bg-vignette-opacity`

### 面板与卡片

- `--theme-panel-bg`
- `--theme-panel-border`
- `--theme-panel-radius`
- `--theme-panel-shadow`
- `--theme-panel-backdrop`

### 按钮

- `--theme-button-bg`
- `--theme-button-bg-hover`
- `--theme-button-border`
- `--theme-button-color`
- `--theme-button-radius`
- `--theme-button-padding`

### 对话框

- `--theme-dialogue-bg`
- `--theme-dialogue-border`
- `--theme-dialogue-radius`
- `--theme-dialogue-shadow`
- `--theme-dialogue-padding`
- `--theme-dialogue-name-color`
- `--theme-dialogue-text-color`

### Toast

- `--theme-toast-bg`
- `--theme-toast-border`
- `--theme-toast-radius`
- `--theme-toast-color`
- `--theme-toast-shadow`
- `--theme-toast-position`

### 字体

- `--theme-font-ui`
- `--theme-font-body`
- `--theme-font-display`
- `--theme-font-mono`

---

## 执行留痕

### 已完成的改造

- `src/galgame/App.vue`
  - 补充 `data-ui="app-root"`
  - 将主题 CSS 以 `#galgame-shell, [data-ui="app-root"]` 作用域注入到 `document.head`
  - 补全了默认主题 token，toast / 背景 / 对话框样式开始 token 化
- `src/galgame/StageArea.vue`
  - 补充 `data-ui="stage-area"`、`data-ui="stage-background"`
  - 默认背景渐变已改为 `--theme-bg-gradient`
  - 作用域样式改为基于 `data-ui` 的选择器
- `src/galgame/DialogueBox.vue`
  - 补充 `data-ui="dialogue-box"`
  - 对话框边框、圆角、阴影、padding 接入主题 token
- `src/galgame/SettingsPanel.vue`
  - 补充 `data-ui="panel"`
  - 在设置页新增主题模块：启用开关、CSS 粘贴、`.css` 导入、重置按钮
- `src/galgame/ChoicePanel.vue`
  - 补充 `data-ui="choice-panel"`、`data-ui="choice-panel-list"`、`data-ui="button"`
  - 选项背景与边框开始接入主题 token

### 当前待继续项

- 将 `HistoryPanel.vue`、`CharacterPanel.vue`、`GameplayPanel.vue`、`ImageDeck.vue`、`AchievementNotch.vue` 统一补齐 `data-ui`
- 继续扩展按钮 / 面板 / 输入框的 token 化覆盖面
- 为主题模块补充更明确的当前来源提示和清空导入入口

## `data-ui` 约定建议

建议从这些组件开始补：

- `app-root`
- `stage-area`
- `stage-background`
- `stage-overlay`
- `dialogue-box`
- `dialogue-box-header`
- `dialogue-box-body`
- `dialogue-box-footer`
- `choice-panel`
- `settings-panel`
- `toast`
- `panel`
- `button`
- `input`
- `toggle`

原则是：

- 主题只靠 `data-ui` 和 token 识别区域
- 不要依赖组件内部层级名
- 内部 DOM 未来可重构，但 `data-ui` 保持稳定

---

## 修改顺序建议

### 阶段 1：主题底座

先完成这些内容：

1. 在 `settings` 中新增 theme 子模块
2. 定义主题 token 初版
3. 建立 CSS 注入机制
4. 给根容器补统一主题挂点
5. 给核心组件补 `data-ui`

### 阶段 2：设置页主题模块

在设置页中加入：

- 自定义 CSS 粘贴区
- `.css` 文件导入
- 当前样式启用状态
- 重置按钮
- 说明文案和错误提示

### 阶段 3：核心视觉组件接管

优先改：

- `StageArea.vue`
- `DialogueBox.vue`
- toast 区域
- `SettingsPanel.vue` 本体

### 阶段 4：扩展到其余组件

继续改：

- `ChoicePanel.vue`
- `HistoryPanel.vue`
- `CharacterPanel.vue`
- `GameplayPanel.vue`
- `ImageDeck.vue`
- `AchievementNotch.vue`
- 各种按钮、输入框、弹窗、开关

### 阶段 5：兼容性与治理

补充：

- 主题 CSS 缺失兜底
- 用户 CSS 导入失败处理
- 主题切换后状态不丢失
- 主题不影响业务逻辑的回归检查

---

## 当前阶段的明确边界

本阶段**不做**：

- 完整第三方主题包格式
- 主题包压缩导入
- 资源包清单标准化
- 多主题市场
- 主题插件系统

本阶段只做：

- 现有 `settings` 中独立主题模块
- 直接粘贴 CSS
- 导入 `.css` 文件
- 核心 UI 留出可覆写接口
- 主题与逻辑解耦

---

## 主题写作建议

1. 先从变量开始
   - 能改颜色就先改颜色
   - 能改圆角就先改圆角
   - 能改阴影就先改阴影

2. 少量使用深层选择器
   - 优先用 `data-ui`
   - 尽量不要依赖内部多层 DOM

3. 不要改业务逻辑
   - 主题只影响视觉
   - 不要通过 CSS 去改变点击顺序、自动播放逻辑、状态流转

4. 优先局部测试
   - 先改对话框
   - 再改按钮
   - 再改 toast
   - 最后再调整整体背景

## 预期结果

完成后，`galgame` 的 UI 应该满足：

- 默认主题可用
- 用户可自己写 CSS 覆盖默认主题
- 用户可导入 `.css` 文件
- 按钮、对话框、toast 等区域可被单独覆写
- 视觉方案可替换，但业务逻辑不受主题影响
- 组件根节点具备稳定 `data-ui` 标识，方便主题精准命中
