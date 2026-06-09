"""通过抖音电商开放平台 API 抓取商品（巨量百应 / 精选联盟）
用法:
  python -m agents.scrapers.douyin_openapi_cli --n 50 --title "防晒衣" --sort sales
  python -m agents.scrapers.douyin_openapi_cli --n 100 --pages 5 --token "act.xxxxx"
"""
import argparse
import json
import sys
from pathlib import Path
from typing import List, Dict, Any

# 确保项目根目录在路径中
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from loguru import logger

from agents.scrapers.douyin_openapi import (
    DouyinAllianceClient,
    normalize_products,
)
from config import Config, get_env
from utils.common import ensure_dir


def crawl_via_openapi(
    access_token: str,
    title: str = "",
    sort_type: str = "sales",
    n: int = 100,
    page_size: int = 20,
    output_file: str = None,
    app_key: str = "",
    app_secret: str = "",
    code: str = "",
) -> List[Dict[str, Any]]:
    """
    使用 OpenAPI 抓取商品。

    sort_type:
      - sales    = 按历史销量排序 (search_type=1, sort_type=1)
      - commission = 按佣金金额排序 (search_type=3, sort_type=1)
      - ratio    = 按佣金比例排序 (search_type=4, sort_type=1)
      - price_asc= 按价格升序 (search_type=2, sort_type=0)
      - default  = 默认排序
    """
    sort_map = {
        "sales": (1, 1),
        "commission": (3, 1),
        "ratio": (4, 1),
        "price_asc": (2, 0),
        "default": (0, 1),
    }
    st, so = sort_map.get(sort_type, sort_map["default"])

    client = DouyinAllianceClient(app_key=app_key, app_secret=app_secret)

    if code and app_key and app_secret:
        logger.info("使用 code 换取 access_token...")
        client.get_access_token_by_code(code)
    elif access_token:
        client.set_access_token(access_token)
    elif get_env("DOUYIN_ACCESS_TOKEN", ""):
        client.set_access_token(get_env("DOUYIN_ACCESS_TOKEN"))
    else:
        logger.error("没有提供 access_token / code。请通过参数 --token 或设置环境变量 DOUYIN_ACCESS_TOKEN")
        return []

    pages = max(1, (n + page_size - 1) // page_size)
    all_items: List[Dict[str, Any]] = []

    for page in range(1, pages + 1):
        resp = client.search_products(
            title=title,
            search_type=st,
            sort_type=so,
            page=page,
            page_size=page_size,
        )
        normalized = normalize_products(resp)
        if not normalized:
            # 可能是字段名差异，尝试直接拿 raw data 打印
            logger.warning(f"第 {page} 页没解析到商品，原始返回: {json.dumps(resp, ensure_ascii=False)[:300]}")
            break
        all_items.extend(normalized)
        logger.info(f"第 {page}/{pages} 页: {len(normalized)} 条 | 累计 {len(all_items)}")
        if len(all_items) >= n:
            break

    all_items = all_items[:n]

    out_path = Path(output_file) if output_file else Config.DATA_DIR / "products.json"
    ensure_dir(out_path.parent)
    out_path.write_text(
        json.dumps(all_items, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    logger.success(f"已写入 {len(all_items)} 条商品 -> {out_path}")
    return all_items


def main():
    p = argparse.ArgumentParser(description="通过抖音电商 OpenAPI 抓取商品")
    p.add_argument("--title", type=str, default="", help="搜索关键词，如 '防晒衣'")
    p.add_argument("--sort", type=str, default="sales",
                   choices=["sales", "commission", "ratio", "price_asc", "default"],
                   help="排序方式: sales=销量 commission=佣金金额 ratio=佣金比例 price_asc=价格升序 default=默认")
    p.add_argument("-n", "--num", type=int, default=100, help="需要抓取的商品总数")
    p.add_argument("--page-size", type=int, default=20, help="每页数量（文档限制<=20）")
    p.add_argument("-o", "--output", type=str, default=None, help="输出 JSON 路径（默认 data/products.json）")
    p.add_argument("--token", type=str, default="", help="直接传 access_token，优先级最高")
    p.add_argument("--app-key", type=str, default="", help="app_key，配合 code 获取 token")
    p.add_argument("--app-secret", type=str, default="", help="app_secret，配合 code 获取 token")
    p.add_argument("--code", type=str, default="", help="OAuth code，配合 app_key/app_secret 换取 token")
    args = p.parse_args()

    crawl_via_openapi(
        access_token=args.token,
        title=args.title,
        sort_type=args.sort,
        n=args.num,
        page_size=args.page_size,
        output_file=args.output,
        app_key=args.app_key,
        app_secret=args.app_secret,
        code=args.code,
    )


if __name__ == "__main__":
    main()
