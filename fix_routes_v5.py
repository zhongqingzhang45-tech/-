#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""修复 routes.py - 使用 chr() 避开 emoji 编码问题"""
import sys
from pathlib import Path

# 定义常用符号（通过 chr() 动态生成，避开 Python 字符串字面量编码问题）
EMOJI_SPARKLES = chr(0x2728)         # ✨
EMOJI_GLOWING_STAR = chr(0x1F31F)    # 🌟
EMOJI_PACKAGE = chr(0x1F4E6)         # 📦
EMOJI_MAG = chr(0x1F52C)             # 🔬
EMOJI_CHART = chr(0x1F4CA)           # 📊
EMOJI_MONEY = chr(0x1F4B0)           # 💰
EMOJI_STAR = chr(0x2B50)              # ⭐
EMOJI_CHECK = chr(0x2705)             # ✅
EMOJI_TROPHY = chr(0x1F3C6)          # 🏆
EMOJI_MEGAPHONE = chr(0x1F4E2)        # 📢
EMOJI_CART = chr(0x1F6D2)             # 🛒
EMOJI_SPEECH = chr(0x1F4AC)           # 💬
EMOJI_UP = chr(0x2B06) + chr(0xFE0F)  # ⬆️
EMOJI_ONE = chr(0x0031) + chr(0xFE0F) + chr(0x20E3)  # 1️⃣
EMOJI_TWO = chr(0x0032) + chr(0xFE0F) + chr(0x20E3)  # 2️⃣
EMOJI_THREE = chr(0x0033) + chr(0xFE0F) + chr(0x20E3) # 3️⃣
RMB = chr(0x00A5)                     # ¥
LSQB = chr(0x3010)                    # 【
RSQB = chr(0x3011)                    # 】
LPAREN_S = chr(0xFF08)                # （
RPAREN_S = chr(0xFF09)                # ）
EMDASH = chr(0x2014)                  # —
NL = chr(10)
DQ = chr(34)

CG_HEADER = """class ContentGenerator:
    _TAG_SETS = {
        "image_text": ["#好物推荐", "#种草笔记", "#品质生活", "#今日推荐"],
        "script": ["#短视频脚本", "#口播", "#好物推荐"],
        "review": ["#深度测评", "#好物测评", "#品质推荐"],
        "plot": ["#剧情植入", "#短剧", "#好物推荐"],
        "compare": ["#对比测评", "#选购指南", "#性价比"],
    }

    @classmethod
    def _join(cls, parts):
        return chr(10).join(parts)
"""

