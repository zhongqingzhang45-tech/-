"""FastAPI 应用入口：挂载静态资源、注册 API 路由、允许 CORS。
根路径返回 /workspace/web/index.html（前端页面占位）。
"""
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from loguru import logger

# 确保项目根目录在 sys.path，便于 from db import ... / from config import Config
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from config import Config  # noqa: E402
from db import init_db  # noqa: E402
from api.routes import api_router  # noqa: E402


# ---------- 初始化 DB ----------
init_db()
logger.info("DB 初始化完成")

# ---------- FastAPI 实例 ----------
app = FastAPI(
    title="Marketing Agent Dashboard",
    description="营销 Agent 运营仪表盘 API：商品/内容/热点/发布/排行榜/日志",
    version="1.0.0",
)

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- 静态资源 ----------
# /static -> /workspace/web/static
WEB_STATIC_DIR = BASE_DIR / "web" / "static"
WEB_STATIC_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(WEB_STATIC_DIR)), name="static")

# /images -> /workspace/output/images
app.mount("/images", StaticFiles(directory=str(Config.IMAGE_DIR)), name="images")

# ---------- 挂载 API 路由 ----------
app.include_router(api_router)


# ---------- 健康检查 ----------
@app.get("/health", tags=["system"])
def health():
    return {"status": "ok"}


# ---------- 根路径：返回 index.html ----------
@app.get("/", tags=["web"])
def root():
    index_html = BASE_DIR / "web" / "index.html"
    if index_html.exists():
        return FileResponse(str(index_html), media_type="text/html")
    # 兜底：返回一个简单的欢迎页 JSON
    return JSONResponse({
        "title": "Marketing Agent Dashboard",
        "api_docs": "/docs",
        "api": "/api/stats",
        "image_dir": str(Config.IMAGE_DIR),
    })


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return JSONResponse({})


logger.success("FastAPI server 已就绪")
