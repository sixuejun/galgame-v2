# 快速入门指南

## 🎯 最简单的使用方式

### Windows 用户

1. **双击运行** `run_merge.bat` 文件
2. 按照提示完成操作

或者在命令行中：
```powershell
cd scripts
run_merge.bat
```

### Linux / macOS 用户

```bash
# 首次使用需要添加执行权限
chmod +x scripts/run_merge.sh

# 运行脚本
./scripts/run_merge.sh
```

## 🔍 先预览再执行（推荐）

### Windows
```powershell
# 演练模式 - 查看将要执行的操作
python scripts/git_branch_merge.py --dry-run

# 确认无误后正式执行
python scripts/git_branch_merge.py
```

### Linux / macOS
```bash
# 演练模式
python3 scripts/git_branch_merge.py --dry-run

# 正式执行
python3 scripts/git_branch_merge.py
```

## ⚡ 常用场景

### 场景 1: 完整流程（最常用）
```bash
# 直接执行，包括推送到远程
python scripts/git_branch_merge.py
```

### 场景 2: 仅本地操作
```bash
# 不推送到远程仓库
python scripts/git_branch_merge.py --skip-push
```

### 场景 3: 安全预览
```bash
# 先看看会做什么
python scripts/git_branch_merge.py --dry-run
```

## 📋 执行前检查清单

- [ ] 确保所有更改已提交
- [ ] 确认当前在正确的分支上
- [ ] 确保有推送到远程仓库的权限（如需推送）
- [ ] 建议先使用 `--dry-run` 预览操作

## 💡 提示

- 脚本会自动创建备份标签，可以随时恢复
- 如果不确定，先使用 `--dry-run` 查看将要执行的操作
- 详细文档请查看 `README.md`

