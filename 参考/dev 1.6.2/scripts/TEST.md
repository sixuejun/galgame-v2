# 脚本测试指南

## 🧪 测试脚本是否正常工作

在实际使用脚本之前，建议先进行测试以确保一切正常。

## 1️⃣ 基础测试：检查 Python 环境

### Windows
```powershell
python --version
```

### Linux / macOS
```bash 
python3 --version
```

**预期输出**: `Python 3.6.x` 或更高版本

---

## 2️⃣ 演练模式测试（推荐）

演练模式不会执行实际操作，只会显示将要执行的命令，非常安全。

### Windows
```powershell
cd c:\Users\Administrator\Documents\github\SillyTavern-tongceng
python scripts/git_branch_merge.py --dry-run
```

### Linux / macOS
```bash
cd ~/path/to/SillyTavern-tongceng
python3 scripts/git_branch_merge.py --dry-run
```

**预期输出示例**:
```
============================================================
🚀 Git 分支合并自动化脚本
============================================================
⚠️  演练模式：不会执行实际操作

📍 检查当前分支...
[DRY RUN] 将执行: git rev-parse --abbrev-ref HEAD
✅ 当前分支: dev-20

📍 确定主分支名称...
[DRY RUN] 将执行: git branch -a
✅ 主分支: main

============================================================
步骤 1: 为当前分支创建备份标签
============================================================
📍 为分支 'dev-20' 创建备份标签: backup-dev-20-20251120-143022
[DRY RUN] 将执行: git tag backup-dev-20-20251120-143022 dev-20
✅ 标签创建成功: backup-dev-20-20251120-143022
...
```

---

## 3️⃣ 查看帮助信息

### Windows
```powershell
python scripts/git_branch_merge.py --help
```

### Linux / macOS
```bash
python3 scripts/git_branch_merge.py --help
```

**预期输出**:
```
usage: git_branch_merge.py [-h] [--dry-run] [--skip-push]

Git 分支合并自动化脚本

optional arguments:
  -h, --help   show this help message and exit
  --dry-run    演练模式：显示将要执行的操作但不实际执行
  --skip-push  跳过推送到远程仓库的步骤
...
```

---

## 4️⃣ 测试启动器脚本

### Windows - 测试批处理文件
```powershell
# 在文件资源管理器中双击 run_merge.bat
# 或在命令行中执行：
scripts\run_merge.bat --dry-run
```

### Linux / macOS - 测试 Shell 脚本
```bash
# 添加执行权限
chmod +x scripts/run_merge.sh

# 测试运行
./scripts/run_merge.sh --dry-run
```

---

## 5️⃣ 完整流程测试（在测试分支上）

如果你想测试完整流程，建议在测试分支上进行：

```bash
# 1. 创建测试分支
git checkout -b test-merge-script

# 2. 做一些测试提交
echo "test" > test.txt
git add test.txt
git commit -m "Test commit"

# 3. 运行脚本（演练模式）
python scripts/git_branch_merge.py --dry-run

# 4. 如果演练模式输出正常，可以尝试实际执行（但跳过推送）
python scripts/git_branch_merge.py --skip-push

# 5. 检查结果
git log --oneline -5
git tag | grep backup

# 6. 清理测试
git checkout main
git branch -D test-merge-script
git tag -d backup-test-merge-script-*
git tag -d backup-main-*
```

---

## ✅ 测试检查清单

完成以下测试后，脚本即可安全使用：

- [ ] Python 版本检查通过（3.6+）
- [ ] `--help` 参数正常显示帮助信息
- [ ] `--dry-run` 演练模式正常运行
- [ ] 启动器脚本（.bat 或 .sh）正常工作
- [ ] （可选）在测试分支上完整流程测试成功

---

## 🐛 常见问题排查

### 问题 1: 提示 "python 不是内部或外部命令"
**解决方案**: 
- Windows: 安装 Python 并添加到 PATH
- Linux/macOS: 使用 `python3` 命令

### 问题 2: 提示 "git 不是内部或外部命令"
**解决方案**: 安装 Git 并添加到 PATH

### 问题 3: 权限错误（Linux/macOS）
**解决方案**: 
```bash
chmod +x scripts/run_merge.sh
chmod +x scripts/git_branch_merge.py
```

### 问题 4: 编码错误
**解决方案**: 脚本已设置 UTF-8 编码，如仍有问题请检查系统编码设置

---

## 📞 获取帮助

如果测试过程中遇到问题：

1. 查看 `scripts/README.md` 获取详细文档
2. 查看 `scripts/QUICKSTART.md` 获取快速入门指南
3. 使用 `--dry-run` 参数查看将要执行的操作
4. 检查 Git 仓库状态：`git status`

---

## 🎉 测试通过后

测试通过后，你可以：

1. 在实际工作分支上使用脚本
2. 建议首次使用时仍然先用 `--dry-run` 预览
3. 确认无误后再执行实际操作
4. 频繁使用以提高工作效率

祝使用愉快！🚀

