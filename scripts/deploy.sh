#!/bin/bash
set -e

echo "=========================================="
echo "  LifeOS - 一键部署脚本"
echo "=========================================="

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

echo ""
echo "[1/5] 检查环境..."
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: 未安装 Docker"
    exit 1
fi
if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "❌ 错误: 未安装 Docker Compose"
    exit 1
fi
echo "✅ Docker 环境正常"

DOCKER_COMPOSE="docker compose"
if ! command -v docker compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
fi

echo ""
echo "[2/5] 检查环境变量..."
if [ ! -f .env ]; then
    echo "⚠️  未找到 .env 文件，使用默认配置"
    echo "   建议复制 .env.example 为 .env 并修改配置"
fi

echo ""
echo "[3/5] 拉取最新代码..."
if [ -d .git ]; then
    git pull || echo "⚠️  Git pull 失败，使用当前代码"
else
    echo "⚠️  非 Git 仓库，跳过拉取"
fi

echo ""
echo "[4/5] 构建并启动服务..."
$DOCKER_COMPOSE up -d --build

echo ""
echo "[5/5] 等待服务启动..."
sleep 10

echo ""
echo "=========================================="
echo "  ✅ 部署完成！"
echo "=========================================="
echo ""
echo "访问地址: http://localhost:${APP_PORT:-3000}"
echo "健康检查: http://localhost:${APP_PORT:-3000}/api/health"
echo ""
echo "常用命令:"
echo "  查看日志: $DOCKER_COMPOSE logs -f lifeos"
echo "  停止服务: $DOCKER_COMPOSE down"
echo "  重启服务: $DOCKER_COMPOSE restart"
echo "  数据库迁移: $DOCKER_COMPOSE exec lifeos npx prisma migrate deploy"
echo ""