CG_BODY_METHODS = """
    @classmethod
    def _t_image_text(cls, title, price):
        return cls._join([
            SPARKLES + " " + title + "｜姐妹们真的不能错过！",
            "",
            GLOWING_STAR + " 为什么推荐它？",
            ONE + " 真的超级好用！用完立刻回购",
            TWO + " 成分安全温和，敏感肌也完全 OK",
            THREE + " 性价比超高，学生党也能轻松入手",
            "",
            MONEY + " 使用小技巧：每次取适量，轻轻拍打至完全吸收，坚持一个月状态肉眼可见的变好！",
            "",
            CHART + " 使用 28 天后的真实感受：水润度提升，细腻度变好，整体气色明显改善",
            "",
            "姐妹们！真的强烈安利给每一位看到这篇笔记的宝宝~ 早买早享受！" + SPARKLES,
        ])

    @classmethod
    def _t_script(cls, title, price):
        q = chr(34)
        return cls._join([
            LSQB + "开场 3s 抓眼球" + RSQB,
            q + "姐妹们！这个真的是我今年用到最惊艳的东西，没有之一！" + q,
            "",
            LSQB + "产品展示" + RSQB,
            "- 镜头对准 " + title,
            "- 展示核心功能和效果",
            "- 对比使用前后",
            "",
            LSQB + "核心卖点" + RSQB,
            CHECK + " 效果看得见",
            CHECK + " 价格很亲民 " + RMB + str(price),
            CHECK + " 大牌同厂",
            CHECK + " 售后有保障",
            "",
            LSQB + "转化引导" + RSQB,
            q + "真的，我已经回购 3 次了！现在点左下角小黄车，还有限时折扣！" + q,
            "",
            q + "关注我，每天分享真实好用的平价好物~" + q,
        ])

    @classmethod
    def _t_review(cls, title, price):
        return cls._join([
            LSQB + title + " | 30 天深度测评" + RSQB,
            "",
            PACKAGE + " 开箱体验：包装非常精致，开箱有仪式感，送礼也很合适",
            "",
            MAG + " 成分分析：核心成分优质原料，含量充足，无香精酒精防腐剂",
            "",
            CHART + " 使用效果：第 7 天吸收很快，第 14 天明显改善，第 21 天惊喜，第 30 天彻底爱上",
            "",
            MONEY + " 性价比：价格 " + RMB + str(price) + "，折算每天不到几块钱",
            "",
            STAR + " 综合评分：4.8 / 5.0，推荐给追求品质的你",
        ])

    @classmethod
    def _t_compare(cls, title, price):
        return cls._join([
            LSQB + title + " vs 同类产品 | 深度对比测评" + RSQB,
            "",
            "A 款：大牌经典款 " + RMB + "899",
            "B 款：网红爆款 " + RMB + "599",
            "C 款：今日主角 " + RMB + str(price),
            "",
            CHECK + " 成分安全：A " + STAR*4 + " | B " + STAR*4 + " | C " + STAR*5,
            CHECK + " 使用感受：A 略油腻 | B 吸收一般 | C 清爽秒吸收",
            CHECK + " 效果表现：A 1 个月见效 | B 不明显 | C 2 周肉眼可见",
            "",
            TROPHY + " 总结：综合评分 C > A > B，追求性价比闭眼入 C！",
        ])

    @classmethod
    def _t_plot(cls, title, price):
        return cls._join([
            LSQB + "场景一：办公室" + RSQB,
            LPAREN_S + "小美一脸疲惫地对着电脑" + RPAREN_S,
            "",
            "小美：唉，最近加班太多，状态都变差了...",
            "同事小丽：" + LPAREN_S + "凑近" + RPAREN_S + " 怎么啦？看起来状态不太好耶",
            "小美：天天熬夜，试了好多方法都没用",
            "同事小丽：" + LPAREN_S + "神秘一笑" + RPAREN_S + " 早说呀！给你推荐我一直在用的神器",
            "小美：什么呀？",
            "同事小丽：当当当当！就是这个" + EMDASH + EMDASH + title + "！",
            LPAREN_S + "特写产品" + RPAREN_S,
            "同事小丽：我用了 2 个月，你看我现在是不是多了？",
            "小美：真的啊！你整个人气色都不一样！",
            "同事小丽：成分很温和，效果真的看得见",
            "小美：那我也赶紧去买！在哪里下单？",
            "同事小丽：点左下角小黄车就可以啦！现在还有限时优惠~",
            "",
            LSQB + "结尾" + RSQB + "二人相视一笑，镜头切产品特写 + 购买链接",
            "字幕：遇见它，是今年最美丽的意外 " + SPARKLES,
        ])

    @classmethod
    def generate(cls, product, content_type, extra_prompt=""):
        title = getattr(product, "title", None) or getattr(product, "name", "精选商品")
        price = getattr(product, "price", None) or "299"
        aliases = {
            "image_text": "image_text", "copywriting": "image_text", "种草": "image_text",
            "script": "script", "口播": "script",
            "review": "review", "测评": "review",
            "plot_script": "plot", "剧情": "plot",
            "compare": "compare", "对比": "compare",
        }
        key = aliases.get(content_type, "image_text")
        if key == "image_text":
            body = cls._t_image_text(title, price)
        elif key == "script":
            body = cls._t_script(title, price)
        elif key == "review":
            body = cls._t_review(title, price)
        elif key == "compare":
            body = cls._t_compare(title, price)
        elif key == "plot":
            body = cls._t_plot(title, price)
        else:
            body = cls._t_image_text(title, price)
        title_out = SPARKLES + " " + title
        tags = cls._TAG_SETS.get(key, ["#好物推荐"])
        call_to_action = SPEECH + " 评论区告诉我你的看法，抽 3 位宝宝送小样~"
        cart_text = CART + " 点击左下角小黄车下单 " + title + "，限时优惠 " + RMB + str(price) + "！"
        return {"title": title_out, "body": body, "tags": tags, "call_to_action": call_to_action, "cart_text": cart_text}
"""

