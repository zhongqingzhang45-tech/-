export type LLMProvider = "openai" | "anthropic" | "azure" | "deepseek" | "qwen" | "glm" | "mock";

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
}

export interface LLMProviderInterface {
  generate(messages: ChatMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse>;
  stream?(messages: ChatMessage[], config?: Partial<LLMConfig>): AsyncIterable<string>;
}

export interface CharacterPromptOptions {
  name: string;
  nickname: string;
  userNickname: string;
  persona: string;
  speakingStyle: string;
  personality: string;
  currentMood: string;
  relationshipType: string;
  affectionLevel: number;
  recentMemories?: string[];
}
