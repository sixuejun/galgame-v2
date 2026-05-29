#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Git 分支合并自动化脚本
功能：自动化执行分支备份、合并、清理和推送操作
支持平台：Windows、Linux、macOS
"""

import subprocess
import sys
import argparse
from datetime import datetime
import re


class GitMergeAutomation:
    """Git 分支合并自动化工具"""
    
    def __init__(self, dry_run=False, skip_push=False):
        """
        初始化
        :param dry_run: 是否为演练模式（不执行实际操作）
        :param skip_push: 是否跳过推送到远程仓库
        """
        self.dry_run = dry_run
        self.skip_push = skip_push
        self.original_branch = None
        self.main_branch = None
        
    def run_command(self, command, check=True, capture_output=True):
        """
        执行命令
        :param command: 命令列表
        :param check: 是否检查返回码
        :param capture_output: 是否捕获输出
        :return: 命令执行结果
        """
        if self.dry_run:
            print(f"[DRY RUN] 将执行: {' '.join(command)}")
            return subprocess.CompletedProcess(command, 0, stdout='', stderr='')

        try:
            result = subprocess.run(
                command,
                check=check,
                capture_output=capture_output,
                text=True,
                encoding='utf-8'
            )
            return result
        except subprocess.CalledProcessError as e:
            print(f"❌ 命令执行失败: {' '.join(command)}")
            print(f"错误信息: {e.stderr}")
            raise
    
    def get_current_branch(self):
        """获取当前分支名称"""
        print("📍 检查当前分支...")
        result = self.run_command(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])
        branch = result.stdout.strip()
        print(f"✅ 当前分支: {branch}")
        return branch
    
    def get_main_branch(self):
        """确定主分支名称（main 或 master）"""
        print("📍 确定主分支名称...")
        # 获取所有分支
        result = self.run_command(['git', 'branch', '-a'])
        branches = result.stdout
        
        if 'main' in branches:
            main_branch = 'main'
        elif 'master' in branches:
            main_branch = 'master'
        else:
            print("❌ 未找到 main 或 master 分支")
            sys.exit(1)
        
        print(f"✅ 主分支: {main_branch}")
        return main_branch
    
    def create_backup_tag(self, branch_name):
        """
        为指定分支创建备份标签
        :param branch_name: 分支名称
        """
        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        tag_name = f"backup-{branch_name}-{timestamp}"
        
        print(f"📍 为分支 '{branch_name}' 创建备份标签: {tag_name}")
        
        if not self.dry_run:
            self.run_command(['git', 'tag', tag_name, branch_name])
        
        print(f"✅ 标签创建成功: {tag_name}")
        return tag_name
    
    def merge_branch(self, source_branch, target_branch):
        """
        将源分支合并到目标分支
        :param source_branch: 源分支
        :param target_branch: 目标分支
        """
        print(f"📍 切换到目标分支: {target_branch}")
        self.run_command(['git', 'checkout', target_branch])
        
        print(f"📍 合并分支 '{source_branch}' 到 '{target_branch}'（使用源分支内容优先策略）...")
        
        try:
            # 使用 -X theirs 策略，在冲突时优先使用被合并分支的内容
            self.run_command(['git', 'merge', '-X', 'theirs', source_branch, '-m', 
                            f'Merge {source_branch} into {target_branch}'])
            print(f"✅ 合并成功")
        except subprocess.CalledProcessError:
            print("⚠️  合并出现冲突，尝试使用强制策略...")
            # 如果上述方法失败，尝试其他方法
            self.run_command(['git', 'merge', '--abort'], check=False)
            print("❌ 合并失败，请手动解决冲突")
            sys.exit(1)
    
    def cleanup_dev_branches(self, include_current=True):
        """
        清理 dev 开头的分支
        :param include_current: 是否包括当前已合并的 dev 分支（默认为 True，因为已经合并到 main）
        """
        print("📍 列出所有 dev 开头的分支...")
        result = self.run_command(['git', 'branch'])
        branches = result.stdout.strip().split('\n')

        dev_branches = []
        for branch in branches:
            branch = branch.strip().replace('* ', '')
            # 检查是否为 dev 开头的分支（支持 dev、dev/、dev- 等格式）
            if branch.startswith('dev') and branch != '':
                dev_branches.append(branch)

        if not dev_branches:
            print("✅ 没有需要清理的 dev 分支")
            return

        print(f"📍 找到 {len(dev_branches)} 个需要清理的 dev 分支:")
        for branch in dev_branches:
            print(f"  - {branch}")

        # 确认是否删除
        if not self.dry_run:
            print(f"\n⚠️  即将删除 {len(dev_branches)} 个 dev 分支（本地和远程）")

        for branch in dev_branches:
            print(f"📍 删除本地分支: {branch}")
            self.run_command(['git', 'branch', '-D', branch])

            # 尝试删除远程分支
            print(f"📍 尝试删除远程分支: {branch}")
            try:
                self.run_command(['git', 'push', 'origin', '--delete', branch], check=False)
            except:
                print(f"⚠️  远程分支 {branch} 可能不存在或已删除")

        print("✅ dev 分支清理完成")

    def push_to_remote(self):
        """推送主分支和标签到远程仓库"""
        if self.skip_push:
            print("⏭️  跳过推送到远程仓库")
            return

        print(f"📍 推送主分支 '{self.main_branch}' 到远程仓库...")
        self.run_command(['git', 'push', 'origin', self.main_branch])
        print("✅ 主分支推送成功")

        print("📍 推送所有标签到远程仓库...")
        self.run_command(['git', 'push', 'origin', '--tags'])
        print("✅ 标签推送成功")

    def execute(self):
        """执行完整的自动化流程"""
        try:
            print("=" * 60)
            print("🚀 Git 分支合并自动化脚本")
            print("=" * 60)

            if self.dry_run:
                print("⚠️  演练模式：不会执行实际操作")
                print()

            # 步骤 1: 获取当前分支
            self.original_branch = self.get_current_branch()
            print()

            # 步骤 2: 确定主分支
            self.main_branch = self.get_main_branch()
            print()

            # 步骤 3: 为当前分支创建备份标签
            print("=" * 60)
            print("步骤 1: 为当前分支创建备份标签")
            print("=" * 60)
            self.create_backup_tag(self.original_branch)
            print()

            # 步骤 4: 为主分支创建备份标签
            print("=" * 60)
            print("步骤 2: 为主分支创建备份标签")
            print("=" * 60)
            self.create_backup_tag(self.main_branch)
            print()

            # 步骤 5: 合并分支
            print("=" * 60)
            print("步骤 3: 将当前分支合并到主分支")
            print("=" * 60)
            self.merge_branch(self.original_branch, self.main_branch)
            print()

            # 步骤 6: 清理 dev 分支
            # 检查是否有 dev 分支需要清理
            print("=" * 60)
            print("步骤 4: 清理 dev 分支")
            print("=" * 60)
            self.cleanup_dev_branches()
            print()

            # 步骤 7: 推送到远程仓库
            print("=" * 60)
            print("步骤 5: 推送到远程仓库")
            print("=" * 60)
            self.push_to_remote()
            print()

            print("=" * 60)
            print("✅ 所有操作完成！")
            print("=" * 60)

        except Exception as e:
            print(f"\n❌ 执行过程中出现错误: {str(e)}")
            print("\n尝试恢复到原始分支...")
            if self.original_branch:
                try:
                    self.run_command(['git', 'checkout', self.original_branch], check=False)
                except:
                    pass
            sys.exit(1)


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description='Git 分支合并自动化脚本',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例用法:
  # 正常执行（会推送到远程仓库）
  python git_branch_merge.py

  # 演练模式（不执行实际操作，仅显示将要执行的命令）
  python git_branch_merge.py --dry-run

  # 跳过推送到远程仓库
  python git_branch_merge.py --skip-push

  # 演练模式 + 跳过推送
  python git_branch_merge.py --dry-run --skip-push
        """
    )

    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='演练模式：显示将要执行的操作但不实际执行'
    )

    parser.add_argument(
        '--skip-push',
        action='store_true',
        help='跳过推送到远程仓库的步骤'
    )

    args = parser.parse_args()

    # 创建自动化工具实例并执行
    automation = GitMergeAutomation(dry_run=args.dry_run, skip_push=args.skip_push)
    automation.execute()


if __name__ == '__main__':
    main()

