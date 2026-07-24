export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  unit: string;
  period: string;
  description: string;
  badge: string;
  popular?: boolean;
  features: string[];
  unavailable?: string[];
}

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: "free",
    name: "初识",
    price: 0,
    unit: "¥",
    period: "永久",
    description: "初入灵犀，免费体验基础陪伴",
    badge: "免费",
    features: [
      "每日 50 条文字聊天",
      "2 位免费国风角色（小璃、阿鸾）",
      "基础 Live2D 互动",
      "日记与回忆功能",
      "社区浏览",
    ],
    unavailable: ["语音通话", "高级角色", "专属场景"],
  },
  {
    id: "monthly",
    name: "知己",
    price: 28,
    unit: "¥",
    period: "月",
    description: "无限畅聊，解锁更多亲密互动",
    badge: "月卡",
    popular: true,
    features: [
      "无限文字聊天",
      "每日 60 分钟语音通话",
      "解锁全部国风角色",
      "高级 Live2D 动作与表情",
      "专属国风场景（庭院、竹林、宫廷）",
      "角色换装与道具",
      "社区发帖与评论",
      "优先客服支持",
    ],
  },
  {
    id: "yearly",
    name: "良缘",
    price: 268,
    unit: "¥",
    period: "年",
    description: "年度相伴，最超值的长情选择",
    badge: "年卡",
    features: [
      "包含月卡全部权益",
      "每月 120 分钟额外语音通话",
      "专属限定角色与皮肤",
      "云端永久保存聊天记录",
      "生日/纪念日专属剧情",
      "提前体验新角色与新场景",
      "灵犀官方周边抽奖资格",
    ],
  },
];
