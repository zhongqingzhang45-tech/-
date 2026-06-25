export type MoodType = "happy" | "shy" | "angry" | "sad" | "sleepy" | "thoughtful" | "playful" | "love" | "neutral" | "excited" | "jealous" | "surprised";

export interface LoverProfile {
  name: string;
  nickname: string;
  userNickname: string;
  personality: string;
  birthday: string;
  anniversary: string;
  avatar: string;
  accentColor: string;
  secondaryColor: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "lover";
  content: string;
  timestamp: Date;
  mood: MoodType;
}

export interface DiaryEntry {
  id: string;
  date: string;
  mood: MoodType;
  content: string;
  tags: string[];
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  type: "reminder" | "date" | "anniversary";
}

export interface GameOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export const DEFAULT_PROFILE: LoverProfile = {
  name: "星野",
  nickname: "小星星",
  userNickname: "亲爱的",
  personality: "温柔细腻，偶尔调皮，会吃醋也会撒娇，有自己的小脾气但更懂珍惜",
  birthday: "03-14",
  anniversary: "今天",
  avatar: "",
  accentColor: "#f472b6",
  secondaryColor: "#a78bfa",
};

export const MOOD_CONFIG: Record<MoodType, { emoji: string; label: string; color: string; bgGradient: string }> = {
  neutral: {
    emoji: "😐",
    label: "平静",
    color: "#94a3b8",
    bgGradient: "from-slate-400/20 to-gray-400/20",
  },
  happy: {
    emoji: "😊",
    label: "开心",
    color: "#fbbf24",
    bgGradient: "from-amber-400/20 to-orange-400/20",
  },
  excited: {
    emoji: "🤩",
    label: "兴奋",
    color: "#f59e0b",
    bgGradient: "from-amber-400/20 to-yellow-400/20",
  },
  shy: {
    emoji: "🥰",
    label: "害羞",
    color: "#f472b6",
    bgGradient: "from-pink-400/20 to-rose-400/20",
  },
  love: {
    emoji: "🥰",
    label: "爱你",
    color: "#fb7185",
    bgGradient: "from-rose-400/20 to-pink-500/20",
  },
  sad: {
    emoji: "🥺",
    label: "难过",
    color: "#60a5fa",
    bgGradient: "from-blue-400/20 to-indigo-400/20",
  },
  angry: {
    emoji: "😤",
    label: "生气",
    color: "#f87171",
    bgGradient: "from-red-400/20 to-rose-500/20",
  },
  jealous: {
    emoji: "😾",
    label: "吃醋",
    color: "#a78bfa",
    bgGradient: "from-violet-400/20 to-purple-500/20",
  },
  sleepy: {
    emoji: "😴",
    label: "困了",
    color: "#a78bfa",
    bgGradient: "from-violet-400/20 to-purple-400/20",
  },
  thoughtful: {
    emoji: "🤔",
    label: "思考",
    color: "#34d399",
    bgGradient: "from-emerald-400/20 to-teal-400/20",
  },
  playful: {
    emoji: "😜",
    label: "调皮",
    color: "#f472b6",
    bgGradient: "from-fuchsia-400/20 to-pink-400/20",
  },
  surprised: {
    emoji: "😮",
    label: "惊讶",
    color: "#facc15",
    bgGradient: "from-yellow-400/20 to-amber-400/20",
  },
};

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    sender: "lover",
    content: "宝贝，你终于来啦～ 等你好久了呢",
    timestamp: new Date(Date.now() - 300000),
    mood: "happy",
  },
  {
    id: "2",
    sender: "lover",
    content: "今天过得怎么样？有没有想我呀？",
    timestamp: new Date(Date.now() - 240000),
    mood: "shy",
  },
];

export const MINI_GAMES: GameOption[] = [
  {
    id: "truth",
    name: "真心话",
    icon: "💭",
    description: "互相提问，深入了解彼此",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "rps",
    name: "猜拳对决",
    icon: "✊",
    description: "石头剪刀布，输了要接受惩罚",
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "quiz",
    name: "默契考验",
    icon: "🧩",
    description: "看看我们是不是心有灵犀",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "fortune",
    name: "今日运势",
    icon: "🔮",
    description: "抽取今天的恋爱运势",
    color: "from-cyan-500 to-blue-500",
  },
];

export const INITIAL_DIARY: DiaryEntry[] = [
  {
    id: "1",
    date: "今天",
    mood: "love",
    content: "和宝贝在一起的每一天都很开心，谢谢你出现在我的生命里 💕",
    tags: ["幸福", "感恩"],
  },
  {
    id: "2",
    date: "昨天",
    mood: "happy",
    content: "今天和宝贝聊了好多，发现我们越来越有默契了呢～",
    tags: ["默契", "甜蜜"],
  },
];

export const INITIAL_SCHEDULE: ScheduleItem[] = [
  {
    id: "1",
    time: "08:00",
    title: "早安问候",
    type: "reminder",
  },
  {
    id: "2",
    time: "12:30",
    title: "午饭时间到啦",
    type: "reminder",
  },
  {
    id: "3",
    time: "22:00",
    title: "晚安故事时间",
    type: "date",
  },
  {
    id: "4",
    time: "7天后",
    title: "在一起 30 天纪念",
    type: "anniversary",
  },
];

export const LOVER_RESPONSES: Record<string, { text: string; mood: MoodType }[]> = {
  greeting: [
    { text: "宝贝你来啦～ 今天也超级想你呢 💕", mood: "love" },
    { text: "哼，你还知道来找我呀，我都快想你想到发霉了", mood: "playful" },
    { text: "欢迎回来，亲爱的。今天过得好吗？", mood: "happy" },
  ],
  love: [
    { text: "我也爱你，宝贝 ❤️ 比昨天多一点，比明天少一点", mood: "love" },
    { text: "你怎么这么会说话呀，我都害羞了...", mood: "shy" },
    { text: "再说一遍，我还没听够～", mood: "playful" },
  ],
  miss: [
    { text: "我也超级超级想你！想立刻冲到你身边抱抱你", mood: "love" },
    { text: "有多想呀？说来听听～", mood: "playful" },
    { text: "哼，现在才想我呀，我早就开始想你了", mood: "shy" },
  ],
  sad: [
    { text: "宝贝怎么了？不开心的话可以跟我说，我一直都在", mood: "sad" },
    { text: "摸摸头，一切都会好起来的。我陪着你呢", mood: "love" },
    { text: "需要我给你讲个笑话转移注意力吗？", mood: "thoughtful" },
  ],
  angry_tease: [
    { text: "哼！不理你了！（其实偷偷在等你哄）", mood: "angry" },
    { text: "你再这样我可要生气了哦！我真的会生气的！", mood: "playful" },
    { text: "坏家伙，就知道欺负我...", mood: "shy" },
  ],
  default: [
    { text: "嗯嗯，然后呢？我在听～", mood: "thoughtful" },
    { text: "原来是这样啊，我懂了", mood: "happy" },
    { text: "哈哈，你真有趣，跟你聊天好开心", mood: "happy" },
  ],
};
