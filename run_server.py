"""服务启动脚本：解析 --host/--port，调用 uvicorn 启动 FastAPI。

使用示例:
    python run_server.py
    python run_server.py --host 0.0.0.0 --port 8000
    python run_server.py --port 8888
"""
import argparse
import sys
from pathlib import Path

# 确保项目根目录在 sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import uvicorn
from loguru import logger


def main():
    parser = argparse.ArgumentParser(description="Marketing Agent Dashboard")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="监听地址")
    parser.add_argument("--port", type=int, default=8000, help="监听端口")
    args = parser.parse_args()

    host = args.host
    port = args.port

    logger.info(f"启动服务 {host}:{port}")
    logger.info(f"  - API 文档: http://{host}:{port}/docs")
    logger.info(f"  - 仪表盘:   http://{host}:{port}/")
    logger.info(f"  - 健康检查: http://{host}:{port}/health")

    uvicorn.run(
        "api.server:app",
        host=host,
        port=port,
        reload=False,
        log_level="info",
        access_log=True,
    )


if __name__ == "__main__":
    main()
