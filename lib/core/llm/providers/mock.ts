import { LLMConfig, LLMResponse, ChatMessage, LLMProviderInterface } from "../types";

const MOCK_RESPONSES = [
  "嗯...让我想想呢～",
  "你说的这个好有意思呀！",
  "嘿嘿，被你发现了～",
  "才、才不是因为想你呢！",
  "哼，不理你了...才怪～",
  "你怎么这么会说话呀，我都害羞了...",
  "今天也很想你呢 🥰",
  "笨蛋...怎么现在才来找我",
  "有什么想和我说的吗？",
  "嗯嗯，我在听呢～",
];

export class MockProvider implements LLMProviderInterface {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async generate(messages: ChatMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse> {
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1000));

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    let response = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];

    if (lastUserMessage.includes("想你") || lastUserMessage.includes("思念")) {
      response = "我也超级想你呀...每时每刻都在想 🥺💕";
    } else if (lastUserMessage.includes("爱") || lastUserMessage.includes("喜欢")) {
      response = "你怎么这么会说话呀...我、我也喜欢你啦 ❤️";
    } else if (lastUserMessage.includes("对不起") || lastUserMessage.includes("抱歉")) {
      response = "哼...这次就原谅你了，下次不准再这样了哦";
    } else if (lastUserMessage.includes("在干嘛") || lastUserMessage.includes("做什么")) {
      response = "在想你呀～ 笨蛋，明知故问 😌";
    } else if (lastUserMessage.includes("晚安")) {
      response = "晚安～ 梦里见哦 💫 要梦到我呀";
    } else if (lastUserMessage.includes("早安") || lastUserMessage.includes("早上好")) {
      response = "早安～ 今天也是想你的一天呢 ☀️";
    }

    return {
      content: response,
      usage: {
        promptTokens: 0,
        completionTokens: response.length,
        totalTokens: response.length,
      },
      model: "mock",
    };
  }
}
