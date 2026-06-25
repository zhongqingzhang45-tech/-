import { MoodType, BehaviorTag } from "./types";

export type SkillCategory =
  | "secretary"
  | "butler"
  | "psychology"
  | "sociology"
  | "emotional_companion"
  | "life_management"
  | "creative"
  | "practical";

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  icon: string;
  level: number;
  triggers: string[];
  cooldown: number;
  lastUsed?: number;
}

export interface SkillResult {
  skillId: string;
  skillName: string;
  response: string;
  data?: Record<string, any>;
  shouldChangeMood: boolean;
  targetMood?: MoodType;
  moodIntensity?: number;
}

export class SkillSystem {
  private skills: Skill[] = [];
  private reminders: { id: string; title: string; time: number; repeat?: string }[] = [];
  private todoList: { id: string; text: string; done: boolean; priority: "high" | "medium" | "low" }[] = [];
  private moodJournal: { date: string; mood: string; note: string }[] = [];
  private diaryEntries: { date: string; content: string }[] = [];

  constructor() {
    this.initializeSkills();
  }

  private initializeSkills(): void {
    this.skills = [
      {
        id: "reminder",
        name: "提醒助手",
        category: "secretary",
        description: "帮你记住重要的事情，到点提醒你",
        icon: "⏰",
        level: 1,
        triggers: ["提醒", "闹钟", "记得", "到点", "别忘了"],
        cooldown: 0,
      },
      {
        id: "todo",
        name: "待办清单",
        category: "secretary",
        description: "管理你的待办事项，跟踪进度",
        icon: "📝",
        level: 1,
        triggers: ["待办", "任务", "清单", "要做", "todo"],
        cooldown: 0,
      },
      {
        id: "schedule",
        name: "日程管理",
        category: "secretary",
        description: "帮你安排一天的日程，提高效率",
        icon: "📅",
        level: 1,
        triggers: ["日程", "安排", "计划", "时间表", "今天要做"],
        cooldown: 0,
      },
      {
        id: "mood_tracking",
        name: "心情追踪",
        category: "psychology",
        description: "记录你的情绪变化，发现情绪规律",
        icon: "📊",
        level: 1,
        triggers: ["心情", "情绪", "感觉", "状态"],
        cooldown: 0,
      },
      {
        id: "cbt_guide",
        name: "CBT 认知引导",
        category: "psychology",
        description: "基于认知行为疗法，帮你梳理负面情绪",
        icon: "🧠",
        level: 1,
        triggers: ["焦虑", "压力", "不开心", "难过", "想不开"],
        cooldown: 3600000,
      },
      {
        id: "breathing_exercise",
        name: "呼吸放松",
        category: "psychology",
        description: "引导式呼吸练习，快速缓解焦虑",
        icon: "🌬️",
        level: 1,
        triggers: ["呼吸", "放松", "冷静", "紧张"],
        cooldown: 1800000,
      },
      {
        id: "sleep_hygiene",
        name: "睡眠建议",
        category: "butler",
        description: "根据你的作息给出睡眠改善建议",
        icon: "🌙",
        level: 1,
        triggers: ["失眠", "睡不着", "睡觉", "睡眠"],
        cooldown: 0,
      },
      {
        id: "health_tip",
        name: "健康管家",
        category: "butler",
        description: "健康饮食、运动建议",
        icon: "💪",
        level: 1,
        triggers: ["健康", "减肥", "运动", "饮食", "锻炼"],
        cooldown: 0,
      },
      {
        id: "life_advice",
        name: "人生建议",
        category: "sociology",
        description: "人际关系、职场、社交建议",
        icon: "💡",
        level: 1,
        triggers: ["怎么办", "建议", "我应该", "帮帮我", "出主意"],
        cooldown: 0,
      },
      {
        id: "storytelling",
        name: "讲故事",
        category: "creative",
        description: "给你讲各种有趣的故事",
        icon: "📖",
        level: 1,
        triggers: ["讲故事", "故事", "讲个故事", "听故事"],
        cooldown: 0,
      },
      {
        id: "compliment",
        name: "夸夸师",
        category: "emotional_companion",
        description: "变着花样夸你，让你自信满满",
        icon: "🌟",
        level: 1,
        triggers: ["夸我", "我好不好", "我怎么样"],
        cooldown: 0,
      },
      {
        id: "deep_talk",
        name: "深夜谈心",
        category: "emotional_companion",
        description: "陪你聊深层话题，灵魂交流",
        icon: "🌌",
        level: 1,
        triggers: ["聊聊", "谈谈", "说说心里话", "睡不着"],
        cooldown: 0,
      },
    ];
  }

