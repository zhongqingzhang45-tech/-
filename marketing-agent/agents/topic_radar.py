"""
Agent 2: 热点雷达
发现热点趋势

数据源:
- 抖音热榜
- 微博热搜
- 百度热搜
- 微信指数
- 小红书热榜
"""


class HotTopicAgent:
    """热点发现Agent"""

    def __init__(self):
        self.name = "热点雷达"
        self.platforms = {
            'douyin': '抖音热榜',
            'weibo': '微博热搜',
            'baidu': '百度热搜',
            'weixin': '微信指数',
            'xiaohongshu': '小红书热榜',
        }
        # 模拟热点数据
        self.mock_topics = self._generate_mock_topics()

    def _generate_mock_topics(self):
        """生成模拟热点数据"""
        topics = []

        base_topics = [
            # 季节性热点
            {'keyword': '高温天气', 'platforms': ['douyin', 'baidu', 'weixin'], 'category': '天气'},
            {'keyword': '防晒指南', 'platforms': ['douyin', 'xiaohongshu', 'weibo'], 'category': '生活'},
            {'keyword': '空调病预防', 'platforms': ['baidu', 'weixin'], 'category': '健康'},
            {'keyword': '夏日穿搭', 'platforms': ['xiaohongshu', 'weibo', 'douyin'], 'category': '时尚'},
            {'keyword': '驱蚊妙招', 'platforms': ['douyin', 'baidu'], 'category': '生活'},

            # 社会热点
            {'keyword': '上班族副业', 'platforms': ['weibo', 'douyin', 'xiaohongshu'], 'category': '职场'},
            {'keyword': '轻创业项目', 'platforms': ['weibo', 'douyin', 'weixin'], 'category': '创业'},
            {'keyword': '居家赚钱', 'platforms': ['xiaohongshu', 'douyin', 'weibo'], 'category': '创业'},
            {'keyword': '数字游民', 'platforms': ['weibo', 'xiaohongshu'], 'category': '生活'},

            # 日常热点
            {'keyword': '早餐吃什么', 'platforms': ['xiaohongshu', 'douyin', 'weibo'], 'category': '美食'},
            {'keyword': '懒人减肥', 'platforms': ['douyin', 'xiaohongshu', 'weibo'], 'category': '健康'},
            {'keyword': '护肤心得', 'platforms': ['xiaohongshu', 'douyin', 'weibo'], 'category': '美妆'},
            {'keyword': '收纳技巧', 'platforms': ['xiaohongshu', 'douyin'], 'category': '家居'},
            {'keyword': '母婴好物', 'platforms': ['xiaohongshu', 'douyin', 'weixin'], 'category': '母婴'},
        ]

        for i, base in enumerate(base_topics):
            for platform in base['platforms']:
                topic = {
                    'platform': platform,
                    'keyword': base['keyword'],
                    '热度指数': round(5000 + (len(base['platforms']) * 1000) - (i * 300) + (i % 3) * 200, 0),
                    '增长趋势': round(5 + (len(base['platforms']) * 10) - (i % 5) * 2, 1),
                    'category': base['category'],
                    'status': 'pending',
                }
                topics.append(topic)

        return topics

    def fetch_platform_topics(self, platform: str) -> list:
        """抓取单个平台热点"""
        topics = [t.copy() for t in self.mock_topics if t['platform'] == platform]
        topics.sort(key=lambda x: x['热度指数'], reverse=True)
        return topics

    def fetch_all_topics(self) -> list:
        """抓取所有平台热点"""
        all_topics = []
        for platform in self.platforms.keys():
            all_topics.extend(self.fetch_platform_topics(platform))

        # 去重，按热度排序
        seen = set()
        unique_topics = []
        for t in sorted(all_topics, key=lambda x: x['热度指数'], reverse=True):
            if t['keyword'] not in seen:
                seen.add(t['keyword'])
                t['platforms'] = [t['platform']]
                unique_topics.append(t)
            else:
                for ut in unique_topics:
                    if ut['keyword'] == t['keyword']:
                        ut['platforms'].append(t['platform'])
                        break

        return unique_topics

    def match_with_products(self, products: list, topics: list) -> list:
        """匹配热点与商品"""
        matches = []

        # 关键词映射
        product_keywords = {
            '风扇': ['高温天气', '防晒指南', '驱蚊妙招'],
            '防晒': ['高温天气', '防晒指南', '夏日穿搭'],
            '空调': ['高温天气', '空调病预防'],
            '护肤': ['护肤心得'],
            '母婴': ['母婴好物'],
            '收纳': ['收纳技巧'],
            '美食': ['早餐吃什么'],
            '减肥': ['懒人减肥'],
            '创业': ['上班族副业', '轻创业项目', '居家赚钱'],
        }

        for product in products:
            product_title = product.get('title', '')
            matched_topics = []

            for p_keyword, t_keywords in product_keywords.items():
                if p_keyword in product_title:
                    for topic in topics:
                        if topic['keyword'] in t_keywords:
                            matched_topics.append(topic)

            if matched_topics:
                matches.append({
                    'product': product,
                    'topics': matched_topics,
                    'match_score': len(matched_topics) * 20 + min(product.get('rank_score', 0), 50)
                })

        # 按匹配度排序
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        return matches[:10]

    def get_topic_stats(self) -> dict:
        """获取热点统计"""
        stats = {}
        for platform, name in self.platforms.items():
            count = len([t for t in self.mock_topics if t['platform'] == platform])
            stats[platform] = {'name': name, 'count': count}
        return stats


async def run_agent():
    """运行热点雷达Agent"""
    print("[热点雷达] 启动...")

    agent = HotTopicAgent()

    # 获取统计
    stats = agent.get_topic_stats()
    print(f"[热点雷达] 各平台热点数量: {stats}")

    # 获取所有热点
    topics = agent.fetch_all_topics()
    print(f"[热点雷达] 合并后热点数量: {len(topics)}")

    # 显示Top10热点
    print(f"[热点雷达] Top10热点:")
    for i, t in enumerate(topics[:10], 1):
        print(f"  {i}. {t['keyword']} | 热度:{t['热度指数']} | 增长:{t['增长趋势']}% | 平台:{t['platforms']}")

    return topics


if __name__ == '__main__':
    import asyncio
    asyncio.run(run_agent())
