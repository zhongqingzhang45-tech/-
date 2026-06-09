"""抖音电商（精选联盟 / 巨量百应）OpenAPI 客户端
域名: https://open.douyinec.com
文档: https://buyin.jinritemai.com/developer/service-provider/doc-center
  或 https://op.jinritemai.com/docs/api-docs/

鉴权流程:
  1. 先到 抖音开放平台 / 精选联盟 后台 注册应用获取 app_key / app_secret
  2. 通过 /oauth/access_token/ 获取用户授权 access_token（需要用户授权登录）
  3. 业务接口在请求头带 access-token: {token}

主要业务接口:
  /buyin/kolMaterialsProductsSearch   - 达人视角搜索精选联盟商品
  /product/detail                     - 商品详情
  /alliance/materialsProductCategory  - 类目查询
  /buyin/kolProductsDetail            - 达人视角商品详情（含佣金）
"""
import json
import time
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pathlib import Path
from loguru import logger

from config import Config, get_env
from utils.common import ensure_dir
from utils.http_client import http_post, http_get

# ============================================================
# 基础配置（建议把 app_key / app_secret / access_token 放到 .env
# ============================================================
BASE_URL = "https://open.douyinec.com"

TOKEN_CACHE_FILE = Config.DATA_DIR / "douyin_token_cache.json"


# ============================================================
# 工具函数
# ============================================================
def _load_token_cache() -> Dict[str, Any]:
    if not TOKEN_CACHE_FILE.exists():
        return {}
    try:
        return json.loads(TOKEN_CACHE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_token_cache(cache: Dict[str, Any]) -> None:
    TOKEN_CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    TOKEN_CACHE_FILE.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


# ============================================================
# 客户端
# ============================================================
class DouyinAllianceClient:
    """
    轻量封装。支持两种 token 获取方式:
    1) 直接在构造函数里传 access_token（比如手动获取后填入 .env）
    2) 传 app_key + app_secret + code 走 OAuth（首次需要人工授权拿到 code）
    """

    def __init__(
        self,
        app_key: Optional[str] = None,
        app_secret: Optional[str] = None,
        access_token: Optional[str] = None,
        base_url: str = BASE_URL,
    ):
        self.app_key = app_key or get_env("DOUYIN_APP_KEY", "")
        self.app_secret = app_secret or get_env("DOUYIN_APP_SECRET", "")
        self._access_token = access_token or get_env("DOUYIN_ACCESS_TOKEN", "")
        self.base_url = base_url.rstrip("/")
        self._session_headers = {"Content-Type": "application/json;charset=UTF-8"}

    # ---------- token ----------
    @property
    def access_token(self) -> str:
        return self._access_token

    def set_access_token(self, token: str) -> None:
        self._access_token = token.strip()

    def get_access_token_by_code(self, code: str, refresh_token: str = "") -> Dict[str, Any]:
        """
        使用授权 code 换取 access_token / refresh_token。
        文档: /oauth/access_token/
        """
        url = f"{self.base_url}/oauth/access_token/"
        params = {
            "code": code,
            "grant_type": "authorization_code",
            "client_id": self.app_key,
            "client_secret": self.app_secret,
        }
        resp = http_get(url, params=params, headers=self._session_headers, timeout=30)
        try:
            data = resp.json()
        except Exception as e:
            logger.error(f"token parse failed: {e}, raw: {resp.text[:300]}")
            return {}
        if data.get("message") != "success" and data.get("access_token") is None:
            logger.error(f"获取 access_token 失败: {data}")
            return data or {}

        token = data.get("access_token", "")
        expires_in = int(data.get("expires_in", 0) or 0)
        self._access_token = token

        _save_token_cache({
            "access_token": token,
            "refresh_token": data.get("refresh_token", "") or refresh_token,
            "expires_at": int(time.time()) + expires_in,
            "got_at": datetime.now().isoformat(),
        })
        logger.success(f"access_token 已获取，过期时间 {expires_in}s")
        return data

    def refresh_access_token(self, refresh_token: Optional[str] = None) -> Dict[str, Any]:
        """
        使用 refresh_token 续期 access_token。
        文档: /oauth/refresh_token/
        """
        refresh_token = refresh_token or _load_token_cache().get("refresh_token") or ""
        if not refresh_token:
            logger.error("没有 refresh_token，无法续期")
            return {}
        url = f"{self.base_url}/oauth/refresh_token/"
        params = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": self.app_key,
            "client_secret": self.app_secret,
        }
        resp = http_get(url, params=params, headers=self._session_headers, timeout=30)
        data = resp.json() if resp.content else {}
        token = data.get("access_token")
        if token:
            self._access_token = token
            _save_token_cache({
                "access_token": token,
                "refresh_token": data.get("refresh_token", refresh_token),
                "expires_at": int(time.time()) + int(data.get("expires_in", 0) or 0),
                "got_at": datetime.now().isoformat(),
            })
            logger.success("access_token 续期成功")
        else:
            logger.error(f"refresh 失败: {data}")
        return data

    # ---------- 通用请求 ----------
    def _request(self, method: str, path: str, body: Optional[Dict[str, Any]] = None,
                 query: Optional[Dict[str, Any]] = None,
                 extra_headers: Optional[Dict[str, str]] = None,
                 timeout: int = 30) -> Dict[str, Any]:
        if not self.access_token:
            raise RuntimeError("缺少 access_token，请先调用 get_access_token_by_code / set_access_token")
        headers = dict(self._session_headers)
        headers["access-token"] = self.access_token
        if extra_headers:
            headers.update(extra_headers)
        url = self.base_url + path

        if method.upper() == "GET":
            resp = http_get(url, params=query, headers=headers, timeout=timeout)
        else:
            resp = http_post(url, params=query, json_body=body, headers=headers, timeout=timeout)

        try:
            return resp.json()
        except Exception as e:
            logger.error(f"parse JSON failed: {e}, text={resp.text[:300]}")
            return {}

    # ---------- 业务接口 ----------
    def search_products(
        self,
        title: str = "",
        search_type: int = 0,           # 0默认 1历史销量 2价格 3佣金金额 4佣金比例
        sort_type: int = 1,             # 0升序 1降序
        page: int = 1,
        page_size: int = 20,
        first_cids: str = "",
        price_min: Optional[float] = None,
        price_max: Optional[float] = None,
        share_status: int = 1,
        tag: int = 0,
    ) -> Dict[str, Any]:
        """
        达人视角搜索精选联盟商品。
        URL: /buyin/kolMaterialsProductsSearch
        """
        body = {
            "title": title,
            "search_type": search_type,
            "sort_type": sort_type,
            "page": page,
            "page_size": page_size,
            "share_status": share_status,
            "tag": tag,
        }
        if first_cids:
            body["first_cids"] = first_cids
        if price_min is not None:
            body["price_min"] = int(price_min * 100)  # 文档：单位是分
        if price_max is not None:
            body["price_max"] = int(price_max * 100)

        logger.info(f"search products: title='{title}', sort={search_type}/{sort_type}, page={page}")
        data = self._request(
            "POST",
            "/buyin/kolMaterialsProductsSearch",
            body=body,
        )

        if data.get("code") not in (0, "0", 200, "200", None):
            logger.warning(f"接口返回非成功: {data}")
        return data

    def get_product_detail(self, product_id: int) -> Dict[str, Any]:
        """商品详情"""
        return self._request(
            "POST",
            "/product/detail",
            body={"product_id": product_id},
        )

    def get_category_tree(self) -> Dict[str, Any]:
        """类目查询"""
        return self._request("POST", "/alliance/materialsProductCategory")


