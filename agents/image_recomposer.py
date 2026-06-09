"""Agent 6: 图片重组系统
- 下载商品主图/详情图
- 自动裁剪、排版、生成封面
- 加卖点文字
- 输出多平台尺寸图片"""
from pathlib import Path
from typing import List, Optional, Tuple
from loguru import logger
from PIL import Image, ImageDraw, ImageFont, ImageOps

from config import Config
from db import Product, ImageAsset, get_db
from utils.common import safe_filename, timestamp_str, ensure_dir
from utils.http_client import download_file

# 各平台推荐尺寸（竖版优先）
PLATFORM_SIZES = {
    "xhs": [(1080, 1440), (1080, 1080), (1080, 1920)],
    "douyin": [(1080, 1920), (1080, 1440)],
    "wechat": [(1080, 1260), (1080, 1920)],
    "kuaishou": [(1080, 1920)],
    "common": [(1080, 1440)],
}


def _get_font(size: int = 40) -> ImageFont.ImageFont:
    """尝试加载中文字体，找不到就用默认"""
    candidates = [
        "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
        "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/System/Library/Fonts/PingFang.ttc",
        "C:/Windows/Fonts/msyh.ttc",
        "C:/Windows/Fonts/simhei.ttf",
    ]
    for p in candidates:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def _fit_image(img: Image.Image, target_w: int, target_h: int,
               bg_color: Tuple[int, int, int] = (255, 255, 255)) -> Image.Image:
    """按比例缩放并居中放到目标尺寸画布"""
    img = img.convert("RGB")
    src_w, src_h = img.size
    ratio = min(target_w / src_w, target_h / src_h)
    new_w, new_h = int(src_w * ratio), int(src_h * ratio)
    resized = img.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new("RGB", (target_w, target_h), bg_color)
    canvas.paste(resized, ((target_w - new_w) // 2, (target_h - new_h) // 2))
    return canvas


def _add_text_overlay(img: Image.Image, title: str, sell_points: List[str]) -> Image.Image:
    """在图片底部添加半透明遮罩 + 标题 + 卖点"""
    w, h = img.size
    overlay = img.copy()
    draw = ImageDraw.Draw(overlay)

    bar_h = min(int(h * 0.28), 360)
    # 半透明渐变遮罩
    mask = Image.new("RGBA", (w, bar_h), (0, 0, 0, 160))
    overlay.paste(mask, (0, h - bar_h), mask)

    draw = ImageDraw.Draw(overlay)
    title_font = _get_font(min(int(w / 22), 56))
    point_font = _get_font(min(int(w / 32), 38))

    # 标题
    title_x = int(w * 0.06)
    title_y = h - bar_h + int(bar_h * 0.15)
    draw.text((title_x, title_y), (title or "")[:20], fill=(255, 215, 0), font=title_font)

    # 卖点
    y = title_y + int(bar_h * 0.4)
    for i, p in enumerate(sell_points[:3]):
        text = f"· {str(p)[:28]}"
        draw.text((title_x, y), text, fill=(255, 255, 255), font=point_font)
        y += int(bar_h * 0.2)

    return overlay


class ImageRecomposer:
    def __init__(self, product: Product):
        self.product = product
        self._downloaded: List[Path] = []

    # ---- 下载素材 ----
    def download_assets(self, image_urls: Optional[List[str]] = None,
                        max_images: int = 6) -> List[Path]:
        """下载主图/详情图。若无 URL，则尝试从 product.main_image_url 和 extra 中抽取"""
        urls = list(image_urls or [])
        if not urls and self.product.main_image_url:
            urls.append(self.product.main_image_url)
        extra = self.product.extra or {}
        for key in ("images", "detail_images", "image_list", "imgs"):
            if key in extra and isinstance(extra[key], list):
                urls.extend([u for u in extra[key] if isinstance(u, str) and u.startswith("http")])
        urls = list(dict.fromkeys(u for u in urls if u))[:max_images]

        save_dir = ensure_dir(Config.IMAGE_DIR / f"product_{self.product.id}")
        downloaded = []
        for i, url in enumerate(urls):
            save_path = save_dir / f"raw_{i}_{safe_filename(self.product.title)}_{timestamp_str(short=True)}.jpg"
            ok = download_file(url, save_path)
            if ok and save_path.exists():
                downloaded.append(save_path)
        self._downloaded = downloaded
        logger.info(f"下载图片 {len(downloaded)}/{len(urls)} 张 -> {save_dir}")
        return downloaded

    # ---- 生成图文 ----
    def compose_for_platform(self, platform: str = "xhs", title: str = "",
                             sell_points: Optional[List[str]] = None,
                             source_images: Optional[List[Path]] = None) -> List[Path]:
        """生成指定平台尺寸的图文（多图）"""
        sources = list(source_images or self._downloaded)
        if not sources:
            sources = self.download_assets()
        if not sources:
            logger.warning("没有可用图片素材，无法合成")
            return []

        sizes = PLATFORM_SIZES.get(platform, PLATFORM_SIZES["common"])
        out_dir = ensure_dir(Config.IMAGE_DIR / f"product_{self.product.id}" / platform)
        out_paths: List[Path] = []
        points = sell_points or ["品质优选", "性价比高", "颜值在线"]

        for idx, src in enumerate(sources):
            try:
                img = Image.open(src)
            except Exception as e:
                logger.warning(f"打开图片失败 {src}: {e}")
                continue
            target_w, target_h = sizes[idx % len(sizes)]
            fitted = _fit_image(img, target_w, target_h)

            # 第1张加标题 + 卖点；其余只做尺寸适配
            if idx == 0:
                final = _add_text_overlay(fitted, title or self.product.title[:20], points[:3])
            else:
                final = _add_text_overlay(fitted, title or "", points[idx:idx + 2])

            out_path = out_dir / f"{platform}_{idx}_{timestamp_str(short=True)}.jpg"
            final.save(out_path, "JPEG", quality=92)
            out_paths.append(out_path)

        # 写入 ImageAsset
        with get_db() as db:
            for p in out_paths:
                db.add(ImageAsset(
                    product_id=self.product.id,
                    local_path=str(p),
                    image_type="composite",
                    platform=platform,
                    width=target_w,
                    height=target_h,
                ))
            db.commit()
        logger.success(f"生成 {len(out_paths)} 张 {platform} 图文 -> {out_dir}")
        return out_paths

    def make_cover(self, source: Path, platform: str = "xhs") -> Optional[Path]:
        """生成封面（单张带强标题）"""
        if not source or not source.exists():
            return None
        sizes = PLATFORM_SIZES.get(platform, PLATFORM_SIZES["common"])
        target_w, target_h = sizes[0]
        img = Image.open(source)
        fitted = _fit_image(img, target_w, target_h)
        with_title = _add_text_overlay(fitted, self.product.title[:20], ["强烈推荐！", "闭眼入"])
        out_dir = ensure_dir(Config.IMAGE_DIR / f"product_{self.product.id}" / platform)
        out = out_dir / f"cover_{timestamp_str(short=True)}.jpg"
        with_title.save(out, "JPEG", quality=92)
        return out
