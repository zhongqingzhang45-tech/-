"""
Agent 5: 内容工厂
批量生成内容文案

内容类型:
- 图文
- 带货文案
- 口播稿
- 测评稿
- 剧情脚本
- 种草文案
- 对比文案

使用 DeepSeek API
"""

import os
import json
import re
from typing import Dict, List, Optional


class ContentFactory:
    """内容工厂Agent"""

    def __init__(self, api_key: str = None):
        self.name = "内容工厂"
        self.api_key = api_key or os.getenv('DEEPSEEK_API_KEY', '')
        self.mock_mode = not self.api_key

    def _call_deepseek(self, prompt: str) -> str:
        """调用DeepSeek API"""
        if self.mock_mode:
            return self._mock_content(prompt)

        import aiohttp

        async def _call():
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    'https://api.deepseek.com/v1/chat/completions',
                    headers={
                        'Authorization': f'Bearer {self.api_key}',
                        'Content-Type': 'application/json'
                    },
                    json={
                        'model': 'deepseek-chat',
                        'messages': [{'role': 'user', 'content': prompt}],
                        'temperature': 0.8,
                    }
                ) as resp:
                    result = await resp.json()
                    return result['choices'][0]['message']['content']

        import asyncio
        return asyncio.run(_call())

    def _mock_content(self, prompt: str) -> str:
        """模拟生成内容"""
        # 检测内容类型
        content_type = '种草文案'
        if '小红书' in prompt:
            content_type = '小红书种草文案'
        elif '口播' in prompt:
            content_type = '口播脚本'
        elif '测评' in prompt:
            content_type = '测评文案'

        title_templates = [
            "后悔没早点买！{product}真的太绝了",
            "姐妹们！这个{product}我要吹爆它！",
            "OMG！{product}也太好用了吧",
            "{product}真实测评｜用了三个月忍不住分享",
            "被问了100遍的{product}，真的绝绝子",
        ]

        body_templates = [
            """姐妹们！今天必须给你们安利这个{product}🙋‍♀️

作为一个每天都在找好物的girl
这个真的让我惊艳到了✨

✅ 优点1：超级实用，解决日常生活痛点
✅ 优点2：颜值超高，拍照超好看
✅ 优点3：性价比绝了，同价位无敌

而且现在有活动价，直接冲就对了！

🔗 同款链接在评论区
💰 专属优惠码：888

有问题的评论区问我哦～""",

            """真心话时间⏰

用了这个{product}三个月
来说说真实感受👇

【优点】
1. 效果真的明显，用了一周就有变化
2. 质地很舒服，不刺激
3. 包装精美，送礼也超有面子

【缺点】
唯一的缺点就是太火了，经常断货😢

【适合人群】
上班族/学生党/新手妈妈/所有爱美的姐妹

价格方面我觉得很值，毕竟能用很久
而且这次团购价真的很划算！

评论区扣1，私信给你们发优惠～""",
        ]

        import random
        title_template = random.choice(title_templates)
        body_template = random.choice(body_templates)

        # 提取商品名称
        title = "吹爆这个好物！用了再也离不开"
        if '商品名称' in prompt:
            import re
            match = re.search(r'商品名称[:：]\s*(.+?)(?:\n|$)', prompt)
            if match:
                product_name = match.group(1).strip()
                title = title_template.format(product=product_name[:6])

        return json.dumps({
            'title': title,
            'body': body_template.format(product='这款产品'),
            'hashtags': '#好物分享 #种草 #我的护肤日记 #上班族必备 #性价比之王 #今日推荐',
            'cover_keywords': ['商品图', '使用前后对比', '细节特写'],
            'video_script': '开场：姐妹们！\n中间：介绍卖点\n结尾：快去买！',
        }, ensure_ascii=False, indent=2)

    def generate_xiaohongshu(self, product: Dict, analysis: Dict) -> Dict:
        """生成小红书种草文案"""
        title = product.get('title', '')
        selling_points = analysis.get('核心卖点', [])[:3]
        pain_points = analysis.get('用户痛点', [])[:2]
        target_audience = analysis.get('目标人群', [])[:3]

        prompt = f"""你是一个资深小红书写手。请为以下商品生成一篇种草文案。

商品名称: {title}
核心卖点: {', '.join(selling_points)}
目标人群: {', '.join(target_audience)}

要求：
1. 标题要吸引人，有代入感，使用emoji
2. 正文要自然，像真实分享，不要太广告化
3. 开头要有hook，让人想继续看
4. 中间穿插使用场景和真实感受
5. 结尾要有行动号召
6. 适当使用小红书风格的语言

生成JSON格式：
{{
    "title": "标题",
    "body": "正文(带emoji)",
    "hashtags": "#标签1 #标签2 #标签3",
    "cover_text": "封面文字",
    "cover_keywords": ["封面图需要的元素"]
}}"""

        try:
            result_str = self._call_deepseek(prompt)
            if '{' in result_str:
                json_start = result_str.find('{')
                json_end = result_str.rfind('}') + 1
                result = json.loads(result_str[json_start:json_end])
                result['type'] = 'xiaohongshu'
                return result
        except Exception as e:
            pass

        return self._mock_content(prompt)

    def generate_douyin_script(self, product: Dict, analysis: Dict) -> Dict:
        """生成抖音口播脚本"""
        title = product.get('title', '')
        selling_points = analysis.get('核心卖点', [])
        emotion_triggers = analysis.get('情绪触发点', [])

        prompt = f"""你是一个抖音带货达人。请为以下商品生成一个口播带货脚本。

商品名称: {title}
核心卖点: {', '.join(selling_points)}
情绪触发点: {', '.join(emotion_triggers)}

要求：
1. 时长15-30秒，适合短视频
2. 开场3秒要抓住注意力
3. 中间快速展示产品卖点
4. 结尾促单，要有紧迫感
5. 语言口语化，有感染力

生成JSON格式：
{{
    "script": "完整口播文案",
    "key_points": ["要点1", "要点2"],
    "bgm_suggestion": "背景音乐建议",
    "action_shots": ["需要展示的动作1", "动作2"]
}}"""

        try:
            result_str = self._call_deepseek(prompt)
            if '{' in result_str:
                json_start = result_str.find('{')
                json_end = result_str.rfind('}') + 1
                result = json.loads(result_str[json_start:json_end])
                result['type'] = 'douyin'
                return result
        except Exception as e:
            pass

        return {
            'type': 'douyin',
            'script': '开场：姐妹们！今天必须给你们安利这个...\n中间：卖点展示\n结尾：快去下单！限时优惠！',
            'key_points': ['吸引眼球', '展示卖点', '促单'],
        }

    def generate_comparison(self, product: Dict, analysis: Dict) -> Dict:
        """生成对比文案"""
        title = product.get('title', '')
        advantages = analysis.get('竞争优势', [])
        purchase_reasons = analysis.get('购买理由', [])

        prompt = f"""请为以下商品生成一篇对比文案（对比使用前后的效果，或者和同类产品的对比）。

商品名称: {title}
竞争优势: {', '.join(advantages)}
购买理由: {', '.join(purchase_reasons)}

生成JSON格式：
{{
    "title": "对比文案标题",
    "before": "使用前的问题",
    "after": "使用后的改变",
    "highlights": ["亮点1", "亮点2"],
    "conclusion": "总结推荐"
}}"""

        try:
            result_str = self._call_deepseek(prompt)
            if '{' in result_str:
                json_start = result_str.find('{')
                json_end = result_str.rfind('}') + 1
                result = json.loads(result_str[json_start:json_end])
                result['type'] = 'comparison'
                return result
        except Exception as e:
            pass

        return {'type': 'comparison', 'title': '对比文案', 'before': '问题', 'after': '改变'}

    def batch_generate(self, products: List[Dict], analysis_results: List[Dict]) -> List[Dict]:
        """批量生成内容"""
        contents = []

        for i, (product, analysis) in enumerate(zip(products, analysis_results)):
            if 'error' in analysis:
                continue

            # 生成小红书文案
            xhs_content = self.generate_xiaohongshu(product, analysis)
            xhs_content['product_id'] = product.get('id')
            xhs_content['content_type'] = 'xiaohongshu'
            contents.append(xhs_content)

            # 生成抖音脚本
            dy_content = self.generate_douyin_script(product, analysis)
            dy_content['product_id'] = product.get('id')
            dy_content['content_type'] = 'douyin'
            contents.append(dy_content)

            # 生成对比文案
            comp_content = self.generate_comparison(product, analysis)
            comp_content['product_id'] = product.get('id')
            comp_content['content_type'] = 'comparison'
            contents.append(comp_content)

        return contents


