# Eden System - 前端应用文档

> 互动式故事游戏系统的前端实现

## 📖 概述

本目录包含 Eden System 的前端应用代码，这是一个基于 Vue 3 + TypeScript + Pinia 的现代化单页应用（SPA），专为 SillyTavern 环境设计。应用通过 JS-Slash-Runner 插件与 SillyTavern 的 AI 和世界书系统深度集成，提供沉浸式的互动故事游戏体验。

## 🏗️ 技术架构

### 核心技术栈

- **Vue 3.5.22**: 使用 Composition API 和 `<script setup>` 语法
- **TypeScript 5.9.3**: 严格类型检查，提供完整的类型安全
- **Pinia 3.0.3**: 轻量级状态管理，替代 Vuex
- **Vite 7.1.12**: 快速的开发服务器和优化的生产构建
- **Vitest 4.0.3**: 基于 Vite 的单元测试框架

### 主要依赖

- **js-yaml 4.1.1**: YAML 数据解析和序列化
- **dompurify 3.3.0**: HTML 内容安全处理，防止 XSS 攻击
- **marked 11.2.0**: Markdown 解析和渲染
- **pinia 3.0.3**: Vue 官方推荐的状态管理库

### 开发工具

- **ESLint**: 代码质量检查（配置了 TypeScript 和 Vue 规则）
- **Prettier**: 代码格式化
- **Husky**: Git hooks 管理
- **lint-staged**: 提交前代码检查
- **TypeDoc**: API 文档生成

## 🚀 开发环境设置

### 前置要求

- **Node.js**: >= 22.0.0
- **pnpm**: >= 10.0.0（推荐使用 10.19.0）

### 安装依赖

```bash
pnpm install
```

### 开发工具配置

#### VSCode（推荐）

推荐安装以下扩展以获得最佳开发体验：

- **ESLint** (`dbaeumer.vscode-eslint`) - 代码质量检查
- **Prettier** (`esbenp.prettier-vscode`) - 代码格式化
- **Vue Language Features (Volar)** (`Vue.volar`) - Vue 3 语言支持
- **TypeScript Vue Plugin** (`Vue.vscode-typescript-vue-plugin`) - Vue 中的 TypeScript 支持

项目已包含 `.vscode/settings.json` 配置，会自动启用保存时格式化和 ESLint 自动修复。

#### 其他编辑器

如果使用其他编辑器（WebStorm、Sublime Text、Vim 等），请确保安装以下插件：

- **EditorConfig** 支持 - 统一代码风格
- **ESLint** 支持 - 代码质量检查
- **Prettier** 支持 - 代码格式化
- **Vue** 语法高亮和智能提示
- **TypeScript** 语言支持

### 开发命令

```bash
# 启动开发服务器（http://localhost:5000）
pnpm run dev

# 构建生产版本
pnpm run build

# 预览生产构建
pnpm run preview

# 类型检查
pnpm run type-check

# 运行测试
pnpm run test          # 监听模式
pnpm run test:run      # 单次运行
pnpm run test:ui       # UI 模式
pnpm run test:coverage # 测试覆盖率

# 代码检查和格式化
pnpm run lint          # ESLint 自动修复
pnpm run lint:check    # ESLint 检查
pnpm run format        # Prettier 格式化
pnpm run format:check  # Prettier 检查

# 生成 API 文档
pnpm run docs          # 生成文档到 docs/api/
pnpm run docs:serve    # 生成并启动文档服务器
```

## 📁 项目结构

