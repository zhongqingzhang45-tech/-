#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

GIT_REPO=""
GIT_BRANCH="main"
COMMIT_MSG=""
REMOTE_NAME="origin"

show_help() {
  echo "Usage: $0 [options] -r <git-repo-url>"
  echo ""
  echo "Options:"
  echo "  -r, --repo <url>       Git repository URL (required)"
  echo "  -b, --branch <name>    Git branch (default: main)"
  echo "  -m, --message <msg>    Commit message (default: auto-generated)"
  echo "  -h, --help             Show this help"
  echo ""
  echo "Examples:"
  echo "  # First push"
  echo "  $0 -r git@github.com:user/lifeos.git"
  echo ""
  echo "  # Push with custom message"
  echo "  $0 -r git@github.com:user/lifeos.git -m \"feat: add new feature\""
  echo ""
  echo "  # Push to specific branch"
  echo "  $0 -r git@github.com:user/lifeos.git -b develop"
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      -r|--repo)
        GIT_REPO="$2"
        shift 2
        ;;
      -b|--branch)
        GIT_BRANCH="$2"
        shift 2
        ;;
      -m|--message)
        COMMIT_MSG="$2"
        shift 2
        ;;
      -h|--help)
        show_help
        exit 0
        ;;
      *)
        log_error "Unknown option: $1"
        show_help
        exit 1
        ;;
    esac
  done
}

check_prerequisites() {
  log_step "Checking prerequisites..."
  
  if ! command -v git &> /dev/null; then
    log_error "git is not installed"
    exit 1
  fi
  
  if [ -z "$GIT_REPO" ]; then
    log_error "Git repository URL is required"
    show_help
    exit 1
  fi
  
  log_info "Prerequisites check passed"
}

init_git_repo() {
  log_step "Initializing git repository..."
  
  if [ ! -d ".git" ]; then
    git init -b "$GIT_BRANCH"
    log_info "Git repository initialized (branch: $GIT_BRANCH)"
  else
    log_info "Git repository already exists"
    
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$current_branch" != "$GIT_BRANCH" ]; then
      log_warn "Current branch is $current_branch, switching to $GIT_BRANCH"
      git checkout -B "$GIT_BRANCH"
    fi
  fi
  
  if git remote | grep -q "$REMOTE_NAME"; then
    local current_url=$(git remote get-url "$REMOTE_NAME")
    if [ "$current_url" != "$GIT_REPO" ]; then
      log_warn "Updating remote $REMOTE_NAME from $current_url to $GIT_REPO"
      git remote set-url "$REMOTE_NAME" "$GIT_REPO"
    fi
  else
    git remote add "$REMOTE_NAME" "$GIT_REPO"
    log_info "Remote $REMOTE_NAME added: $GIT_REPO"
  fi
}

create_gitignore() {
  if [ ! -f ".gitignore" ]; then
    log_step "Creating .gitignore..."
    cat > .gitignore << 'EOF'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# editor
.vscode/
.idea/
*.swp
*.swo

# logs
logs/
*.log

# pm2
pm2.pid
.pm2/

# tmp
tmp/
temp/
EOF
    log_info ".gitignore created"
  fi
}

add_files() {
  log_step "Staging files..."
  
  git add -A
  
  local staged_count=$(git diff --cached --name-only | wc -l)
  log_info "$staged_count files staged"
  
  if [ "$staged_count" -eq 0 ]; then
    log_warn "No changes to commit"
    exit 0
  fi
}

commit_changes() {
  log_step "Committing changes..."
  
  if [ -z "$COMMIT_MSG" ]; then
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    COMMIT_MSG="deploy: update at $timestamp"
  fi
  
  git commit -m "$COMMIT_MSG"
  
  local commit_hash=$(git rev-parse --short HEAD)
  log_info "Committed: $commit_hash - $COMMIT_MSG"
}

push_to_remote() {
  log_step "Pushing to remote..."
  
  if git ls-remote --exit-code "$REMOTE_NAME" "$GIT_BRANCH" &> /dev/null; then
    git push "$REMOTE_NAME" "$GIT_BRANCH"
  else
    git push -u "$REMOTE_NAME" "$GIT_BRANCH"
  fi
  
  log_info "Pushed to $REMOTE_NAME/$GIT_BRANCH"
}

show_summary() {
  local commit_hash=$(git rev-parse --short HEAD)
  local commit_msg=$(git log -1 --pretty=%s)
  local file_count=$(git ls-files | wc -l)
  
  echo ""
  echo -e "${GREEN}==========================================${NC}"
  echo -e "${GREEN}          上传成功！${NC}"
  echo -e "${GREEN}==========================================${NC}"
  echo ""
  echo "  仓库:      $GIT_REPO"
  echo "  分支:      $GIT_BRANCH"
  echo "  提交:      $commit_hash - $commit_msg"
  echo "  文件数:    $file_count"
  echo ""
  echo "  服务器部署:"
  echo "    ssh user@server"
  echo "    curl -sSL <deploy-script-url> | bash -s -- -r $GIT_REPO"
  echo ""
  echo "  或直接在服务器上:"
  echo "    ./deploy.sh -r $GIT_REPO"
  echo ""
}

main() {
  parse_args "$@"
  
  echo ""
  echo -e "${BLUE}==========================================${NC}"
  echo -e "${BLUE}     星野 AI 伴侣 - Git 上传脚本${NC}"
  echo -e "${BLUE}==========================================${NC}"
  echo ""
  
  check_prerequisites
  init_git_repo
  create_gitignore
  add_files
  commit_changes
  push_to_remote
  show_summary
  
  echo -e "${GREEN}上传完成！${NC}"
}

main "$@"