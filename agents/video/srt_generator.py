"""字幕生成：将文本/脚本转换为 SRT 格式"""
import math
from pathlib import Path
from typing import List, Dict, Any
from utils.common import ensure_dir, timestamp_str
from config import Config


def _format_timestamp(seconds: float) -> str:
    if seconds < 0:
        seconds = 0
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    whole = int(secs)
    millis = int((secs - whole) * 1000)
    return f"{hours:02d}:{minutes:02d}:{whole:02d},{millis:03d}"


def build_srt_from_lines(lines: List[Dict[str, Any]], start_offset: float = 0.0) -> str:
    """根据脚本数组 [{line, duration}, ...] 生成 SRT 文本"""
    chunks = []
    cursor = start_offset
    for i, item in enumerate(lines, start=1):
        text = str(item.get("line", "")).strip()
        dur = float(item.get("duration", 3.0))
        start = cursor
        end = cursor + dur
        chunks.append(f"{i}")
        chunks.append(f"{_format_timestamp(start)} --> {_format_timestamp(end)}")
        chunks.append(text)
        chunks.append("")
        cursor = end
    return "\n".join(chunks)


def build_srt_from_text(text: str, total_duration: float, chars_per_sec: float = 4.0) -> str:
    """从纯文本均匀分句生成 SRT"""
    import re
    text = (text or "").strip()
    sentences = [s for s in re.split(r"[。！？.!?\n]", text) if s.strip()]
    if not sentences:
        return ""
    per_sentence = total_duration / len(sentences)
    lines = [{"line": s, "duration": per_sentence} for s in sentences]
    return build_srt_from_lines(lines)


def save_srt(srt_text: str, name_hint: str = "subtitles") -> Path:
    out_dir = ensure_dir(Config.SRT_DIR)
    path = out_dir / f"{name_hint}_{timestamp_str(short=True)}.srt"
    path.write_text(srt_text, encoding="utf-8")
    return path
