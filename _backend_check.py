import json
import sys
import traceback
from datetime import datetime

import requests

BASE = "http://127.0.0.1:8000"
results = {}
errors = []


def req(method, path, json_body=None, params=None, expect_json=True):
    url = BASE + path
    try:
        r = requests.request(
            method, url, json=json_body, params=params, timeout=30
        )
        out = {
            "status_code": r.status_code,
            "ok": 200 <= r.status_code < 300,
        }
        try:
            out["json"] = r.json() if expect_json and r.content else None
        except Exception:
            out["json"] = None
            out["text"] = r.text[:500]
        return out
    except Exception as e:
        errors.append(f"{method} {path}: {e}")
        return {"status_code": 0, "ok": False, "error": str(e)}


def section(name):
    print(f"\n{'='*60}\n  {name}\n{'='*60}")


def pretty(d, indent=2, max_len=400):
    s = json.dumps(d, ensure_ascii=False, indent=indent)
    if len(s) > max_len:
        s = s[:max_len] + "\n...[截断，共 " + str(len(s)) + " 字符]"
    return s


# ------------------------------------------------------------------
# 步骤1：静态资源 & 核心页面
# ------------------------------------------------------------------
section("步骤1：静态资源 & 核心页面")

r1 = req("GET", "/", expect_json=False)
print(f"GET /  -> {r1['status_code']}")
if r1.get("json") is not None:
    print("  响应类型：JSON（非常规页面）")
    print(pretty(r1["json"]))
elif "text" in r1:
    print("  响应（前500字）：", r1["text"][:200])
elif r1.get("json") is None and r1.get("status_code"):
    # 可能已经是 html，需要用 text 方式再抓一次
    rr = requests.get(BASE + "/", timeout=15)
    text = rr.text
    has_dashboard = "Dashboard" in text or "爆品中心" in text or "dashboard" in text
    print(f"  页面长度：{len(text)} 字节 | 含关键字(Dashboard/爆品中心)={has_dashboard}")
    print("  片段：", text[:180].replace("\n", " "))

r2 = req("GET", "/health")
print(f"GET /health -> {r2['status_code']}")
print(pretty(r2.get("json") or r2))

r3 = req("GET", "/api/docs", expect_json=False)
print(f"GET /api/docs -> {r3['status_code']}")

results["static_pages"] = r1["ok"] and r2["ok"]

# ------------------------------------------------------------------
# 步骤2：Dashboard 数据
# ------------------------------------------------------------------
section("步骤2：Dashboard 数据")

stats = req("GET", "/api/stats")
print(f"GET /api/stats -> {stats['status_code']}")
print(pretty(stats.get("json")))

agents = req("GET", "/api/agents")
print(f"GET /api/agents -> {agents['status_code']}")
a_json = agents.get("json")
if a_json:
    if isinstance(a_json, dict) and "agents" in a_json:
        print(f"  agent数={len(a_json['agents'])}")
        print(pretty(a_json["agents"][:2]))
    elif isinstance(a_json, list):
        print(f"  agent数={len(a_json)}")
        print(pretty(a_json[:2]))
    else:
        print(pretty(a_json))

tasks = req("GET", "/api/tasks")
print(f"GET /api/tasks -> {tasks['status_code']}")
print(pretty(tasks.get("json")))

rankings = req("GET", "/api/rankings")
print(f"GET /api/rankings -> {rankings['status_code']}")
rk_json = rankings.get("json")
if rk_json:
    keys = list(rk_json.keys())
    print("  keys:", keys)
    for k in keys[:3]:
        v = rk_json[k]
        print(f"  [{k}] -> {pretty(v)[:120]}")

results["dashboard"] = all([stats["ok"], agents["ok"], tasks["ok"], rankings["ok"]])

# ------------------------------------------------------------------
# 步骤3：爆品中心
# ------------------------------------------------------------------
section("步骤3：爆品中心")

