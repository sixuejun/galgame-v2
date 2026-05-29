@echo off
REM Git 分支合并自动化脚本 - Windows 批处理启动器
REM 使用方法: 双击运行或在命令行中执行

echo ========================================
echo Git 分支合并自动化脚本
echo ========================================
echo.

REM 检查 Python 是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到 Python，请先安装 Python 3.6 或更高版本
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo 检测到 Python 已安装
echo.

REM 获取脚本所在目录
set SCRIPT_DIR=%~dp0

REM 执行 Python 脚本
echo 开始执行合并操作...
echo.
python "%SCRIPT_DIR%git_branch_merge.py" %*

REM 检查执行结果
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo 脚本执行成功！
    echo ========================================
) else (
    echo.
    echo ========================================
    echo 脚本执行失败，请检查错误信息
    echo ========================================
)

echo.
pause