# ============================================================
# 结果归一化：统一成 pipeline_end2end.py 需要的格式
# ============================================================
def normalize_products(raw: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    把 search_products 的返回结果抽取成统一字段的商品列表。
    返回:
      [{title, price_yuan, commission_rate, commission_amount_yuan,
        sales_count, creator_count, rating, main_image_url, detail_url,
        product_id, shop_id, shop_name, raw}]
    """
    products = (
        raw.get("data", {}).get("products")
        or raw.get("data", {}).get("product_list")
        or raw.get("products")
        or []
    )
    out = []
    for p in products:
        p_raw = dict(p)
        # 价格可能是分也可能是元，这里先读原始字段；然后统一成元
        price_fen = p.get("price") or 0
        cos_fee_fen = p.get("cos_fee") or 0
        cos_ratio = p.get("cos_ratio") or 0

        price_yuan = price_fen / 100 if price_fen else 0
        commission_yuan = cos_fee_fen / 100 if cos_fee_fen else 0
        commission_rate = cos_ratio / 10 if cos_ratio else 0

        out.append({
            "product_id": p.get("product_id"),
            "title": p.get("title") or p.get("product_title") or "",
            "price": round(price_yuan, 2),
            "commission_rate": round(commission_rate, 2),
            "commission_amount": round(commission_yuan, 2),
            "sales_count": int(p.get("sales") or p.get("sell_num") or 0),
            "creator_count": int(p.get("kol_count") or p.get("creator_count") or 0),
            "rating": float(p.get("shop_rating") or p.get("rating") or 0),
            "main_image_url": p.get("cover") or p.get("main_image") or "",
            "detail_url": p.get("detail_url") or p.get("promotion_url") or "",
            "shop_id": p.get("shop_id"),
            "shop_name": p.get("shop_name") or "",
            "first_cid": p.get("first_cid"),
            "second_cid": p.get("second_cid"),
            "third_cid": p.get("third_cid"),
            "in_stock": p.get("in_stock"),
            "raw": p_raw,
        })
    return out
