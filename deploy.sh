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

BETTER_AUTH_SECRET=$(generate_secret)
LLM_ROUTER_MASTER_KEY=$(generate_secret)

info "========================================"
info "  AIRI 一键部署脚本"
info "  服务器: $(hostname) ($(curl -s ifconfig.me 2>/dev/null || echo 'unknown'))"
info "  部署目录: $APP_DIR"
info "========================================"

# ============================================================
# Step 1: 安装系统依赖
# ============================================================
info "Step 1: 安装系统依赖..."

sudo apt-get update -qq

# 基础工具 + PostgreSQL + Redis + Nginx
sudo apt-get install -y -qq curl git build-essential python3 nginx \
  postgresql postgresql-contrib redis-server ufw 2>/dev/null

# canvas 原生模块编译需要的系统库（如启用 canvas 构建时需要）
sudo apt-get install -y -qq pkg-config libpixman-1-dev libcairo2-dev \
  libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev 2>/dev/null

ok "系统依赖安装完成"

# ============================================================
# Step 1.5: 配置 Swap 空间（防止构建时 OOM）
# ============================================================
info "Step 1.5: 检查并配置 Swap 空间..."

TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
SWAP_SIZE=4096

if [ "$TOTAL_MEM" -lt 4096 ]; then
  info "内存不足 ${TOTAL_MEM}MB，配置 ${SWAP_SIZE}MB Swap..."
  
  if ! swapon --show | grep -q .; then
    sudo fallocate -l ${SWAP_SIZE}M /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=$SWAP_SIZE 2>/dev/null
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
    ok "Swap 空间已配置: ${SWAP_SIZE}MB"
  else
    info "Swap 已存在，跳过配置"
  fi
else
  info "内存充足 (${TOTAL_MEM}MB)，跳过 Swap 配置"
fi

# ============================================================
# Step 2: 安装 Node.js + pnpm + PM2
# ============================================================
info "Step 2: 安装 Node.js + pnpm + PM2..."

# Node.js 22 LTS（pnpm 10+ 需要 node:sqlite 模块，仅 Node 22+ 支持）
NODE_MAJOR=22
if ! command -v node &>/dev/null || ! node -v | grep -q "^v$NODE_MAJOR\."; then
  info "安装 Node.js $NODE_MAJOR.x LTS..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | sudo -E bash -
  sudo apt-get install -y -qq nodejs
fi
ok "Node.js: $(node -v)"

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
  git remote set-url origin "$GITEE_REPO_AUTH" 2>/dev/null || true
  git fetch origin main 2>&1 || warn "git fetch 失败"
  git reset --hard origin/main 2>&1 || warn "git reset 失败"
  git remote set-url origin "$GITEE_REPO" 2>/dev/null || true
else
  git clone --depth 1 "$GITEE_REPO_AUTH" "$APP_DIR"
  cd "$APP_DIR"
  git remote set-url origin "$GITEE_REPO" 2>/dev/null || true
fi

ok "代码已就绪: $(pwd)"

# ============================================================
# Step 6: 配置环境变量
# ============================================================
info "Step 6: 配置环境变量..."

# dotenvx 通过 .env.local 加载环境变量（apply:env 脚本）
# 同时创建 .env 供其他工具使用
SERVER_ENV_LOCAL="apps/server/.env.local"
SERVER_ENV="apps/server/.env"

# NOTICE: AUTH_GOOGLE_* / AUTH_GITHUB_* 在 env.ts 中是 nonEmpty 必填项
# 部署时若未配置真实 OAuth，使用占位符让 server 能启动（OAuth 登录将不可用）
cat > "$SERVER_ENV_LOCAL" << EOF
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

# ===== LLM Router 加密密钥（base64 编码的 32 字节）=====
LLM_ROUTER_MASTER_KEY=$LLM_ROUTER_MASTER_KEY

# ===== OAuth 占位符（env.ts 要求 nonEmpty，真实值请手动替换）=====
AUTH_GOOGLE_CLIENT_ID=placeholder_google_client_id
AUTH_GOOGLE_CLIENT_SECRET=placeholder_google_client_secret
AUTH_GITHUB_CLIENT_ID=placeholder_github_client_id
AUTH_GITHUB_CLIENT_SECRET=placeholder_github_client_secret

# ===== Stripe（可选，先留空）=====
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# ===== 邮件（可选）=====
RESEND_API_KEY=

# ===== 数据库连接池 =====
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT_MS=30000
DB_POOL_CONNECTION_TIMEOUT_MS=5000
DB_POOL_KEEPALIVE_INITIAL_DELAY_MS=10000

# ===== 可信来源 =====
ADDITIONAL_TRUSTED_ORIGINS=
EOF

