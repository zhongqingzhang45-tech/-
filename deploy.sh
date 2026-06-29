#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_NAME="lifeos"
APP_DIR="/opt/lifeos"
REPO_DIR="/opt/lifeos/repo"
BUILD_DIR="/opt/lifeos/build"
LOGS_DIR="/opt/lifeos/logs"
BACKUP_DIR="/opt/lifeos/backups"
GIT_REPO=""
GIT_BRANCH="main"
NODE_VERSION="20"

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

show_help() {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -r, --repo <url>       Git repository URL (required for first deploy)"
  echo "  -b, --branch <name>    Git branch (default: main)"
  echo "  -d, --dir <path>       App directory (default: /opt/lifeos)"
  echo "  -f, --full             Full deploy (reinstall all dependencies)"
  echo "  -h, --help             Show this help"
  echo ""
  echo "Examples:"
  echo "  # First deploy"
  echo "  $0 -r git@github.com:user/lifeos.git"
  echo ""
  echo "  # Update deploy (pull latest)"
  echo "  $0"
  echo ""
  echo "  # Full deploy with dependency reinstall"
  echo "  $0 --full"
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
      -d|--dir)
        APP_DIR="$2"
        REPO_DIR="$APP_DIR/repo"
        BUILD_DIR="$APP_DIR/build"
        LOGS_DIR="$APP_DIR/logs"
        BACKUP_DIR="$APP_DIR/backups"
        shift 2
        ;;
      -f|--full)
        FULL_DEPLOY=true
        shift
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
  
  if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Install Node.js $NODE_VERSION first."
    exit 1
  fi
  
  if ! command -v npm &> /dev/null; then
    log_error "npm is not installed"
    exit 1
  fi
  
  if ! command -v pm2 &> /dev/null; then
    log_warn "PM2 not found, installing..."
    npm install -g pm2
  fi
  
  log_info "Prerequisites check passed"
}

setup_directories() {
  log_step "Setting up directories..."
  
  sudo mkdir -p "$REPO_DIR"
  sudo mkdir -p "$BUILD_DIR"
  sudo mkdir -p "$LOGS_DIR"
  sudo mkdir -p "$BACKUP_DIR"
  sudo chown -R $USER:$USER "$APP_DIR"
  
  log_info "Directories ready"
}

clone_or_pull() {
  log_step "Pulling latest code..."
  
  if [ ! -d "$REPO_DIR/.git" ]; then
    if [ -z "$GIT_REPO" ]; then
      log_error "Git repository URL is required for first deployment"
      log_error "Use: $0 -r <git-repo-url>"
      exit 1
    fi
    
    log_info "Cloning repository: $GIT_REPO (branch: $GIT_BRANCH)"
    git clone --depth 1 --branch "$GIT_BRANCH" "$GIT_REPO" "$REPO_DIR"
  else
    cd "$REPO_DIR"
    
    if [ -n "$GIT_REPO" ]; then
      git remote set-url origin "$GIT_REPO"
    fi
    
    log_info "Fetching latest from $GIT_BRANCH..."
    git fetch origin "$GIT_BRANCH"
    git reset --hard "origin/$GIT_BRANCH"
    git clean -fd
  fi
  
  local COMMIT_HASH=$(cd "$REPO_DIR" && git rev-parse --short HEAD)
  local COMMIT_MSG=$(cd "$REPO_DIR" && git log -1 --pretty=%s)
  log_info "Deploying commit: $COMMIT_HASH - $COMMIT_MSG"
}

backup_current_build() {
  log_step "Backing up current build..."
  
  if [ -d "$BUILD_DIR" ] && [ "$(ls -A $BUILD_DIR 2>/dev/null)" ]; then
    local BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
    local BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    mkdir -p "$BACKUP_PATH"
    cp -r "$BUILD_DIR"/* "$BACKUP_PATH/" 2>/dev/null || true
    
    log_info "Backup created: $BACKUP_NAME"
    
    ls -1dt "$BACKUP_DIR"/*/ 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true
  else
    log_info "No existing build to backup"
  fi
}

install_dependencies() {
  log_step "Installing dependencies..."
  
  cd "$REPO_DIR"
  
  if [ "$FULL_DEPLOY" = true ] || [ ! -d "node_modules" ]; then
    log_info "Performing clean install..."
    rm -rf node_modules
    npm ci --production
  else
    if [ -f package-lock.json ]; then
      npm ci --production
    else
      npm install --production
    fi
  fi
  
  log_info "Dependencies installed"
}

build_project() {
  log_step "Building project..."
  
  cd "$REPO_DIR"
  
  if [ -f .env ]; then
    log_info "Using .env file from repo"
  elif [ -f "$APP_DIR/.env" ]; then
    log_info "Using .env file from app directory"
    cp "$APP_DIR/.env" .env
  else
    log_warn "No .env file found, using defaults"
  fi
  
  npm run build
  
  log_info "Build completed"
}

