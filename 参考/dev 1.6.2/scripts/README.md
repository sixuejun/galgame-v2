# Git 分支合并自动化脚本

## 📋 功能概述

`git_branch_merge.py` 是一个跨平台的 Git 自动化脚本，用于简化分支合并流程。该脚本会自动执行以下操作：

1. **创建备份标签** - 为当前分支和主分支创建带时间戳的备份标签
2. **合并分支** - 将当前分支合并到主分支（使用源分支内容优先策略）
3. **清理 dev 分支** - 自动删除**所有** dev 开头的本地和远程分支（包括刚合并的分支，因为已经合并到 main）
4. **推送到远程** - 将主分支和标签推送到远程仓库

## 🖥️ 支持平台

- ✅ Windows
- ✅ Linux
- ✅ macOS

## 📦 依赖项

- **Python 3.6+** （系统需要安装 Python 3）
- **Git** （系统需要安装 Git 并配置好）

无需安装额外的 Python 包，脚本仅使用 Python 标准库。

## 🚀 使用方法

### Windows

```powershell
# 方法 1: 使用 Python 直接运行
python scripts/git_branch_merge.py

# 方法 2: 使用 Python3（如果系统中 Python 命令为 python3）
python3 scripts/git_branch_merge.py

# 演练模式（不执行实际操作，仅查看将要执行的命令）
python scripts/git_branch_merge.py --dry-run

# 跳过推送到远程仓库
python scripts/git_branch_merge.py --skip-push
```

### Linux / macOS

```bash
# 方法 1: 添加执行权限后直接运行
chmod +x scripts/git_branch_merge.py
./scripts/git_branch_merge.py

# 方法 2: 使用 Python 运行
python3 scripts/git_branch_merge.py

# 演练模式
python3 scripts/git_branch_merge.py --dry-run

# 跳过推送到远程仓库
python3 scripts/git_branch_merge.py --skip-push
```

## 📖 命令行参数

| 参数 | 说明 |
|------|------|
| `--dry-run` | 演练模式：显示将要执行的操作但不实际执行，用于预览操作流程 |
| `--skip-push` | 跳过推送到远程仓库的步骤，仅在本地执行操作 |
| `--help` | 显示帮助信息 |

## 📝 使用示例

### 示例 1: 正常合并流程

```bash
# 假设当前在 dev-20 分支
python scripts/git_branch_merge.py
```

执行结果：
- 创建标签 `backup-dev-20-20251120-143022`
- 创建标签 `backup-main-20251120-143022`
- 将 `dev-20` 合并到 `main`
- 删除**所有** dev 分支（包括 dev-20, dev-19, dev-18 等，因为已经合并到 main）
- 推送 `main` 分支和所有标签到远程仓库

### 示例 2: 先预览再执行

```bash
# 第一步：演练模式查看将要执行的操作
python scripts/git_branch_merge.py --dry-run

# 第二步：确认无误后正式执行
python scripts/git_branch_merge.py
```

### 示例 3: 仅本地操作

```bash
# 执行合并但不推送到远程（适合需要先本地测试的场景）
python scripts/git_branch_merge.py --skip-push

# 测试无误后，手动推送
git push origin main
git push origin --tags
```

## ⚠️ 注意事项

1. **备份重要性**: 脚本会自动创建备份标签，但建议在执行前确保重要更改已提交
2. **合并策略**: 脚本使用 `-X theirs` 策略，在冲突时优先使用源分支（当前分支）的内容
3. **分支清理**: 会清理**所有** dev 开头的分支（包括刚合并的分支），其他分支不受影响。如果需要保留某个 dev 分支，请在执行前重命名
4. **远程操作**: 默认会推送到远程仓库，如需仅本地操作请使用 `--skip-push` 参数
5. **权限要求**: 需要有推送到远程仓库的权限

## 🔧 故障排除

### 问题 1: 提示 "python 不是内部或外部命令"

**解决方案**: 
- Windows: 安装 Python 并将其添加到系统 PATH
- Linux/macOS: 使用 `python3` 命令代替 `python`

### 问题 2: 合并冲突

**解决方案**: 
- 脚本会尝试使用 `-X theirs` 策略自动解决
- 如果仍然失败，需要手动解决冲突后重新运行脚本

### 问题 3: 推送失败（权限问题）

**解决方案**: 
- 确保已配置 Git 凭据
- 使用 `--skip-push` 参数跳过推送，手动推送

### 问题 4: 找不到 main 或 master 分支

**解决方案**: 
- 确保仓库中存在 main 或 master 分支
- 检查是否在正确的 Git 仓库目录中

## 📄 脚本工作流程

```
开始
  ↓
检查当前分支 (例如: dev-20)
  ↓
确定主分支 (main 或 master)
  ↓
创建当前分支备份标签 (backup-dev-20-20251120-143022)
  ↓
创建主分支备份标签 (backup-main-20251120-143022)
  ↓
切换到主分支
  ↓
合并当前分支到主分支 (使用 -X theirs 策略)
  ↓
清理其他 dev 分支 (本地 + 远程)
  ↓
推送主分支到远程仓库
  ↓
推送标签到远程仓库
  ↓
完成
```

## 🤝 贡献

如需修改脚本功能，请编辑 `scripts/git_branch_merge.py` 文件。

## 📜 许可

该脚本遵循项目的整体许可协议。