products = req("GET", "/api/products", params={"page": 1, "page_size": 10})
print(f"GET /api/products -> {products['status_code']}")
p_json = products.get("json")
if p_json:
    items = p_json.get("items") or p_json.get("products") or (
        p_json if isinstance(p_json, list) else []
    )
    print(f"  items数={len(items)}")
    if items:
        print(pretty(items[0]))

p1 = req("GET", "/api/products/1")
print(f"GET /api/products/1 -> {p1['status_code']}")
p1_json = p1.get("json")
if p1_json:
    keys = list(p1_json.keys())
    print("  keys:", keys)
    for k in keys:
        v = p1_json[k]
        snippet = pretty(v)[:120]
        print(f"  [{k}] -> {snippet}")

results["products"] = products["ok"] and p1["ok"]

# ------------------------------------------------------------------
# 步骤4：热点中心
# ------------------------------------------------------------------
section("步骤4：热点中心")

hot = req("GET", "/api/hot_topics", params={"limit": 10})
print(f"GET /api/hot_topics -> {hot['status_code']}")
h_json = hot.get("json")
if h_json:
    items = h_json.get("items") or h_json.get("hot_topics") or (
        h_json if isinstance(h_json, list) else []
    )
    print(f"  热点数={len(items)}")
    for item in items[:3]:
        print("  ", pretty(item)[:160])

results["hot_topics"] = hot["ok"]

# ------------------------------------------------------------------
# 步骤5：内容工厂
# ------------------------------------------------------------------
section("步骤5：内容工厂")

gen_c = req(
    "POST",
    "/api/actions/generate_content",
    json_body={
        "product_id": 1,
        "content_type": "种草",
        "title": "夏季防晒衣轻薄外套",
    },
)
print(f"POST /api/actions/generate_content -> {gen_c['status_code']}")
print(pretty(gen_c.get("json")))

contents = req("GET", "/api/contents")
print(f"GET /api/contents -> {contents['status_code']}")
print(pretty(contents.get("json")))

results["content_factory"] = gen_c["ok"]

# ------------------------------------------------------------------
# 步骤6：视频工厂
# ------------------------------------------------------------------
section("步骤6：视频工厂")

gen_v = req(
    "POST",
    "/api/actions/generate_video",
    json_body={"product_id": 1, "template": "口播带货", "duration": 10},
    timeout=120,
) if False else None
# 改用普通 req（无timeout参数兼容）
gen_v = None
try:
    rr = requests.post(
        BASE + "/api/actions/generate_video",
        json={"product_id": 1, "template": "口播带货", "duration": 10},
        timeout=180,
    )
    gen_v = {"status_code": rr.status_code, "ok": 200 <= rr.status_code < 300}
    try:
        gen_v["json"] = rr.json() if rr.content else None
    except Exception:
        gen_v["json"] = None
        gen_v["text"] = rr.text[:500]
except Exception as e:
    errors.append(f"POST generate_video: {e}")
    gen_v = {"status_code": 0, "ok": False, "error": str(e)}

print(f"POST /api/actions/generate_video -> {gen_v['status_code']}")
print(pretty(gen_v.get("json") or gen_v))

# 再次检查商品详情确保有图片
p1b = req("GET", "/api/products/1")
print(f"GET /api/products/1(再次) -> {p1b['status_code']}")
jb = p1b.get("json") or {}
images = jb.get("images") if isinstance(jb, dict) else []
print(f"  images数={len(images) if isinstance(images, list) else 'N/A'}")

results["video_factory"] = gen_v["ok"]

# ------------------------------------------------------------------
# 步骤7：发布中心
# ------------------------------------------------------------------
section("步骤7：发布中心")

pub = req("GET", "/api/publish_records")
print(f"GET /api/publish_records -> {pub['status_code']}")
print(pretty(pub.get("json")))

results["publish"] = pub["ok"]

# ------------------------------------------------------------------
# 步骤8：账号中心
# ------------------------------------------------------------------
section("步骤8：账号中心")