```
app/
├── src/
│   ├── components/           # Vue 组件
│   │   ├── common/          # 通用组件
│   │   │   ├── CustomNumberInput.vue    # 自定义数字输入框
│   │   │   ├── CustomSelect.vue         # 自定义下拉选择器
│   │   │   ├── EmptyState.vue           # 空状态占位符
│   │   │   ├── ErrorBoundary.vue        # 错误边界组件
│   │   │   ├── Icon.vue                 # 图标组件
│   │   │   ├── LoadingSpinner.vue       # 加载动画
│   │   │   ├── Pagination.vue           # 分页组件
│   │   │   ├── ProgressBar.vue          # 进度条
│   │   │   ├── QuantitySelector.vue     # 数量选择器
│   │   │   ├── SafeImage.vue            # 安全图片组件
│   │   │   ├── ScrollToTopButton.vue    # 回到顶部按钮
│   │   │   ├── SkeletonCard.vue         # 骨架屏卡片
│   │   │   └── ToastContainer.vue       # Toast 通知容器
│   │   ├── layout/          # 布局组件
│   │   │   ├── AILoadingOverlay.vue     # AI 加载遮罩
│   │   │   ├── Modal.vue                # 模态框
│   │   │   ├── NavBar.vue               # 导航栏
│   │   │   └── PageRouter.vue           # 页面路由器
│   │   └── pages/           # 页面组件
│   │       ├── AchievementsPage.vue     # 成就页面
│   │       ├── CartPage.vue             # 购物车页面
│   │       ├── HomePage.vue             # 主页
│   │       ├── InitializationPage.vue   # 初始化页面
│   │       ├── LoadGamePage.vue         # 加载存档页面
│   │       ├── ReviewPage.vue           # 剧情回顾页面
│   │       ├── SettingsPage.vue         # 设置页面
│   │       ├── ShopPage.vue             # 商店页面
│   │       ├── StatusPage.vue           # 状态页面
│   │       └── StoragePage.vue          # 物品存储页面
│   ├── composables/         # 组合式函数（业务逻辑复用，按功能分类）
│   │   ├── achievement/     # 成就相关
│   │   │   ├── useAchievementProgress.ts    # 成就进度计算
│   │   │   └── useAchievementUnlock.ts      # 成就自动解锁
│   │   ├── ai/              # AI 通信相关
│   │   │   ├── useAICommunication.ts        # AI 通信
│   │   │   └── useAILoadingState.ts         # AI 加载状态
│   │   ├── app/             # 应用生命周期相关
│   │   │   ├── useAILoadingOverlay.ts       # AI 加载遮罩
│   │   │   ├── useAppErrorHandling.ts       # 应用错误处理
│   │   │   ├── useAppLifecycle.ts           # 应用生命周期
│   │   │   └── useHeightSync.ts             # iframe 高度同步
│   │   ├── form/            # 表单验证相关
│   │   │   └── useFormValidation.ts         # 表单验证
│   │   ├── game/            # 游戏逻辑相关
│   │   │   ├── useGameInitialization.ts     # 游戏初始化
│   │   │   ├── useItemEffects.ts            # 物品效果应用
│   │   │   ├── usePlayerChoice.ts           # 玩家选择处理
│   │   │   ├── useSearch.ts                 # 搜索功能
│   │   │   └── useStorageFiltering.ts       # 存储筛选
│   │   ├── save/            # 存档管理相关
│   │   │   ├── useSaveList.ts               # 存档列表
│   │   │   ├── useSaveManagement.ts         # 存档管理
│   │   │   └── useSaveOperations.ts         # 存档操作
│   │   ├── shop/            # 商店相关
│   │   │   ├── useCart.ts                   # 购物车基础逻辑
│   │   │   ├── useCartCheckout.ts           # 购物车结算
│   │   │   ├── useCartCoupon.ts             # 优惠券逻辑
│   │   │   ├── useShop.ts                   # 商店逻辑
│   │   │   ├── useShopFilters.ts            # 商店筛选
│   │   │   └── useShoppingCart.ts           # 购物车管理
│   │   └── ui/              # UI 交互相关
│   │       ├── useFullscreen.ts             # 全屏控制
│   │       ├── useHtmlSanitizer.ts          # HTML 安全处理
│   │       ├── useIframeHeightSync.ts       # iframe 高度同步
│   │       ├── useModal.ts                  # 模态框控制
│   │       ├── usePageNavigation.ts         # 页面导航
│   │       ├── usePagination.ts             # 分页逻辑
│   │       ├── useStoryContentProcessor.ts  # 故事内容处理
│   │       ├── useTheme.ts                  # 主题控制
│   │       ├── useToast.ts                  # Toast 通知
│   │       └── useTTS.ts                    # 文本转语音
│   ├── services/            # 业务服务层
│   │   ├── api/             # API 调用封装
│   │   │   ├── aiApi.ts                 # AI 生成 API
│   │   │   ├── characterApi.ts          # 角色卡 API
│   │   │   ├── minimaxApi.ts            # MiniMax TTS API
│   │   │   ├── worldbookApi.ts          # 世界书 API
│   │   │   └── index.ts                 # API 统一导出
│   │   ├── dataUpdate/      # 数据更新服务
│   │   │   ├── dataMerger.ts            # 数据合并器
│   │   │   ├── pathResolver.ts          # 路径解析器
│   │   │   ├── yamlParser.ts            # YAML 解析器
│   │   │   └── index.ts                 # 数据更新统一导出
│   │   ├── worldbook/       # 世界书服务
│   │   │   ├── worldbookConnectionService.ts  # 世界书连接
│   │   │   ├── worldbookDataService.ts        # 世界书数据管理
│   │   │   ├── worldbookSaveService.ts        # 世界书存档服务
│   │   │   └── index.ts                       # 世界书服务统一导出
│   │   ├── aiResponseParser.ts          # AI 响应解析（已废弃，逻辑已合并到 aiService）
│   │   ├── aiService.ts                 # AI 服务（含重试和解析逻辑）
│   │   ├── baseCacheService.ts          # 缓存服务基类
│   │   ├── dataBackupService.ts         # 数据备份服务
│   │   ├── gameDataService.ts           # 游戏数据服务
│   │   ├── imageCacheService.ts         # 图片缓存服务
│   │   ├── stChatu8ImageService.ts      # SillyTavern Chatu8 图片服务
│   │   └── ttsCacheService.ts           # TTS 缓存服务
│   ├── stores/              # Pinia 状态管理
│   │   ├── gameStore.ts                 # 游戏数据 Store
│   │   ├── navigationStore.ts           # 导航状态 Store
│   │   └── settingsStore.ts             # 应用设置 Store
│   ├── types/               # TypeScript 类型定义
│   │   ├── api.ts                       # API 相关类型
│   │   ├── common.ts                    # 通用类型
│   │   ├── config.ts                    # 配置类型
│   │   ├── external-apis.d.ts           # 外部 API 类型声明
│   │   ├── gameData.ts                  # 游戏数据类型
│   │   ├── global.d.ts                  # 全局类型声明
│   │   ├── shop.ts                      # 商店相关类型
│   │   ├── ui.ts                        # UI 相关类型
│   │   ├── utility.ts                   # 工具类型
│   │   └── index.ts                     # 类型统一导出
│   ├── utils/               # 工具函数
│   │   ├── typeGuards/      # 类型守卫
│   │   ├── dataValidation.ts            # 数据验证
│   │   ├── dateUtils.ts                 # 日期工具
│   │   ├── debounce.ts                  # 防抖函数
│   │   ├── environment.ts               # 环境检测
│   │   ├── errorHandler.ts              # 错误处理
│   │   ├── logger.ts                    # 日志工具
│   │   ├── pathUtils.ts                 # 路径工具
│   │   ├── sanitize.ts                  # 安全处理
│   │   └── storage.ts                   # 本地存储
│   ├── styles/              # 样式文件
│   │   ├── base.css                     # 基础样式
│   │   ├── components.css               # 组件样式
│   │   ├── utilities.css                # 工具类样式
│   │   └── index.css                    # 样式入口
│   ├── constants/           # 常量定义
│   │   ├── index.ts                     # 常量导出
│   │   └── messages.ts                  # 消息常量
│   ├── App.vue              # 根组件
│   ├── main.ts              # 应用入口
│   └── vite-env.d.ts        # Vite 环境类型声明
├── public/                  # 静态资源
│   └── data.yaml            # 示例游戏数据
├── dist/                    # 构建输出目录
├── docs/                    # 技术文档
├── scripts/                 # 辅助脚本
│   ├── check-color-contrast.js         # 颜色对比度检查
│   └── generate-file-tree.js           # 文件树生成
├── package.json             # 项目配置和依赖
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # TypeScript 配置
├── tsconfig.node.json       # Node.js TypeScript 配置
├── eslint.config.js         # ESLint 配置
├── typedoc.json             # TypeDoc 配置
├── CONTRIBUTING.md          # 贡献指南
└── CHANGELOG.md             # 变更日志
```

