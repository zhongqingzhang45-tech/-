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

    # ---- Mock 模式：无 Key 时返回上下文相关的占位 JSON ----
    def _mock_response(self, messages: List[Dict[str, str]]) -> str:
        import json
        system = ""
        for m in messages:
            if m.get("role") == "system":
                system = m.get("content", "")
                break
        if "小红书" in system or "xhs" in system.lower():
            return json.dumps({
                "title": "夏天这件防晒衣真的绝！",
                "body": "姐妹们！这件防晒衣也太好穿了吧！\n\n冰丝面料上身超凉快，一点都不闷热~UPF50+防紫外线，夏天再也不怕晒黑啦！\n\n关键是颜值也很高，随便搭配都好看！\n\n推荐指数：⭐⭐⭐⭐⭐",
                "call_to_action": "想要同款的评论区扣1！",
                "tags": ["防晒衣", "夏季穿搭", "好物推荐", "平价好物", "防晒分享"],
                "cart_text": "戳小黄车 get 同款防晒衣！",
            }, ensure_ascii=False)
        if "口播" in system or "短视频" in system or "视频" in system:
            return json.dumps({
                "script": [
                    {"line": "姐妹们！夏天到了，防晒你做好了吗？", "duration": 3.0},
                    {"line": "今天给你们安利这款防晒衣！", "duration": 2.5},
                    {"line": "UPF50+，防紫外线效果超好！", "duration": 3.0},
                    {"line": "冰丝面料，上身超级凉快！", "duration": 2.5},
                    {"line": "而且颜值超高，随便搭配都好看！", "duration": 3.0},
                    {"line": "价格也很实惠，性价比绝了！", "duration": 3.0},
                    {"line": "心动不如行动，戳下方小黄车！", "duration": 3.0},
                    {"line": "关注我，每天带你发现好物！", "duration": 3.0},
                ],
                "total_duration": 23.0,
            }, ensure_ascii=False)
        # 默认：商品分析
        return json.dumps({
            "pain_points": ["质量一般", "价格偏贵", "效果不明显"],
            "selling_points": ["品质优秀", "价格实惠", "颜值在线", "性价比高"],
            "use_scenarios": ["日常通勤", "户外运动", "旅行出行"],
            "target_audience": ["上班族", "学生党", "年轻女性"],
            "buy_reasons": ["大牌品质", "限时优惠", "口碑推荐"],
            "advantages": ["正品保障", "七天无理由", "退换无忧"],
            "emotion_triggers": ["种草分享", "限时焦虑", "社交认同"],
        }, ensure_ascii=False)


_default_client: Optional[DeepSeekClient] = None


def get_client() -> DeepSeekClient:
    global _default_client
    if _default_client is None:
        _default_client = DeepSeekClient()
    return _default_client
