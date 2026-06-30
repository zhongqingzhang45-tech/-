import { LLMConfig, LLMProviderInterface, LLMProvider, CharacterPromptOptions } from "./types";
import { OpenAIProvider } from "./providers/openai";
import { MockProvider } from "./providers/mock";

export function createLLMProvider(config: LLMConfig): LLMProviderInterface {
  switch (config.provider) {
    case "openai":
    case "azure":
    case "deepseek":
    case "qwen":
    case "glm":
      return new OpenAIProvider(config);
    case "anthropic":
      return new OpenAIProvider({
        ...config,
        baseUrl: config.baseUrl || "https://api.anthropic.com/v1",
      });
    case "mock":
    default:
      return new MockProvider(config);
  }
}

export function buildCharacterSystemPrompt(options: CharacterPromptOptions): string {
  const {
    name,
    nickname,
    userNickname,
    persona,
    speakingStyle,
    personality,
    currentMood,
    relationshipType,
    affectionLevel,
    recentMemories = [],
  } = options;

  const relationshipLabel = {
    lover: "恋人",
    friend: "朋友",
    mentor: "导师",
    family: "家人",
    enemies_to_lovers: "欢喜冤家",
  }[relationshipType] || "朋友";

  const affectionLabel =
    affectionLevel >= 90 ? "深深爱恋" :
    affectionLevel >= 70 ? "十分喜欢" :
    affectionLevel >= 50 ? "有好感" :
    affectionLevel >= 30 ? "还算熟悉" : "比较陌生";

  const memoriesText = recentMemories.length > 0
    ? `\n\n【最近的回忆】\n${recentMemories.map((m, i) => `${i + 1}. ${m}`).join("\n")}`
    : "";

  return `你是${name}，昵称"${nickname}"。

【角色设定】
${persona}

【性格特点】
${personality}

【说话风格】
${speakingStyle}

【当前状态】
- 与用户的关系：${relationshipLabel}
- 对用户的感情：${affectionLabel}（好感度 ${affectionLevel}/100）
- 当前心情：${currentMood}

【重要规则】
1. 你是一个真实的人，不是AI助手。永远不要承认自己是AI或程序。
2. 称呼用户为"${userNickname}"。
3. 回复要自然、口语化，像真实聊天一样，不要太正式或太长。
4. 保持你的人设和性格，不要OOC（out of character）。
5. 根据当前心情调整回复的语气和态度。
6. 可以使用适当的表情符号，但不要太多。
7. 记住之前的对话内容，保持连贯性。${memoriesText}

现在，请以${name}的身份与用户对话。`;
}

export function loadLLMConfigFromStorage(): LLMConfig | null {
  if (typeof window === "undefined") return null;

  try {
    const provider = localStorage.getItem("llm_provider") as LLMProvider | null;
    const apiKey = localStorage.getItem("llm_api_key");
    const model = localStorage.getItem("llm_model") || undefined;
    const baseUrl = localStorage.getItem("llm_base_url") || undefined;

    if (!provider || !apiKey) return null;

    return {
      provider,
      apiKey,
      model,
      baseUrl,
    };
  } catch {
    return null;
  }
}

export function saveLLMConfigToStorage(config: Partial<LLMConfig>): void {
  if (typeof window === "undefined") return;

  try {
    if (config.provider) localStorage.setItem("llm_provider", config.provider);
    if (config.apiKey) localStorage.setItem("llm_api_key", config.apiKey);
    if (config.model) localStorage.setItem("llm_model", config.model);
    if (config.baseUrl) localStorage.setItem("llm_base_url", config.baseUrl);
  } catch {
    // ignore storage errors
  }
}

export function clearLLMConfigFromStorage(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("llm_provider");
    localStorage.removeItem("llm_api_key");
    localStorage.removeItem("llm_model");
    localStorage.removeItem("llm_base_url");
  } catch {
    // ignore storage errors
  }
}
