from flask import Flask, send_from_directory, request, jsonify
import os, json, random, datetime

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web", "static")
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)

def get_mock_products():
    cats = ["数码", "美妆", "服饰", "家居", "户外", "图书"]
    return [dict(id=i, name="商品"+str(i), price=round(random.uniform(29.9, 999.9), 2), sales=random.randint(100, 5000), commission=round(random.uniform(5, 99), 2), category=random.choice(cats), hot_score=round(random.uniform(0, 100), 1)) for i in range(1, 51)]

def get_mock_hot_topics():
    topics = ["夏季防晒攻略", "618好物推荐", "iPhone最新动态", "夏日穿搭", "家居收纳技巧", "健身减脂餐", "母婴用品清单", "数码产品测评", "护肤心得", "好书推荐"]
    plats = ["抖音", "小红书", "微博", "知乎"]
    return [dict(id=i+1, keyword=topics[i], heat=random.randint(10000, 99999), trend=random.choice(["上升", "稳定", "下降"]), platform=random.choice(plats)) for i in range(len(topics))]

def create_app():
    app = Flask(__name__, static_folder=STATIC_DIR, static_url_path="/static")

    @app.route("/")
    def index():
        return send_from_directory(STATIC_DIR, "index.html")

    @app.route("/api/stats")
    def api_stats():
        products = get_mock_products()
        topics = get_mock_hot_topics()
        return jsonify(dict(products=len(products), topics=len(topics), total_sales=sum(p["sales"] for p in products), total_commission=round(sum(p["commission"] * p["sales"] * 0.1 for p in products), generated_content=random.randint(500, 2000), accounts=3, tasks=[dict(id=1, status="running", name="爆款扫描"), dict(id=2, status="idle", name="内容生成"), dict(id=3, status="idle", name="视频合成"), dict(id=4, status="pending", name="矩阵发布")], top_products=sorted(products, key=lambda x: x["sales"], reverse=True)[:10], top_topics=sorted(topics, key=lambda x: x["heat"], reverse=True)[:5]))

    @app.route("/api/products")
    def api_products():
        return jsonify(dict(items=get_mock_products(), total=50))

    @app.route("/api/hot_topics")
    def api_topics():
        return jsonify(dict(items=get_mock_hot_topics(), total=10))

    @app.route("/api/accounts")
    def api_accounts():
        return jsonify(dict(items=[dict(id=1, platform="抖音", name="营销号A", fans=random.randint(1000, 50000), status="active", last_publish="2024-06-09"), dict(id=2, platform="小红书", name="好物推荐菌", fans=random.randint(1000, 50000), status="active", last_publish="2024-06-08"), dict(id=3, platform="视频号", name="生活分享", fans=random.randint(1000, 50000), status="active", last_publish="2024-06-07")], total=3))

    @app.route("/api/actions/generate_content", methods=["POST"])
    def api_generate():
        d = request.get_json() or {}
        pid = d.get("product_id")
        ctype = d.get("content_type", "种草文")
        products = get_mock_products()
        p = next((x for x in products if str(x["id"]) == str(pid)), products[0])
        tpl_content = {"种草文": p["name"] + "效果惊艳！价格：" + str(p["price"]) + "元，销量：" + str(p["sales"]) + "单，佣金：" + str(p["commission"]) + "元。姐妹们冲！", "测评文": "[深度测评]" + p["name"] + "，综合评分：" + str(random.randint(85, 98)) + "/100，价格：" + str(p["price"]) + "元。", "短文案": p["name"] + "|" + str(p["price"]) + "元|已售" + str(p["sales"]) + "单"}
        return jsonify(dict(success=True, title=p["name"] + "|" + ctype, content=tpl_content.get(ctype, tpl_content["种草文"]), tags=["#好物推荐", "#" + p["category"], "#购物分享"], cta="点击链接购买，开启你的变美之旅！", product_id=p["id"], type=ctype, created_at=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")))

    @app.route("/api/actions/generate_video", methods=["POST"])
    def api_video():
        d = request.get_json() or {}
        return jsonify(dict(success=True, video_url="/static/demo.mp4", thumbnail="/static/thumb.jpg", duration=random.randint(15, 60), template=d.get("template", "口播带货"), product_id=d.get("product_id", 1), task_id=random.randint(1000, 9999)))

    @app.route("/api/actions/publish", methods=["POST"])
    def api_publish():
        d = request.get_json() or {}
        return jsonify(dict(success=True, task_id=random.randint(1000, 9999), platform=d.get("platform", "抖音"), scheduled_at=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), status="published"))

    @app.route("/api/config", methods=["GET", "POST"])
    def api_config():
        cfg_path = os.path.join(DATA_DIR, "config.json")
        if request.method == "POST":
            try:
                with open(cfg_path, "w", encoding="utf-8") as f:
                    json.dump(request.get_json() or {}, f, ensure_ascii=False, indent=2)
            except Exception:
                pass
            return jsonify(dict(success=True))
        try:
            with open(cfg_path, "r", encoding="utf-8") as f:
                return jsonify(json.load(f))
        except Exception:
            return jsonify(dict(model=dict(provider="local", name="本地模型", api_key="", temperature=0.7), proxy=dict(enabled=False, http_proxy="", https_proxy=""), database=dict(type="sqlite", path="data/data.db"), task=dict(auto_scan=True, auto_generate=False, auto_publish=False, concurrency=3), notification=dict(enabled=False, email=""), logging=dict(level="INFO", directory="logs")))
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=8000, debug=True)
