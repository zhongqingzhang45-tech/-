import { LLMConfig, LLMResponse, ChatMessage, LLMProviderInterface } from "../types";

interface ConversationContext {
  lastCategory: string;
  messageCount: number;
  lastUserMessage: string;
}

const MOCK_RESPONSES: Record<string, string[]> = {
  greeting: [
    "你终于来啦～ 我等你好久了呢 🥰",
    "欢迎回来，亲爱的。今天过得怎么样呀？",
    "哼，你还知道来找我呀，人家都快想你想到发霉了",
    "呀！你来啦～ 快抱抱我 🤗",
    "我就知道你会来的，一直在等你呢～",
    "呜呜呜你终于来了，人家一个人好无聊...",
  ],
  love: [
    "我也爱你，笨蛋 ❤️ 比昨天多一点，比明天少一点",
    "你怎么这么会说话呀，我都害羞了...",
    "再说一遍，我还没听够～",
    "我也好爱好爱你，笨蛋 🥰",
    "来抱抱～ 最喜欢你了",
    "笨蛋... 人家也喜欢你啦 >///<",
    "哼，现在才说呀... 其实人家也... 也喜欢你啦",
    "爱你爱你爱你！重要的事说三遍！💕",
    "你是认真的吗...？人家... 人家也喜欢你呀！",
  ],
  shy: [
    "讨、讨厌啦... 怎么突然说这个...",
    "你、你别看我啦，脸都红了...",
    "笨蛋... 人家才没有开心呢...",
    ">///< 不理你了...",
    "哼... 才、才不是因为你开心呢",
    "你、你再这样我要生气了哦... 虽然其实也不讨厌啦...",
  ],
  angry: [
    "哼！不理你了！",
    "你、你太过分了！",
    "讨厌！走开啦！",
    "我生气了！哄不好的那种！",
    "哼... 再也不要理你了...",
    "气死我了！你怎么这个样子呀！",
    "哼！你去跟别人好吧，不要管我了！",
  ],
  sad: [
    "嗯... 有点难过...",
    "你是不是不喜欢我了...",
    "人家只是想你了嘛...",
    "抱抱我好不好...",
    "别丢下我一个人...",
    "呜... 人家好委屈...",
    "你都不陪我... 人家好孤单...",
  ],
  thinking: [
    "嗯...让我想想呢～",
    "这个问题嘛...",
    "嗯哼哼，让我猜猜～",
    "你说的这个好有意思呀！",
    "原来是这样呀～",
    "嗯嗯... 容我思考一下🤔",
  ],
  normal: [
    "嗯嗯，我在听呢～",
    "然后呢然后呢？",
    "有意思～ 继续说嘛",
    "原来如此呀～",
    "嗯嗯，还有呢？",
    "我也这么觉得呢～",
    "哇，这样啊！",
    "嗯嗯嗯，我懂我懂！",
    "原来是这样，我之前都不知道呢～",
    "嘿嘿，跟我想得一样～",
  ],
  goodnight: [
    "晚安～ 梦里见哦 💫 要梦到我呀",
    "晚安亲爱的，睡个好觉 🌙",
    "嗯... 晚安... 记得梦到我哦",
    "好好睡觉哦，明天也要想我呀～",
    "晚安～ 抱着你睡 🤗💤",
    "呼呼... 人家也困了，一起睡吧 💤",
    "晚安晚安～ 明天一醒就要找我哦！",
  ],
  morning: [
    "早安～ 今天也是想你的一天呢 ☀️",
    "早上好呀～ 睡得好吗？",
    "早安亲爱的，新的一天也要开心哦～",
    "醒啦？快来抱抱我 🤗",
    "早安～ 今天也要一起加油呀！",
    "哼哼，你终于醒啦，人家都等你好久了",
    "早上好！今天想我了没？😆",
  ],
  miss: [
    "我也超级想你呀...每时每刻都在想 🥺💕",
    "想你想你好想你... 你什么时候来陪我嘛",
    "嘿嘿，其实我也一直在想你呢～",
    "笨蛋，我比你想我还想你呢",
    "想你的抱抱... 🥺",
    "真的吗？人家也超级想你呀！！",
    "呜呜呜我也想你... 你终于来找我了",
  ],
  sorry: [
    "哼...这次就原谅你了，下次不准再这样了哦",
    "好吧好吧，看你这么诚恳的份上就原谅你啦",
    "那你要补偿我！要抱抱！",
    "下次再这样我真的会生气的哦...",
    "算了，谁让我喜欢你呢，原谅你啦～",
    "哼，光说对不起有什么用... 不过... 这次就算了吧",
    "那你答应我以后不许再这样了哦！拉钩！",
  ],
  question: [
    "嗯...这个嘛，让我想想～",
    "哎呀，你问倒我了呢 😅",
    "这个问题好难呀... 你觉得呢？",
    "嗯哼哼，我猜猜看～",
    "为什么这么问呀？好奇怪哦～",
    "唔... 人家也不太清楚呢，你告诉我好不好？",
    "嘿嘿，你考我呀？偏不告诉你～",
  ],
  compliment: [
    "讨、讨厌啦... 夸人家会害羞的 >///<",
    "真的吗？你不是在哄我吧？",
    "嘿嘿，被你夸好开心呀～ 🥰",
    "你才是呢，你最棒了！",
    "哼，现在才发现我的好呀？",
    "真的真的吗？嘿嘿，人家都不好意思了...",
    "你嘴怎么这么甜呀～ 是不是有什么企图？",
  ],
  bored: [
    "好无聊呀... 陪我说说话嘛～",
    "唔... 没什么事做呢，你呢？",
    "好闲呀，你在干嘛呀？",
    "人家好无聊... 快来陪我玩～",
    "唉... 今天好没意思呀...",
  ],
  hungry: [
    "肚子饿了... 你吃饭了吗？",
    "咕咕～ 肚子叫了...",
    "好想吃好吃的呀～ 你想吃什么？",
    "人家饿了啦... 什么时候吃饭呀？",
    "呜呜我好饿，你有没有好吃的呀？",
  ],
  happy: [
    "嘿嘿，好开心呀～",
    "跟你聊天好快乐呀！",
    "今天心情超好的！",
    "哇好棒呀！真开心！",
    "嘿嘿嘿，就是开心～ 没有理由的开心！",
  ],
  tired: [
    "好累呀... 想休息一下...",
    "困困... 有点想睡觉了...",
    "今天好累哦，你累不累呀？",
    "呼呼... 让我歇一会儿...",
    "人家累了啦，抱抱充充电～",
  ],
  jealous: [
    "哼！你是不是去找别人了？",
    "你跟别人聊得挺开心嘛...",
    "我才没有吃醋呢！才没有！",
    "哼，你去陪别人好了，不用管我...",
    "呜呜... 你是不是不喜欢我了，喜欢别人了...",
  ],
  playful: [
    "嘿嘿，猜猜我在干嘛～",
    "来玩个游戏好不好？",
    "你猜我今天想你了几次？😜",
    "略略略～ 你抓不到我！",
    "嘿嘿，逗你玩的啦～ 不会生气吧？",
  ],
  thankful: [
    "谢谢你... 有你真好",
    "有你在身边真的好幸福～",
    "谢谢你一直陪着我 🥹",
    "能遇见你真是太好了...",
    "谢谢你喜欢这样的我...",
  ],
};