accs = req("GET", "/api/accounts")
print(f"GET /api/accounts -> {accs['status_code']}")
print(pretty(accs.get("json")))

new_acc = req(
    "POST",
    "/api/accounts",
    json_body={
        "platform": "douyin",
        "account_name": "抖音测试号",
        "cookie_string": "sessionid=test",
        "username": "test_user",
    },
)
print(f"POST /api/accounts -> {new_acc['status_code']}")
print(pretty(new_acc.get("json")))

new_id = None
nj = new_acc.get("json") or {}
if isinstance(nj, dict):
    for k in ("id", "account_id", "ID"):
        if k in nj:
            new_id = nj[k]
            break
    if not new_id and "data" in nj and isinstance(nj["data"], dict):
        new_id = nj["data"].get("id")

deleted_ok = False
if new_id:
    del_r = req("DELETE", f"/api/accounts/{new_id}")
    print(f"DELETE /api/accounts/{new_id} -> {del_r['status_code']}")
    print(pretty(del_r.get("json")))
    deleted_ok = del_r["ok"]
else:
    print("  未获取新账号 ID，跳过 DELETE")

results["accounts"] = accs["ok"] and new_acc["ok"]

# ------------------------------------------------------------------
# 步骤9：系统设置 & 配置
# ------------------------------------------------------------------
section("步骤9：系统设置 & 配置")

cfg = req("GET", "/api/config")
print(f"GET /api/config -> {cfg['status_code']}")
cjson = cfg.get("json")
if cjson:
    keys = list(cjson.keys())
    print("  keys:", keys)
    print(pretty(cjson))

cfg_post = req("POST", "/api/config", json_body={"key": "test", "value": "value1"})
print(f"POST /api/config -> {cfg_post['status_code']}")
print(pretty(cfg_post.get("json")))

results["config"] = cfg["ok"] and cfg_post["ok"]

# ------------------------------------------------------------------
# 步骤10：冒烟测试触发
# ------------------------------------------------------------------
section("步骤10：冒烟测试触发")

smoke = None
try:
    rr = requests.post(BASE + "/api/actions/run_smoke_test", json={}, timeout=300)
    smoke = {"status_code": rr.status_code, "ok": 200 <= rr.status_code < 300}
    try:
        smoke["json"] = rr.json() if rr.content else None
    except Exception:
        smoke["json"] = None
        smoke["text"] = rr.text[:500]
except Exception as e:
    errors.append(f"POST run_smoke_test: {e}")
    smoke = {"status_code": 0, "ok": False, "error": str(e)}

print(f"POST /api/actions/run_smoke_test -> {smoke['status_code']}")
print(pretty(smoke.get("json") or smoke))

results["smoke_test"] = smoke["ok"]

# ------------------------------------------------------------------
# 汇总
# ------------------------------------------------------------------
section("汇总")

module_map = [
    ("静态页面", "static_pages"),
    ("Dashboard", "dashboard"),
    ("爆品中心", "products"),
    ("热点中心", "hot_topics"),
    ("内容工厂", "content_factory"),
    ("视频工厂", "video_factory"),
    ("发布中心", "publish"),
    ("账号中心", "accounts"),
    ("系统设置", "config"),
    ("冒烟测试", "smoke_test"),
]

pass_count = 0
issue_items = []
for name, key in module_map:
    ok = results.get(key, False)
    mark = "✅" if ok else "❌"
    print(f"  {mark} {name}")
    if ok:
        pass_count += 1
    else:
        issue_items.append(name)

print(f"\n通过模块：{pass_count}/{len(module_map)}")
print(f"异常模块：{issue_items if issue_items else '无'}")
if errors:
    print(f"\n连接/超时等错误 ({len(errors)} 条)：")
    for e in errors[:10]:
        print(" -", e)

print("\n[DONE]", datetime.now().isoformat(timespec="seconds"))
