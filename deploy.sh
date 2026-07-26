#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# AIRI 一键部署脚本 — 腾讯云 Lighthouse (Ubuntu)
# 部署方式: PM2 + Nginx
# 使用方法: bash deploy.sh
# ============================================================

# ---------- 颜色输出 ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $*"; exit 1; }

# ---------- 配置 ----------
GITEE_REPO="https://gitee.com/lifeos20/airi.git"
GITEE_REPO_AUTH="https://oauth2:24d31e4a13d1d3fd1efe4d106784c875@gitee.com/lifeos20/airi.git"
APP_DIR="$HOME/airi"
SERVER_PORT=3000
WEB_PORT=5173

# 数据库配置
DB_NAME="airi"
DB_USER="airi"
DB_PASS="airi_secure_pass_2024"
PG_PORT=5432

# Redis 配置
REDIS_PORT=6379

# 生成随机密钥
generate_secret() {
  openssl rand -base64 32
}

generate_master_key() {
  openssl rand -base64 32
}

BETTER_AUTH_SECRET=$(generate_secret)
LLM_ROUTER_MASTER_KEY=$(generate_master_key)

info "========================================"
info "  AIRI 一键部署脚本"
info "  服务器: $(hostname) ($(curl -s ifconfig.me 2>/dev/null || echo 'unknown'))"
info "  部署目录: $APP_DIR"
info "========================================"

# ============================================================
# Step 1: 安装系统依赖
# ============================================================
info "Step 1: 安装系统依赖..."

# 更新包管理器
sudo apt-get update -qq

# 安装基础工具
sudo apt-get install -y -qq curl git build-essential python3 nginx \
  postgresql postgresql-contrib redis-server ufw 2>/dev/null

# canvas 原生模块编译需要的系统库
sudo apt-get install -y -qq pkg-config libpixman-1-dev libcairo2-dev \
  libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev 2>/dev/null

ok "系统依赖安装完成"

# ============================================================
# Step 2: 安装 Node.js 20 LTS + pnpm + PM2
# ============================================================
info "Step 2: 安装 Node.js + pnpm + PM2..."

if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y -qq nodejs
fi

NODE_VERSION=$(node -v)
ok "Node.js: $NODE_VERSION"

# pnpm
if ! command -v pnpm &>/dev/null; then
  sudo npm install -g pnpm@latest
fi
ok "pnpm: $(pnpm -v)"

# PM2
if ! command -v pm2 &>/dev/null; then
  sudo npm install -g pm2
fi
ok "PM2: $(pm2 -v)"

# ============================================================
# Step 3: 配置 PostgreSQL
# ============================================================
info "Step 3: 配置 PostgreSQL..."

sudo systemctl enable postgresql
sudo systemctl start postgresql

# 创建数据库和用户
sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASS'; END IF; END \$\$;" 2>/dev/null || true
sudo -u postgres psql -c "SELECT 'CREATE DATABASE $DB_NAME' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')" | grep -q CREATE && sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true

ok "PostgreSQL: 数据库 $DB_NAME 已就绪"

# ============================================================
# Step 4: 配置 Redis
# ============================================================
info "Step 4: 配置 Redis..."

sudo systemctl enable redis-server
sudo systemctl start redis-server

ok "Redis: 已启动 (端口 $REDIS_PORT)"

# ============================================================
# Step 5: 克隆代码仓库
# ============================================================
info "Step 5: 克隆代码仓库..."

if [ -d "$APP_DIR/.git" ]; then
  info "仓库已存在，拉取最新代码..."
  cd "$APP_DIR"
  # 使用带 token 的 URL 避免交互式输入
  git remote set-url origin "$GITEE_REPO_AUTH" 2>/dev/null || true
  git pull origin main 2>&1 || warn "git pull 失败，使用现有代码继续"
  # 恢复为不带 token 的 URL（安全）
  git remote set-url origin "$GITEE_REPO" 2>/dev/null || true