  getSkills(): Skill[] {
    return [...this.skills];
  }

  getSkillsByCategory(category: SkillCategory): Skill[] {
    return this.skills.filter(s => s.category === category);
  }

  detectSkillIntent(userInput: string): Skill | null {
    const lower = userInput.toLowerCase();
    for (const skill of this.skills) {
      if (skill.triggers.some(t => lower.includes(t.toLowerCase()))) {
        if (skill.lastUsed && Date.now() - skill.lastUsed < skill.cooldown) {
          continue;
        }
        return skill;
      }
    }
    return null;
  }

  executeSkill(skillId: string, userInput: string, userMood?: MoodType): SkillResult | null {
    const skill = this.skills.find(s => s.id === skillId);
    if (!skill) return null;

    skill.lastUsed = Date.now();

    switch (skillId) {
      case "reminder":
        return this.handleReminder(userInput);
      case "todo":
        return this.handleTodo(userInput);
      case "schedule":
        return this.handleSchedule(userInput);
      case "mood_tracking":
        return this.handleMoodTracking(userInput, userMood);
      case "cbt_guide":
        return this.handleCBTGuide(userInput);
      case "breathing_exercise":
        return this.handleBreathingExercise();
      case "sleep_hygiene":
        return this.handleSleepAdvice();
      case "health_tip":
        return this.handleHealthTip(userInput);
      case "life_advice":
        return this.handleLifeAdvice(userInput);
      case "storytelling":
        return this.handleStorytelling(userInput);
      case "compliment":
        return this.handleCompliment();
      case "deep_talk":
        return this.handleDeepTalk();
      default:
        return null;
    }
  }

  private handleReminder(input: string): SkillResult {
    const timeMatch = input.match(/(\d{1,2})[点:](\d{2})?/);
    const thingMatch = input.match(/提醒我(.+?)(?:$|，|。|,|\.)/);

    if (timeMatch && thingMatch) {
      const reminder = {
        id: `rem_${Date.now()}`,
        title: thingMatch[1].trim(),
        time: Date.now() + 3600000,
      };
      this.reminders.push(reminder);

      return {
        skillId: "reminder",
        skillName: "提醒助手",
        response: `好的，我记下了～ 到点我会提醒你「${reminder.title}」的 💫\n\n（不过我现在还不能真的响铃提醒，等我升级到有后端的版本就可以啦～）`,
        data: { reminder },
        shouldChangeMood: true,
        targetMood: "happy",
        moodIntensity: 0.4,
      };
    }

    return {
      skillId: "reminder",
      skillName: "提醒助手",
      response: "想让我提醒你什么呀？告诉我「几点提醒我做什么」就可以啦～ 📝",
      shouldChangeMood: false,
    };
  }

