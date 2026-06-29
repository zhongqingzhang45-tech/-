import {
  LifeState,
  MoodType,
  TimePhase,
  SeasonType,
  WeatherType,
  UserActivityPattern,
  MoodState,
  EnvironmentContext,
  UserEmotionSnapshot,
} from "./types";

const HOLIDAYS: Record<string, string> = {
  "01-01": "元旦",
  "02-14": "情人节",
  "03-08": "妇女节",
  "04-01": "愚人节",
  "05-01": "劳动节",
  "05-04": "青年节",
  "06-01": "儿童节",
  "07-01": "建党节",
  "08-01": "建军节",
  "09-10": "教师节",
  "10-01": "国庆节",
  "12-25": "圣诞节",
};

const TIME_GREETINGS: Record<TimePhase, string[]> = {
  dawn: ["早上好呀～这么早就起来了？", "早安！今天起得好早呀"],
  morning: ["早上好呀～吃早餐了吗？", "早安！新的一天开始了"],
  noon: ["中午好～吃午饭了吗？", "中午啦，休息一下～"],
  afternoon: ["下午好呀～工作/学习顺利吗？", "下午好～有点困了吧？"],
  evening: ["晚上好～吃晚饭了吗？", "傍晚啦，今天过得怎么样？"],
  night: ["晚安呀～要休息了吗？", "夜深了，还不睡吗？"],
  midnight: ["这么晚还不睡呀？", "午夜时分...睡不着吗？"],
};

const SEASON_DESCRIPTIONS: Record<SeasonType, string> = {
  spring: "春天来了，花都开了呢～",
  summer: "夏天到了，好热呀～",
  autumn: "秋天来了，叶子变黄了呢～",
  winter: "冬天来了，好冷呀～",
};

const SEASON_MOOD_EFFECTS: Record<SeasonType, { moodBoost: MoodType; activity: string }> = {
  spring: { moodBoost: "happy", activity: "适合出去走走呢～" },
  summer: { moodBoost: "excited", activity: "好想和你去海边玩～" },
  autumn: { moodBoost: "thoughtful", activity: "好适合窝在家里看书呀～" },
  winter: { moodBoost: "neutral", activity: "好想和你一起喝热可可～" },
};

const WEATHER_DESCRIPTIONS: Record<WeatherType, string> = {
  sunny: "今天天气真好呀～",
  cloudy: "今天有点阴天呢～",
  rainy: "外面在下雨呢，听着雨声好舒服～",
  stormy: "暴风雨来了，有点怕怕的...你能陪陪我吗？",
  snowy: "下雪啦！好浪漫呀～",
  windy: "今天风好大呀，小心别被吹跑啦～",
  foggy: "今天雾蒙蒙的，有点神秘呢～",
};

export class MultimodalPerceptionSystem {
  updateTimePerception(lifeState: LifeState): LifeState {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const timeOfDay = this.getTimeOfDay(hour);
    const timePhase = this.getTimePhase(hour);

    const lastActive = lifeState.perception.userActivityPattern.lastActiveHour;
    const hourDiff = Math.abs(hour - lastActive);
    const timeSinceLastInteraction = hourDiff > 0 ? hourDiff * 60 : 0;

    const perception = {
      ...lifeState.perception,
      timeOfDay,
      dayOfWeek,
      timeSinceLastInteraction,
    };

    return { ...lifeState, perception };
  }