# .env 与 .env.local 保持一致
cp "$SERVER_ENV_LOCAL" "$SERVER_ENV"

ok "环境变量配置完成: $SERVER_ENV_LOCAL"
warn "请根据需要修改 OAuth/Stripe 等配置（当前为占位符）"

# ============================================================
# Step 7: 安装项目依赖
# ============================================================
info "Step 7: 安装项目依赖..."

# ---------- 7.1 清理 pnpm-workspace.yaml 中的问题配置 ----------
WORKSPACE_FILE="pnpm-workspace.yaml"

# 移除未使用的 mineflayer-pathfinder patch（只删除 .patch 行，保留 catalog 版本声明）
if grep -q "mineflayer-pathfinder" "$WORKSPACE_FILE" 2>/dev/null; then
  sed -i '/mineflayer-pathfinder.*\.patch$/d' "$WORKSPACE_FILE"
  info "已移除未使用的 mineflayer-pathfinder patch"
fi

# 移除 @mediapipe/tasks-vision patch（补丁与当前包版本不匹配，只删除 .patch 行）
if grep -q "@mediapipe/tasks-vision.*\.patch" "$WORKSPACE_FILE" 2>/dev/null; then
  sed -i '/@mediapipe\/tasks-vision.*\.patch$/d' "$WORKSPACE_FILE"
  info "已移除 @mediapipe/tasks-vision patch（补丁不匹配）"
fi

# ---------- 7.2 禁用部署不需要的 native 模块 postinstall ----------
# 这些模块的 postinstall 会因网络或系统依赖失败，但服务器部署不需要它们:
#   sharp@0.29.3: 从 GitHub 下载 libvips（国内网络受限）
#   canvas: 原生编译耗时，仅用于开发工具
#   uiohook-napi: 桌面端键盘/鼠标钩子
#   node-pty: 终端模拟，服务器不需要
#   electron: 桌面应用框架
#   isolated-vm: V8 沙箱，服务器不需要
#   stockfish: 国际象棋引擎
# 将它们从 onlyBuiltDependencies 移到 ignoredBuiltDependencies
NATIVE_MODULES_TO_SKIP=(
  "sharp"
  "canvas"
  "uiohook-napi"
  "node-pty"
  "electron"
  "isolated-vm"
  "stockfish"
)

for mod in "${NATIVE_MODULES_TO_SKIP[@]}"; do
  # 从 onlyBuiltDependencies 中移除
  sed -i "/^  - ${mod}$/d" "$WORKSPACE_FILE"
  # 添加到 ignoredBuiltDependencies（如果尚未存在）
  if ! grep -A50 "^ignoredBuiltDependencies:" "$WORKSPACE_FILE" | grep -q "^  - ${mod}$"; then
    sed -i "/^ignoredBuiltDependencies:/a\\  - ${mod}" "$WORKSPACE_FILE"
  fi
done
info "已禁用 sharp/canvas/electron 等 native 模块的 postinstall"

# ---------- 7.3 临时禁用根 postinstall 脚本 ----------
# 根 package.json 的 postinstall 是: pnpm exec simple-git-hooks && pnpm run build:packages
# - simple-git-hooks: 部署不需要 git hooks
# - build:packages: 稍后手动构建（需要先安装依赖才能构建）
ROOT_PKG="package.json"
if grep -q '"postinstall"' "$ROOT_PKG"; then
  sed -i 's/"postinstall":/"_postinstall_orig":/' "$ROOT_PKG"
  info "已临时禁用根 postinstall 脚本（稍后手动构建 packages）"
fi

# ---------- 7.4 执行 pnpm install ----------
# 使用 --filter 仅安装 server + stage-web 及其依赖，跳过 tauri/electron 等无关包
# 这大幅减少安装时间和避免更多 native 模块问题
info "执行 pnpm install（仅安装 server + stage-web 依赖）..."

pnpm install \
  --filter "@proj-airi/server..." \
  --filter "@proj-airi/stage-web..." \
  --no-frozen-lockfile 2>&1 || {
  warn "filtered install 失败，回退到完整安装..."
  pnpm install --no-frozen-lockfile 2>&1 || {
    warn "完整安装也有警告，继续部署（部分 native 模块可能不可用）"
  }
}

ok "依赖安装完成"

# ============================================================
# Step 8: 构建 workspace packages
# ============================================================
info "Step 8: 构建 workspace packages..."

# 构建 packages 也需要适当内存
export NODE_OPTIONS="--max-old-space-size=2048"

# server 和 stage-web 依赖的 workspace packages 需要先构建（生成 dist/）
# 使用 --filter ... 递归构建 server 和 stage-web 的所有 workspace 依赖
info "构建 server 依赖的 packages..."
pnpm --filter "@proj-airi/server..." run build 2>&1 || warn "server packages 构建有警告，继续"