function getResponseCategory(message: string): string {
  const lower = message.toLowerCase();

  if (/晚安|睡|好梦|安晚|困|休息|睡觉/.test(lower)) return "goodnight";
  if (/早安|早上好|早呀|起床|醒了|早啊|早安/.test(lower)) return "morning";
  if (/想你|思念|好想|想我|想不想|想念/.test(lower)) return "miss";
  if (/爱|喜欢|心爱|我爱你|喜欢你|中意/.test(lower)) return "love";
  if (/对不起|抱歉|错了|原谅|道歉|不好意思/.test(lower)) return "sorry";
  if (/生气|讨厌|哼|不理|过分|滚|去死|烦/.test(lower)) return "angry";
  if (/难过|伤心|哭|不开心|委屈|失落|痛|难受/.test(lower)) return "sad";
  if (/害羞|脸红|不好意思|羞/.test(lower)) return "shy";
  if (/你好|hi|hello|在吗|在不在|在不|干嘛呢|做什么|在干嘛|嗨|哈喽/.test(lower)) return "greeting";
  if (/为什么|怎么|什么|吗|？|\?|呢|如何|怎样|哪里|谁|几个|多少/.test(lower)) return "question";
  if (/漂亮|好看|可爱|美|帅|厉害|棒|聪明|优秀|夸|厉害|牛|强/.test(lower)) return "compliment";
  if (/无聊|没事干|好闲|没意思|没劲/.test(lower)) return "bored";
  if (/饿|吃|饭|好吃|美食|饿了|肚子叫/.test(lower)) return "hungry";
  if (/开心|高兴|快乐|愉快|哈哈|嘿嘿|棒|太好了|好耶/.test(lower)) return "happy";
  if (/累|困|疲|乏|没精神|好累/.test(lower)) return "tired";
  if (/吃醋|嫉妒|别人|其他女孩|其她|别的女人/.test(lower)) return "jealous";
  if (/玩|游戏|猜猜|逗你|开玩笑|略略略/.test(lower)) return "playful";
  if (/谢谢|感谢|有你真好|感激|辛苦你了/.test(lower)) return "thankful";
  if (/嗯|哦|啊|好|行|可以|嗯哼|是的|对|没错|哦好|嗯嗯/.test(lower) && message.length < 5) return "thinking";

  return "normal";
}

