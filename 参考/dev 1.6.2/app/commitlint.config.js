/**
 * Commitlint 配置文件
 * 用于规范 Git 提交信息格式
 * 
 * 提交信息格式: <type>(<scope>): <subject>
 * 
 * 示例:
 * - feat: 添加用户登录功能
 * - fix(ui): 修复按钮样式问题
 * - docs: 更新 API 文档
 * - refactor(store): 重构状态管理模块
 */

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 提交类型枚举
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复 bug
        'docs',     // 文档更新
        'style',    // 代码格式调整(不影响代码运行)
        'refactor', // 重构(既不是新功能也不是修复bug)
        'perf',     // 性能优化
        'test',     // 测试相关
        'chore',    // 构建/工具链相关
        'revert',   // 回滚
        'build',    // 构建系统或外部依赖变更
        'ci',       // CI 配置文件和脚本变更
      ],
    ],
    // 允许任意大小写(适应中文提交信息)
    'subject-case': [0],
    // 不限制 body 行长度
    'body-max-line-length': [0],
    // 主题不能为空
    'subject-empty': [2, 'never'],
    // 类型不能为空
    'type-empty': [2, 'never'],
    // 主题最大长度 100 字符
    'subject-max-length': [2, 'always', 100],
  },
}

