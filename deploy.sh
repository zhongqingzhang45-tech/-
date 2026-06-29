#!/bin/bash
set -e

APP_NAME="lifeos"
APP_DIR="/opt/lifeos"
BUILD_DIR="$APP_DIR/build"
NODE_VERSION="20"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

install_dependencies() {
  log_info "Installing system dependencies..."
  
  if ! command -v node &> /dev/null; then
    log_info "Installing Node.js $NODE_VERSION..."
    curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi

  if ! command -v npm &> /dev/null; then
    log_info "Installing npm..."
    sudo apt-get install -y npm
  fi

  if ! command -v pm2 &> /dev/null; then
    log_info "Installing PM2..."
    sudo npm install -g pm2
  fi

  if ! command -v nginx &> /dev/null; then
    log_info "Installing Nginx..."
    sudo apt-get install -y nginx
  fi
}

setup_directories() {
  log_info "Setting up directories..."
  
  sudo mkdir -p "$APP_DIR"
  sudo mkdir -p "$BUILD_DIR"
  sudo chown -R $USER:$USER "$APP_DIR"
}

build_project() {
  log_info "Building project..."
  
  npm install --production
  npm run build
  
  log_info "Build completed successfully"
}

copy_build_files() {
  log_info "Copying build files to $BUILD_DIR..."
  
  rm -rf "$BUILD_DIR"/*
  
  cp -r .next/standalone/* "$BUILD_DIR/"
  cp -r .next/static "$BUILD_DIR/.next/"
  cp -r public "$BUILD_DIR/"
  
  if [ -f .next/BUILD_ID ]; then
    cp .next/BUILD_ID "$BUILD_DIR/.next/"
  else
    log_warn "BUILD_ID not found, skipping"
  fi
  
  if [ -f .next/PRERENDER_MANIFEST ]; then
    cp .next/PRERENDER_MANIFEST "$BUILD_DIR/.next/"
  else
    log_warn "PRERENDER_MANIFEST not found, skipping"
  fi
  
  if [ -f .next/BUILD_MANIFEST ]; then
    cp .next/BUILD_MANIFEST "$BUILD_DIR/.next/"
  else
    log_warn "BUILD_MANIFEST not found, skipping"
  fi
  
  if [ -f .next/server-reference-manifest.json ]; then
    cp .next/server-reference-manifest.json "$BUILD_DIR/.next/"
  else
    log_warn "server-reference-manifest.json not found, skipping (may be optional)"
  fi
  
  log_info "Build files copied successfully"
}

setup_pm2() {
  log_info "Setting up PM2..."
  
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
    error_file: '$APP_DIR/logs/error.log',
    out_file: '$APP_DIR/logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};
EOF
  
  mkdir -p "$APP_DIR/logs"
  pm2 start "$APP_DIR/ecosystem.config.js"
  pm2 save
  pm2 startup
  
  log_info "PM2 setup completed"
}

setup_nginx() {
  log_info "Setting up Nginx..."
  
  cat > "/etc/nginx/sites-available/$APP_NAME" << EOF
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

  location /vendor/ {
    alias $BUILD_DIR/public/vendor/;
    expires 30d;
  }

  location /live2d-models/ {
    alias $BUILD_DIR/public/live2d-models/;
    expires 30d;
  }

  gzip on;
  gzip_vary on;
  gzip_min_length 1024;
  gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
}
EOF
  
  ln -sf "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-enabled/"
  
  nginx -t
  if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    log_info "Nginx configured successfully"
  else
    log_error "Nginx configuration error"
    exit 1
  fi
}

setup_firewall() {
  log_info "Setting up firewall..."
  
  if command -v ufw &> /dev/null; then
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw reload
    log_info "Firewall rules updated"
  else
    log_warn "ufw not installed, skipping firewall setup"
  fi
}

show_summary() {
  log_info ""
  log_info "=========================================="
  log_info "          部署完成！"
  log_info "=========================================="
  log_info ""
  log_info "项目目录: $BUILD_DIR"
  log_info "运行端口: 3000 (PM2)"
  log_info "访问地址: http://<服务器IP>"
  log_info ""
  log_info "管理命令:"
  log_info "  pm2 status          # 查看状态"
  log_info "  pm2 logs            # 查看日志"
  log_info "  pm2 restart lifeos  # 重启项目"
  log_info "  pm2 stop lifeos     # 停止项目"
  log_info ""
}

main() {
  log_info "=========================================="
  log_info "     星野 AI 伴侣项目部署脚本"
  log_info "=========================================="
  log_info ""
  
  install_dependencies
  setup_directories
  build_project
  copy_build_files
  setup_pm2
  setup_nginx
  setup_firewall
  show_summary
  
  log_info ""
  log_info "${GREEN}部署成功！${NC}"
}

main "$@"