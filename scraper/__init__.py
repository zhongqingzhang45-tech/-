"""采集器包：统一调度京东/淘宝/拼多多的商品采集流程。"""

from .base import BaseScraper
from .jd import JDScraper
from .taobao import TaobaoScraper
from .pdd import PddScraper

__all__ = ["BaseScraper", "JDScraper", "TaobaoScraper", "PddScraper"]


def run_all_scrapers(keyword: str, use_sample_fallback: bool = True):
    """顺序执行所有平台采集器，并自动做回退处理。"""
    scrapers = [JDScraper(), TaobaoScraper(), PddScraper()]
    all_items = []
    for scraper in scrapers:
        items = scraper.search(keyword, use_sample_fallback=use_sample_fallback)
        all_items.extend(items)
    return all_items