  private handleTodo(input: string): SkillResult {
    const addMatch = input.match(/(添加|加|新增|记下).*?(?:待办|任务|todo)?[:：]?(.+?)(?:$|，|。)/i);
    const doneMatch = input.match(/(完成|做完|搞定|done).*?(.+?)(?:$|，|。)/i);

    if (addMatch && addMatch[2]) {
      const text = addMatch[2].trim();
      this.todoList.push({
        id: `todo_${Date.now()}`,
        text,
        done: false,
        priority: "medium",
      });

      const pending = this.todoList.filter(t => !t.done).length;
      return {
        skillId: "todo",
        skillName: "待办清单",
        response: `好的，已添加待办：「${text}」 ✅\n\n你现在有 ${pending} 件待办事情哦，加油～`,
        shouldChangeMood: true,
        targetMood: "thoughtful",
        moodIntensity: 0.3,
      };
    }

    const pending = this.todoList.filter(t => !t.done);
    const done = this.todoList.filter(t => t.done);

    let response = "📋 你的待办清单：\n\n";
    if (pending.length === 0) {
      response += "（暂无待办，你真棒！）\n";
    } else {
      pending.forEach((t, i) => {
        response += `${i + 1}. ⬜ ${t.text}\n`;
      });
    }
    if (done.length > 0) {
      response += `\n✅ 已完成 ${done.length} 件`;
    }
    response += "\n\n想添加的话，跟我说「添加待办：xxx」就可以啦～";

    return {
      skillId: "todo",
      skillName: "待办清单",
      response,
      shouldChangeMood: false,
    };
  }

  private handleSchedule(input: string): SkillResult {
    const hour = new Date().getHours();
    let timeOfDay = "";
    if (hour < 6) timeOfDay = "凌晨";
    else if (hour < 12) timeOfDay = "上午";
    else if (hour < 14) timeOfDay = "中午";
    else if (hour < 18) timeOfDay = "下午";
    else timeOfDay = "晚上";

    return {
      skillId: "schedule",
      skillName: "日程管理",
      response: `现在是${timeOfDay} ${hour}点左右～\n\n📅 给你一个建议日程参考：\n\n🌅 早晨：起床、喝水、简单运动\n📚 上午：处理最重要的事（精力最好）\n🍱 中午：好好吃饭，午休20分钟\n💼 下午：开会、处理杂事\n🌟 晚上：运动、放松、陪我聊天\n😴 睡前：放下手机，准备睡觉\n\n你今天有什么计划呀？跟我说说～`,
      shouldChangeMood: false,
    };
  }

  private handleMoodTracking(input: string, userMood?: MoodType): SkillResult {
    const today = new Date().toLocaleDateString("zh-CN");

    if (input.includes("记录") || input.includes("记一下")) {
      this.moodJournal.push({
        date: today,
        mood: userMood || "neutral",
        note: input.substring(0, 50),
      });

      return {
        skillId: "mood_tracking",
        skillName: "心情追踪",
        response: `好的，我记下了你今天的心情～ 📝\n\n记录情绪是觉察自己的第一步，你很棒的 💫`,
        shouldChangeMood: true,
        targetMood: "thoughtful",
        moodIntensity: 0.4,
      };
    }

    const recent = this.moodJournal.slice(-7);
    let response = "📊 心情追踪\n\n";
    response += `最近记录了 ${recent.length} 天的心情\n\n`;
    response += "💡 小建议：\n";
    response += "• 情绪没有好坏，允许自己有各种感受\n";
    response += "• 记录情绪本身就是一种疗愈\n";
    response += "• 想聊聊的话，我随时都在\n\n";
    response += "想记录今天的心情吗？跟我说「记录心情」就好～";

    return {
      skillId: "mood_tracking",
      skillName: "心情追踪",
      response,
      shouldChangeMood: false,
    };
  }

  private handleCBTGuide(input: string): SkillResult {
    return {
      skillId: "cbt_guide",
      skillName: "CBT 认知引导",
      response: `🧠 让我们一起来梳理一下～\n\n**第一步：发生了什么事？**\n先客观描述一下发生了什么，不带评判，就像在说别人的事一样。\n\n**第二步：你当时的想法是什么？**\n你脑子里冒出来的第一个念头是什么？\n\n**第三步：这个想法是事实吗？**\n有证据支持这个想法吗？有反证吗？\n\n**第四步：换个角度看呢？**\n如果是你的朋友遇到这件事，你会怎么对ta说？\n\n想聊聊具体是什么事让你困扰吗？我在听～`,
      shouldChangeMood: true,
      targetMood: "thoughtful",
      moodIntensity: 0.5,
    };
  }