## 🎯 核心功能模块

### 1. 游戏数据管理

- **数据加载**: 从世界书或本地示例数据加载游戏数据
- **数据更新**: 通过 YAML 路径更新游戏数据
- **自动保存**: 玩家操作后自动保存到世界书
- **手动存档**: 支持多存档管理（保存、加载、删除、导入/导出）

### 2. AI 通信

- **剧情生成**: 发送玩家选择到 AI，生成新的剧情内容
- **响应解析**: 解析 AI 返回的 YAML 格式数据
- **重试机制**: 自动重试失败的 AI 请求
- **错误处理**: 友好的错误提示和降级处理

### 3. 状态管理（Pinia Stores）

- **gameStore**: 管理游戏核心数据（配置、故事、角色、商店、成就等）
- **navigationStore**: 管理页面导航状态
- **settingsStore**: 管理应用设置（重试次数、调试模式、自动保存等）

### 4. 页面系统

应用采用自定义的页面路由系统（非 Vue Router），通过 `PageRouter` 组件根据 `currentPage` 状态渲染不同页面：

- **home**: 主页 - 显示故事内容和玩家选择
- **status**: 状态页 - 显示角色详细信息
- **shop**: 商店页 - 浏览和购买物品
- **cart**: 购物车页 - 管理购物车和结算
- **storage**: 存储页 - 查看已拥有的物品
- **achievements**: 成就页 - 查看成就进度和解锁记录
- **review**: 回顾页 - 查看剧情摘要
- **load**: 加载页 - 管理存档
- **settings**: 设置页 - 配置应用选项

