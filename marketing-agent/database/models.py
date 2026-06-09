"""
V3.0 数据库模型
爆品发现 + 内容工厂 + 矩阵带货系统
"""

import sqlite3
import os
from datetime import datetime
from typing import Optional, List, Dict, Any

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'marketing_v3.db')


def get_db():
    """获取数据库连接"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """初始化数据库表"""
    conn = get_db()
    cursor = conn.cursor()

    # 爆品池
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            platform TEXT NOT NULL,
            product_id TEXT NOT NULL,
            title TEXT NOT NULL,
            price REAL,
            commission_rate REAL,
            commission_amount REAL,
            sales_count INTEGER,
            sales_increase INTEGER,
            rating REAL,
            category TEXT,
            image_url TEXT,
            detail_url TEXT,
            tags TEXT,
            rank_score REAL DEFAULT 0,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(platform, product_id)
        )
    ''')

    # 热点库
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS hot_topics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            platform TEXT NOT NULL,
            keyword TEXT NOT NULL,
           热度指数 REAL,
            增长趋势 REAL,
            category TEXT,
            related_products TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 商品分析
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS product_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            pain_points TEXT,
            selling_points TEXT,
            use_scenes TEXT,
            target_audience TEXT,
            purchase_reasons TEXT,
            advantages TEXT,
            emotion_triggers TEXT,
            generated_content TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    ''')

    # 内容库
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS contents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            topic_id INTEGER,
            content_type TEXT NOT NULL,
            title TEXT,
            body TEXT NOT NULL,
            hashtags TEXT,
            cover_image TEXT,
            video_script TEXT,
            voiceover TEXT,
            status TEXT DEFAULT 'draft',
            platform TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (topic_id) REFERENCES hot_topics(id)
        )
    ''')

    # 账号库
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            platform TEXT NOT NULL,
            account_name TEXT NOT NULL,
            account_id TEXT,
            cookies TEXT,
            status TEXT DEFAULT 'active',
            followers INTEGER DEFAULT 0,
            today_publish_count INTEGER DEFAULT 0,
            total_publish_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 发布记录
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS publish_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content_id INTEGER,
            account_id INTEGER,
            platform TEXT NOT NULL,
            platform_url TEXT,
            status TEXT DEFAULT 'pending',
            views INTEGER DEFAULT 0,
            likes INTEGER DEFAULT 0,
            comments INTEGER DEFAULT 0,
            favorites INTEGER DEFAULT 0,
            shares INTEGER DEFAULT 0,
            clicks INTEGER DEFAULT 0,
            orders INTEGER DEFAULT 0,
            gmv REAL DEFAULT 0,
            commission REAL DEFAULT 0,
            published_at DATETIME,
            fetched_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (content_id) REFERENCES contents(id),
            FOREIGN KEY (account_id) REFERENCES accounts(id)
        )
    ''')

    # 配置表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 索引
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_products_rank ON products(rank_score DESC)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_publish_status ON publish_records(status)')

    conn.commit()
    conn.close()
    print(f"[DB] Database initialized at {DB_PATH}")


def row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    """Row转字典"""
    if row is None:
        return {}
    return dict(row)


def rows_to_list(rows: List[sqlite3.Row]) -> List[Dict[str, Any]]:
    """Rows转列表"""
    return [row_to_dict(row) for row in rows]


class ProductService:
    """爆品服务"""

    @staticmethod
    def add_or_update(product: Dict) -> int:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO products (platform, product_id, title, price, commission_rate,
                commission_amount, sales_count, sales_increase, rating, category, image_url, detail_url, rank_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(platform, product_id) DO UPDATE SET
                title=excluded.title, price=excluded.price, commission_rate=excluded.commission_rate,
                commission_amount=excluded.commission_amount, sales_count=excluded.sales_count,
                sales_increase=excluded.sales_increase, rating=excluded.rating, rank_score=excluded.rank_score,
                updated_at=CURRENT_TIMESTAMP
        ''', (
            product.get('platform'), product.get('product_id'), product.get('title'),
            product.get('price'), product.get('commission_rate'), product.get('commission_amount'),
            product.get('sales_count'), product.get('sales_increase'), product.get('rating'),
            product.get('category'), product.get('image_url'), product.get('detail_url'),
            product.get('rank_score', 0)
        ))
        conn.commit()
        product_id = cursor.lastrowid or cursor.execute(
            'SELECT id FROM products WHERE platform=? AND product_id=?',
            (product.get('platform'), product.get('product_id'))
        ).fetchone()['id']
        conn.close()
        return product_id

    @staticmethod
    def get_top_products(limit: int = 50, platform: str = None) -> List[Dict]:
        conn = get_db()
        cursor = conn.cursor()
        query = 'SELECT * FROM products WHERE status != "published" ORDER BY rank_score DESC LIMIT ?'
        params = [limit]
        if platform:
            query = 'SELECT * FROM products WHERE platform=? AND status != "published" ORDER BY rank_score DESC LIMIT ?'
            params = [platform, limit]
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        return rows_to_list(rows)

    @staticmethod
    def get_by_id(product_id: int) -> Optional[Dict]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM products WHERE id=?', (product_id,))
        row = cursor.fetchone()
        conn.close()
        return row_to_dict(row) if row else None

    @staticmethod
    def update_status(product_id: int, status: str):
        conn = get_db()
        conn.execute('UPDATE products SET status=? WHERE id=?', (status, product_id))
        conn.commit()
        conn.close()


class ContentService:
    """内容服务"""

    @staticmethod
    def create(content: Dict) -> int:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO contents (product_id, topic_id, content_type, title, body, hashtags, cover_image, video_script, voiceover, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            content.get('product_id'), content.get('topic_id'), content.get('content_type'),
            content.get('title'), content.get('body'), content.get('hashtags'),
            content.get('cover_image'), content.get('video_script'), content.get('voiceover'),
            content.get('status', 'draft')
        ))
        conn.commit()
        content_id = cursor.lastrowid
        conn.close()
        return content_id

    @staticmethod
    def get_by_id(content_id: int) -> Optional[Dict]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT c.*, p.title as product_title, p.image_url as product_image
            FROM contents c
            LEFT JOIN products p ON c.product_id = p.id
            WHERE c.id=?
        ''', (content_id,))
        row = cursor.fetchone()
        conn.close()
        return row_to_dict(row) if row else None

    @staticmethod
    def get_list(status: str = None, limit: int = 50, offset: int = 0) -> List[Dict]:
        conn = get_db()
        cursor = conn.cursor()
        query = 'SELECT c.*, p.title as product_title FROM contents c LEFT JOIN products p ON c.product_id = p.id'
        params = []
        if status:
            query += ' WHERE c.status=?'
            params.append(status)
        query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?'
        params.extend([limit, offset])
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        return rows_to_list(rows)

    @staticmethod
    def update_status(content_id: int, status: str):
        conn = get_db()
        conn.execute('UPDATE contents SET status=? WHERE id=?', (status, content_id))
        conn.commit()
        conn.close()

    @staticmethod
    def get_stats() -> Dict:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) as total FROM contents')
        total = cursor.fetchone()['total']
        cursor.execute('SELECT COUNT(*) as total FROM contents WHERE status="published"')
        published = cursor.fetchone()['total']
        conn.close()
        return {'total': total, 'published': published, 'draft': total - published}


class PublishService:
    """发布服务"""

    @staticmethod
    def create(record: Dict) -> int:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO publish_records (content_id, account_id, platform, status, published_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            record.get('content_id'), record.get('account_id'), record.get('platform'),
            record.get('status', 'pending'), record.get('published_at')
        ))
        conn.commit()
        record_id = cursor.lastrowid
        conn.close()
        return record_id

    @staticmethod
    def update_stats(record_id: int, stats: Dict):
        conn = get_db()
        conn.execute('''
            UPDATE publish_records SET views=?, likes=?, comments=?, favorites=?, shares=?, clicks=?, orders=?, gmv=?, commission=?
            WHERE id=?
        ''', (
            stats.get('views', 0), stats.get('likes', 0), stats.get('comments', 0),
            stats.get('favorites', 0), stats.get('shares', 0), stats.get('clicks', 0),
            stats.get('orders', 0), stats.get('gmv', 0), stats.get('commission', 0),
            record_id
        ))
        conn.commit()
        conn.close()

    @staticmethod
    def get_list(limit: int = 50) -> List[Dict]:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT pr.*, c.title as content_title, a.account_name
            FROM publish_records pr
            LEFT JOIN contents c ON pr.content_id = c.id
            LEFT JOIN accounts a ON pr.account_id = a.id
            ORDER BY pr.created_at DESC LIMIT ?
        ''', (limit,))
        rows = cursor.fetchall()
        conn.close()
        return rows_to_list(rows)

    @staticmethod
    def get_stats() -> Dict:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT SUM(views) as total_views, SUM(commission) as total_commission, SUM(gmv) as total_gmv FROM publish_records')
        row = cursor.fetchone()
        cursor.execute('SELECT COUNT(*) as total FROM publish_records WHERE status="published"')
        published_count = cursor.fetchone()['total']
        cursor.execute('SELECT COUNT(*) as today FROM publish_records WHERE date(created_at)=date("now")')
        today_count = cursor.fetchone()['today']
        conn.close()
        return {
            'total_views': row['total_views'] or 0,
            'total_commission': row['total_commission'] or 0,
            'total_gmv': row['total_gmv'] or 0,
            'published_count': published_count,
            'today_count': today_count
        }


class AccountService:
    """账号服务"""

    @staticmethod
    def add(account: Dict) -> int:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO accounts (platform, account_name, account_id, cookies, status, followers)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            account.get('platform'), account.get('account_name'), account.get('account_id'),
            account.get('cookies'), account.get('status', 'active'), account.get('followers', 0)
        ))
        conn.commit()
        account_id = cursor.lastrowid
        conn.close()
        return account_id

    @staticmethod
    def get_list(platform: str = None, status: str = 'active') -> List[Dict]:
        conn = get_db()
        cursor = conn.cursor()
        query = 'SELECT * FROM accounts WHERE status=?'
        params = [status]
        if platform:
            query += ' AND platform=?'
            params.append(platform)
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        return rows_to_list(rows)


# 初始化
init_db()
