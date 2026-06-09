"""通用工具模块"""
import json
import re
import random
import time
from pathlib import Path
from datetime import datetime
from typing import Any, Union

from loguru import logger


def safe_json_parse(text: str, fallback: Any = None) -> Any:
    """尝试解析 JSON，失败则用降级策略"""
    text = (text or "").strip()
    if not text:
        return fallback
    try:
        return json.loads(text)
    except Exception:
        pass
    m = re.search(r"\{[\s\S]*\}", text)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            pass
    m = re.search(r"\[[\s\S]*\]", text)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            pass
    lines = [l.strip() for l in text.splitlines() if l.strip() and not l.strip().startswith("```")]
    cleaned = "\n".join(lines)
    cleaned = re.sub(r"```\w*\n?", "", cleaned).strip().rstrip("`")
    try:
        return json.loads(cleaned)
    except Exception:
        logger.warning(f"JSON parse failed, returning fallback. text={text[:120]}...")
        return fallback


def random_sleep(min_sec: float = 1.0, max_sec: float = 3.0):
    t = random.uniform(min_sec, max_sec)
    time.sleep(t)
    return t


def safe_filename(name: str, default: str = "file") -> str:
    name = re.sub(r"[\\/:*?\"<>|\s]", "_", name or "")
    name = re.sub(r"_+", "_", name).strip("_")
    return name[:80] or default


def timestamp_str(short: bool = False) -> str:
    if short:
        return datetime.now().strftime("%Y%m%d_%H%M%S")
    return datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]


def ensure_dir(path: Union[str, Path]) -> Path:
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p