# 将常量映射嵌入类内（更优雅）
CG_FULL = (
    "# 通过 chr() 生成符号以避开某些 Python 版本的代理对编码问题\n"
    "SPARKLES = chr(0x2728)\n"
    "GLOWING_STAR = chr(0x1F31F)\n"
    "PACKAGE = chr(0x1F4E6)\n"
    "MAG = chr(0x1F52C)\n"
    "CHART = chr(0x1F4CA)\n"
    "MONEY = chr(0x1F4B0)\n"
    "STAR = chr(0x2B50)\n"
    "CHECK = chr(0x2705)\n"
    "TROPHY = chr(0x1F3C6)\n"
    "SPEECH = chr(0x1F4AC)\n"
    "CART = chr(0x1F6D2)\n"
    "ONE = chr(0x0031) + chr(0xFE0F) + chr(0x20E3)\n"
    "TWO = chr(0x0032) + chr(0xFE0F) + chr(0x20E3)\n"
    "THREE = chr(0x0033) + chr(0xFE0F) + chr(0x20E3)\n"
    "RMB = chr(0x00A5)\n"
    "LSQB = chr(0x3010)\n"
    "RSQB = chr(0x3011)\n"
    "LPAREN_S = chr(0xFF08)\n"
    "RPAREN_S = chr(0xFF09)\n"
    "EMDASH = chr(0x2014)\n"
    "\n"
    + CG_HEADER
    + CG_BODY_METHODS
)

# gc_content: 带本地兜底的 generate_content_action
GC_DECORATOR = '@api_router.post("/api/actions/generate_content")'
GC_BODY = """
def generate_content_action(body: dict):
    try:
        product_id = body.get("product_id")
        content_type = body.get("content_type", "image_text")
        extra_prompt = body.get("prompt", "") or ""
        if not product_id:
            raise HTTPException(status_code=400, detail={"error": "缺少 product_id"})
        with get_db() as db:
            product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail={"error": "商品 #" + str(product_id) + " 不存在"})
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        content_obj = None
        used_local_fallback = False
        llm_error = None
        try:
            from agents.content_factory import ContentFactory
            factory = ContentFactory()
            if content_type in ("image_text", "copywriting", "种草"):
                content_obj = factory.generate_xhs_post(product)
            elif content_type in ("script", "口播"):
                result = factory.generate_video_script(product)
                if result:
                    with get_db() as db2:
                        content_obj = db2.query(Content).filter(Content.id == result["content_id"]).first()
            elif content_type in ("review", "测评"):
                content_obj = factory.generate_review(product)
            elif content_type in ("剧情", "plot_script"):
                content_obj = factory.generate_story_script(product)
            elif content_type in ("对比", "compare"):
                content_obj = factory.generate_compare(product)
            else:
                content_obj = factory.generate_xhs_post(product)
        except Exception as _e_llm:
            llm_error = str(_e_llm)
            content_obj = None
        local_result = None
        if not content_obj:
            used_local_fallback = True
            local_result = ContentGenerator.generate(product, content_type, extra_prompt)
            try:
                with get_db() as db3:
                    _tags_val = local_result["tags"]
                    _tags_str = ",".join(_tags_val) if isinstance(_tags_val, list) else str(_tags_val)
                    new_c = Content(product_id=product_id, title=local_result["title"], body=local_result["body"], platform="xhs", content_type=content_type, tags=_tags_str)
                    db3.add(new_c); db3.commit(); db3.refresh(new_c)
                    content_obj = new_c
            except Exception:
                content_obj = None
        if content_obj:
            _tags = getattr(content_obj, "tags", None)
            if isinstance(_tags, str):
                _tags_out = [t for t in _tags.split(",") if t]
            elif isinstance(_tags, list):
                _tags_out = _tags
            else:
                _tags_out = local_result["tags"] if used_local_fallback and local_result else ["#推荐"]
            return {
                "success": True,
                "used_local_fallback": used_local_fallback,
                "llm_error": llm_error,
                "content": {
                    "id": getattr(content_obj, "id", None),
                    "title": getattr(content_obj, "title", None) or (local_result["title"] if used_local_fallback and local_result else ""),
                    "body": getattr(content_obj, "body", None) or (local_result["body"] if used_local_fallback and local_result else ""),
                    "platform": getattr(content_obj, "platform", "xhs"),
                    "content_type": getattr(content_obj, "content_type", content_type),
                    "tags": _tags_out,
                    "call_to_action": local_result.get("call_to_action") if used_local_fallback and local_result else None,
                    "cart_text": local_result.get("cart_text") if used_local_fallback and local_result else None,
                },
            }
        else:
            used_local_fallback = True
            local_result = ContentGenerator.generate(product, content_type, extra_prompt)
            return {
                "success": True,
                "used_local_fallback": used_local_fallback,
                "llm_error": llm_error,
                "content": {
                    "id": None, "title": local_result["title"], "body": local_result["body"],
                    "platform": "xhs", "content_type": content_type, "tags": local_result["tags"],
                    "call_to_action": local_result["call_to_action"], "cart_text": local_result["cart_text"],
                },
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("generate_content_action failed: " + str(e))
        raise HTTPException(status_code=500, detail={"error": str(e)})
"""

