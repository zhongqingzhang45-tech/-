"""日志配置"""
import sys
from loguru import logger

from config import Config


def setup_logger(log_level: str = "INFO"):
    logger.remove()
    logger.add(
        sys.stdout,
        level=log_level,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
               "<level>{level:<7}</level> | "
               "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
               "<level>{message}</level>",
    )
    logger.add(
        Config.LOG_DIR / "runtime_{time:YYYY-MM-DD}.log",
        level=log_level,
        rotation="10 MB",
        retention="14 days",
        encoding="utf-8",
    )
    return logger


setup_logger(Config.LOG_LEVEL)