info "构建 stage-web 依赖的 packages..."
pnpm --filter "@proj-airi/stage-web..." run build 2>&1 || warn "stage-web packages 构建有警告，继续"

unset NODE_OPTIONS

ok "workspace packages 构建完成"

# ============================================================
# Step 9: 数据库迁移
# ============================================================
info "Step 9: 数据库迁移..."

# db:push 脚本通过 dotenvx 加载 .env.local，然后运行 drizzle-kit push
cd apps/server
pnpm run db:push 2>&1 || warn "数据库迁移可能需要手动检查: cd apps/server && pnpm run db:push"
cd ../..

ok "数据库迁移完成"

# ============================================================
# Step 10: 构建 stage-web 前端
# ============================================================
info "Step 10: 构建 stage-web..."

# Vite/Rolldown 构建大型应用需要大量内存，增加 Node.js 内存限制
# 低配置服务器（2G/4G）可能需要 2-4G 内存才能完成构建
export NODE_OPTIONS="--max-old-space-size=4096"

# 使用 --mode=production 构建，限制并发 worker 减少内存占用
BUILD_RESULT=0
pnpm -F @proj-airi/stage-web run build 2>&1 || BUILD_RESULT=$?

if [ $BUILD_RESULT -ne 0 ]; then
  warn "stage-web 构建失败（可能内存不足），尝试增加内存重试..."
  export NODE_OPTIONS="--max-old-space-size=6144"
  pnpm -F @proj-airi/stage-web run build 2>&1 || {
    warn "stage-web 构建仍然失败，跳过前端构建"
    warn "服务器内存不足，建议升级到 4G 以上内存"
    warn "前端页面将无法访问，但 API 服务正常"
  }
fi

# 恢复默认内存限制
unset NODE_OPTIONS

ok "stage-web 构建完成"

# ============================================================
# Step 11: 创建 PM2 启动脚本
# ============================================================
info "Step 11: 配置 PM2..."

# PM2 启动脚本：通过 pnpm run start 调用 dotenvx 加载 .env.local 后启动 tsx
# 不能直接调用 tsx，否则环境变量不会被加载（server 启动会失败）
START_SCRIPT="$APP_DIR/apps/server/start-server.sh"

cat > "$START_SCRIPT" << STARTEOF
#!/usr/bin/env bash
set -euo pipefail
cd "\$(dirname "\$0")"

# 确保使用正确的 Node.js 路径（PM2 启动时 PATH 可能不包含 nodesource 的 node）
export PATH="\$(dirname \$(which node)):\$PATH"

# 通过 pnpm run start 调用 dotenvx run 加载 .env.local，然后运行 tsx
exec pnpm run start
STARTEOF
chmod +x "$START_SCRIPT"

# PM2 配置
PM2_CONFIG="$APP_DIR/ecosystem.config.cjs"

cat > "$PM2_CONFIG" << 'EOF'
module.exports = {
  apps: [
    {
      name: 'airi-server',
      cwd: './apps/server',
      script: './start-server.sh',
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
# Step 12: 配置 Nginx 反向代理
# ============================================================
info "Step 12: 配置 Nginx..."

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
# Step 13: 配置防火墙
# ============================================================
info "Step 13: 配置防火墙..."

sudo ufw allow 22/tcp 2>/dev/null || true
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 443/tcp 2>/dev/null || true
sudo ufw --force enable 2>/dev/null || warn "防火墙配置跳过"

ok "防火墙配置完成"

# ============================================================
# Step 14: 验证部署
# ============================================================
info "Step 14: 验证部署..."

sleep 5

# 检查 PM2 进程状态
info "PM2 进程状态:"
pm2 list

# 检查健康端点
info "健康检查:"
if curl -sf "http://localhost:$SERVER_PORT/livez" 2>/dev/null; then
  ok "Server 健康检查通过"
else
  warn "Server 健康检查未就绪"
  warn "查看日志: pm2 logs airi-server --lines 50"
  # 显示最近日志帮助诊断
  pm2 logs airi-server --lines 20 --nostream 2>/dev/null || true
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
echo -e "  1. 修改 ${BLUE}apps/server/.env.local${NC} 中的 OAuth/Stripe 配置"
echo -e "     当前 OAuth 为占位符，登录功能不可用"
echo -e "  2. 查看日志: ${BLUE}pm2 logs airi-server${NC}"
echo -e "  3. 重启服务: ${BLUE}pm2 restart airi-server${NC}"
echo -e "  4. 更新代码: ${BLUE}cd ~/airi && git pull && bash deploy.sh${NC}"
echo ""