# gv_content: generate_video_action
GV_DECORATOR = '@api_router.post("/api/actions/generate_video")'
GV_BODY = """
def generate_video_action(body: dict):
    import shutil
    try:
        product_id = body.get("product_id")
        template = body.get("template", "slideshow")
        duration = int(body.get("duration", 8))
        if not product_id:
            raise HTTPException(status_code=400, detail={"error": "缺少 product_id"})
        with get_db() as db:
            product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail={"error": "商品 #" + str(product_id) + " 不存在"})
        title = product.title or ("商品 #" + str(product_id))
        img_dir = Path(Config.IMAGE_DIR) / ("product_" + str(product_id))
        img_dir.mkdir(parents=True, exist_ok=True)
        existing = []
        for suffix in ("*.jpg", "*.jpeg", "*.png"):
            existing.extend(sorted(img_dir.glob(suffix)))
        existing = existing[:3]
        if len(existing) < 3:
            try:
                from PIL import Image, ImageDraw, ImageFont
                for idx in range(3):
                    path = img_dir / ("img_" + str(idx) + ".jpg")
                    if path.exists() and path in existing:
                        continue
                    img = Image.new("RGB", (640, 360), (40 + idx * 40, 80 + idx * 30, 140 + idx * 20))
                    draw = ImageDraw.Draw(img)
                    text = title + " - Scene " + str(idx + 1)
                    try:
                        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
                    except Exception:
                        font = ImageFont.load_default()
                    draw.text((20, 160), text, fill=(255, 255, 255), font=font)
                    img.save(path, "JPEG", quality=90)
                    existing.append(path)
            except Exception:
                for idx in range(3):
                    path = img_dir / ("img_" + str(idx) + ".jpg")
                    with open(path, "wb") as _fh:
                        _fh.write(bytes.fromhex("ffd8ffe000104a46494600010101006000600000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffc00011080001000101011100ffc40014000100000000000000000000000000000000000000ffc400141001000000000000000000000000000000000000000000ffda000c03010002110311003f00f9c000ffd9"))
                    existing.append(path)
        if hasattr(Config, "VIDEO_DIR"):
            video_dir = Path(Config.VIDEO_DIR) / ("product_" + str(product_id))
        else:
            video_dir = Path(__file__).resolve().parent.parent / "output" / "videos" / ("product_" + str(product_id))
        video_dir.mkdir(parents=True, exist_ok=True)
        out_path = video_dir / ("task_" + datetime.now().strftime("%Y%m%d_%H%M%S") + ".mp4")
        concat_txt = video_dir / ("concat_" + str(product_id) + ".txt")
        with open(concat_txt, "w", encoding="utf-8") as _cf:
            for p in existing:
                _s = str(p).replace(chr(39), chr(39) + chr(92) + chr(39) + chr(39))
                _cf.write("file " + chr(39) + _s + chr(39) + chr(10))
                _cf.write("duration 2" + chr(10))
        video_url = None
        thumb_url = None
        tried_ffmpeg = False
        ffmpeg_error = None
        ffmpeg_path = shutil.which("ffmpeg")
        if ffmpeg_path:
            tried_ffmpeg = True
            try:
                cmd = [ffmpeg_path, "-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(concat_txt), "-pix_fmt", "yuv420p", "-vcodec", "libx264", "-r", "30", str(out_path)]
                proc = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
                if proc.returncode == 0 and out_path.exists() and out_path.stat().st_size > 0:
                    video_url = "/videos/product_" + str(product_id) + "/" + out_path.name
                    thumb_url = "/images/product_" + str(product_id) + "/img_0.jpg"
                else:
                    ffmpeg_error = proc.stderr or "ffmpeg no output"
            except Exception as _e_ffmpeg:
                ffmpeg_error = str(_e_ffmpeg)
        if not video_url:
            video_url = "/images/product_" + str(product_id) + "/img_0.jpg"
            thumb_url = "/images/product_" + str(product_id) + "/img_0.jpg"
        return {
            "success": True, "video_url": video_url, "thumbnail": thumb_url,
            "duration": duration, "product_title": title, "template": template,
            "used_ffmpeg": tried_ffmpeg and (ffmpeg_error is None), "ffmpeg_error": ffmpeg_error,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("generate_video_action failed: " + str(e))
        raise HTTPException(status_code=500, detail={"error": str(e)})
"""

