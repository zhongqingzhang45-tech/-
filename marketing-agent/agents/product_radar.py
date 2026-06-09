"""
Agent 1: 爆品雷达
自动发现高潜力商品

数据源:
- 抖音精选联盟
- 京东联盟
- 淘宝联盟
- 拼多多联盟

计算爆品指数 = 销量*0.3 + 增长率*0.3 + 佣金率*0.2 + 评分*0.2
"""

import asyncio
import aiohttp
import json
import re
import time
from typing import List, Dict, Optional
from datetime import datetime


class HotProductAgent:
    """爆品发现Agent"""

    def __init__(self):
        self.name = "爆品雷达"
        self.platforms = {
            'douyin': '抖音精选联盟',
            'jingdong': '京东联盟',
            'taobao': '淘宝联盟',
            'pinduoduo': '拼多多联盟',
        }
        # 模拟爆品数据（实际应对接联盟API）
        self.mock_products = self._generate_mock_products()

    def _generate_mock_products(self) -> List[Dict]:
        """生成模拟爆品数据"""
        categories = ['家居用品', '美妆护肤', '服饰内衣', '食品饮料', '数码电器', '母婴用品']
        products = []

        base_products = [
            {'title': '挂脖风扇便携式空调', 'price': 89, 'commission_rate': 0.30, 'category': '家居用品'},
            {'title': '防晒衣女冰丝薄款', 'price': 129, 'commission_rate': 0.35, 'category': '服饰内衣'},
            {'title': '驱蚊手环户外防蚊', 'price': 39, 'commission_rate': 0.40, 'category': '家居用品'},
            {'title': '空调毯沙发毯加厚', 'price': 79, 'commission_rate': 0.25, 'category': '家居用品'},
            {'title': '面膜补水保湿美白', 'price': 69, 'commission_rate': 0.45, 'category': '美妆护肤'},
            {'title': '零食大礼包整箱送人', 'price': 99, 'commission_rate': 0.20, 'category': '食品饮料'},
            {'title': '无线蓝牙耳机降噪', 'price': 199, 'commission_rate': 0.25, 'category': '数码电器'},
            {'title': '婴儿湿巾手口专用', 'price': 49, 'commission_rate': 0.35, 'category': '母婴用品'},
            {'title': '洗衣液留香持久', 'price': 59, 'commission_rate': 0.30, 'category': '家居用品'},
            {'title': '体脂秤智能电子秤', 'price': 79, 'commission_rate': 0.28, 'category': '数码电器'},
        ]

        platforms = ['douyin', 'jingdong', 'taobao', 'pinduoduo']

        for i, base in enumerate(base_products):
            for platform in platforms:
                # 添加一些变化让数据更真实
                price_var = base['price'] * (0.9 + (i % 3) * 0.1)
                sales_base = 5000 + (10 - i) * 2000 + (i % 5) * 500
                sales_increase = 10 + (i % 8) * 5

                product = {
                    'platform': platform,
                    'product_id': f'{platform}_{10000 + i}_{platform}',
                    'title': base['title'],
                    'price': round(price_var, 2),
                    'commission_rate': base['commission_rate'],
                    'commission_amount': round(price_var * base['commission_rate'], 2),
                    'sales_count': sales_base,
                    'sales_increase': sales_increase,
                    'rating': 4.5 + (i % 5) * 0.1,
                    'category': base['category'],
                    'image_url': f'https://picsum.photos/seed/{platform}{i}/400/400',
                    'detail_url': f'https://example.com/product/{platform}_{10000 + i}',
                    'rank_score': 0,
                }

                # 计算爆品指数
                product['rank_score'] = self._calculate_rank_score(product)
                products.append(product)

        # 按爆品指数排序
        products.sort(key=lambda x: x['rank_score'], reverse=True)
        return products

    def _calculate_rank_score(self, product: Dict) -> float:
        """计算爆品指数"""
        # 归一化各指标到0-100
        sales_score = min(product['sales_count'] / 500, 100) * 0.3
        growth_score = min(product['sales_increase'] / 50, 100) * 0.3
        commission_score = product['commission_rate'] * 100 * 0.2
        rating_score = (product['rating'] / 5) * 100 * 0.2
        return round(sales_score + growth_score + commission_score + rating_score, 2)

    async def fetch_platform_products(self, platform: str, keyword: str = None) -> List[Dict]:
        """抓取单个平台商品"""
        await asyncio.sleep(0.1)  # 模拟网络延迟

        products = []
        for p in self.mock_products:
            if p['platform'] == platform:
                if keyword is None or keyword in p['title']:
                    products.append(p.copy())

        return products

    async def fetch_all_products(self) -> List[Dict]:
        """抓取所有平台商品"""
        tasks = [self.fetch_platform_products(platform) for platform in self.platforms.keys()]
        results = await asyncio.gather(*tasks)

        all_products = []
        for platform_products in results:
            all_products.extend(platform_products)

        # 按爆品指数排序
        all_products.sort(key=lambda x: x['rank_score'], reverse=True)
        return all_products

    def get_top_products(self, limit: int = 10) -> List[Dict]:
        """获取Top爆品"""
        return self.mock_products[:limit]

    def get_products_by_platform(self, platform: str, limit: int = 20) -> List[Dict]:
        """获取指定平台爆品"""
        products = [p for p in self.mock_products if p['platform'] == platform]
        return products[:limit]

    def search_products(self, keyword: str) -> List[Dict]:
        """搜索商品"""
        keyword_lower = keyword.lower()
        results = []
        for p in self.mock_products:
            if keyword_lower in p['title'].lower() or keyword_lower in p['category'].lower():
                results.append(p)
        return results[:20]

    def get_platform_stats(self) -> Dict:
        """获取各平台商品数量"""
        stats = {}
        for platform in self.platforms.keys():
            stats[platform] = len([p for p in self.mock_products if p['platform'] == platform])
        return stats


