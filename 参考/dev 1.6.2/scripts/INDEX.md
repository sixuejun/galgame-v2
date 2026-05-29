# Git 分支合并自动化脚本 - 文档索引

## 📚 文档导航

根据你的需求选择合适的文档：

### 🚀 快速开始
- **[QUICKSTART.md](QUICKSTART.md)** - 快速入门指南
  - 最简单的使用方式
  - 常用场景示例
  - 执行前检查清单

### 📖 完整文档
- **[README.md](README.md)** - 完整使用文档
  - 详细功能说明
  - 所有平台的使用方法
  - 命令行参数详解
  - 故障排除指南

### 🧪 测试指南
- **[TEST.md](TEST.md)** - 脚本测试指南
  - 如何测试脚本
  - 演练模式使用
  - 测试检查清单

---

## 📁 文件说明

### 核心脚本
- **`git_branch_merge.py`** - 主 Python 脚本（跨平台）
  - 自动化 Git 分支合并流程
  - 支持 Windows、Linux、macOS

### 启动器
- **`run_merge.bat`** - Windows 批处理启动器
  - 双击即可运行
  - 自动检查 Python 环境

- **`run_merge.sh`** - Linux/macOS Shell 启动器
  - 需要执行权限：`chmod +x run_merge.sh`
  - 自动检查 Python3 环境

---

## ⚡ 快速参考

### 最常用命令

#### Windows
```powershell
# 方式 1: 双击运行
双击 run_merge.bat

# 方式 2: 命令行运行
python scripts/git_branch_merge.py

# 方式 3: 先预览再执行（推荐）
python scripts/git_branch_merge.py --dry-run
python scripts/git_branch_merge.py
```

#### Linux / macOS
```bash
# 方式 1: 使用启动器
chmod +x scripts/run_merge.sh
./scripts/run_merge.sh

# 方式 2: 直接运行
python3 scripts/git_branch_merge.py

# 方式 3: 先预览再执行（推荐）
python3 scripts/git_branch_merge.py --dry-run
python3 scripts/git_branch_merge.py
```

---

## 🎯 脚本功能

根据 `doc/Untitled-5.ini` 中的需求实现：

1. ✅ 为当前分支创建备份标签
2. ✅ 为主分支创建备份标签
3. ✅ 将当前分支合并到主分支
4. ✅ 清理废弃的 dev 分支
5. ✅ 推送主分支到远程仓库

---

## 🛠️ 命令行参数

| 参数 | 说明 |
|------|------|
| `--dry-run` | 演练模式（不执行实际操作） |
| `--skip-push` | 跳过推送到远程仓库 |
| `--help` | 显示帮助信息 |

---

## 📋 推荐使用流程

### 首次使用
1. 阅读 [QUICKSTART.md](QUICKSTART.md)
2. 阅读 [TEST.md](TEST.md) 并进行测试
3. 使用 `--dry-run` 预览操作
4. 正式执行

### 日常使用
```bash
# 直接执行（已熟悉流程）
python scripts/git_branch_merge.py

# 或先预览（更安全）
python scripts/git_branch_merge.py --dry-run
python scripts/git_branch_merge.py
```

---

## 💡 提示

- 📌 首次使用建议先阅读 [QUICKSTART.md](QUICKSTART.md)
- 🧪 不确定时使用 `--dry-run` 预览操作
- 📖 遇到问题查看 [README.md](README.md) 的故障排除部分
- 🔒 脚本会自动创建备份标签，可随时恢复

---

## 🆘 需要帮助？

1. **快速入门** → [QUICKSTART.md](QUICKSTART.md)
2. **详细文档** → [README.md](README.md)
3. **测试指南** → [TEST.md](TEST.md)
4. **查看帮助** → `python scripts/git_branch_merge.py --help`

---

## 📦 依赖项

- Python 3.6+
- Git

无需安装额外的 Python 包！

---

## 🎉 开始使用

选择你的平台：

### Windows 用户
```powershell
# 最简单的方式
scripts\run_merge.bat
```

### Linux/macOS 用户
```bash
# 添加执行权限
chmod +x scripts/run_merge.sh

# 运行
./scripts/run_merge.sh
```

祝使用愉快！🚀

