#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""修复 routes.py - 添加 ContentGenerator 兜底和 generate_video 接口"""

def main():
    import re
    from pathlib import Path

    routes_path = Path("/workspace/api/routes.py")
    content = routes_path.read_text(encoding="utf-8")

    # 定义要插入的代码块（用纯 Python 变量，避免终端编码问题）
    content_generator_code = '''

# ============ ContentGenerator：LLM 不可用时的本地兜底 ============

class ContentGenerator:
    """不依赖外部 LLM 的中文营销文案生成器。根据 content_type 选择模板填充商品信息。"""

    @classmethod
    def _t_image_text(cls, title, price):
        return (
            "\\u2728 " + title + "\\uff5a\\u59d0\\u59b9\\u4eec\\u771f\\u7684\\u4e0d\\u80fd\\u9519\\u8fc7\\uff01\\n\\n"
            "\\ud83c\\udf1f \\u4e3a\\u4ec0\\u4e48\\u63a8\\u8350\\u5b83\\uff1f\\n"
            "1\\ufe0f\\u20e3 \\u771f\\u7684\\u8d85\\u7ea7\\u597d\\u7528\\uff01\\u7528\\u5b8c\\u7acb\\u523b\\u56de\\u8d2d\\n"
            "2\\ufe0f\\u20e3 \\u6210\\u5206\\u5b89\\u5168\\u6e29\\u548c\\uff0c\\u654f\\u611f\\u808c\\u4e5f\\u5b8c\\u5168 OK\\n"
            "3\\ufe0f\\u20e3 \\u6027\\u4ef7\\u6bd4\\u8d85\\u9ad8\\uff0c\\u5b66\\u751f\\u515a\\u4e5f\\u80fd\\u8f7b\\u677e\\u5165\\u624b\\n\\n"
            "\\ud83d\\udca1 \\u4f7f\\u7528\\u5c0f\\u6280\\u5de7\\uff1a\\n\\u6bcf\\u6b21\\u53d6\\u9002\\u91cf\\uff0c\\u8f7b\\u8f7b\\u62cd\\u6253\\u81f3\\u5b8c\\u5168\\u5438\\u6536\\uff0c"
            "\\u575a\\u6301\\u4e00\\u4e2a\\u6708\\u72b6\\u6001\\u8089\\u773c\\u53ef\\u89c1\\u7684\\u53d8\\u597d\\uff01\\n\\n"
            "\\ud83d\\udcca \\u4f7f\\u7528 28 \\u5929\\u540e\\u7684\\u771f\\u5b9e\\u611f\\u53d7\\uff1a\\n"
            "- \\u6c34\\u6da6\\u5ea6 \\u2b06\\ufe0f 80%\\n- \\u7ec6\\u817b\\u5ea6 \\u2b06\\ufe0f 65%\\n- \\u6574\\u4f53\\u6c14\\u8272 \\u2b06\\ufe0f 90%\\n\\n"
            "\\u59d0\\u59b9\\u4eec\\uff01\\u771f\\u7684\\u5f3a\\u70c8\\u5b89\\u5229\\u7ed9\\u6bcf\\u4e00\\u4f4d\\u770b\\u5230\\u8fd9\\u7bc7\\u7b14\\u8bb0\\u7684\\u5b9d\\u8d1d\\uff5e "
            "\\u65e9\\u4e70\\u65e9\\u4eab\\u53d7\\uff01\\ud83d\\udc95"
        )

    @classmethod
    def _t_script(cls, title, price):
        return (
            "\\u3010\\u5f00\\u573a 3s \\u6293\\u773c\\u7403\\u3011\\n\"\\u59d0\\u59b9\\u4eec\\uff01\\u8fd9\\u4e2a\\u771f\\u7684\\u662f\\u6211\\u4eca\\u5e74\\u7528\\u5230\\u6700\\u60ca\\u8273\\u7684\\u4e1c\\u897f\\uff0c\\u6ca1\\u6709\\u4e4b\\u4e00\\uff01\"\\n\\n"
            "\\u3010\\u4ea7\\u54c1\\u5c55\\u793a\\u3011\\n- \\u955c\\u5934\\u5bf9\\u51c6 " + title + "\\n- \\u5c55\\u793a\\u6838\\u5fc3\\u529f\\u80fd/\\u6548\\u679c\\n- \\u5bf9\\u6bd4\\u4f7f\\u7528\\u524d\\u540e\\n\\n"
            "\\u3010\\u75db\\u70b9\\u5f15\\u51fa\\u3011\\n\"\\u4e4b\\u524d\\u6211\\u4e00\\u76f4\\u88ab\\u8fd9\\u4e2a\\u95ee\\u9898\\u56f0\\u6270\\uff0c\\u8bd5\\u4e86\\u5e02\\u9762\\u4e0a N \\u591a\\u4ea7\\u54c1\\uff0c\\u90fd\\u6ca1\\u80fd\\u89e3\\u51b3..."
            "\\u76f4\\u5230\\u9047\\u5230\\u5b83\\uff01\"\\n\\n"
            "\\u3010\\u6838\\u5fc3\\u5356\\u70b9\\u3011\\n\\u2705 \\u6548\\u679c\\u770b\\u5f97\\u89c1\\n\\u2705 \\u4ef7\\u683c\\u5f88\\u4eb2\\u6c11 \\u00a5" + str(price) + "\\n\\u2705 \\u5927\\u724c\\u540c\\u5382\\n\\u2705 \\u552e\\u540e\\u6709\\u4fdd\\u969c\\n\\n"
            "\\u3010\\u8f6c\\u5316\\u5f15\\u5bfc\\u3011\\n\"\\u771f\\u7684\\uff0c\\u6211\\u5df2\\u7ecf\\u56de\\u8d2d 3 \\u6b21\\u4e86\\uff01\\u73b0\\u5728\\u70b9\\u5de6\\u4e0b\\u89d2\\u5c0f\\u9ec4\\u8f66\\uff0c"
            "\\u8fd8\\u6709\\u9650\\u65f6\\u6298\\u6263\\uff0c\\u9519\\u8fc7\\u771f\\u7684\\u62cd\\u5927\\u817f\\uff01\"\\n\\n"
            "\\u3010\\u7ed3\\u5c3e\\u3011\\n\"\\u5173\\u6ce8\\u6211\\uff0c\\u6bcf\\u5929\\u5206\\u4eab\\u771f\\u5b9e\\u597d\\u7528\\u7684\\u5e73\\u4ef7\\u597d\\u7269\\uff5e\""
        )

    @classmethod
    def _t_review(cls, title, price):
        return (
            "\\u3010" + title + "\\uff5c30 \\u5929\\u6df1\\u5ea6\\u6d4b\\u8bc4\\u3011\\n\\n"
            "\\ud83d\\udce6 \\u5f00\\u7bb1\\u4f53\\u9a8c\\n\\u5305\\u88c5\\u975e\\u5e38\\u7cbe\\u81f4\\uff0c\\u5f00\\u7bb1\\u6709\\u4eea\\u5f0f\\u611f\\uff0c\\u9001\\u793c\\u4e5f\\u5f88\\u5408\\u9002\\n\\n"
            "\\ud83d\\udd2c \\u6210\\u5206\\u5206\\u6790\\n- \\u6838\\u5fc3\\u6210\\u5206\\uff1a\\u4f18\\u8d28\\u539f\\u6599\\n- \\u542b\\u91cf\\u5145\\u8db3\\uff0c\\u8db3\\u91cf\\u6dfb\\u52a0\\n"
            "- \\u65e0\\u9999\\u7cbe\\u9152\\u7cbe\\u8150\\u8150\\u5242\\uff0c\\u654f\\u611f\\u808c\\u53cb\\u597d\\n\\n"
            "\\ud83d\\udcca \\u4f7f\\u7528\\u6548\\u679c\\n\\u7b2c 7 \\u5929\\uff1a\\u521d\\u4f53\\u9a8c\\uff0c\\u5438\\u6536\\u5f88\\u5feb\\uff0c\\u4e0d\\u7c98\\u817b\\n"
            "\\u7b2c 14 \\u5929\\uff1a\\u660e\\u663e\\u6539\\u5584\\uff0c\\u72b6\\u6001\\u7a33\\u5b9a\\n\\u7b2c 21 \\u5929\\uff1a\\u60ca\\u559c\\uff01\\u6548\\u679c\\u5728\\u53d1\\u5149\\n"
            "\\u7b2c 30 \\u5929\\uff1a\\u5f7b\\u5e95\\u7231\\u4e0a\\uff0c\\u56de\\u8d2d\\u9884\\u8ba2\\n\\n"
            "\\ud83d\\udcb0 \\u6027\\u4ef7\\u6bd4\\n\\u4ef7\\u683c \\u00a5" + str(price) + "\\uff0c\\u6298\\u7b97\\u4e0b\\u6765\\u6bcf\\u5929\\u4e0d\\u5230\\u51e0\\u5757\\u94b1\\uff0c\\u5f88\\u5212\\u7b97\\n\\n"
            "\\u2b50 \\u7efc\\u5408\\u8bc4\\u5206\\uff1a4.8 / 5.0\\n\\u2705 \\u63a8\\u8350\\u8d2d\\u4e70\\uff1a\\u8ffd\\u6c42\\u54c1\\u8d28\\u7684\\u4f60\\u3001\\u654f\\u611f\\u808c\\u6613\\u8e29\\u96f7\\u4f53\\u8d28\\u3001\\u6210\\u5206\\u515a\\u7231\\u597d\\u8005"
        )

    @classmethod
    def _t_compare(cls, title, price):
        return (
            "\\u3010" + title + " vs \\u540c\\u7c7b\\u4ea7\\u54c1\\uff5c\\u6df1\\u5ea6\\u5bf9\\u6bd4\\u6d4b\\u8bc4\\u3011\\n\\n"
            "\\u2694\\ufe0f \\u53c2\\u8d5b\\u9009\\u624b\\nA \\u6b3e\\uff1a\\u5927\\u724c\\u7ecf\\u5178\\u6b3e \\u00a5899\\nB \\u6b3e\\uff1a\\u7f51\\u7ea2\\u7206\\u6b3e \\u00a5599\\n"
            "C \\u6b3e\\uff1a\\u4eca\\u65e5\\u4e3b\\u89d2 \\u00a5" + str(price) + "\\n\\n"
            "\\ud83d\\udcca \\u7ef4\\u5ea6\\u5bf9\\u6bd4\\n\\n1\\ufe0f\\u20e3 \\u6210\\u5206\\u5b89\\u5168\\nA: \\u2b50\\u2b50\\u2b50\\u2b50\\nB: \\u2b50\\u2b50\\u2b50\\u2b50\\n"
            "C: \\u2b50\\u2b50\\u2b50\\u2b50\\u2b50 (\\u65e0\\u9999\\u7cbe\\u9152\\u7cbe)\\n\\n2\\ufe0f\\u20e3 \\u4f7f\\u7528\\u611f\\u53d7\\nA: \\u2b50\\u2b50\\u2b50\\u2b50 (\\u7565\\u6cb9\\u817b)\\n"
            "B: \\u2b50\\u2b50\\u2b50 (\\u5438\\u6536\\u4e00\\u822c)\\nC: \\u2b50\\u2b50\\u2b50\\u2b50\\u2b50 (\\u6e05\\u723d\\u79d2\\u5438\\u6536)\\n\\n"
            "3\\ufe0f\\u20e3 \\u6548\\u679c\\u8868\\u73b0\\nA: \\u2b50\\u2b50\\u2b50\\u2b50 (1 \\u4e2a\\u6708\\u89c1\\u6548)\\nB: \\u2b50\\u2b50\\u2b50 (\\u6548\\u679c\\u4e0d\\u660e\\u663e)\\n"
            "C: \\u2b50\\u2b50\\u2b50\\u2b50\\u2b50 (2 \\u5468\\u8089\\u773c\\u53ef\\u89c1)\\n\\n4\\ufe0f\\u20e3 \\u6027\\u4ef7\\u6bd4\\nA: \\u2b50\\u2b50 (\\u8d35)\\n"
            "B: \\u2b50\\u2b50\\u2b50 (\\u9002\\u4e2d)\\nC: \\u2b50\\u2b50\\u2b50\\u2b50\\u2b50 (\\u8d85\\u503c)\\n\\n"
            "\\ud83c\\udfc6 \\u603b\\u7ed3\\n\\u7efc\\u5408\\u8bc4\\u5206\\uff1aC > A > B\\n\\u9884\\u7b97\\u5145\\u8db3\\u9009 A\\uff0c\\u8ffd\\u6c42\\u6027\\u4ef7\\u6bd4\\u95ed\\u773c\\u5165 C\\uff01"
        )

    @classmethod
    def _t_plot(cls, title, price):
        return (
            "\\u3010\\u573a\\u666f\\u4e00\\uff1a\\u529e\\u516c\\u5ba4\\u00b7\\u65e5\\u00b7\\u5185\\u3011\\n\\n"
            "\\uff08\\u5c0f\\u7f8e\\u4e00\\u8138\\u75b2\\u60eb\\u5730\\u5bf9\\u7740\\u7535\\u8111\\uff09\\n\\n"
            "\\u5c0f\\u7f8e\\uff1a\\u5509\\uff0c\\u6700\\u8fd1\\u52a0\\u73ed\\u592a\\u591a\\uff0c\\u6574\\u4e2a\\u4eba\\u72b6\\u6001\\u90fd\\u53d8\\u5dee\\u4e86...\\n\\n"
            "\\u540c\\u4e8b\\u5c0f\\u4e3d\\uff1a\\uff08\\u51d1\\u8fd1\\uff09\\u600e\\u4e48\\u5566\\uff1f\\u770b\\u8d77\\u6765\\u72b6\\u6001\\u4e0d\\u592a\\u597d\\u5462\\n\\n"
            "\\u5c0f\\u7f8e\\uff1a\\u6700\\u8fd1\\u5929\\u5929\\u71ac\\u591c\\uff0c\\u8bd5\\u4e86\\u597d\\u591a\\u65b9\\u6cd5\\u90fd\\u6ca1\\u7528\\n\\n"
            "\\u540c\\u4e8b\\u5c0f\\u4e3d\\uff1a\\uff08\\u795e\\u79d8\\u4e00\\u7b11\\uff09\\u65e9\\u8bf4\\u5440\\uff01\\u7ed9\\u4f60\\u63a8\\u8350\\u6211\\u4e00\\u76f4\\u5728\\u7528\\u7684\\u795e\\u5668\\n\\n"
            "\\u5c0f\\u7f8e\\uff1a\\u4ec0\\u4e48\\u5440\\uff1f\\n\\n\\u540c\\u4e8b\\u5c0f\\u4e3d\\uff1a\\u5f53\\u5f53\\u5f53\\u5f53\\uff01\\u5c31\\u662f\\u8fd9\\u4e2a\\u2014\\u2014" + title + "\\uff01\\n\\n"
            "\\uff08\\u7279\\u5199\\u4ea7\\u54c1\\uff09\\n\\n\\u540c\\u4e8b\\u5c0f\\u4e3d\\uff1a\\u6211\\u7528\\u4e86 2 \\u4e2a\\u6708\\uff0c\\u4f60\\u770b\\u6211\\u73b0\\u5728\\u662f\\u4e0d\\u662f\\u591a\\u4e86\\uff1f\\n\\n"
            "\\u5c0f\\u7f8e\\uff1a\\u771f\\u7684\\u554a\\uff01\\u4f60\\u6574\\u4e2a\\u4eba\\u6c14\\u8272\\u90fd\\u4e0d\\u4e00\\u6837\\uff01\\n\\n"
            "\\u540c\\u4e8b\\u5c0f\\u4e3d\\uff1a\\u771f\\u7684\\u8d85\\u597d\\u7528\\uff01\\u6210\\u5206\\u5f88\\u6e29\\u548c\\uff0c\\u5173\\u952e\\u662f\\u6548\\u679c\\u771f\\u7684\\u770b\\u5f97\\u89c1\\n\\n"
            "\\u5c0f\\u7f8e\\uff1a\\u90a3\\u6211\\u4e5f\\u8d81\\u7d27\\u53bb\\u4e70\\uff01\\u5728\\u54ea\\u91cc\\u4e0b\\u5355\\uff1f\\n\\n"
            "\\u540c\\u4e8b\\u5c0f\\u4e3d\\uff1a\\u70b9\\u5de6\\u4e0b\\u89d2\\u5c0f\\u9ec4\\u8f66\\u5c31\\u53ef\\u4ee5\\u5566\\uff01\\u73b0\\u5728\\u8fd8\\u6709\\u9650\\u65f6\\u4f18\\u60e0\\uff5e\\n\\n"
            "\\u3010\\u7ed3\\u5c3e\\u3011\\u4e8c\\u4eba\\u76f8\\u89c6\\u4e00\\u7b11\\uff0c\\u955c\\u5934\\u5207\\u4ea7\\u54c1\\u7279\\u5199 + \\u8d2d\\u4e70\\u94fe\\u63a5\\n\\n"
            "\\u5b57\\u5e55\\uff1a\\u9047\\u89c1\\u5b83\\uff0c\\u662f\\u4eca\\u5e74\\u6700\\u7f8e\\u4e3d\\u7684\\u610f\\u5916 \\u2728"
        )

    @classmethod
    def generate(cls, product, content_type: str, extra_prompt: str = ""):
        title = getattr(product, "title", None) or getattr(product, "name", "精选商品")
        price = getattr(product, "price", None) or "299"

        aliases = {
            "image_text": "image_text",
            "copywriting": "image_text",
            "种草": "image_text",
            "script": "script",
            "口播": "script",
            "review": "review",
            "测评": "review",
            "剧情": "plot",
            "plot_script": "plot",
            "对比": "compare",
            "compare": "compare",
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

        title_out = "\\u2728 " + title
        tags = ["#好物推荐", "#种草笔记", "#品质生活", "#今日推荐"]
        call_to_action = "\\ud83d\\udcac 评论区告诉我你的看法，抽 3 位宝宝送小样~"
        cart_text = "\\ud83d\\uded2 点击左下角小黄车直接下单 " + title + "，限时优惠 \\u00a5" + str(price) + "！"

        return {
            "title": title_out,
            "body": body,
            "tags": tags,
            "call_to_action": call_to_action,
            "cart_text": cart_text,
        }


# ============ generate_content_action 修改为带本地兜底 ============

# 修改 generate_content_action 函数:
# 1. 尝试调用 LLM；2. 失败或超时则用 ContentGenerator 兜底
# 关键是把 generate_content_action 中的异常处理部分改为尝试本地兜底

'''

    generate_video_code = '''


# ---------- POST /api/actions/generate_video ----------

@api_router.post("/actions/generate_video")
def generate_video_action(body: dict):
    """
    body: { product_id: int, template: str, duration: int }
    使用 ffmpeg 合成图片轮播视频，没有图片时用 Pillow 生成占位图
    返回 { success, video_url, thumbnail, duration, product_title }
    """
    import shutil
    from pathlib import Path

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

        # 准备图片目录
        img_dir = Path(Config.IMAGE_DIR) / ("product_" + str(product_id))
        img_dir.mkdir(parents=True, exist_ok=True)

        # 查找现有图片
        existing = []
        for suffix in ("*.jpg", "*.jpeg", "*.png"):
            existing.extend(sorted(img_dir.glob(suffix)))
        existing = existing[:3]

        # 如果图片不足 3 张，用 Pillow 合成占位图
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
            except Exception as _e_pil:
                # 即使 Pillow 也失败，写极简占位
                for idx in range(3):
                    path = img_dir / ("img_" + str(idx) + ".jpg")
                    with open(path, "wb") as _f:
                        # 一个最小的有效 JPEG
                        _f.write(bytes.fromhex(
                            "ffd8ffe000104a46494600010101006000600000ffdb00430008060607060508070707"
                            "090908 0a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837"
                            "292c30313434341f27393d38323c2e333432ffc00011080001000101011100ffc4001400"
                            "01000000000000000000000000000000000000ffc40014100100000000000000000000"
                            "0000000000000000ffda000c03010002110311003f00f9c000ffd9".replace(" ", "")
                        ))
                    existing.append(path)

        # 准备视频输出目录
        video_dir = Path(Config.VIDEO_DIR) if hasattr(Config, "VIDEO_DIR") else (
            Path(__file__).resolve().parent.parent / "output" / "videos" / ("product_" + str(product_id))
        )
        video_dir.mkdir(parents=True, exist_ok=True)
        out_path = video_dir / ("task_" + datetime.now().strftime("%Y%m%d_%H%M%S") + ".mp4")

        # 创建一个输入文件列表（ffmpeg concat demuxer）
        concat_txt = video_dir / ("concat_" + str(product_id) + ".txt")
        with open(concat_txt, "w", encoding="utf-8") as _f:
            for p in existing:
                _f.write("file '" + str(p).replace("'", "'\\\\''") + "'\\n")
                _f.write("duration 2\\n")

        video_url = None
        thumb_url = None
        tried_ffmpeg = False
        ffmpeg_error = None

        ffmpeg_path = shutil.which("ffmpeg")
        if ffmpeg_path:
            tried_ffmpeg = True
            try:
                cmd = [
                    ffmpeg_path, "-y", "-hide_banner", "-loglevel", "error",
                    "-f", "concat", "-safe", "0", "-i", str(concat_txt),
                    "-pix_fmt", "yuv420p", "-vcodec", "libx264", "-r", "30",
                    str(out_path)
                ]
                proc = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
                if proc.returncode == 0 and out_path.exists() and out_path.stat().st_size > 0:
                    # 生成缩略图（取第 0 张）
                    video_url = "/videos/product_" + str(product_id) + "/" + out_path.name
                    thumb_url = "/images/product_" + str(product_id) + "/img_0.jpg"
                else:
                    ffmpeg_error = proc.stderr or "ffmpeg 未输出文件"
            except Exception as _e_ffmpeg:
                ffmpeg_error = str(_e_ffmpeg)

        if not video_url:
            # 兜底：返回第一张图作为"视频"占位（前端以图片形式播放）
            video_url = "/images/product_" + str(product_id) + "/img_0.jpg"
            thumb_url = "/images/product_" + str(product_id) + "/img_0.jpg"

        return {
            "success": True,
            "video_url": video_url,
            "thumbnail": thumb_url,
            "duration": duration,
            "product_title": title,
            "template": template,
            "used_ffmpeg": tried_ffmpeg and (ffmpeg_error is None),
            "ffmpeg_error": ffmpeg_error,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("generate_video_action failed: " + str(e))
        raise HTTPException(status_code=500, detail={"error": str(e)})
'''

    # ============ 修改 1: 在 generate_content_action 之前插入 ContentGenerator ============
    marker_before_gen = '# ---------- POST /api/actions/generate_content ----------'
    if content_generator_code.strip() not in content:
        if marker_before_gen in content:
            content = content.replace(marker_before_gen, content_generator_code.strip() + '\n\n' + marker_before_gen, 1)
            print("[1/2] ContentGenerator 已插入")

    # ============ 修改 2: 替换 generate_content_action 内部逻辑，加本地兜底 ============
    old_func_pattern = re.compile(
        r'(@api_router\.post\("/api/actions/generate_content"\)\n'
        r'def generate_content_action\(body: dict\):\n.*?)(?=\n\n# ---------- POST |\n\n# ============|\Z)',
        re.DOTALL,
    )

    new_func = '''@api_router.post("/api/actions/generate_content")
def generate_content_action(body: dict):
    """
    body: { product_id: int, content_type: string, prompt: string? }
    优先调用 agents.content_factory.ContentFactory 的 LLM 生成；
    若 LLM 不可用或超时，则退回本地 ContentGenerator 模板兜底。
    """
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

        # 先尝试 LLM
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

        if not content_obj:
            # 本地兜底
            used_local_fallback = True
            local_result = ContentGenerator.generate(product, content_type, extra_prompt)

            # 同时写入数据库，便于后续检索
            try:
                with get_db() as db3:
                    new_c = Content(
                        product_id=product_id,
                        title=local_result["title"],
                        body=local_result["body"],
                        platform="xhs",
                        content_type=content_type,
                        tags=(",".join(local_result["tags"])) if isinstance(local_result["tags"], list) else local_result["tags"],
                    )
                    db3.add(new_c)
                    db3.commit()
                    db3.refresh(new_c)
                    content_obj = new_c
            except Exception:
                content_obj = None

        if content_obj:
            return {
                "success": True,
                "used_local_fallback": used_local_fallback,
                "llm_error": llm_error,
                "content": {
                    "id": getattr(content_obj, "id", None),
                    "title": content_obj.title if hasattr(content_obj, "title") else local_result["title"],
                    "body": content_obj.body if hasattr(content_obj, "body") else local_result["body"],
                    "platform": getattr(content_obj, "platform", "xhs"),
                    "content_type": getattr(content_obj, "content_type", content_type),
                    "tags": (content_obj.tags.split(",") if isinstance(getattr(content_obj, "tags", None), str) else getattr(content_obj, "tags", local_result["tags"])),
                    "call_to_action": local_result.get("call_to_action") if used_local_fallback else None,
                    "cart_text": local_result.get("cart_text") if used_local_fallback else None,
                },
            }
        else:
            # 最后的兜底：直接返回本地结果，不带 DB 对象
            used_local_fallback = True
            local_result = ContentGenerator.generate(product, content_type, extra_prompt)
            return {
                "success": True,
                "used_local_fallback": used_local_fallback,
                "llm_error": llm_error,
                "content": {
                    "id": None,
                    "title": local_result["title"],
                    "body": local_result["body"],
                    "platform": "xhs",
                    "content_type": content_type,
                    "tags": local_result["tags"],
                    "call_to_action": local_result["call_to_action"],
                    "cart_text": local_result["cart_text"],
                },
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("generate_content_action failed: " + str(e))
        raise HTTPException(status_code=500, detail={"error": str(e)})
'''

    m = old_func_pattern.search(content)
    if m:
        content = content[:m.start()] + new_func.strip() + content[m.end():]
        print("[2/2] generate_content_action 已替换为带本地兜底版本")
    else:
        print("警告: 未找到 generate_content_action 函数，附加到末尾")
        content += "\n\n" + new_func.strip()

    # ============ 修改 3: 在文件末尾添加 generate_video_action ============
    if 'def generate_video_action' not in content:
        content += generate_video_code
        print("[3/3] generate_video_action 已添加")

    # 确保 Config 有 VIDEO_DIR
    if 'hasattr(Config, "VIDEO_DIR")' not in content and 'def get_config' in content:
        pass  # generate_video_action 内部已用 hasattr 兜底

    routes_path.write_text(content, encoding="utf-8")
    print("\\n写入完成，文件大小:", routes_path.stat().st_size, "字节")

    # 验证语法
    import ast
    try:
        ast.parse(content)
        print("AST 语法检查: \\u2705 OK")
    except SyntaxError as e:
        print("AST 语法检查: \\u274c", e)
        raise

main()
