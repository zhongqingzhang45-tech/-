"""
V3.0 API 服务
Flask API for 爆品发现 + 内容工厂 + 矩阵带货系统
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, jsonify, request
from flask_cors import CORS
import asyncio
from datetime import datetime

from database.models import (
    init_db, ProductService, ContentService, PublishService, AccountService
)
from agents.product_radar import HotProductAgent, ProductRanker
from agents.topic_radar import HotTopicAgent
from agents.product_analyzer import ProductAnalyzer
from agents.content_factory import ContentFactory

app = Flask(__name__)
CORS(app)

# 初始化数据库
init_db()

# 全局Agent实例
product_agent = HotProductAgent()
topic_agent = HotTopicAgent()
analyzer = ProductAnalyzer()
content_factory = ContentFactory()


@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'service': 'LifeOS V3.0 Marketing Agent'})


# ==================== 爆品接口 ====================

@app.route('/api/products/top')
def get_top_products():
    """获取Top爆品"""
    platform = request.args.get('platform')
    limit = int(request.args.get('limit', 20))

    products = product_agent.get_top_products(limit)
    if platform:
        products = [p for p in products if p['platform'] == platform]

    return jsonify({'success': True, 'data': products})


@app.route('/api/products/search')
def search_products():
    """搜索商品"""
    keyword = request.args.get('keyword', '')
    products = product_agent.search_products(keyword)
    return jsonify({'success': True, 'data': products})


@app.route('/api/products/stats')
def get_product_stats():
    """获取爆品统计"""
    stats = product_agent.get_platform_stats()
    total = len(product_agent.mock_products)
    return jsonify({
        'success': True,
        'data': {
            'total': total,
            'platforms': stats
        }
    })


# ==================== 热点接口 ====================

@app.route('/api/topics')
def get_topics():
    """获取热点列表"""
    platform = request.args.get('platform')
    topics = topic_agent.fetch_all_topics()
    if platform:
        topics = [t for t in topics if platform in t.get('platforms', [])]
    return jsonify({'success': True, 'data': topics})


@app.route('/api/topics/match')
def match_topics_products():
    """匹配热点与商品"""
    products = product_agent.get_top_products(50)
    topics = topic_agent.fetch_all_topics()[:20]
    matches = topic_agent.match_with_products(products, topics)
    return jsonify({'success': True, 'data': matches})


# ==================== 内容接口 ====================

@app.route('/api/contents')
def get_contents():
    """获取内容列表"""
    status = request.args.get('status')
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))

    contents = ContentService.get_list(status=status, limit=limit, offset=offset)
    stats = ContentService.get_stats()

    return jsonify({
        'success': True,
        'data': {
            'list': contents,
            'stats': stats
        }
    })


@app.route('/api/contents/generate', methods=['POST'])
def generate_content():
    """生成内容"""
    data = request.get_json()
    product_id = data.get('product_id')

    # 获取商品
    product = None
    if product_id:
        product = ProductService.get_by_id(product_id)
        if not product:
            return jsonify({'success': False, 'error': '商品不存在'}), 400
    else:
        # 使用最新爆品
        products = product_agent.get_top_products(1)
        if products:
            product = products[0]

    if not product:
        return jsonify({'success': False, 'error': '没有可用的商品'}), 400

    # 分析商品
    analysis = analyzer.analyze_product(product)

    # 生成内容
    contents = []

    # 小红书文案
    xhs = content_factory.generate_xiaohongshu(product, analysis)
    xhs['content_type'] = 'xiaohongshu'
    xhs['product_id'] = product.get('id')
    content_id = ContentService.create(xhs)
    xhs['id'] = content_id
    contents.append(xhs)

    # 抖音脚本
    dy = content_factory.generate_douyin_script(product, analysis)
    dy['content_type'] = 'douyin'
    dy['product_id'] = product.get('id')
    content_id = ContentService.create(dy)
    dy['id'] = content_id
    contents.append(dy)

    return jsonify({'success': True, 'data': contents})


@app.route('/api/contents/<int:content_id>')
def get_content(content_id):
    """获取内容详情"""
    content = ContentService.get_by_id(content_id)
    if not content:
        return jsonify({'success': False, 'error': '内容不存在'}), 404
    return jsonify({'success': True, 'data': content})


@app.route('/api/contents/<int:content_id>', methods=['PUT'])
def update_content(content_id):
    """更新内容"""
    data = request.get_json()

    conn = __import__('database.models', fromlist=['get_db']).get_db()
    fields = []
    values = []

    for key in ['title', 'body', 'hashtags', 'status', 'cover_image', 'video_script', 'voiceover']:
        if key in data:
            fields.append(f'{key}=?')
            values.append(data[key])

    if fields:
        values.append(content_id)
        conn.execute(f'UPDATE contents SET {", ".join(fields)} WHERE id=?', values)
        conn.commit()
    conn.close()

    content = ContentService.get_by_id(content_id)
    return jsonify({'success': True, 'data': content})


# ==================== 发布接口 ====================

@app.route('/api/publish')
def get_publish_records():
    """获取发布记录"""
    limit = int(request.args.get('limit', 50))
    records = PublishService.get_list(limit=limit)
    stats = PublishService.get_stats()

    return jsonify({
        'success': True,
        'data': {
            'list': records,
            'stats': stats
        }
    })


@app.route('/api/accounts')
def get_accounts():
    """获取账号列表"""
    platform = request.args.get('platform')
    accounts = AccountService.get_list(platform=platform)
    return jsonify({'success': True, 'data': accounts})


@app.route('/api/accounts', methods=['POST'])
def add_account():
    """添加账号"""
    data = request.get_json()
    account_id = AccountService.add(data)
    return jsonify({'success': True, 'data': {'id': account_id}})


@app.route('/api/publish/publish', methods=['POST'])
def publish_content():
    """发布内容到平台"""
    data = request.get_json()
    content_id = data.get('content_id')
    platform = data.get('platform')
    account_id = data.get('account_id')

    content = ContentService.get_by_id(content_id)
    if not content:
        return jsonify({'success': False, 'error': '内容不存在'}), 400

    # 模拟发布
    import random
    success = random.random() > 0.2

    if success:
        record_id = PublishService.create({
            'content_id': content_id,
            'account_id': account_id,
            'platform': platform,
            'status': 'published',
            'published_at': datetime.now().isoformat()
        })

        # 模拟数据
        PublishService.update_stats(record_id, {
            'views': random.randint(100, 10000),
            'likes': random.randint(10, 500),
            'comments': random.randint(0, 50),
            'favorites': random.randint(5, 200),
            'shares': random.randint(0, 30),
            'clicks': random.randint(20, 1000),
            'orders': random.randint(0, 10),
            'gmv': random.randint(0, 5000),
            'commission': random.randint(0, 500),
        })

        return jsonify({
            'success': True,
            'data': {
                'record_id': record_id,
                'status': 'published',
                'message': '发布成功'
            }
        })
    else:
        return jsonify({
            'success': False,
            'error': '发布失败，请稍后重试'
        }), 500


# ==================== 统计接口 ====================

@app.route('/api/dashboard/stats')
def get_dashboard_stats():
    """获取仪表盘统计"""
    content_stats = ContentService.get_stats()
    publish_stats = PublishService.get_stats()
    product_stats = product_agent.get_platform_stats()

    return jsonify({
        'success': True,
        'data': {
            'products': {
                'total': len(product_agent.mock_products),
                'platforms': product_stats
            },
            'contents': content_stats,
            'publish': publish_stats,
            'commission_rate': 0.35,  # 模拟转化率
        }
    })


if __name__ == '__main__':
    print("[V3.0 API] 启动服务...")
    app.run(host='0.0.0.0', port=3002, debug=True)