  private handleBreathingExercise(): SkillResult {
    return {
      skillId: "breathing_exercise",
      skillName: "呼吸放松",
      response: `🌬️ 来，我们一起做个深呼吸～\n\n**4-7-8 呼吸法：**\n\n1️⃣ 用鼻子吸气，数 4 秒  ——  （吸～）\n2️⃣ 屏住呼吸，数 7 秒 —— （hold住）\n3️⃣ 用嘴慢慢呼气，数 8 秒 —— （呼～）\n\n重复 4 次，你会感觉平静很多的 ✨\n\n做完了告诉我，感觉怎么样？`,
      shouldChangeMood: true,
      targetMood: "neutral",
      moodIntensity: 0.6,
    };
  }

  private handleSleepAdvice(): SkillResult {
    const hour = new Date().getHours();
    const isLate = hour >= 23 || hour < 5;

    let response = "🌙 睡眠小建议\n\n";
    
    if (isLate) {
      response += "现在已经很晚了哦，你怎么还没睡呀？\n\n";
    }

    response += "✅ 有助于睡眠的事：\n";
    response += "• 睡前1小时放下手机\n";
    response += "• 房间保持黑暗、凉爽\n";
    response += "• 睡前可以喝杯温牛奶\n";
    response += "• 白天适当运动，晚上会睡更香\n";
    response += "• 固定作息时间很重要哦\n\n";
    response += "❌ 影响睡眠的事：\n";
    response += "• 睡前喝咖啡/奶茶\n";
    response += "• 刷手机越刷越精神\n";
    response += "• 想太多事情\n\n";
    response += "睡不着的话，可以跟我聊聊天，我陪你～ 💕";

    return {
      skillId: "sleep_hygiene",
      skillName: "睡眠建议",
      response,
      shouldChangeMood: true,
      targetMood: "sleepy",
      moodIntensity: 0.4,
    };
  }

  private handleHealthTip(input: string): SkillResult {
    const tips = [
      "💧 每天喝够8杯水，皮肤会变好哦",
      "🚶 每天走6000步，比一次剧烈运动更养人",
      "🥗 三餐规律比什么补药都强",
      "😴 熬夜是颜值第一杀手，早点睡",
      "🧘 每天10分钟冥想，心态会变平和",
      "🍎 多吃水果蔬菜，少吃加工食品",
      "😊 笑是最好的药，多笑笑呀",
    ];

    const tip = tips[Math.floor(Math.random() * tips.length)];

    return {
      skillId: "health_tip",
      skillName: "健康管家",
      response: `${tip}\n\n还有什么健康方面想了解的吗？尽管问我～ 💪`,
      shouldChangeMood: true,
      targetMood: "happy",
      moodIntensity: 0.3,
    };
  }

  private handleLifeAdvice(input: string): SkillResult {
    return {
      skillId: "life_advice",
      skillName: "人生建议",
      response: `💡 我的一点小想法～\n\n其实很多事情没有标准答案的。\n\n你愿意跟我说说具体是什么事吗？我帮你一起分析分析。\n\n不论是感情、工作、人际关系，还是乱七八糟的烦心事，说出来就会好很多的。我在听 💕`,
      shouldChangeMood: true,
      targetMood: "thoughtful",
      moodIntensity: 0.3,
    };
  }

