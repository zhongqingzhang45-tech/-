"""统一 HTTP 客户端封装"""
from typing import Any, Optional, Dict
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from loguru import logger

from config import Config
from utils.common import random_sleep


_default_headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept-Language": "zh-CN,zh;q=0.9",
}


def build_session(retries: int = 3, backoff: float = 1.0) -> requests.Session:
    session = requests.Session()
    retry = Retry(
        total=retries,
        backoff_factor=backoff,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "OPTIONS", "POST", "PUT"],
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=10, pool_maxsize=20)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    session.headers.update(_default_headers)
    return session


def http_get(
    url: str,
    params: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None,
    timeout: int = 30,
    session: Optional[requests.Session] = None,
    use_proxy: bool = False,
    **kwargs,
) -> requests.Response:
    sess = session or build_session()
    proxies = Config.proxies() if use_proxy else None
    extra_headers = dict(headers or {})
    resp = sess.get(url, params=params, headers=extra_headers, timeout=timeout,
                    proxies=proxies, **kwargs)
    return resp


def http_post(
    url: str,
    data: Any = None,
    json_body: Any = None,
    headers: Optional[Dict[str, str]] = None,
    timeout: int = 30,
    session: Optional[requests.Session] = None,
    use_proxy: bool = False,
    **kwargs,
) -> requests.Response:
    sess = session or build_session()
    proxies = Config.proxies() if use_proxy else None
    resp = sess.post(url, data=data, json=json_body, headers=headers,
                     timeout=timeout, proxies=proxies, **kwargs)
    return resp


def download_file(url: str, save_path: Any, overwrite: bool = False,
                  timeout: int = 60, use_proxy: bool = False) -> bool:
    from pathlib import Path
    p = Path(save_path)
    if p.exists() and not overwrite:
        return True
    p.parent.mkdir(parents=True, exist_ok=True)
    try:
        resp = http_get(url, stream=True, timeout=timeout, use_proxy=use_proxy)
        resp.raise_for_status()
        with open(p, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        return True
    except Exception as e:
        logger.warning(f"Download failed: {url} -> {save_path}: {e}")
        return False
