"""免费 TTS 配音（Edge-TTS）"""
import asyncio
from pathlib import Path
from typing import Optional
from loguru import logger

from config import Config
from utils.common import ensure_dir, timestamp_str, safe_filename


class TTS:
    def __init__(self, voice: str = None, rate: str = None, volume: str = None):
        self.voice = voice or Config.TTS_VOICE
        self.rate = rate or Config.TTS_RATE
        self.volume = volume or Config.TTS_VOLUME

    def synthesize(self, text: str, output_path: Optional[Path] = None) -> Optional[Path]:
        """同步调用：内部跑 asyncio"""
        text = (text or "").strip()
        if not text:
            return None
        if output_path is None:
            out_dir = ensure_dir(Config.AUDIO_DIR)
            output_path = out_dir / f"tts_{safe_filename(text[:20])}_{timestamp_str(short=True)}.mp3"
        output_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            import edge_tts
        except ImportError:
            logger.warning("edge-tts 未安装，请先 pip install edge-tts")
            return None

        async def _run():
            communicate = edge_tts.Communicate(text, self.voice, rate=self.rate, volume=self.volume)
            await communicate.save(str(output_path))

        try:
            asyncio.run(_run())
        except Exception as e:
            # 某些环境里已有 event loop
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    import threading
                    result = {}

                    def _t():
                        new_loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(new_loop)
                        try:
                            new_loop.run_until_complete(_run())
                            result["ok"] = True
                        except Exception as ee:
                            result["err"] = str(ee)
                        finally:
                            new_loop.close()

                    t = threading.Thread(target=_t, daemon=True)
                    t.start()
                    t.join(timeout=300)
                    if "err" in result:
                        raise RuntimeError(result["err"])
                else:
                    loop.run_until_complete(_run())
            except Exception as e2:
                logger.error(f"TTS 合成失败: {e2}")
                return None

        if output_path.exists() and output_path.stat().st_size > 0:
            logger.success(f"TTS 配音完成 -> {output_path}")
            return output_path
        return None