### 5. 商店和物品系统

- **物品浏览**: 分类筛选、搜索、分页
- **购物车**: 添加/移除物品、数量调整、优惠券应用
- **物品效果**: 支持多种效果类型（add、subtract、set、add_status、remove_status）
- **货币管理**: 灵活的货币显示模式

### 6. 成就系统

- **成就进度**: 基于游戏数据路径自动计算进度
- **自动解锁**: 监听数据变化，满足条件时自动解锁成就
- **稀有度**: 支持成就稀有度分类

## 🔧 构建配置

### Vite 配置要点

- **单文件构建**: 使用 `vite-plugin-singlefile` 生成单个 HTML 文件
- **代码压缩**: 使用 Terser 进行代码压缩（比 esbuild 兼容性更好）
- **外部依赖**: Vue、Pinia、js-yaml、DOMPurify、marked 标记为外部依赖，通过全局变量引入
- **IIFE 格式**: 输出为立即执行函数表达式，适合 iframe 环境
- **路径别名**: `@` 指向 `src` 目录

### TypeScript 配置要点

- **目标**: ES2022
- **严格模式**: 启用所有严格类型检查
- **模块解析**: bundler 模式
- **未使用变量检查**: 启用

### ESLint 配置要点

- **TypeScript 规则**: 禁止使用 `any`，检查未使用变量
- **Vue 规则**: 禁止使用 `v-html`（安全考虑），允许单词组件名
- **测试文件**: 特殊规则，允许多组件定义

## 📚 开发指南

### 添加新页面

1. 在 `src/components/pages/` 创建页面组件
2. 在 `PageRouter.vue` 中注册页面
3. 在 `config.navButtons` 中添加导航按钮配置（如需要）

### 添加新的 Composable

1. 在 `src/composables/` 创建文件，命名为 `use*.ts`
2. 导出函数，返回响应式数据和方法
3. 添加 JSDoc 注释
4. 在 `__tests__/` 目录添加单元测试

### 添加新的类型定义

1. 在 `src/types/` 对应的文件中添加类型
2. 在 `src/types/index.ts` 中导出
3. 使用 `interface` 定义对象类型，使用 `type` 定义联合类型或工具类型

### 数据更新

使用 `dataUpdate` 模块提供的服务更新游戏数据：

```typescript
import { PathResolver, DataMerger, YamlParser } from '@/services/dataUpdate'

// 解析 YAML 更新操作
const operations = YamlParser.parseYamlUpdates(yamlString)

// 设置路径值
PathResolver.setPath(gameData, 'shop.currency', 100)

// 删除路径
PathResolver.deletePath(gameData, 'shop.items.item1')

// 合并数据
const mergedData = DataMerger.mergeGameData(currentData, newData)
```

## 🧪 测试

### 测试策略

- **单元测试**: 测试独立的函数和 Composables
- **组件测试**: 测试 Vue 组件的行为和渲染
- **覆盖率目标**: 保持在 80% 以上

### 运行测试

```bash
# 监听模式（开发时使用）
pnpm run test

# 单次运行（CI 环境）
pnpm run test:run

# 测试覆盖率
pnpm run test:coverage

# UI 模式（可视化测试结果）
pnpm run test:ui
```

## 🐛 调试技巧

### 开启调试模式

在设置页面开启"调试模式"，或在浏览器控制台执行：

```javascript
localStorage.setItem('eden-system-settings', JSON.stringify({ debugMode: true }))
```

调试模式会在控制台输出详细的日志信息。

### 查看游戏数据

在浏览器控制台执行：

```javascript
// 查看完整游戏数据
window.__EDEN_DEBUG__ = true
```

### 常见问题

**Q: 开发服务器启动失败？**
A: 检查 Node.js 版本（需要 >= 22.0.0）和 pnpm 版本（需要 >= 10.0.0）

**Q: 类型检查报错？**
A: 运行 `pnpm run type-check` 查看详细错误，确保所有类型定义正确

**Q: 测试失败？**
A: 检查是否安装了所有依赖，运行 `pnpm install` 重新安装

## 📖 相关文档

- [贡献指南](./CONTRIBUTING.md) - 代码规范、提交规范、PR 流程
- [技术文档](./docs/) - 架构设计、API 接口、数据模型等详细文档

## 📄 许可证

MIT License
