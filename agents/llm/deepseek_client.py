"""DeepSeek LLM 客户端封装"""
from typing import List, Dict, Any, Optional
from tenacity import retry, stop_after_attempt, wait_exponential
from loguru import logger

from config import Config
from utils.common import safe_json_parse


class DeepSeekClient:
    def __init__(
        self,
        api_key: str = None,
        base_url: str = None,
        model: str = None,
        temperature: float = None,
        max_tokens: int = None,
    ):
        self.api_key = api_key or Config.DEEPSEEK_API_KEY
        self.base_url = base_url or Config.DEEPSEEK_BASE_URL
        self.model = model or Config.DEEPSEEK_MODEL
        self.temperature = temperature or Config.DEEPSEEK_TEMPERATURE
        self.max_tokens = max_tokens or Config.DEEPSEEK_MAX_TOKENS

        if not self.api_key:
            logger.warning("DeepSeek API Key 未配置，将使用 Mock 模式返回占位数据")

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8))
    def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        if not self.api_key:
            return self._mock_response(messages)

        import requests
        payload = {
            "model": kwargs.pop("model", self.model),
            "messages": messages,
            "temperature": kwargs.pop("temperature", self.temperature),
            "max_tokens": kwargs.pop("max_tokens", self.max_tokens),
            **kwargs,
        }
        url = f"{self.base_url.rstrip('/')}/chat/completions"
        resp = requests.post(url, headers=self._headers(), json=payload, timeout=120)
        resp.raise_for_status()
        data = resp.json()
        try:
            content = data["choices"][0]["message"]["content"]
            return content.strip()
        except (KeyError, IndexError) as e:
            logger.error(f"Unexpected DeepSeek response: {data}")
            raise RuntimeError(f"Invalid response: {e}")

    def chat_json(self, system_prompt: str, user_prompt: str, **kwargs) -> Any:
        """返回 JSON 对象"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        raw = self.chat(messages, **kwargs)
        parsed = safe_json_parse(raw)
        if parsed is None:
            logger.warning(f"DeepSeek 返回非 JSON 内容: {raw[:200]}")
            return {}
        return parsed

    def chat_text(self, system_prompt: str, user_prompt: str, **kwargs) -> str:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        return self.chat(messages, **kwargs)

    # ---- Mock 模式：无 Key 时占位 ----
    @staticmethod
    def _mock_response(messages: List[Dict[str, str]]) -> str:
        last = messages[-1]["content"] if messages else ""
        return (
            "【Mock 响应】当前未配置 DeepSeek API Key，以下为占位内容。\n\n"
            "这是一款非常好用的产品，强烈推荐大家购买！\n\n"
            "亮点：\n"
            "1. 品质优秀\n"
            "2. 价格实惠\n"
            "3. 颜值在线\n\n"
            "#好物推荐 #性价比 #种草"
        )


_default_client: Optional[DeepSeekClient] = None


def get_client() -> DeepSeekClient:
    global _default_client
    if _default_client is None:
        _default_client = DeepSeekClient()
    return _default_client
