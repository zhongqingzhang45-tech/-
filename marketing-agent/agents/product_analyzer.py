"""
Agent 4: 卖点分析引擎
自动分析商品，生成卖点、痛点、使用场景等

使用 DeepSeek API 进行分析
"""

import os
import json
import re
from typing import Dict, Optional

# DeepSeek API配置
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY', '')
DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'


class ProductAnalyzer:
    """商品分析Agent"""

    def __init__(self, api_key: str = None):
        self.name = "卖点分析引擎"
        self.api_key = api_key or DEEPSEEK_API_KEY
        self.mock_mode = not self.api_key

    def _call_deepseek(self, prompt: str) -> str:
        """调用DeepSeek API"""
        if self.mock_mode:
            return self._mock_analysis(prompt)

        import aiohttp
        import asyncio

        async def _call():
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    DEEPSEEK_API_URL,
                    headers={
                        'Authorization': f'Bearer {self.api_key}',
                        'Content-Type': 'application/json'
                    },
                    json={
                        'model': 'deepseek-chat',
                        'messages': [{'role': 'user', 'content': prompt}],
                        'temperature': 0.7,
                    }
                ) as resp:
                    result = await resp.json()
                    return result['choices'][0]['message']['content']

        return asyncio.run(_call())

    def _mock_analysis(self, prompt: str) -> str:
        """模拟分析结果"""
        # 从prompt中提取商品名称
        title_match = re.search(r'商品名称[:：]\s*(.+?)(?:\n|$)', prompt)
        title = title_match.group(1).strip() if title_match else "该商品"

        return json.dumps({
            '用户痛点': [
                '夏天出门太热，容易中暑',
                '传统风扇风力不够，降温效果差',
                '手持风扇需要一直拿着，手很酸',
                '办公室空调不给力，座位太热'
            ],
            '核心卖点': [
                '解放双手，挂在脖子上就能用',
                '360度环绕出风，覆盖全身',
                '三档风力可调，满足不同需求',
                '超长续航，一整天都不用充电'
            ],
            '使用场景': [
                '户外运动：跑步、徒步、骑行',
                '通勤路上：地铁、公交',
                '办公环境：工位、会议室',
                '户外活动：野餐、露营、带娃'
            ],
            '目标人群': [
                '上班族：办公室制冷需求',
                '学生党：教室、图书馆',
                '户外爱好者：运动时需要降温',
                '宝妈：带娃出门必备'
            ],
            '购买理由': [
                '性价比高：同价位风力最强',
                '颜值在线：简约设计，时尚百搭',
                '口碑好：月销10万+，好评率98%',
                '送礼佳品：包装精美，适合送人'
            ],
            '竞争优势': [
                '比手持风扇更方便，解放双手',
                '比空调扇更便携，随时随地使用',
                '比同类挂脖风扇风力更大、续航更久',
                '价格更具竞争力'
            ],
            '情绪触发点': [
                '🔥 高温焦虑：夏天出门的恐惧',
                '😰 形象焦虑：满头大汗很尴尬',
                '💰 性价比：花小钱办大事',
                '⭐ 从众心理：10万+人都在用'
            ]
        }, ensure_ascii=False, indent=2)

    def analyze_product(self, product: Dict) -> Dict:
        """分析商品"""
        title = product.get('title', '')
        category = product.get('category', '')
        price = product.get('price', 0)
        commission_rate = product.get('commission_rate', 0)

        # 构建分析prompt
        prompt = f"""请分析以下商品，生成营销内容所需的各项要素。

商品名称: {title}
商品分类: {category}
商品价格: ¥{price}
佣金比例: {commission_rate*100}%

请生成以下内容（JSON格式）：
{{
    "用户痛点": ["痛点1", "痛点2", ...],
    "核心卖点": ["卖点1", "卖点2", ...],
    "使用场景": ["场景1", "场景2", ...],
    "目标人群": ["人群1", "人群2", ...],
    "购买理由": ["理由1", "理由2", ...],
    "竞争优势": ["优势1", "优势2", ...],
    "情绪触发点": ["触发点1", "触发点2", ...]
}}

要求：内容要真实、有感染力、符合小红书/抖音平台风格。"""

        try:
            result_str = self._call_deepseek(prompt)
            # 尝试解析JSON
            if '{' in result_str:
                json_start = result_str.find('{')
                json_end = result_str.rfind('}') + 1
                result = json.loads(result_str[json_start:json_end])
            else:
                result = {'error': '解析失败', 'raw': result_str}

            return result
        except Exception as e:
            return {'error': str(e), 'title': title}

    def analyze_and_save(self, product: Dict) -> Dict:
        """分析并保存结果"""
        analysis = self.analyze_product(product)

        result = {
            'product_id': product.get('id'),
            'title': product.get('title'),
            'analysis': analysis
        }

        return result


class TrendMatcher:
    """趋势匹配引擎 - 将热点与商品智能匹配"""

    def __init__(self):
        self.name = "趋势匹配引擎"

    def match(self, products: list, topics: list) -> list:
        """匹配热点商品组合"""
        matches = []

        # 热点关键词 -> 商品关键词映射
        mappings = {
            '高温天气': ['风扇', '空调', '防晒', '冰袖', '凉席'],
            '防晒指南': ['防晒', '冰袖', '遮阳帽', '防晒霜'],
            '空调病预防': ['空调被', '加湿器', '养生'],
            '夏日穿搭': ['防晒衣', '短裤', '裙子', '凉鞋'],
            '驱蚊妙招': ['驱蚊', '蚊香', '驱蚊手环'],
            '上班族副业': ['创业', '兼职', '副业'],
            '轻创业项目': ['创业', '项目', '赚钱'],
            '居家赚钱': ['创业', '兼职', '电商'],
            '懒人减肥': ['代餐', '健身', '瑜伽'],
            '护肤心得': ['护肤', '面膜', '洗面奶'],
            '收纳技巧': ['收纳', '储物', '衣柜'],
            '母婴好物': ['母婴', '婴儿', '湿巾'],
            '早餐吃什么': ['零食', '代餐', '麦片'],
        }

        for topic in topics:
            topic_keyword = topic.get('keyword', '')
            matched_products = []

            for product in products:
                product_title = product.get('title', '')

                # 检查商品是否匹配当前热点
                for h_key, p_keywords in mappings.items():
                    if h_key in topic_keyword:
                        for pk in p_keywords:
                            if pk in product_title:
                                matched_products.append(product)
                                break

            if matched_products:
                matches.append({
                    'topic': topic,
                    'products': matched_products[:3],  # 每个热点最多3个商品
                    'match_count': len(matched_products)
                })

        # 按匹配数量排序
        matches.sort(key=lambda x: x['match_count'], reverse=True)
        return matches[:10]  # 返回Top10匹配


async def run_agent():
    """运行卖点分析Agent"""
    print("[卖点分析引擎] 启动...")

    analyzer = ProductAnalyzer()

    # 模拟商品
    product = {
        'id': 1,
        'title': '挂脖风扇便携式空调制冷小巧风扇',
        'category': '家居用品',
        'price': 89,
        'commission_rate': 0.30
    }

    print(f"[卖点分析引擎] 分析商品: {product['title']}")

    result = analyzer.analyze_and_save(product)

    if 'error' not in result['analysis']:
        print(f"[卖点分析引擎] 分析结果:")
        for key, values in result['analysis'].items():
            print(f"  {key}:")
            for v in values[:3]:
                print(f"    - {v}")
    else:
        print(f"[卖点分析引擎] 分析失败: {result['analysis']}")

    return result


if __name__ == '__main__':
    import asyncio
    asyncio.run(run_agent())
