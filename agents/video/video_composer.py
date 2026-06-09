"""Agent 7: 视频自动混剪系统
流程：
1. 从图片素材生成幻灯片（FFmpeg）
2. 合成 TTS 配音
3. 嵌入字幕（可选）
4. 输出 15s/30s/60s 带货视频
"""
import shutil
import subprocess
from pathlib import Path
from typing import List, Optional, Dict, Any
from loguru import logger

from config import Config
from db import Product, VideoAsset, get_db
from utils.common import safe_filename, timestamp_str, ensure_dir
from agents.image_recomposer import ImageRecomposer
from agents.video.tts_engine import TTS
from agents.video.srt_generator import build_srt_from_lines, save_srt


def _has_ffmpeg() -> bool:
    return shutil.which("ffmpeg") is not None


def _run_cmd(cmd: List[str]) -> bool:
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if proc.returncode != 0:
            logger.error(f"CMD failed (rc={proc.returncode}): {' '.join(cmd[:2])}\n"
                         f"stderr: {proc.stderr[-500:]}")
            return False
        return True
    except Exception as e:
        logger.error(f"CMD exception: {e}")
        return False


class VideoComposer:
    def __init__(self, product: Product):
        self.product = product

    # ---- 从图片生成幻灯片视频 ----
    def _build_slideshow_from_images(self, images: List[Path], duration: float,
                                      fps: int = 25) -> Optional[Path]:
        if not images:
            logger.warning("没有图片，无法生成幻灯片")
            return None
        ensure_dir(Config.VIDEO_DIR)

        out_dir = ensure_dir(Config.VIDEO_DIR / f"product_{self.product.id}")
        out_path = out_dir / f"slideshow_{safe_filename(self.product.title[:15])}_{timestamp_str(short=True)}.mp4"

        # 每张图片停留时间
        per_img = max(duration / max(len(images), 1), 2.0)

        # 用 concat demuxer：生成 txt 文件
        concat_txt = out_dir / f"concat_{timestamp_str(short=True)}.txt"
        lines = []
        for img in images:
            lines.append(f"file '{img}'")
            lines.append(f"duration {per_img:.2f}")
        # 最后一张需要再重复一次 file 以使 duration 生效
        if images:
            lines.append(f"file '{images[-1]}'")
        concat_txt.write_text("\n".join(lines), encoding="utf-8")

        cmd = [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0",
            "-i", str(concat_txt),
            "-vf", f"scale=1080:1920:force_original_aspect_ratio=decrease,"
                   f"pad=1080:1920:(ow-iw)/2:(oh-ih)/2:white,"
                   f"zoompan=z='min(zoom+0.001,1.1)':d={int(duration * fps)}:s=1080x1920",
            "-r", str(fps),
            "-pix_fmt", "yuv420p",
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "22",
            str(out_path),
        ]
        # zoompan 对 concat 输入支持有限，这里降级：先用简单方法做缩放然后直接输出
        cmd_simple = [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0",
            "-i", str(concat_txt),
            "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,"
                   "pad=1080:1920:(ow-iw)/2:(oh-ih)/2:white,"
                   "fps=25",
            "-pix_fmt", "yuv420p",
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "22",
            "-r", str(fps),
            str(out_path),
        ]
        ok = _run_cmd(cmd_simple)
        if not ok:
            return None
        if out_path.exists():
            return out_path
        return None

    # ---- 合成音频 + 视频 ----
    def _mux_audio_video(self, video_path: Path, audio_path: Path, out_path: Path) -> bool:
        cmd = [
            "ffmpeg", "-y",
            "-i", str(video_path),
            "-i", str(audio_path),
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "128k",
            "-shortest",
            str(out_path),
        ]
        return _run_cmd(cmd)

    # ---- 嵌入字幕（烧录进画面） ----
    def _burn_subtitles(self, video_path: Path, srt_path: Path, out_path: Path) -> bool:
        # ffmpeg subtitles filter 需要 SRT 文件路径（windows 路径需转义）
        srt_str = str(srt_path).replace("\\", "/").replace(":", r"\:")
        cmd = [
            "ffmpeg", "-y",
            "-i", str(video_path),
            "-vf",
            f"subtitles='{srt_str}':force_style='FontName=Noto Sans CJK SC,FontSize=28,"
            f"PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,Outline=2,Shadow=0,BorderStyle=1,'",
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "22",
            "-c:a", "copy",
            str(out_path),
        ]
        return _run_cmd(cmd)

    # ---- 对外主入口 ----
    def compose(
        self,
        script_lines: List[Dict[str, Any]],
        script_text: str,
        platform: str = "wechat",
        target_duration: float = 30.0,
        images: Optional[List[Path]] = None,
        burn_subtitles: bool = True,
    ) -> Optional[VideoAsset]:
        """主流程：图片幻灯片 + TTS配音 + 字幕 -> 成品视频"""
        if not _has_ffmpeg():
            logger.error("未检测到 ffmpeg，请先安装 ffmpeg 并加入 PATH")
            return None

        logger.info(f"开始合成 {target_duration}s 视频 -> {self.product.title[:30]}")

        # Step 1: 获取图片素材
        if not images:
            recomposer = ImageRecomposer(self.product)
            images = recomposer.download_assets()
        if not images:
            logger.error("没有可用图片素材，视频合成终止")
            return None

        # Step 2: TTS 配音
        tts = TTS()
        audio_path = tts.synthesize(script_text)
        if not audio_path:
            logger.warning("TTS 配音失败，将生成静音视频")

        # Step 3: 生成图片幻灯片
        slideshow = self._build_slideshow_from_images(images, target_duration)
        if not slideshow:
            return None

        # Step 4: 合成
        out_dir = ensure_dir(Config.VIDEO_DIR / f"product_{self.product.id}")
        if audio_path and audio_path.exists():
            muxed = out_dir / f"muxed_{timestamp_str(short=True)}.mp4"
            ok = self._mux_audio_video(slideshow, audio_path, muxed)
            if not ok:
                muxed = slideshow
        else:
            muxed = slideshow

        # Step 5: 字幕
        final_path = muxed
        srt_path = None
        if burn_subtitles and script_lines:
            srt_text = build_srt_from_lines(script_lines)
            srt_path = save_srt(srt_text, name_hint=f"p{self.product.id}")
            final_path = out_dir / f"final_{timestamp_str(short=True)}.mp4"
            ok = self._burn_subtitles(muxed, srt_path, final_path)
            if not ok:
                final_path = muxed

        # Step 6: 写入数据库
        with get_db() as db:
            asset = VideoAsset(
                product_id=self.product.id,
                local_path=str(final_path),
                duration=target_duration,
                video_type=f"{int(target_duration)}s",
                platform=platform,
                audio_path=str(audio_path) if audio_path and audio_path.exists() else "",
                srt_path=str(srt_path) if srt_path and srt_path.exists() else "",
                script=script_text,
                status="ready",
            )
            db.add(asset)
            db.commit()
            db.refresh(asset)

        logger.success(f"视频合成完成 -> {final_path}")
        return asset

    def compose_from_script(self, script: Dict[str, Any], platform: str = "wechat",
                            images: Optional[List[Path]] = None) -> Optional[VideoAsset]:
        """直接从脚本 dict 合成视频"""
        lines = script.get("lines", [])
        total = float(script.get("total_duration") or sum(float(x.get("duration") or 3) for x in lines))
        text = script.get("text") or "\n".join(str(x.get("line", "")) for x in lines)
        return self.compose(lines, text, platform=platform, target_duration=total, images=images)
