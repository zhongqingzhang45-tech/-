import { LLMConfig, LLMResponse, ChatMessage, LLMProviderInterface } from "../types";

export class OpenAIProvider implements LLMProviderInterface {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = {
      ...config,
      model: config.model || "gpt-3.5-turbo",
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 1000,
      baseUrl: config.baseUrl || "https://api.openai.com/v1",
    };
  }

  async generate(messages: ChatMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse> {
    const mergedConfig = { ...this.config, ...config };

    try {
      const response = await fetch(`${mergedConfig.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mergedConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: mergedConfig.model,
          messages,
          temperature: mergedConfig.temperature,
          max_tokens: mergedConfig.maxTokens,
          top_p: mergedConfig.topP,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();

      return {
        content: data.choices[0]?.message?.content || "",
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        model: data.model,
      };
    } catch (error) {
      throw new Error(`OpenAI request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async *stream(messages: ChatMessage[], config?: Partial<LLMConfig>): AsyncIterable<string> {
    const mergedConfig = { ...this.config, ...config };

    const response = await fetch(`${mergedConfig.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mergedConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: mergedConfig.model,
        messages,
        temperature: mergedConfig.temperature,
        max_tokens: mergedConfig.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI stream error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // ignore parse errors for individual chunks
        }
      }
    }
  }
}