deploy_build() {
  log_step "Deploying build..."
  
  rm -rf "$BUILD_DIR"/*
  mkdir -p "$BUILD_DIR/.next/static"
  
  cp -r "$REPO_DIR/.next/standalone"/* "$BUILD_DIR/"
  
  cp -r "$REPO_DIR/.next/static"/* "$BUILD_DIR/.next/static/" 2>/dev/null || true
  cp -r "$REPO_DIR/public" "$BUILD_DIR/" 2>/dev/null || true
  
  if [ -f "$REPO_DIR/.next/BUILD_ID" ]; then
    cp "$REPO_DIR/.next/BUILD_ID" "$BUILD_DIR/.next/"
  fi
  
  if [ -f "$REPO_DIR/.env" ]; then
    cp "$REPO_DIR/.env" "$BUILD_DIR/.env"
  elif [ -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env" "$BUILD_DIR/.env"
  fi
  
  log_info "Build deployed to $BUILD_DIR"
}

setup_pm2() {
  log_step "Setting up PM2..."
  
  cat > "$APP_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'server.js',
    cwd: '$BUILD_DIR',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    restart_delay: 4000,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    error_file: '$LOGS_DIR/error.log',
    out_file: '$LOGS_DIR/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};
EOF
  
  if pm2 list | grep -q "$APP_NAME"; then
    log_info "Reloading existing PM2 process..."
    pm2 reload "$APP_NAME" --update-env
  else
    log_info "Starting new PM2 process..."
    pm2 start "$APP_DIR/ecosystem.config.js"
  fi
  
  pm2 save
  
  local count=0
  while [ $count -lt 10 ]; do
    if pm2 list | grep "$APP_NAME" | grep -q "online"; then
      log_info "PM2 process is running"
      break
    fi
    sleep 1
    count=$((count + 1))
  done
  
  if [ $count -ge 10 ]; then
    log_error "PM2 process failed to start within 10 seconds"
    pm2 logs "$APP_NAME" --lines 20 --nostream
    exit 1
  fi
}

setup_nginx() {
  log_step "Checking Nginx configuration..."
  
  if ! command -v nginx &> /dev/null; then
    log_warn "Nginx not installed, skipping Nginx setup"
    return
  fi
  
  local NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"
  
  if [ ! -f "$NGINX_CONF" ]; then
    log_info "Creating Nginx configuration..."
    
    sudo tee "$NGINX_CONF" > /dev/null << EOF
server {
  listen 80;
  server_name _;

  client_max_body_size 100M;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_cache_bypass \$http_upgrade;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
  }

  location /_next/static/ {
    alias $BUILD_DIR/.next/static/;
    expires 365d;
    add_header Cache-Control "public, immutable";
  }

  gzip on;
  gzip_vary on;
  gzip_min_length 1024;
  gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
}
EOF
    
    sudo ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/"
    
    if sudo nginx -t &> /dev/null; then
      sudo systemctl reload nginx
      log_info "Nginx configured and reloaded"
    else
      log_warn "Nginx config test failed, please check manually"
    fi
  else
    log_info "Nginx config already exists, skipping"
  fi
}

verify_deployment() {
  log_step "Verifying deployment..."
  
  sleep 2
  
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    log_info "Application is responding on port 3000"
  else
    log_warn "Application not responding on port 3000 (may need more time)"
  fi
  
  log_info ""
  pm2 status | grep "$APP_NAME" || true
}

rollback() {
  log_step "Rolling back..."
  
  local LATEST_BACKUP=$(ls -1dt "$BACKUP_DIR"/*/ 2>/dev/null | head -1)
  
  if [ -z "$LATEST_BACKUP" ]; then
    log_error "No backup found for rollback"
    exit 1
  fi
  
  log_info "Restoring from: $LATEST_BACKUP"
  
  rm -rf "$BUILD_DIR"/*
  cp -r "$LATEST_BACKUP"/* "$BUILD_DIR/"
  
  pm2 reload "$APP_NAME" --update-env
  
  log_info "Rollback completed"
}

show_summary() {
  local COMMIT_HASH=$(cd "$REPO_DIR" && git rev-parse --short HEAD)
  local COMMIT_MSG=$(cd "$REPO_DIR" && git log -1 --pretty=%s)
  
  echo ""
  echo -e "${GREEN}==========================================${NC}"
  echo -e "${GREEN}          部署成功！${NC}"
  echo -e "${GREEN}==========================================${NC}"
  echo ""
  echo "  Commit:    $COMMIT_HASH - $COMMIT_MSG"
  echo "  分支:      $GIT_BRANCH"
  echo "  目录:      $BUILD_DIR"
  echo "  端口:      3000 (PM2)"
  echo ""
  echo "  管理命令:"
  echo "    pm2 status          查看状态"
  echo "    pm2 logs            查看日志"
  echo "    pm2 restart $APP_NAME   重启"
  echo "    pm2 stop $APP_NAME      停止"
  echo ""
  echo "  更新部署:"
  echo "    $0"
  echo ""
}

main() {
  parse_args "$@"
  
  echo ""
  echo -e "${BLUE}==========================================${NC}"
  echo -e "${BLUE}     星野 AI 伴侣 - Git 部署脚本${NC}"
  echo -e "${BLUE}==========================================${NC}"
  echo ""
  
  check_prerequisites
  setup_directories
  clone_or_pull
  backup_current_build
  install_dependencies
  build_project
  deploy_build
  setup_pm2
  setup_nginx
  verify_deployment
  show_summary
  
  echo -e "${GREEN}部署完成！${NC}"
}

main "$@"