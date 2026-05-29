# 伊甸园 - Eden System

> 一个只属于二人的完美世界

[![Vue 3](https://img.shields.io/badge/Vue-3.5.22-4FC08D?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.12-646CFF?logo=vite)](https://vitejs.dev/)
[![Pinia](https://img.shields.io/badge/Pinia-3.0.3-FFD859)](https://pinia.vuejs.org/)

## 📖 项目简介

Eden System 是一个基于 Vue 3 的互动式故事游戏系统，专为 [SillyTavern](https://github.com/SillyTavern/SillyTavern) 设计。它通过 [JS-Slash-Runner](https://github.com/N0VI028/JS-Slash-Runner) 插件与 SillyTavern 深度集成，提供了一个沉浸式的游戏体验，结合了 AI 驱动的剧情生成、角色状态管理、物品系统和成就系统。

### ✨ 核心特性

- 🎮 **AI 驱动的剧情生成**：与 SillyTavern 的 AI 深度集成，动态生成剧情内容
- 📊 **完整的角色系统**：多维度角色状态追踪（好感度、信任度、依赖度等）
- 🛒 **物品与商店系统**：UNDO 商店、物品效果、购物车、优惠券功能
- 🏆 **成就系统**：记录玩家的游戏进度和里程碑，支持自动解锁
- 💾 **存档管理**：支持多存档、导入/导出、自动保存到世界书
- 📖 **剧情回顾**：查看历史剧情摘要，支持自定义回顾配置
- 🖼️ **图片生成**：支持 Pollinations.ai 和 ST-ChatU8 图片生成服务
- 🔊 **语音合成**：集成 MiniMax TTS 语音合成服务
- 🎨 **主题系统**：支持多种主题切换和自定义样式
- 📱 **响应式设计**：适配各种屏幕尺寸，支持移动端
- 🎯 **现代化 UI**：清晰的界面设计和流畅的交互体验

### 🔧 技术栈

- **前端框架**：[Vue 3.5.22](https://vuejs.org/) (Composition API + `<script setup>`)
- **状态管理**：[Pinia 3.0.3](https://pinia.vuejs.org/) - Vue 官方推荐的状态管理库
- **类型系统**：[TypeScript 5.9.3](https://www.typescriptlang.org/) - 严格类型检查
- **构建工具**：[Vite 7.1.12](https://vitejs.dev/) - 快速的开发服务器和优化的生产构建
- **测试框架**：[Vitest 4.0.3](https://vitest.dev/) + [@vue/test-utils](https://test-utils.vuejs.org/)
- **代码规范**：ESLint + Prettier + Husky + lint-staged + Commitlint
- **数据格式**：YAML (js-yaml 4.1.1) + Markdown (marked 11.2.0)
- **安全处理**：DOMPurify 3.3.0 (防止 XSS 攻击)
- **文档生成**：TypeDoc 0.28.14

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 22.0.0
- **pnpm**: >= 10.0.0 (推荐使用 10.19.0)

### 安装依赖

```bash
cd app
pnpm install
```

### 开发模式

```bash
pnpm run dev
```

开发服务器将在 `http://localhost:5000` 启动（如果端口被占用会自动尝试下一个可用端口）。

### 构建生产版本

```bash
pnpm run build
```

构建产物将输出到 `app/dist/` 目录，生成单文件 HTML（使用 vite-plugin-singlefile）。

### 运行测试

```bash
# 运行所有测试
pnpm run test:run

# 监听模式
pnpm run test

# 测试覆盖率
pnpm run test:coverage

# UI 模式
pnpm run test:ui
```

### 代码检查和格式化

```bash
# 类型检查
pnpm run type-check

# ESLint 检查
pnpm run lint:check

# ESLint 自动修复
pnpm run lint

# Prettier 格式化检查
pnpm run format:check

# Prettier 自动格式化
pnpm run format
```

## 📂 项目结构

```
SillyTavern-tongceng/
├── app/                      # 前端应用目录
│   ├── src/                  # 源代码
│   │   ├── components/       # Vue 组件
│   │   │   ├── common/       # 通用组件（输入、加载器、Toast、图片等）
│   │   │   ├── layout/       # 布局组件（导航栏、模态框、路由器、AI 加载遮罩）
│   │   │   └── pages/        # 页面组件（10 个功能页面）
│   │   ├── composables/      # 可复用的组合式函数（按功能分类）
│   │   │   ├── achievement/  # 成就相关（进度计算、自动解锁）
│   │   │   ├── ai/           # AI 通信相关（请求、重试、加载状态）
│   │   │   ├── app/          # 应用生命周期相关（错误处理、高度同步）
│   │   │   ├── form/         # 表单验证相关
│   │   │   ├── game/         # 游戏逻辑相关（初始化、选择、物品效果、搜索）
│   │   │   ├── save/         # 存档管理相关（列表、操作、管理）
│   │   │   ├── shop/         # 商店相关（商品、购物车、优惠券、结算）
│   │   │   └── ui/           # UI 交互相关（模态框、Toast、分页、主题、TTS）
│   │   ├── services/         # 业务逻辑服务
│   │   │   ├── api/          # API 调用封装（AI、世界书、角色、MiniMax）
│   │   │   ├── dataUpdate/   # 数据更新服务（合并、解析、路径解析）
│   │   │   ├── worldbook/    # 世界书服务（连接、数据、存档）
│   │   │   ├── aiService.ts  # AI 服务（请求、解析、重试）
│   │   │   ├── gameDataService.ts  # 游戏数据服务（加载、初始化）
│   │   │   ├── imageCacheService.ts  # 图片缓存服务
│   │   │   ├── ttsCacheService.ts    # TTS 缓存服务
│   │   │   └── ...           # 其他核心服务
│   │   ├── stores/           # Pinia 状态管理
│   │   │   ├── gameStore.ts       # 游戏核心数据（config、story、characters 等）
│   │   │   ├── navigationStore.ts # 页面导航状态
│   │   │   └── settingsStore.ts   # 应用设置（重试、调试、主题等）
│   │   ├── types/            # TypeScript 类型定义（按功能分类）
│   │   │   ├── api.ts        # API 相关类型
│   │   │   ├── common.ts     # 通用类型
│   │   │   ├── config.ts     # 配置类型
│   │   │   ├── gameData.ts   # 游戏数据类型
│   │   │   ├── shop.ts       # 商店相关类型
│   │   │   ├── ui.ts         # UI 相关类型
│   │   │   ├── utility.ts    # 工具类型
│   │   │   └── external-apis.d.ts  # 外部 API 类型声明
│   │   ├── utils/            # 工具函数（纯函数，无副作用）
│   │   │   ├── dataValidation.ts  # 数据验证
│   │   │   ├── dateUtils.ts       # 日期处理
│   │   │   ├── debounce.ts        # 防抖函数
│   │   │   ├── environment.ts     # 环境检测
│   │   │   ├── errorHandler.ts    # 错误处理
│   │   │   ├── logger.ts          # 日志工具
│   │   │   ├── sanitize.ts        # 安全处理
│   │   │   ├── storage.ts         # 本地存储
│   │   │   ├── typeGuards/        # 类型守卫
│   │   │   └── imageParser/       # 图片解析
│   │   ├── styles/           # 样式文件
│   │   │   ├── base.css      # 基础样式和 CSS 变量
│   │   │   ├── components.css  # 组件样式
│   │   │   ├── utilities.css   # 工具类样式
│   │   │   ├── themes/         # 主题样式
│   │   │   └── index.css       # 样式入口
│   │   ├── constants/        # 常量定义
│   │   ├── App.vue           # 根组件
│   │   ├── main.ts           # 应用入口
│   │   └── vite-env.d.ts     # Vite 环境类型声明
│   ├── public/               # 静态资源（data.yaml 示例数据）
│   ├── dist/                 # 构建输出目录
│   ├── docs/                 # 技术文档（14 个文档文件）
│   ├── coverage/             # 测试覆盖率报告
│   ├── package.json          # 项目依赖和脚本
│   ├── vite.config.ts        # Vite 配置
│   ├── tsconfig.json         # TypeScript 配置
│   ├── tsconfig.node.json    # Node.js TypeScript 配置
│   ├── eslint.config.js      # ESLint 配置
│   ├── commitlint.config.js  # Commitlint 配置
│   ├── typedoc.json          # TypeDoc 配置
│   ├── CONTRIBUTING.md       # 贡献指南
│   ├── CHANGELOG.md          # 变更日志
│   ├── LICENSE               # 许可证
│   └── README.md             # 前端应用说明
├── 系统提示词/               # AI 系统提示词
├── 安装指南.md               # 安装与使用指南
└── README.md                 # 项目说明（本文件）
```

## 📚 相关文档

### 入门文档
- [📘 安装指南](./安装指南.md) - 快速安装和完整安装指南，SillyTavern 配置说明
- [📖 前端应用 README](./app/README.md) - 前端应用快速入门、开发流程、调试技巧

### 开发文档
- [🤝 贡献指南](./app/CONTRIBUTING.md) - 代码规范、提交规范、测试要求和 PR 流程
- [🏗️ 架构设计说明](./app/docs/架构设计说明.md) - 系统架构、技术栈、模块划分、设计模式
- [🔌 API 接口说明](./app/docs/API接口说明.md) - 外部 API 和内部服务 API 文档
- [📊 数据模型说明](./app/docs/数据模型说明.md) - 所有数据结构的详细定义
- [🗂️ 状态管理说明](./app/docs/状态管理说明.md) - Pinia Store 使用指南
- [🧩 组件使用指南](./app/docs/组件使用指南.md) - 可复用组件的使用文档
- [💻 开发指南](./app/docs/开发指南.md) - 添加新功能的实用指南
- [🧪 测试指南](./app/docs/测试指南.md) - 测试编写指南和最佳实践
- [🚀 部署指南](./app/docs/部署指南.md) - 构建和部署说明
- [🔧 故障排查指南](./app/docs/故障排查指南.md) - 常见问题和解决方案

## 🔗 依赖项目

- [SillyTavern](https://github.com/SillyTavern/SillyTavern) - AI 聊天界面
- [JS-Slash-Runner](https://github.com/N0VI028/JS-Slash-Runner) - SillyTavern 插件，提供 JavaScript 执行环境和 API

## 📄 许可证

MIT License

---

**感谢使用 Eden System！** 🎉