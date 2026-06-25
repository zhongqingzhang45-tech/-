export interface ImageAnalysisResult {
  type: "emoji" | "photo" | "screenshot" | "meme" | "unknown";
  mood: "happy" | "sad" | "angry" | "neutral" | "surprised" | "love";
  description: string;
  keywords: string[];
  confidence: number;
}

const emojiPatterns: Record<string, { mood: ImageAnalysisResult["mood"]; keywords: string[] }> = {
  "😊": { mood: "happy", keywords: ["开心", "笑脸", "微笑"] },
  "😢": { mood: "sad", keywords: ["难过", "哭", "伤心"] },
  "😡": { mood: "angry", keywords: ["生气", "愤怒"] },
  "😍": { mood: "love", keywords: ["喜欢", "爱", "花痴"] },
  "😮": { mood: "surprised", keywords: ["惊讶", "吃惊"] },
  "😂": { mood: "happy", keywords: ["笑", "开心", "搞笑"] },
  "🥺": { mood: "sad", keywords: ["委屈", "可怜", "求"] },
  "😏": { mood: "neutral", keywords: ["得意", "坏笑"] },
  "😭": { mood: "sad", keywords: ["大哭", "难过"] },
  "🤔": { mood: "neutral", keywords: ["思考", "疑惑"] },
  "😴": { mood: "neutral", keywords: ["睡觉", "困"] },
  "😜": { mood: "happy", keywords: ["调皮", "鬼脸"] },
  "❤️": { mood: "love", keywords: ["爱心", "爱"] },
  "👍": { mood: "happy", keywords: ["赞", "好的", "厉害"] },
  "🌹": { mood: "love", keywords: ["玫瑰", "花", "浪漫"] },
};

export class ImageRecognition {
  private imageCache: Map<string, ImageAnalysisResult> = new Map();

  analyzeImage(imageUrl: string): ImageAnalysisResult {
    if (this.imageCache.has(imageUrl)) {
      return this.imageCache.get(imageUrl)!;
    }

    const result = this.simulateAnalysis(imageUrl);
    this.imageCache.set(imageUrl, result);
    return result;
  }

  analyzeEmoji(emoji: string): ImageAnalysisResult {
    const pattern = emojiPatterns[emoji];
    if (pattern) {
      return {
        type: "emoji",
        mood: pattern.mood,
        description: `识别到表情：${emoji}`,
        keywords: pattern.keywords,
        confidence: 0.95,
      };
    }

    return {
      type: "emoji",
      mood: "neutral",
      description: `识别到表情符号`,
      keywords: ["表情"],
      confidence: 0.7,
    };
  }

  private simulateAnalysis(imageUrl: string): ImageAnalysisResult {
    const types: ImageAnalysisResult["type"][] = ["photo", "meme", "screenshot", "unknown"];
    const moods: ImageAnalysisResult["mood"][] = ["happy", "sad", "neutral", "surprised", "love"];
    
    const type = types[Math.floor(Math.random() * types.length)];
    const mood = moods[Math.floor(Math.random() * moods.length)];
    const confidence = 0.6 + Math.random() * 0.3;

    let description = "";
    const keywords: string[] = [];

    switch (type) {
      case "photo":
        description = "看起来是一张照片";
        keywords.push("照片", "图片");
        break;
      case "meme":
        description = "这是一张表情包/梗图吧？";
        keywords.push("表情包", "梗图", "搞笑");
        break;
      case "screenshot":
        description = "像是截图呢";
        keywords.push("截图", "屏幕");
        break;
      default:
        description = "我看到了一张图片";
        keywords.push("图片");
    }

    switch (mood) {
      case "happy":
        description += " 感觉氛围挺开心的～";
        keywords.push("开心", "愉快");
        break;
      case "sad":
        description += " 有点淡淡的忧伤...";
        keywords.push("难过", "忧伤");
        break;
      case "love":
        description += " 好温暖的感觉～";
        keywords.push("温暖", "有爱");
        break;
      case "surprised":
        description += " 哇，好惊喜的样子！";
        keywords.push("惊喜", "意外");
        break;
      default:
        break;
    }

    return {
      type,
      mood,
      description,
      keywords,
      confidence,
    };
  }

  detectEmojis(text: string): string[] {
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F680}-\u{1F6FF}]/gu;
    const matches = text.match(emojiRegex);
    return matches || [];
  }
}

export const imageRecognition = new ImageRecognition();