async def run_agent():
    """运行内容工厂Agent"""
    print("[内容工厂] 启动...")

    factory = ContentFactory()

    # 模拟商品和分析结果
    product = {
        'id': 1,
        'title': '挂脖风扇便携式空调',
        'price': 89,
    }

    analysis = {
        '核心卖点': ['解放双手', '360度环绕出风', '超长续航'],
        '用户痛点': ['夏天太热', '手持风扇手酸'],
        '目标人群': ['上班族', '学生党', '户外爱好者'],
        '情绪触发点': ['高温焦虑', '性价比'],
        '竞争优势': ['比手持方便', '比空调扇便携'],
        '购买理由': ['月销10万+', '好评率98%'],
    }

    # 生成小红书文案
    print("[内容工厂] 生成小红书文案...")
    xhs = factory.generate_xiaohongshu(product, analysis)
    print(f"  标题: {xhs.get('title', 'N/A')}")
    print(f"  标签: {xhs.get('hashtags', 'N/A')}")

    # 生成抖音脚本
    print("[内容工厂] 生成抖音口播脚本...")
    dy = factory.generate_douyin_script(product, analysis)
    print(f"  脚本: {dy.get('script', 'N/A')[:50]}...")

    # 批量生成
    print("[内容工厂] 批量生成...")
    contents = factory.batch_generate([product], [analysis])
    print(f"  生成内容数: {len(contents)}")

    return contents


if __name__ == '__main__':
    import asyncio
    asyncio.run(run_agent())
