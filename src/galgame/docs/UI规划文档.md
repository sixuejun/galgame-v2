# galgame（v1）UI 规划文档

本文档规划 `src/galgame`（v1）的 UI 组件、按钮分布与界面层级。

v1 的目标是在现有可运行 UI 基础上，满足以下体验约束：
- 单实例 iframe 渲染（仅 0 楼）
- 历史楼层浏览
- block 用尽自动跨楼层切换（连续阅读）
- 玩法模块以 overlay / module view 的方式插件化

相关：
- 架构与边界见：[设计文档](./设计文档.md)
- 导航与状态机见：[开发指南](./开发指南.md)

---

## 1. 界面层级结构（v1）

v1 的整体 UI 结构与 v2 蓝图一致，但组件映射到 v1 实际文件路径。

```
AppRoot
├── StageArea（舞台层）
├── ImageDeck（卡牌队列）
├── OverlayContainer（覆盖层容器）
│   ├── QuickAccessMenu（快捷菜单）
│   ├── AchievementNotch（成就刘海）
│   └── DialogueBox（对话框区；黑屏时由 BlacktextOverlay 接管）
├── ChoicePanel（选择框；覆盖在对话框上方）
└── Overlays（面板覆盖层）
    ├── SettingsPanel
    ├── HistoryPanel
    ├── CharacterPanel
    ├── GameplayPanel
    └── InputPanel（可选）
```

---

## 2. v1 组件映射表（权威）

| 规划组件 | v1 实现文件 |
|---|---|
| AppRoot | `src/galgame/App.vue` |
| StageArea | `src/galgame/components/stage/StageArea.vue` |
| BackgroundLayer | `src/galgame/components/stage/BackgroundLayer.vue` |
| SpriteLayer | `src/galgame/components/stage/SpriteLayer.vue` |
| DanmakuLayer | （若拆分）建议：`src/galgame/components/stage/DanmakuLayer.vue` |
| ImageDeck | `src/galgame/components/stage/ImageDeck.vue` |
| DialogueBox | `src/galgame/components/dialogue/DialogueBox.vue` |
| TypewriterText | `src/galgame/components/dialogue/TypewriterText.vue` |
| BlacktextOverlay | `src/galgame/components/dialogue/BlacktextOverlay.vue` |
| ChoicePanel | `src/galgame/components/panel/ChoicePanel.vue` |
| QuickAccessMenu | `src/galgame/components/layout/QuickAccessMenu.vue` |
| AchievementNotch | `src/galgame/components/layout/AchievementNotch.vue` |
| SettingsPanel | `src/galgame/components/panel/SettingsPanel.vue` |
| HistoryPanel | `src/galgame/components/panel/HistoryPanel.vue` |
| CharacterPanel | `src/galgame/components/panel/CharacterPanel.vue` |
| GameplayPanel | `src/galgame/components/module/GameplayPanel.vue` |
| WorldbookManagerPanel | `src/galgame/components/panel/WorldbookManagerPanel.vue` |

> 说明：若后续重构发生文件迁移，应同时更新本表；该表视为“UI 结构的文档 API”。

---

## 3. 主界面布局（交互层）

### 3.1 舞台层（StageArea）

- 位置：全屏背景，最底层
- 负责：背景/立绘/CG 的层叠与过渡
- 约束：
  - 舞台只关心“当前 block”的展示态，不关心历史导航的业务决策
  - 图片加载/缓存策略应由 store 或资源层统一管理

### 3.2 对话框（DialogueBox）

- 位置：底部居中
- 负责：
  - 展示角色名、台词、翻页按钮
  - 打字机效果与跳过
  - 黑屏 block 时由 BlacktextOverlay 接管交互

### 3.3 选择框（ChoicePanel）

- 位置：覆盖在对话框上方
- 约束：
  - 点击空白区域应允许“穿透翻页”（由设计决定）
  - 选择提交必须走统一入口（store action 或统一发送函数）

---

## 4. 覆盖层（Overlay）

Overlay 的原则：
- 打开 overlay 时，VN 主舞台依然存在（舞台不断层）
- overlay 内的玩法模块不得破坏 VN 导航状态机

### 4.1 历史面板（HistoryPanel）

目标交互：
- 显示楼层列表与楼层内 block 列表
- 支持跳转到指定楼层/指定 block
- 支持“一键回到最新”

### 4.2 玩法面板（GameplayPanel / ModuleView）

- GameplayPanel 是“插件入口列表”
- ModuleView 是“插件内容容器”（例如 Shop/Inventory/BoardGame/2048/Riddle/Comms）

插件化约束：
- 输入：只读 store
- 输出：只通过 store action

---

## 5. 主题方向（先保留接口，后集中美术迭代）

v1 支持多个主题方向：
- Animal Island
- 液态玻璃/Linear
- 现有报纸风/和蝶风

约束：
- 主题差异必须尽量通过 `--theme-*` 变量表达
- 组件不应依赖某一个具体主题的“专属变量”
