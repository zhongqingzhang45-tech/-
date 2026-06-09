# 全局配置管理
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from loguru import logger

BASE_DIR = Path(__file__).resolve().parent.parent

_ENV_FILE = BASE_DIR / ".env"
if _ENV_FILE.exists():
    load_dotenv(_ENV_FILE)
    logger.info(f"Loaded env from {_ENV_FILE}")
else:
    load_dotenv()
    logger.warning(".env file not found, using environment variables")


def get_env(key: str, default: Optional[str] = None) -> Optional[str]:
    return os.getenv(key, default)


def get_env_int(key: str, default: int = 0) -> int:
    val = get_env(key)
    try:
        return int(val) if val else default
    except (TypeError, ValueError):
        return default


def get_env_bool(key: str, default: bool = False) -> bool:
    val = get_env(key)
    if val is None:
        return default
    return val.lower() in ("1", "true", "yes", "y", "on")


class Config:
    BASE_DIR = BASE_DIR
    DATA_DIR = BASE_DIR / "data"
    OUTPUT_DIR = BASE_DIR / "output"
    LOG_DIR = BASE_DIR / "logs"

    for _d in (DATA_DIR, OUTPUT_DIR, LOG_DIR):
        _d.mkdir(parents=True, exist_ok=True)

    IMAGE_DIR = OUTPUT_DIR / "images"
    VIDEO_DIR = OUTPUT_DIR / "videos"
    AUDIO_DIR = OUTPUT_DIR / "audio"
    SRT_DIR = OUTPUT_DIR / "srt"
    for _d in (IMAGE_DIR, VIDEO_DIR, AUDIO_DIR, SRT_DIR):
        _d.mkdir(parents=True, exist_ok=True)

    DATABASE_URL = get_env("DATABASE_URL", f"sqlite:///{BASE_DIR}/marketing_agent.db")

    DEEPSEEK_API_KEY = get_env("DEEPSEEK_API_KEY", "")
    DEEPSEEK_BASE_URL = get_env("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    DEEPSEEK_MODEL = get_env("DEEPSEEK_MODEL", "deepseek-chat")
    DEEPSEEK_TEMPERATURE = 0.7
    DEEPSEEK_MAX_TOKENS = 4000

    TTS_VOICE = get_env("TTS_VOICE", "zh-CN-XiaoxiaoNeural")
    TTS_RATE = get_env("TTS_RATE", "+0%")
    TTS_VOLUME = get_env("TTS_VOLUME", "+0%")

    PROXY_HTTP = get_env("PROXY_HTTP", "")
    PROXY_HTTPS = get_env("PROXY_HTTPS", "")

    LOG_LEVEL = get_env("LOG_LEVEL", "INFO")

    @classmethod
    def proxies(cls) -> dict:
        p = {}
        if cls.PROXY_HTTP:
            p["http"] = cls.PROXY_HTTP
        if cls.PROXY_HTTPS:
            p["https"] = cls.PROXY_HTTPS
        return p