class ProductRanker:
    """商品排名器 - 基于多维度计算爆品指数"""

    @staticmethod
    def rank_products(products: List[Dict]) -> List[Dict]:
        """对商品进行排名"""
        if not products:
            return []

        # 归一化因子
        max_sales = max(p.get('sales_count', 0) for p in products) or 1
        max_increase = max(p.get('sales_increase', 0) for p in products) or 1
        max_commission = max(p.get('commission_rate', 0) for p in products) or 1

        for p in products:
            # 综合爆品指数 = 销量分*0.3 + 增长分*0.3 + 佣金分*0.2 + 评分分*0.2
            sales_score = (p.get('sales_count', 0) / max_sales) * 100 * 0.3
            growth_score = (p.get('sales_increase', 0) / max_increase) * 100 * 0.3
            commission_score = (p.get('commission_rate', 0) / max_commission) * 100 * 0.2
            rating_score = (p.get('rating', 4.5) / 5) * 100 * 0.2

            p['rank_score'] = round(sales_score + growth_score + commission_score + rating_score, 2)

        return sorted(products, key=lambda x: x['rank_score'], reverse=True)


async def run_agent():
    """运行爆品雷达Agent"""
    print("[爆品雷达] 启动...")

    agent = HotProductAgent()

    # 获取各平台统计
    stats = agent.get_platform_stats()
    print(f"[爆品雷达] 各平台商品数量: {stats}")

    # 获取Top10爆品
    top10 = agent.get_top_products(10)
    print(f"[爆品雷达] Top10爆品:")
    for i, p in enumerate(top10, 1):
        print(f"  {i}. {p['title']} | 销量:{p['sales_count']} | 增长率:{p['sales_increase']}% | 佣金:{p['commission_rate']*100}% | 指数:{p['rank_score']}")

    return top10


if __name__ == '__main__':
    asyncio.run(run_agent())