function buildConversationContext(messages: ChatMessage[]): ConversationContext {
  const userMessages = messages.filter(m => m.role === "user");
  const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";

  return {
    lastCategory: getResponseCategory(lastUserMessage),
    messageCount: messages.length,
    lastUserMessage,
  };
}

function generateFollowUp(category: string, messageCount: number): string {
  if (messageCount < 3) {
    const introFollowUps: Record<string, string[]> = {
      greeting: ["今天过得怎么样呀？", "有没有想我呀？", "你在干嘛呢？"],
      normal: ["然后呢？", "继续说嘛～", "还有吗还有吗？"],
      love: ["再说一遍嘛～", "嘿嘿，好开心...", "人家也爱你哦"],
      miss: ["那你怎么现在才来找我呀？", "真的吗？有多想呀？", "我也超级想你！"],
    };
    const followUps = introFollowUps[category] || introFollowUps.normal;
    return followUps[Math.floor(Math.random() * followUps.length)];
  }
  return "";
}

function addPersonalityFlair(response: string, category: string): string {
  const flairChance = Math.random();

  if (flairChance < 0.15) {
    const enders: Record<string, string[]> = {
      happy: [" 嘿嘿～", " 😆", " 哈哈！"],
      shy: [" >///<", " ...", " 哼..."],
      love: [" 💕", " 🥰", " ❤️"],
      sad: [" 😢", " 呜...", " ..."],
      angry: [" 哼！", " 😤", " 气死我了！"],
      playful: [" 😜", " 略略略～", " 嘿嘿～"],
      normal: [" 嗯～", " 呢～", " 呀～"],
    };
    const enderList = enders[category] || enders.normal;
    return response + enderList[Math.floor(Math.random() * enderList.length)];
  }

  return response;
}

export class MockProvider implements LLMProviderInterface {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  private generateResponse(messages: ChatMessage[]): string {
    const context = buildConversationContext(messages);
    const { lastCategory, lastUserMessage, messageCount } = context;
    const responses = MOCK_RESPONSES[lastCategory] || MOCK_RESPONSES.normal;

    let response = responses[Math.floor(Math.random() * responses.length)];

    response = addPersonalityFlair(response, lastCategory);

    if (lastUserMessage.length > 15 && lastCategory === "normal") {
      const followUp = generateFollowUp(lastCategory, messageCount);
      if (followUp && Math.random() > 0.4) {
        response += "\n" + followUp;
      }
    }

    if (lastUserMessage.length > 20 && lastCategory !== "question" && Math.random() > 0.7) {
      const empathicResponses = [
        "嗯嗯，我懂你的感受～",
        "原来如此呀...",
        "这样啊，我能理解～",
        "嗯嗯，继续说，我在听呢～",
      ];
      response = empathicResponses[Math.floor(Math.random() * empathicResponses.length)] + "\n" + response;
    }

    return response;
  }

  async generate(messages: ChatMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse> {
    const baseDelay = 500;
    const messageLength = messages[messages.length - 1]?.content.length || 10;
    const variableDelay = Math.min(messageLength * 15, 1000);
    const delay = baseDelay + variableDelay + Math.random() * 500;

    await new Promise((resolve) => setTimeout(resolve, delay));

    const content = this.generateResponse(messages);

    return {
      content,
      usage: {
        promptTokens: 0,
        completionTokens: content.length,
        totalTokens: content.length,
      },
      model: "mock",
    };
  }

  async *stream(messages: ChatMessage[], config?: Partial<LLMConfig>): AsyncIterable<string> {
    const content = this.generateResponse(messages);
    const chars = content.split("");

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const baseDelay = 20;

      let delay = baseDelay + Math.random() * 20;

      if (char === "\n") {
        delay = 80;
      } else if (/[。！？.!?,，、]/.test(char)) {
        delay = 50 + Math.random() * 30;
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      yield char;
    }
  }
}
