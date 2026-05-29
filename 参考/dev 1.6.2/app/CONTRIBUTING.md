# 贡献指南 (Contributing Guide)

感谢您对 Eden System 项目的关注！我们欢迎任何形式的贡献，包括但不限于：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复或新功能
- 🧪 编写测试用例
- 🎨 改进 UI/UX 设计

## 📋 目录

- [开发环境设置](#开发环境设置)
- [项目结构](#项目结构)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [测试要求](#测试要求)
- [Pull Request 流程](#pull-request-流程)
- [问题反馈](#问题反馈)

---

## 🛠️ 开发环境设置

### 前置要求

- **Node.js**: >= 22.0.0
- **pnpm**: >= 10.0.0 (推荐使用 10.19.0)
- **Git**: 最新版本

### 安装步骤

1. **Fork 并克隆仓库**

```bash
# 克隆你 fork 的仓库
git clone https://github.com/YOUR_USERNAME/eden-system.git
cd eden-system/app

# 添加上游仓库
git remote add upstream https://github.com/ORIGINAL_OWNER/eden-system.git
```

2. **安装依赖**

```bash
pnpm install
```

3. **启动开发服务器**

```bash
pnpm run dev
```

4. **验证环境**

```bash
# 运行测试
pnpm run test:run

# 类型检查
pnpm run type-check

# 代码规范检查
pnpm run lint:check
```

---

## 📁 项目结构

```
app/
├── src/
│   ├── components/          # Vue 组件
│   │   ├── common/         # 通用组件（按钮、卡片等）
│   │   ├── layout/         # 布局组件（导航栏、模态框等）
│   │   └── pages/          # 页面组件（包含页面子组件）
│   ├── composables/        # 可复用的组合式函数（按功能分类）
│   │   ├── achievement/    # 成就相关
│   │   ├── ai/             # AI 通信相关
│   │   ├── app/            # 应用生命周期相关
│   │   ├── form/           # 表单验证相关
│   │   ├── game/           # 游戏逻辑相关
│   │   ├── save/           # 存档管理相关
│   │   ├── shop/           # 商店相关
│   │   └── ui/             # UI 交互相关
│   ├── services/           # 业务逻辑服务
│   │   ├── api/            # API 调用封装
│   │   ├── dataUpdate/     # 数据更新服务
│   │   └── worldbook/      # 世界书服务
│   ├── stores/             # Pinia 状态管理
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   ├── styles/             # 样式文件
│   └── constants/          # 常量定义
├── public/                 # 静态资源
└── docs/                   # 项目文档
```

**架构原则**:

- 遵循单一职责原则（SRP）
- 避免创建"上帝模块"（God Object）
- 正确实施关注点分离（Separation of Concerns）
- 采用组件化/模块化设计模式

---

## 🔄 开发流程

### 1. 创建功能分支

```bash
# 从 main 分支创建新分支
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name

# 或修复 bug
git checkout -b fix/bug-description
```

### 2. 进行开发

- 遵循代码规范（见下文）
- 编写单元测试
- 更新相关文档
- 保持提交粒度合理（小步快跑）

### 3. 本地测试

```bash
# 运行所有测试
pnpm run test:run

# 运行测试覆盖率
pnpm run test:coverage

# 类型检查
pnpm run type-check

# 代码规范检查
pnpm run lint:check

# 格式化检查
pnpm run format:check
```

### 4. 提交代码

```bash
# 添加文件
git add .

# 提交（会自动触发 pre-commit hooks）
git commit -m "feat: 添加新功能"

# 推送到远程仓库（会自动触发 pre-push hooks）
git push origin feature/your-feature-name
```

---

## 📏 代码规范

### TypeScript 规范

- ✅ 使用 TypeScript 编写所有代码
- ✅ 为函数参数和返回值添加类型注解
- ✅ 避免使用 `any` 类型（除非在测试中有充分理由）
- ✅ 使用接口（interface）定义对象类型
- ✅ 使用类型守卫（type guards）进行运行时类型检查

**示例**:

```typescript
// ✅ 好的做法
interface User {
  id: string
  name: string
  age: number
}

function getUser(id: string): User | null {
  // ...
}

// ❌ 避免
function getUser(id: any): any {
  // ...
}
```

### Vue 组件规范

- ✅ 使用 `<script setup>` 语法
- ✅ 使用 Composition API
- ✅ Props 和 Emits 使用 TypeScript 接口定义
- ✅ 组件文件名使用 PascalCase（如 `UserProfile.vue`）
- ✅ 为组件添加 JSDoc 注释

**示例**:

```vue
<script setup lang="ts">
/**
 * 用户资料组件
 * 显示用户的基本信息和操作按钮
 */

interface Props {
  userId: string
  showActions?: boolean
}

interface Emits {
  (e: 'edit', userId: string): void
  (e: 'delete', userId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>
```

### Composables 规范

- ✅ 文件名使用 `use` 前缀（如 `useGameData.ts`）
- ✅ 返回对象包含响应式数据和方法
- ✅ 添加详细的 JSDoc 注释
- ✅ 单一职责，避免过于复杂

**示例**:

```typescript
/**
 * 游戏数据管理 Composable
 * 提供游戏数据的加载、保存和更新功能
 */
export function useGameData() {
  const gameData = ref<GameData>({})

  const loadData = async (): Promise<void> => {
    // ...
  }

  return {
    gameData,
    loadData,
  }
}
```

### 样式规范

- ✅ 使用 CSS 变量定义颜色和尺寸
- ✅ 遵循 BEM 命名规范（可选）
- ✅ 使用 scoped 样式避免污染全局
- ✅ 移动端优先的响应式设计

---

## 📝 提交规范

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 提交类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建工具或辅助工具的变动
- `revert`: 回滚提交
- `build`: 构建系统或外部依赖的变动
- `ci`: CI 配置文件和脚本的变动

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**示例**:

```bash
# 简单提交
git commit -m "feat: 添加用户登录功能"

# 带作用域
git commit -m "fix(auth): 修复登录验证逻辑"

# 详细提交
git commit -m "feat(shop): 添加购物车功能

- 实现添加到购物车
- 实现购物车数量更新
- 添加购物车总价计算

Closes #123"
```

### Emoji 提示（可选）

- ✨ `:sparkles:` - 新功能
- 🐛 `:bug:` - Bug 修复
- 📝 `:memo:` - 文档更新
- 🎨 `:art:` - 代码格式/结构改进
- ⚡ `:zap:` - 性能优化
- 🔒 `:lock:` - 安全性改进
- ♿ `:wheelchair:` - 可访问性改进

---

## 🧪 测试要求

### 单元测试

- ✅ 所有新功能必须包含单元测试
- ✅ Bug 修复应包含回归测试
- ✅ 测试覆盖率应保持在 80% 以上
- ✅ 使用 Vitest 编写测试

**测试文件位置**:

```
src/
├── services/
│   ├── gameDataService.ts
│   └── __tests__/
│       └── gameDataService.test.ts
```

**测试示例**:

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from '../myFunction'

describe('myFunction', () => {
  it('应该返回正确的结果', () => {
    const result = myFunction('input')
    expect(result).toBe('expected output')
  })

  it('应该处理边界情况', () => {
    expect(() => myFunction(null)).toThrow()
  })
})
```

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

---

## 🔀 Pull Request 流程

### 1. 准备 PR

- ✅ 确保所有测试通过
- ✅ 确保代码符合规范
- ✅ 更新相关文档
- ✅ 提交信息符合规范
- ✅ 解决所有冲突

### 2. 创建 PR

1. 在 GitHub 上创建 Pull Request
2. 填写 PR 模板（如果有）
3. 添加清晰的标题和描述
4. 关联相关 Issue（如 `Closes #123`）
5. 添加适当的标签

### 3. PR 描述模板

```markdown
## 变更类型

- [ ] Bug 修复
- [ ] 新功能
- [ ] 重构
- [ ] 文档更新
- [ ] 其他

## 变更说明

简要描述本次变更的内容和原因。

## 测试

- [ ] 添加了单元测试
- [ ] 所有测试通过
- [ ] 手动测试通过

## 截图（如适用）

添加截图或 GIF 展示变更效果。

## 相关 Issue

Closes #123
```

### 4. 代码审查

- 响应审查意见
- 及时更新代码
- 保持沟通

---

## 🐛 问题反馈

### 报告 Bug

使用 GitHub Issues 报告 Bug，请包含：

1. **Bug 描述**: 清晰简洁的描述
2. **复现步骤**: 详细的复现步骤
3. **预期行为**: 应该发生什么
4. **实际行为**: 实际发生了什么
5. **环境信息**:
   - Node.js 版本
   - 浏览器版本
   - 操作系统
6. **截图/日志**: 如果适用

### 功能建议

1. **功能描述**: 清晰描述建议的功能
2. **使用场景**: 为什么需要这个功能
3. **替代方案**: 是否有其他解决方案
4. **附加信息**: 任何其他相关信息

---

## 📞 联系方式

如有任何问题，欢迎通过以下方式联系：

- 📧 Email: [项目邮箱]
- 💬 GitHub Discussions: [讨论区链接]
- 🐛 GitHub Issues: [Issues 链接]

---

## 📜 许可证

通过贡献代码，您同意您的贡献将在 MIT 许可证下发布。

---

**感谢您的贡献！** 🎉
