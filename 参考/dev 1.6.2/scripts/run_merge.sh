#!/bin/bash
# Git 分支合并自动化脚本 - Linux/macOS Shell 启动器
# 使用方法: chmod +x run_merge.sh && ./run_merge.sh

echo "========================================"
echo "Git 分支合并自动化脚本"
echo "========================================"
echo ""

# 检查 Python 是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 Python3，请先安装 Python 3.6 或更高版本"
    exit 1
fi

echo "✅ 检测到 Python3 已安装"
python3 --version
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 执行 Python 脚本
echo "🚀 开始执行合并操作..."
echo ""
python3 "$SCRIPT_DIR/git_branch_merge.py" "$@"

# 检查执行结果
if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "✅ 脚本执行成功！"
    echo "========================================"
else
    echo ""
    echo "========================================"
    echo "❌ 脚本执行失败，请检查错误信息"
    echo "========================================"
    exit 1
fi