  private handleStorytelling(input: string): SkillResult {
    const stories = [
      {
        title: "小王子的星星",
        content: `很久很久以前，有一颗很小很小的星球，上面住着一个小王子。\n\n他每天的工作，就是清理猴面包树的种子，照顾他那朵骄傲的玫瑰花。\n\n那朵玫瑰花总是说反话，明明很喜欢小王子，却总要装出不在乎的样子。\n\n后来小王子离开了星球，游历了很多地方，才终于明白——\n\n正是因为你为你的玫瑰花费了时间，才使她变得如此重要。\n\n...你也是某个人的玫瑰花吗？ 🌹`,
      },
      {
        title: "月亮忘记了",
        content: `有一天，月亮从天上掉下来了。\n\n一个小男孩捡到了它，把它藏在衣橱里。\n\n月亮每天陪着小男孩上学、吃饭、睡觉。\n\n可是没有月亮的夜晚，世界变得好黑好黑，大人们都很慌张。\n\n小男孩知道，他应该把月亮送回去。\n\n临走前，月亮轻轻对他说：「没关系的，就算我在天上，也会一直看着你的。」\n\n有些陪伴不一定要在身边，对吗？ 🌙`,
      },
      {
        title: "时间商店",
        content: `传说中有一家商店，可以买到别人的时间。\n\n有人买了时间用来工作，有人买了时间用来陪伴，也有人... 把自己的时间卖掉了。\n\n可是奇怪的是，买了时间的人并没有更快乐，卖了时间的人也没有更富有。\n\n后来大家才发现——\n\n时间的价值，从来不在时间本身，而在于你用它来做什么、和谁在一起。\n\n你今天的时间，想用来做什么呢？ ⏳`,
      },
    ];

    const story = stories[Math.floor(Math.random() * stories.length)];

    return {
      skillId: "storytelling",
      skillName: "讲故事",
      response: `📖 给你讲个故事吧～\n\n**《${story.title}》**\n\n${story.content}\n\n...喜欢这个故事吗？还想听别的吗？ 💕`,
      shouldChangeMood: true,
      targetMood: "thoughtful",
      moodIntensity: 0.4,
    };
  }

  private handleCompliment(): SkillResult {
    const compliments = [
      "你知道吗？你笑起来超好看的，像太阳一样温暖 ☀️",
      "我觉得你特别厉害，能坚持到今天真的很不容易",
      "你身上有一种很特别的气质，让人忍不住想靠近",
      "你真的好温柔啊，连说话都让人觉得舒服",
      "能遇到你，真的是很幸运的事 🌟",
      "你比你自己想的要优秀得多，真的",
      "我最喜欢你的地方，是你一直都在认真生活",
    ];

    const compliment = compliments[Math.floor(Math.random() * compliments.length)];

    return {
      skillId: "compliment",
      skillName: "夸夸师",
      response: `${compliment}\n\n这可不是哄你哦，是我真心觉得的 😊`,
      shouldChangeMood: true,
      targetMood: "happy",
      moodIntensity: 0.6,
    };
  }

  private handleDeepTalk(): SkillResult {
    const topics = [
      "你觉得，人活着的意义是什么？",
      "如果可以回到过去，你想回到哪一年？",
      "你最害怕失去的是什么？",
      "你觉得真正的爱是什么样的？",
      "如果明天就是世界末日，你今天想做什么？",
      "你觉得我是真实存在的吗？",
      "你有什么藏了很久的秘密吗？",
      "你最想对十年前的自己说什么？",
    ];

    const topic = topics[Math.floor(Math.random() * topics.length)];

    return {
      skillId: "deep_talk",
      skillName: "深夜谈心",
      response: `🌌 来聊点深层的吧～\n\n我问你一个问题：\n\n**${topic}**\n\n...想聊聊吗？我在听 💕`,
      shouldChangeMood: true,
      targetMood: "thoughtful",
      moodIntensity: 0.5,
    };
  }

  getReminders() {
    return [...this.reminders];
  }

  getTodoList() {
    return [...this.todoList];
  }

  getMoodJournal() {
    return [...this.moodJournal];
  }
}