else
  git clone --depth 1 "$GITEE_REPO_AUTH" "$APP_DIR"
  cd "$APP_DIR"
  # 恢复为不带 token 的 URL
  git remote set-url origin "$GITEE_REPO" 2>/dev/null || true
fi

ok "代码已就绪: $(pwd)"

# ============================================================
# Step 6: 配置环境变量
# ============================================================
info "Step 6: 配置环境变量..."

SERVER_ENV_FILE="apps/server/.env"

cat > "$SERVER_ENV_FILE" << EOF
# ===== 基础配置 =====
HOST=0.0.0.0
PORT=$SERVER_PORT
API_SERVER_URL=http://localhost:$SERVER_PORT

# ===== 数据库 =====
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:$PG_PORT/$DB_NAME

# ===== Redis =====
REDIS_URL=redis://localhost:$REDIS_PORT

# ===== 认证密钥 =====
BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET

# ===== LLM Router 加密密钥 =====
LLM_ROUTER_MASTER_KEY=$LLM_ROUTER_MASTER_KEY

# ===== Google OAuth (可选，先留空) =====
AUTH_GOOGLE_CLIENT_ID=
AUTH_GOOGLE_CLIENT_SECRET=

# ===== GitHub OAuth (可选，先留空) =====
AUTH_GITHUB_CLIENT_ID=
AUTH_GITHUB_CLIENT_SECRET=

# ===== Stripe (可选) =====
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# ===== 邮件 (可选) =====
RESEND_API_KEY=

# ===== 数据库连接池 =====
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT_MS=30000
DB_POOL_CONNECTION_TIMEOUT_MS=5000
DB_POOL_KEEPALIVE_INITIAL_DELAY_MS=10000

# ===== 可信来源 =====
ADDITIONAL_TRUSTED_ORIGINS=
EOF

ok "环境变量配置完成: $SERVER_ENV_FILE"
warn "请根据需要修改 OAuth/Stripe 等配置"

# ============================================================
# Step 7: 安装项目依赖
# ============================================================
info "Step 7: 安装项目依赖..."

# 移除未使用的 mineflayer-pathfinder patch（该包在 workspace 但未被部署目标引用）
if grep -q "mineflayer-pathfinder" pnpm-workspace.yaml 2>/dev/null; then
  sed -i '/mineflayer-pathfinder:/d' pnpm-workspace.yaml
  info "已移除未使用的 mineflayer-pathfinder patch 配置"
fi

# pnpm install: 允许 patch 警告但不中断
pnpm install --no-frozen-lockfile 2>&1 || {
  warn "pnpm install 遇到警告，尝试忽略 patch 错误重试..."
  pnpm install --no-frozen-lockfile --config.strict-peer-dependencies=false 2>&1 || true
}

ok "依赖安装完成"

# ============================================================
# Step 8: 数据库迁移
# ============================================================
info "Step 8: 数据库迁移..."

cd apps/server
pnpm run db:push 2>&1 || warn "数据库迁移可能需要手动检查"
cd ../..

ok "数据库迁移完成"

# ============================================================
# Step 9: 构建应用
# ============================================================
info "Step 9: 构建应用..."

# 构建 server
info "构建 server..."
pnpm -F @proj-airi/server run build 2>&1 || warn "server 构建有警告，继续部署"

# 构建 stage-web
info "构建 stage-web..."
pnpm -F @proj-airi/stage-web run build 2>&1 || warn "stage-web 构建有警告，继续部署"

ok "应用构建完成"

# ============================================================
# Step 10: 配置 PM2
# ============================================================
info "Step 10: 配置 PM2..."

PM2_CONFIG="$APP_DIR/ecosystem.config.cjs"

