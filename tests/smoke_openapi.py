"""冒烟测试: OpenAPI 客户端 + 结果归一化
不实际发请求，用伪造响应验证 normalize_products 正确解析字段。
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from agents.scrapers.douyin_openapi import DouyinAllianceClient, normalize_products


def test_normalize():
    """模拟真实 API 返回结构"""
    fake_resp = {
        "code": 0,
        "message": "success",
        "data": {
            "total": 2,
            "products": [
                {
                    "product_id": 10001,
                    "title": "夏季防晒衣女款2024新款冰丝外套",
                    "price": 5990,            # 分
                    "cos_ratio": 200,         # 百分比 * 10 → 20%
                    "cos_fee": 1198,          # 分 → 11.98 元
                    "sales": 15233,
                    "cover": "https://example.com/a.jpg",
                    "detail_url": "https://haohuo.jinritemai.com/views/product/item2?id=10001",
                    "shop_id": 88001,
                    "shop_name": "夏日女装店",
                    "first_cid": 1,
                    "second_cid": 22,
                    "third_cid": 333,
                },
                {
                    "product_id": 10002,
                    "title": "挂脖小风扇USB可充电静音",
                    "price": 2990,
                    "cos_ratio": 250,
                    "cos_fee": 748,
                    "sales": 8802,
                    "cover": "https://example.com/b.jpg",
                    "detail_url": "https://haohuo.jinritemai.com/views/product/item2?id=10002",
                    "shop_id": 88002,
                    "shop_name": "日用数码",
                    "first_cid": 2,
                    "second_cid": 15,
                    "third_cid": 99,
                },
            ],
        },
    }
    items = normalize_products(fake_resp)
    assert len(items) == 2, f"应返回2条，实际 {len(items)}"
    p = items[0]
    assert p["title"] == "夏季防晒衣女款2024新款冰丝外套"
    assert abs(p["price"] - 59.90) < 0.01, f"price = {p['price']}"
    assert abs(p["commission_rate"] - 20.0) < 0.01, f"commission_rate = {p['commission_rate']}"
    assert abs(p["commission_amount"] - 11.98) < 0.01, f"commission_amount = {p['commission_amount']}"
    assert p["sales_count"] == 15233
    assert p["main_image_url"] == "https://example.com/a.jpg"
    assert "raw" in p, "应保留原始数据"
    print("[OK] normalize_products 字段映射正确")
    print(json.dumps(items, ensure_ascii=False, indent=2))


def test_client_initialization():
    c = DouyinAllianceClient(access_token="fake_token_12345")
    assert c.access_token == "fake_token_12345"
    c.set_access_token("new_token")
    assert c.access_token == "new_token"
    print("[OK] DouyinAllianceClient 初始化/token 管理正常")


if __name__ == "__main__":
    test_client_initialization()
    test_normalize()
    print("\n✅ 所有冒烟测试通过")