# ============ 写入临时文件并验证语法（用二进制 + utf-8 读方式避开 emoji 编码问题） ============
work = Path("/workspace/_fix_parts")
work.mkdir(exist_ok=True)

# 关键：先写二进制再读，避开 CPython 字符串字面量中代理对的问题
def safe_write(path: Path, text: str):
    # 先通过 encode + surrogateescape 写，再读回来
    data = text.encode("utf-8", errors="surrogateescape")
    path.write_bytes(data)

safe_write(work / "cg.py", CG_FULL)
safe_write(work / "gc.py", GC_DECORATOR + "\n" + GC_BODY.strip() + "\n")
safe_write(work / "gv.py", GV_DECORATOR + "\n" + GV_BODY.strip() + "\n")

# 通过读文件方式验证（避免 Python 代码中直接出现 emoji 字面量）
import ast
for name in ["cg.py", "gc.py", "gv.py"]:
    path = work / name
    text_bytes = path.read_bytes()
    text = text_bytes.decode("utf-8", errors="replace")
    try:
        ast.parse(text)
        print("[OK]", name, "大小:", len(text_bytes), "bytes")
    except SyntaxError as e:
        print("[FAIL]", name, ":", e, "行号:", e.lineno)
        around = text.split(chr(10))
        for k in range(max(0, e.lineno-3), min(len(around), e.lineno+2)):
            print("  L" + str(k+1) + ": " + around[k])
        sys.exit(1)

# 合并到 routes.py
subprocess_mod = __import__("subprocess")
subprocess_mod.run(["git", "checkout", "--", "api/routes.py"], cwd="/workspace", check=True)

routes_path = Path("/workspace/api/routes.py")
content_bytes = routes_path.read_bytes()
content = content_bytes.decode("utf-8", errors="replace")

