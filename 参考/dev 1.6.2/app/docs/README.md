# Eden System - 文档索引

欢迎来到 Eden System 前端应用的文档中心！本目录包含了项目的所有技术文档。

## 📚 文档导航

### 入门文档

- **[前端应用 README](../README.md)** - 前端应用的快速入门指南，包含开发环境设置、项目结构、核心功能等

### 架构与设计

- **[架构设计说明](./架构设计说明.md)** - 系统整体架构、技术栈、模块划分、数据流、设计模式等
- **[数据模型说明](./数据模型说明.md)** - 所有数据结构的详细定义，包括 GameData、Config、Story、Shop、Achievement 等

### API 与接口

- **[API 接口说明](./API接口说明.md)** - 外部 API（JS-Slash-Runner）和内部服务 API 的完整文档

### 状态管理

- **[状态管理说明](./状态管理说明.md)** - Pinia Store 的使用指南，包括 gameStore、navigationStore、settingsStore

### 组件开发

- **[组件使用指南](./组件使用指南.md)** - 所有可复用通用组件的使用文档，包括 Icon、ProgressBar、CustomNumberInput 等

### 开发指南

- **[开发指南](./开发指南.md)** - 实用的开发指南，包括如何添加新页面、Composable、类型定义、物品效果、成就等
- **[测试指南](./测试指南.md)** - 测试编写指南,包括单元测试、组件测试、Mock 使用、测试最佳实践

### 部署与运维

- **[部署指南](./部署指南.md)** - 完整的构建和部署流程，包括环境要求、构建步骤、SillyTavern 部署配置
- **[故障排查指南](./故障排查指南.md)** - 常见问题的排查和解决方法，包括界面问题、AI 通信、数据加载、性能优化

## 📖 文档概览

### 架构设计说明.md

**内容**:

- 整体架构图
- 技术栈详解
- 目录结构说明
- 数据流设计
- 组件层次结构
- 设计模式
- 性能优化策略
- 安全措施
- 可扩展性设计
- 测试策略

**适合人群**: 新加入的开发者、架构师、技术负责人

### 数据模型说明.md

**内容**:

- GameData 核心数据结构
- Config 配置数据
- Story 剧情数据
- Choice 选择数据
- Character 角色数据
- ShopData 商店数据
- Item 物品数据
- Achievement 成就数据
- UI 类型定义
- 数据路径规范
- 数据验证
- 数据更新机制
- 数据持久化

**适合人群**: 所有开发者（必读）

### API接口说明.md

**内容**:

- JS-Slash-Runner 外部 API
  - window.generate() - AI 生成
  - window.getWorldbook() - 获取世界书
  - window.updateWorldbook() - 更新世界书
  - window.getCharWorldbooks() - 获取角色世界书
- 内部服务 API
  - AIService - AI 服务
  - GameDataService - 游戏数据服务
  - WorldbookDataService - 世界书数据服务
  - WorldbookSaveService - 世界书存档服务
  - AIResponseParser - AI 响应解析
  - GameDataUpdater - 游戏数据更新
- 错误处理
- 重试机制
- API 调用流程图
- 最佳实践

**适合人群**: 需要调用 API 或处理数据的开发者

### 状态管理说明.md

**内容**:

- Pinia Store 架构
- gameStore - 游戏核心数据
  - 状态（State）
  - 计算属性（Getters）
  - 操作（Actions）
- navigationStore - 页面导航
- settingsStore - 应用设置
- Store 初始化
- 在组件中使用 Store
- 数据持久化策略
- 最佳实践
- 调试技巧
- 常见问题

**适合人群**: 需要访问或修改应用状态的开发者

### 组件使用指南.md

**内容**:

- Icon - 图标组件
- ProgressBar - 进度条组件
- CustomNumberInput - 数字输入组件
- CustomSelect - 下拉选择组件
- QuantitySelector - 数量选择器
- LoadingSpinner - 加载动画
- EmptyState - 空状态组件
- SkeletonCard - 骨架屏
- SafeImage - 安全图片组件
- Pagination - 分页组件
- ScrollToTopButton - 滚动到顶部按钮
- ToastContainer - Toast 通知容器
- ErrorBoundary - 错误边界组件
- 最佳实践
- 测试

**适合人群**: 需要使用通用组件的开发者

### 开发指南.md

**内容**:

- 添加新页面
- 添加新的 Composable
- 添加新的类型定义
- 更新游戏数据
- 添加物品效果
- 添加成就
- 调试技巧
- 性能优化
- 错误处理
- 代码规范
- 常见问题

**适合人群**: 所有开发者（实用指南）

### 测试指南.md

**内容**:

- 测试框架和工具（Vitest、Vue Test Utils）
- 测试文件组织
- 组件测试（渲染、Props、事件、插槽）
- Mock 使用（子组件、Composables、Services、Store）
- Composables 测试
- Service 测试
- 工具函数测试
- 测试最佳实践（独立性、AAA 模式、边界情况）
- 常见测试场景
- 覆盖率目标
- 调试测试

