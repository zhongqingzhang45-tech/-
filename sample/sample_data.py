"""
示例/演示数据模块

由于真实电商平台的网页结构反爬非常复杂（需要 JS 渲染、登录态、频繁变更），
为了让工具在"开箱即用"的状态下依然可以演示完整流程，我们提供：
  1. 一个可离线运行的示例数据集（包含主流商品的模拟数据）
  2. 真实请求失败时自动回退到示例数据的 fallback 机制
"""

SAMPLE_DATASETS = {
    "iPhone 15": [
        {
            "platform": "京东",
            "title": "Apple iPhone 15 (A3092) 256GB 粉色",
            "price": 5999.0,
            "sales": 125830,
            "shop_rating": 4.92,
            "shop_name": "Apple 产品京东自营旗舰店",
            "url": "https://item.jd.com/100067218522.html",
        },
        {
            "platform": "京东",
            "title": "Apple iPhone 15 128GB 黑色",
            "price": 5199.0,
            "sales": 98210,
            "shop_rating": 4.91,
            "shop_name": "Apple 产品京东自营旗舰店",
            "url": "https://item.jd.com/100067218520.html",
        },
        {
            "platform": "淘宝",
            "title": "【24期免息】Apple/苹果 iPhone 15 手机官方",
            "price": 5299.0,
            "sales": 86420,
            "shop_rating": 4.88,
            "shop_name": "Apple Store 官方旗舰店",
            "url": "https://detail.tmall.com/item.htm?id=753981234567",
        },
        {
            "platform": "淘宝",
            "title": "Apple iPhone 15 256GB 国行全新未激活",
            "price": 5799.0,
            "sales": 32180,
            "shop_rating": 4.83,
            "shop_name": "数码优选专营店",
            "url": "https://item.taobao.com/item.htm?id=753981998812",
        },
        {
            "platform": "拼多多",
            "title": "【百亿补贴】Apple iPhone 15 128GB 全新正品",
            "price": 4799.0,
            "sales": 156720,
            "shop_rating": 4.75,
            "shop_name": "拼多多百亿补贴数码",
            "url": "https://mobile.yangkeduo.com/goods.html?goods_id=123456789",
        },
        {
            "platform": "拼多多",
            "title": "Apple iPhone 15 256GB 官方标配",
            "price": 5399.0,
            "sales": 78340,
            "shop_rating": 4.72,
            "shop_name": "数码通讯官方店",
            "url": "https://mobile.yangkeduo.com/goods.html?goods_id=123456999",
        },
    ],
    "小米 14": [
        {
            "platform": "京东",
            "title": "小米14 徕卡光学镜头 光影猎人900 16+512GB 黑色",
            "price": 4299.0,
            "sales": 89320,
            "shop_rating": 4.89,
            "shop_name": "小米京东自营旗舰店",
            "url": "https://item.jd.com/100078123456.html",
        },
        {
            "platform": "京东",
            "title": "小米14 8+256GB 白色",
            "price": 3699.0,
            "sales": 67180,
            "shop_rating": 4.88,
            "shop_name": "小米京东自营旗舰店",
            "url": "https://item.jd.com/100078123450.html",
        },
        {
            "platform": "淘宝",
            "title": "【官方正品】Xiaomi 小米14 徕卡影像 5G手机",
            "price": 3799.0,
            "sales": 54210,
            "shop_rating": 4.85,
            "shop_name": "小米官方旗舰店",
            "url": "https://detail.tmall.com/item.htm?id=755512345678",
        },
        {
            "platform": "淘宝",
            "title": "小米14 16+1TB 黑色 限量套装",
            "price": 4599.0,
            "sales": 23150,
            "shop_rating": 4.81,
            "shop_name": "小米官方旗舰店",
            "url": "https://detail.tmall.com/item.htm?id=755512999999",
        },
        {
            "platform": "拼多多",
            "title": "【百亿补贴】小米14 徕卡影像 8+256GB 正品",
            "price": 3499.0,
            "sales": 112450,
            "shop_rating": 4.78,
            "shop_name": "小米品牌授权店",
            "url": "https://mobile.yangkeduo.com/goods.html?goods_id=234567890",
        },
        {
            "platform": "拼多多",
            "title": "小米14 Pro 16+512GB 全新未拆",
            "price": 4299.0,
            "sales": 41280,
            "shop_rating": 4.73,
            "shop_name": "数码严选专营店",
            "url": "https://mobile.yangkeduo.com/goods.html?goods_id=234567900",
        },
    ],
}


DEFAULT_KEYWORDS = list(SAMPLE_DATASETS.keys())


def get_sample(keyword: str):
    """按关键词获取示例数据。找不到近似匹配时返回默认数据集。"""
    if keyword in SAMPLE_DATASETS:
        return [dict(item) for item in SAMPLE_DATASETS[keyword]]
    # 简单模糊匹配
    for key, items in SAMPLE_DATASETS.items():
        if key.split()[0] in keyword or keyword in key:
            return [dict(item) for item in items]
    # 默认返回第一条数据集并做轻微扰动
    first = next(iter(SAMPLE_DATASETS.values()))
    return [dict(item, price=round(item["price"] * 1.02, 2)) for item in first]