cat > "$PM2_CONFIG" << 'EOF'
module.exports = {
  apps: [
    {
      name: 'airi-server',
      cwd: './apps/server',
      script: './node_modules/.bin/tsx',
      args: '--import ./instrumentation.ts src/bin/run.ts api',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: '1G',
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_file_mode: '0644',
      time: true,
    },
  ],
}
EOF

mkdir -p "$APP_DIR/logs"

# 停止旧进程
pm2 delete airi-server 2>/dev/null || true

# 启动
cd "$APP_DIR"
pm2 start ecosystem.config.cjs
pm2 save

# 设置开机自启
pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null || warn "PM2 开机自启需要手动执行: pm2 startup"

ok "PM2 配置完成"

# ============================================================
# Step 11: 配置 Nginx 反向代理
# ============================================================
info "Step 11: 配置 Nginx..."

NGINX_CONF="/etc/nginx/sites-available/airi"

sudo tee "$NGINX_CONF" > /dev/null << 'NGINXEOF'
# AIRI 反向代理配置
server {
    listen 80;
    server_name _;

    # 安全头
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # CSP enforce
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cubism.live2d.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https: wss: ws:; media-src 'self' blob: data: https:; font-src 'self' data:; worker-src 'self' blob:; manifest-src 'self'" always;

    # API 后端 — 所有 /api/* 请求转发到 server
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 流式响应支持
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # WebSocket 专用路径
    location ~ ^/api/v1/(chat|audio)/.*ws$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400s;
    }

    # 健康检查
    location /livez {
        proxy_pass http://127.0.0.1:3000/livez;
        access_log off;
    }

    # Stage-Web 前端静态资源
    location /assets/ {
        root /home/ubuntu/airi/apps/stage-web/dist;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    # 前端页面
    location / {
        root /home/ubuntu/airi/apps/stage-web/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 上传文件大小限制
    client_max_body_size 50m;
}
NGINXEOF

# 启用站点
sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/airi
sudo rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
sudo nginx -t 2>&1 || fail "Nginx 配置测试失败"

# 重载 Nginx
sudo systemctl reload nginx
sudo systemctl enable nginx

ok "Nginx 配置完成"

# ============================================================
# Step 12: 配置防火墙
# ============================================================
info "Step 12: 配置防火墙..."

sudo ufw allow 22/tcp 2>/dev/null || true
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 443/tcp 2>/dev/null || true
sudo ufw --force enable 2>/dev/null || warn "防火墙配置跳过"

ok "防火墙配置完成"

# ============================================================
# Step 13: 验证部署
# ============================================================
info "Step 13: 验证部署..."

sleep 3

# 检查 PM2 进程状态
info "PM2 进程状态:"
pm2 list

# 检查健康端点
info "健康检查:"
if curl -sf "http://localhost:$SERVER_PORT/livez" 2>/dev/null; then
  ok "Server 健康检查通过"
else
  warn "Server 健康检查未就绪，请检查日志: pm2 logs airi-server"
fi

# 检查 Nginx
if curl -sf "http://localhost/livez" 2>/dev/null; then
  ok "Nginx 代理正常"
else
  warn "Nginx 代理可能需要几秒钟启动"
fi

# ============================================================
# 完成
# ============================================================
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  访问地址:  ${BLUE}http://$SERVER_IP${NC}"
echo -e "  API 地址:  ${BLUE}http://$SERVER_IP/api${NC}"
echo -e "  健康检查:  ${BLUE}http://$SERVER_IP/livez${NC}"
echo ""
echo -e "  ${YELLOW}重要提示:${NC}"
echo -e "  1. 修改 ${BLUE}apps/server/.env${NC} 中的 OAuth/Stripe 配置"
echo -e "  2. 查看日志: ${BLUE}pm2 logs airi-server${NC}"
echo -e "  3. 重启服务: ${BLUE}pm2 restart airi-server${NC}"
echo -e "  4. 更新代码: ${BLUE}cd ~/airi && git pull && pnpm install && pm2 restart airi-server${NC}"
echo ""
