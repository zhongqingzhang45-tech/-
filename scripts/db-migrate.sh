#!/bin/bash
set -e

echo "=========================================="
echo "  LifeOS - 数据库迁移脚本"
echo "=========================================="

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

DOCKER_COMPOSE="docker compose"
if ! command -v docker compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
fi

echo ""
echo "检查数据库连接..."
$DOCKER_COMPOSE exec -T postgres pg_isready -U ${POSTGRES_USER:-lifeos} -d ${POSTGRES_DB:-lifeos}

echo ""
echo "执行数据库迁移..."
$DOCKER_COMPOSE exec -T lifeos npx prisma migrate deploy

echo ""
echo "✅ 数据库迁移完成！"