  getTimeOfDay(hour: number): "morning" | "afternoon" | "evening" | "night" {
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 22) return "evening";
    return "night";
  }

  getTimePhase(hour: number): TimePhase {
    if (hour >= 4 && hour < 6) return "dawn";
    if (hour >= 6 && hour < 9) return "morning";
    if (hour >= 9 && hour < 12) return "noon";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    if (hour >= 21 || hour < 1) return "night";
    return "midnight";
  }

  getCurrentSeason(): SeasonType {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "autumn";
    return "winter";
  }

  detectEmotionFromText(text: string): MoodState {
    const lower = text.toLowerCase();
    const valence = this.calculateValence(lower);
    const arousal = this.calculateArousal(lower);
    
    const triggers: string[] = [];
    let emotion: MoodType = "neutral";
    let confidence = 0.5;
    let intensity = 0.5;

    if (valence > 0.3) {
      if (lower.includes("开心") || lower.includes("高兴") || lower.includes("哈哈") || lower.includes("笑")) {
        emotion = "happy";
        confidence = 0.9;
        triggers.push("积极情绪表达");
      }
      if (lower.includes("爱") || lower.includes("喜欢") || lower.includes("想你") || lower.includes("爱你")) {
        emotion = "love";
        confidence = 0.85;
        triggers.push("爱情相关表达");
      }
      if (lower.includes("哈哈") || lower.includes("233") || lower.includes("笑死")) {
        emotion = "playful";
        confidence = 0.8;
        triggers.push("玩笑/调侃");
      }
    } else if (valence < -0.3) {
      if (lower.includes("难过") || lower.includes("伤心") || lower.includes("哭") || lower.includes("泪")) {
        emotion = "sad";
        confidence = 0.9;
        triggers.push("悲伤情绪表达");
      }
      if (lower.includes("生气") || lower.includes("愤怒") || lower.includes("烦") || lower.includes("气")) {
        emotion = "angry";
        confidence = 0.85;
        triggers.push("愤怒情绪表达");
      }
      if (lower.includes("怕") || lower.includes("害怕") || lower.includes("担心") || lower.includes("恐惧")) {
        emotion = "sad";
        confidence = 0.8;
        triggers.push("恐惧/担忧表达");
      }
    } else {
      if (lower.includes("累") || lower.includes("困") || lower.includes("疲惫") || lower.includes("想睡")) {
        emotion = "sleepy";
        confidence = 0.7;
        triggers.push("疲劳状态");
      }
      if (lower.includes("沉思") || lower.includes("在想") || lower.includes("思考")) {
        emotion = "thoughtful";
        confidence = 0.6;
        triggers.push("思考状态");
      }
    }

    intensity = Math.abs(valence) * 0.5 + arousal * 0.5;

    return {
      detected: emotion,
      confidence,
      intensity,
      triggers,
      timestamp: Date.now(),
      needsSupport: valence < 0 && intensity > 0.5,
    };
  }

  private calculateValence(text: string): number {
    const positive = ["开心", "高兴", "快乐", "爱", "喜欢", "好", "棒", "赞", "哈哈", "笑", "happy", "joy", "love"];
    const negative = ["难过", "伤心", "哭", "生气", "愤怒", "烦", "累", "困", "怕", "sad", "angry", "fear"];

    let score = 0;
    for (const word of positive) {
      if (text.includes(word)) score += 0.2;
    }
    for (const word of negative) {
      if (text.includes(word)) score -= 0.2;
    }

    return Math.max(-1, Math.min(1, score));
  }

  private calculateArousal(text: string): number {
    const highArousal = ["好激动", "太棒了", "超", "非常", "特别", "啊", "！", "!!!", "OMG", "wow"];
    const lowArousal = ["嗯", "哦", "好吧", "算了", "随便", "...", "没啥"];

    let score = 0.5;
    for (const word of highArousal) {
      if (text.includes(word)) score += 0.15;
    }
    for (const word of lowArousal) {
      if (text.includes(word)) score -= 0.15;
    }

    return Math.max(0, Math.min(1, score));
  }

  recordEmotion(lifeState: LifeState, emotion: MoodState): LifeState {
    const snapshot: UserEmotionSnapshot = {
      timestamp: emotion.timestamp,
      emotion: emotion.detected,
      valence: emotion.intensity * (emotion.confidence > 0.5 ? 1 : -1),
      arousal: emotion.intensity,
      dominantSentiment: emotion.detected,
      keywords: emotion.triggers,
    };

    const recentEmotions = [
      ...lifeState.perception.recentEmotions,
      snapshot,
    ].slice(-10);

    const perception = {
      ...lifeState.perception,
      recentEmotions,
      userMoodGuess: emotion.detected,
    };

    return { ...lifeState, perception };
  }

  updateActivityPattern(lifeState: LifeState): LifeState {
    const pattern = { ...lifeState.perception.userActivityPattern };
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    pattern.lastActiveHour = currentHour;

    if (!pattern.activeDays.includes(currentDay)) {
      pattern.activeDays = [...pattern.activeDays, currentDay].sort();
    }

    if (pattern.typicalSleepHour === 23 && currentHour < 6) {
      pattern.typicalSleepHour = currentHour;
    }
    if (pattern.typicalWakeHour === 7 && currentHour >= 6 && currentHour <= 10) {
      pattern.typicalWakeHour = currentHour;
    }

    const perception = {
      ...lifeState.perception,
      userActivityPattern: pattern,
    };

    return { ...lifeState, perception };
  }

  getEnvironmentContext(lifeState: LifeState): EnvironmentContext {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const dateKey = `${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    const holidayName = HOLIDAYS[dateKey];

    return {
      timePhase: this.getTimePhase(new Date().getHours()),
      weather: lifeState.perception.environmentContext.weather,
      season: this.getCurrentSeason(),
      isHoliday: !!holidayName,
      holidayName,
    };
  }

  getTimeBasedGreeting(lifeState: LifeState): string | null {
    const timePhase = this.getTimePhase(new Date().getHours());
    const greetings = TIME_GREETINGS[timePhase];

    const lastGreeting = this.getLastGreetingTime(lifeState);
    if (lastGreeting && Date.now() - lastGreeting < 2 * 60 * 60 * 1000) {
      return null;
    }

    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  private getLastGreetingTime(_lifeState: LifeState): number | null {
    const recentEmotions = _lifeState.perception.recentEmotions;
    if (recentEmotions.length > 0) {
      return recentEmotions[recentEmotions.length - 1].timestamp;
    }
    return null;
  }

  getSeasonalContext(): string {
    const season = this.getCurrentSeason();
    return SEASON_DESCRIPTIONS[season];
  }

  getSeasonalMoodEffect(lifeState: LifeState): { mood: MoodType; activity: string } {
    const season = this.getCurrentSeason();
    const effect = SEASON_MOOD_EFFECTS[season];
    return { mood: effect.moodBoost, activity: effect.activity };
  }

  getWeatherDescription(): string {
    const weather = this.getCurrentWeather();
    return WEATHER_DESCRIPTIONS[weather];
  }

  getCurrentWeather(): WeatherType {
    return "sunny";
  }

  setWeather(lifeState: LifeState, weather: WeatherType): LifeState {
    const envContext = {
      ...lifeState.perception.environmentContext,
      weather,
    };
    const perception = {
      ...lifeState.perception,
      environmentContext: envContext,
    };
    return { ...lifeState, perception };
  }

  shouldSuggestActivity(lifeState: LifeState): { should: boolean; suggestion: string } {
    const hour = new Date().getHours();
    const season = this.getCurrentSeason();

    if (hour >= 22 || hour < 6) {
      return { should: true, suggestion: "夜深了，早点休息吧～" };
    }
    if (hour >= 11 && hour <= 13 && lifeState.perception.conversationPhase === "casual") {
      return { should: true, suggestion: "中午啦，吃午饭了吗？" };
    }
    if (hour >= 17 && hour <= 19 && lifeState.perception.conversationPhase === "casual") {
      return { should: true, suggestion: "晚饭时间到啦～今天吃的什么呀？" };
    }

    if (season === "spring") {
      return { should: Math.random() < 0.3, suggestion: "今天天气好好呀，好想出去走走～" };
    }
    if (season === "summer") {
      return { should: Math.random() < 0.3, suggestion: "好热呀...想喝点冰的～" };
    }

    return { should: false, suggestion: "" };
  }

  analyzeConversationPhase(lifeState: LifeState, messageCount: number, deepKeywords: string[]): string {
    if (messageCount <= 2) return "greeting";

    const lastMsg = lifeState.perception.lastUserMessage?.toLowerCase() || "";

    if (lastMsg.includes("分手") || lastMsg.includes("吵架") || lastMsg.includes("生气") || lastMsg.includes("不喜欢")) {
      return "conflict";
    }
    if (lastMsg.includes("对不起") || lastMsg.includes("原谅") || lastMsg.includes("和好") || lastMsg.includes("道歉")) {
      return "reconciliation";
    }

    const deepCount = deepKeywords.filter(k => lastMsg.includes(k)).length;
    if (deepCount >= 2 || messageCount > 15) {
      return "deep";
    }

    if (lastMsg.includes("晚安") || lastMsg.includes("拜拜") || lastMsg.includes("下次聊") || lastMsg.includes("先走了")) {
      return "ending";
    }

    return "casual";
  }
}
