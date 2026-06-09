@api_router.post("/api/actions/generate_video")
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
