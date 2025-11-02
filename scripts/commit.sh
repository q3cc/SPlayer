#!/bin/bash

# SPlayer 自动提交脚本
# 用于快速提交代码更改

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_cyan() {
    echo -e "${CYAN}🔧 $1${NC}"
}

# 检查是否在 Git 仓库中
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "当前目录不是 Git 仓库"
        exit 1
    fi
}

# 检查工作目录状态
check_git_status() {
    local status=$(git status --porcelain)
    if [ -z "$status" ]; then
        log_warning "没有需要提交的更改"
        exit 0
    fi
}

# 获取当前分支
get_current_branch() {
    git rev-parse --abbrev-ref HEAD
}

# 显示更改状态
show_changes() {
    log_cyan "当前更改状态："
    git status --short
    echo
}

# 获取提交类型
get_commit_type() {
    echo "请选择提交类型："
    echo "1) feat:     新功能"
    echo "2) fix:      修复问题"
    echo "3) docs:     文档更新"
    echo "4) style:    代码格式化"
    echo "5) refactor: 重构代码"
    echo "6) test:     测试相关"
    echo "7) chore:    构建过程或辅助工具的变动"
    echo "8) custom:   自定义提交类型"
    echo
    read -p "请输入选择 (1-8): " choice

    case $choice in
        1) echo "feat" ;;
        2) echo "fix" ;;
        3) echo "docs" ;;
        4) echo "style" ;;
        5) echo "refactor" ;;
        6) echo "test" ;;
        7) echo "chore" ;;
        8)
            read -p "请输入自定义提交类型: " custom_type
            echo "$custom_type"
            ;;
        *)
            log_error "无效选择"
            exit 1
            ;;
    esac
}

# 获取提交信息
get_commit_message() {
    local type=$1
    local default_scope="splayer"

    read -p "请输入作用域 [默认: $default_scope]: " scope
    scope=${scope:-$default_scope}

    read -p "请输入提交描述: " description

    if [ -z "$description" ]; then
        log_error "提交描述不能为空"
        exit 1
    fi

    echo "$type($scope): $description"
}

# 添加文件到暂存区
add_files() {
    log_cyan "添加文件到暂存区..."

    # 检查是否有未跟踪的文件
    local untracked=$(git ls-files --others --exclude-standard)
    if [ -n "$untracked" ]; then
        log_info "发现未跟踪的文件："
        echo "$untracked"
        read -p "是否添加所有未跟踪的文件？(y/N): " add_untracked
        if [[ $add_untracked =~ ^[Yy]$ ]]; then
            git add .
        else
            # 选择性添加
            git add -u
        fi
    else
        git add .
    fi

    log_success "文件已添加到暂存区"
}

# 提交更改
commit_changes() {
    local message=$1

    log_cyan "提交更改..."
    git commit -m "$message"
    log_success "提交成功"
}

# 推送到远程仓库
push_changes() {
    local branch=$1

    log_cyan "推送到远程仓库..."
    git push origin "$branch"
    log_success "推送成功"
}

# 主函数
main() {
    log_info "SPlayer 自动提交脚本"
    echo "=========================="

    # 检查环境
    check_git_repo
    check_git_status

    # 显示当前状态
    local branch=$(get_current_branch)
    log_info "当前分支: $branch"
    show_changes

    # 获取提交信息
    local commit_type=$(get_commit_type)
    local commit_message=$(get_commit_message "$commit_type")

    echo
    log_info "提交信息: $commit_message"
    read -p "确认提交？(y/N): " confirm

    if [[ $confirm =~ ^[Yy]$ ]]; then
        # 添加文件
        add_files

        # 提交
        commit_changes "$commit_message"

        # 询问是否推送
        echo
        read -p "是否推送到远程仓库？(y/N): " push_confirm

        if [[ $push_confirm =~ ^[Yy]$ ]]; then
            push_changes "$branch"
        else
            log_info "已跳过推送，更改已提交到本地仓库"
        fi

        log_success "操作完成！"
    else
        log_info "操作已取消"
    fi
}

# 运行主函数
main "$@"