NL = chr(10)
lines = content.split(NL)

# 替换旧 generate_content_action；其他内容保持原样
new_lines = []
i = 0
n = len(lines)
inserted_cg = False
while i < n:
    if '@api_router.post("/api/actions/generate_content")' in lines[i]:
        # 跳过到下一个 @api_router
        j = i + 1
        while j < n:
            stripped = lines[j].lstrip()
            if stripped.startswith("@api_router.") and j > i + 3:
                break
            if stripped.startswith("# ============") and j > i + 5:
                break
            j += 1
        if not inserted_cg:
            # 先插入 ContentGenerator
            new_lines.append("")
            new_lines.append("# ============ 本地文案生成兜底（不依赖 LLM） ============")
            new_lines.append("")
            cg_text = (work / "cg.py").read_bytes().decode("utf-8", errors="replace")
            new_lines.extend(cg_text.rstrip().split(NL))
            new_lines.append("")
            # 再插入新的 generate_content_action
            new_lines.append("# ---------- POST /api/actions/generate_content ----------")
            gc_text = (work / "gc.py").read_bytes().decode("utf-8", errors="replace")
            new_lines.extend(gc_text.rstrip().split(NL))
            new_lines.append("")
            inserted_cg = True
        i = j
        continue
    else:
        new_lines.append(lines[i])
        i += 1

if not inserted_cg:
    new_lines.append("")
    new_lines.append("# ============ 本地文案生成兜底（不依赖 LLM） ============")
    new_lines.append("")
    cg_text = (work / "cg.py").read_bytes().decode("utf-8", errors="replace")
    new_lines.extend(cg_text.rstrip().split(NL))
    new_lines.append("")
    new_lines.append("# ---------- POST /api/actions/generate_content ----------")
    gc_text = (work / "gc.py").read_bytes().decode("utf-8", errors="replace")
    new_lines.extend(gc_text.rstrip().split(NL))

# 添加 generate_video_action
new_lines.append("")
new_lines.append("# ---------- POST /api/actions/generate_video ----------")
gv_text = (work / "gv.py").read_bytes().decode("utf-8", errors="replace")
new_lines.extend(gv_text.rstrip().split(NL))
new_lines.append("")

final_text = NL.join(new_lines)
# 通过 write_bytes 写回
final_bytes = final_text.encode("utf-8", errors="surrogateescape")
routes_path.write_bytes(final_bytes)
print("[DONE] 已写入 routes.py，大小:", len(final_bytes), "bytes")

# 再次验证整个文件
text2 = routes_path.read_bytes().decode("utf-8", errors="replace")
try:
    ast.parse(text2)
    print("[OK] 最终 routes.py 语法检查通过")
except SyntaxError as e:
    print("[FAIL] 最终 routes.py:", e, "行号:", e.lineno)
    around = text2.split(NL)
    for k in range(max(0, e.lineno-3), min(len(around), e.lineno+3)):
        print("  L" + str(k+1) + ": " + around[k])
    sys.exit(1)

# 验证能够 import
sys.path.insert(0, "/workspace")
try:
    import api.routes  # noqa
    print("[OK] import api.routes 成功")
except Exception as e:
    print("[WARN] import 失败（可能因为 Config 等依赖）:", e)

# 验证新接口存在
src = routes_path.read_bytes().decode("utf-8", errors="replace")
checks = [
    ('class ContentGenerator', 'ContentGenerator 类'),
    ('def generate_content_action', 'generate_content_action 函数'),
    ('def generate_video_action', 'generate_video_action 函数'),
    ('/api/actions/generate_video', 'generate_video 路由'),
]
all_ok = True
for key, name in checks:
    if key in src:
        print("[OK]", name, "存在")
    else:
        print("[MISSING]", name)
        all_ok = False

if all_ok:
    print("\n[DONE] 所有修改已应用")
else:
    print("\n[WARN] 部分内容缺失，请检查")
    sys.exit(1)