**适合人群**: 需要编写测试的开发者

### 部署指南.md

**内容**:

- 环境要求（Node.js、pnpm、SillyTavern、JS-Slash-Runner）
- 构建流程（克隆项目、安装依赖、构建生产版本）
- 部署到 SillyTavern（配置正则表达式、复制构建产物）
- 验证部署（检查清单、测试步骤）
- 常见问题（构建失败、更新部署、自定义配置）
- **重要提示**: 应用依赖 CDN 加载运行时库，需要网络连接

**适合人群**: 部署人员、运维人员、新用户

### 故障排查指南.md

**内容**:

- 前端界面问题（界面未显示、无法交互、样式错乱）
- AI 通信问题（响应格式错误、请求超时）
- 数据加载问题（世界书加载失败、存档加载失败）
- 性能问题（界面卡顿）
- 调试工具（开启调试模式、查看日志、检查数据）
- 错误代码参考
- **重要提示**: 包含 CDN 依赖加载问题的排查方法

**适合人群**: 遇到问题的用户、技术支持人员

## 🚀 快速开始

### 新开发者入门路径

1. **阅读 [前端应用 README](../README.md)** - 了解项目概况和开发环境设置
2. **阅读 [架构设计说明](./架构设计说明.md)** - 理解系统整体架构
3. **阅读 [数据模型说明](./数据模型说明.md)** - 熟悉核心数据结构
4. **阅读 [开发指南](./开发指南.md)** - 学习常见开发任务
5. **根据需要查阅其他文档** - API、状态管理、组件等

### 常见任务快速查找

| 任务             | 参考文档                                    |
| ---------------- | ------------------------------------------- |
| 部署到生产环境   | [部署指南](./部署指南.md)                   |
| 排查界面问题     | [故障排查指南](./故障排查指南.md)           |
| 添加新页面       | [开发指南](./开发指南.md) - 第 2 节         |
| 调用 AI API      | [API接口说明](./API接口说明.md) - 第 3.1 节 |
| 更新游戏数据     | [开发指南](./开发指南.md) - 第 5 节         |
| 使用 Store       | [状态管理说明](./状态管理说明.md) - 第 7 节 |
| 使用通用组件     | [组件使用指南](./组件使用指南.md)           |
| 添加物品         | [开发指南](./开发指南.md) - 第 6 节         |
| 添加成就         | [开发指南](./开发指南.md) - 第 7 节         |
| 理解数据结构     | [数据模型说明](./数据模型说明.md)           |
| 调试问题         | [开发指南](./开发指南.md) - 第 8 节         |
| 编写测试         | [测试指南](./测试指南.md)                   |
| CDN 依赖加载失败 | [故障排查指南](./故障排查指南.md) - 第 1.2  |

## 📝 文档维护

### 更新文档

当代码发生重大变更时，请及时更新相关文档：

- 添加新功能 → 更新相关文档
- 修改 API → 更新 API接口说明.md
- 添加新组件 → 更新 组件使用指南.md
- 修改数据结构 → 更新 数据模型说明.md
- 修改架构 → 更新 架构设计说明.md

### 文档规范

- 使用 Markdown 格式
- 添加代码示例
- 使用表格整理信息
- 添加目录和导航
- 保持文档简洁清晰

## 🔗 相关资源

### 项目文档

- [根目录 README](../../README.md) - 项目总体说明
- [贡献指南](../CONTRIBUTING.md) - 代码规范和贡献流程
- [更新日志](../CHANGELOG.md) - 版本更新记录

### 技术文档

- [Vue 3 官方文档](https://cn.vuejs.org/)
- [Pinia 官方文档](https://pinia.vuejs.org/zh/)
- [TypeScript 官方文档](https://www.typescriptlang.org/zh/)
- [Vite 官方文档](https://cn.vitejs.dev/)
- [Vitest 官方文档](https://cn.vitest.dev/)

### 第三方库

- [js-yaml](https://github.com/nodeca/js-yaml) - YAML 解析
- [DOMPurify](https://github.com/cure53/DOMPurify) - HTML 净化
- [Font Awesome](https://fontawesome.com/) - 图标库

### 外部依赖

- **CDN 依赖**: Vue 3、Pinia、js-yaml、DOMPurify、marked（通过 unpkg.com 加载）
- **可选插件**: st-chatu8（图片生成服务网关，对接 Stable Diffusion、NovelAI、ComfyUI）

## 💡 提示

- 文档中的代码示例都基于实际代码，可以直接使用
- 遇到问题时，先查阅相关文档，再查看源代码
- 建议按照"新开发者入门路径"顺序阅读文档
- 使用 Ctrl+F（或 Cmd+F）在文档中搜索关键词

## 📧 反馈

如果发现文档有错误或需要改进的地方，请：

1. 提交 Issue
2. 提交 Pull Request
3. 联系项目维护者

---

**最后更新**: 2025-11-24
**文档版本**: 1.6.0
