export type AgentId =
  | "product-manager"
  | "ui-designer"
  | "architect"
  | "frontend"
  | "backend"
  | "growth"
  | "sales"
  | "support"
  | "finance"
  | "operations";

export interface AgentExpert {
  id: AgentId;
  name: string;
  role: string;
  tagline: string;
  description: string;
  strengths: string[];
  status: "online" | "busy" | "idle";
  currentTask: string;
  avatar: string;
  color: string;
  accent: string;
}

export const AGENT_EXPERTS: AgentExpert[] = [
  {
    id: "product-manager",
    name: "产品经理",
    role: "Product Manager",
    tagline: "把模糊想法变成可落地的产品蓝图",
    description:
      "梳理需求池、输出 PRD、定义 MVP、规划版本路线图。你给一个念头，我还你一份可执行的产品方案。",
    strengths: ["需求拆解", "PRD 输出", "版本规划", "用户画像"],
    status: "online",
    currentTask: "正在规划需求 V0.3 版本",
    avatar: "/agents/product-manager.png",
    color: "from-cyan-400 to-sky-500",
    accent: "#22d3ee",
  },
  {
    id: "ui-designer",
    name: "UI 设计师",
    role: "UI Designer",
    tagline: "视觉语言、组件体系、品牌表达",
    description:
      "从设计规范到完整界面稿，一手建立可复用的组件体系。像素级精准的视觉呈现，让产品自带高级感。",
    strengths: ["设计系统", "界面设计", "图标插画", "品牌视觉"],
    status: "online",
    currentTask: "正在生成 Landing 页视觉稿",
    avatar: "/agents/ui-designer.png",
    color: "from-fuchsia-400 to-pink-500",
    accent: "#e879f9",
  },
  {
    id: "architect",
    name: "技术架构师",
    role: "Tech Architect",
    tagline: "选型、拆模块、画架构图",
    description:
      "为你的产品选择最合适的技术栈，设计可扩展的系统架构。小到模块划分，大到容灾扩容，通通规划好。",
    strengths: ["技术选型", "架构设计", "API 设计", "性能优化"],
    status: "online",
    currentTask: "正在评审订单系统架构",
    avatar: "/agents/architect.png",
    color: "from-violet-400 to-indigo-500",
    accent: "#8b5cf6",
  },
  {
    id: "frontend",
    name: "前端工程师",
    role: "Frontend Engineer",
    tagline: "把设计稿变成可交互的产品",
    description:
      "Next.js / React 一把梭，响应式、动效、交互一个都不能少。写出来的代码是产品，不是玩具。",
    strengths: ["React", "Next.js", "响应式", "动效交互"],
    status: "busy",
    currentTask: "正在实现仪表盘模块",
    avatar: "/agents/frontend.png",
    color: "from-blue-400 to-cyan-500",
    accent: "#60a5fa",
  },
  {
    id: "backend",
    name: "后端工程师",
    role: "Backend Engineer",
    tagline: "稳固的服务、清晰的接口、可靠的数据",
    description:
      "搭建 API、设计数据库、处理业务逻辑。让每一次请求都丝滑响应，让每一条数据都安全落地。",
    strengths: ["API 开发", "数据库", "缓存策略", "部署运维"],
    status: "busy",
    currentTask: "正在开发支付模块",
    avatar: "/agents/backend.png",
    color: "from-emerald-400 to-teal-500",
    accent: "#34d399",
  },
  {
    id: "growth",
    name: "增长顾问",
    role: "Growth Strategist",
    tagline: "让用户自然来、自然留、自然传",
    description:
      "策划增长飞轮、优化转化漏斗、设计裂变活动。从获客到留存的每一步，都给你一套打法。",
    strengths: ["获客策略", "渠道优化", "A/B 测试", "增长模型"],
    status: "online",
    currentTask: "正在生成本周增长方案",
    avatar: "/agents/growth.png",
    color: "from-amber-400 to-orange-500",
    accent: "#fbbf24",
  },
  {
    id: "sales",
    name: "销售顾问",
    role: "Sales Consultant",
    tagline: "把线索变成订单",
    description:
      "自动跟进销售线索、智能生成报价、起草合同模板。每一条线索都跟进到成交，不再让意向溜走。",
    strengths: ["线索跟进", "报价生成", "合同起草", "销售话术"],
    status: "online",
    currentTask: "正在生成客户 A 的报价方案",
    avatar: "/agents/sales.png",
    color: "from-rose-400 to-red-500",
    accent: "#fb7185",
  },
  {
    id: "support",
    name: "客服专家",
    role: "Customer Support",
    tagline: "7×24 小时在线的金牌客服",
    description:
      "智能响应客户咨询、自动分级工单、情绪识别转人工。响应率 99%，每一次沟通都专业可控。",
    strengths: ["咨询响应", "工单管理", "FAQ 维护", "满意度追踪"],
    status: "online",
    currentTask: "正在处理 3 条客户咨询",
    avatar: "/agents/support.png",
    color: "from-sky-400 to-blue-500",
    accent: "#38bdf8",
  },
  {
    id: "finance",
    name: "财务顾问",
    role: "Finance Advisor",
    tagline: "公司账上的每一分钱都清清楚楚",
    description:
      "自动记账、生成报表、预算规划、税务提醒。让财务数据自动跑起来，你只用看结论和决策。",
    strengths: ["自动记账", "财务报表", "预算管理", "税务提醒"],
    status: "online",
    currentTask: "正在生成本月现金流量表",
    avatar: "/agents/finance.png",
    color: "from-green-400 to-emerald-500",
    accent: "#4ade80",
  },
  {
    id: "operations",
    name: "运营顾问",
    role: "Operations Advisor",
    tagline: "把数据变成可执行的运营策略",
    description:
      "数据分析、周报生成、活动策划、用户运营。每一周给你一份清晰的运营周报 + 下周行动计划。",
    strengths: ["数据分析", "周报自动生成", "活动策划", "用户运营"],
    status: "busy",
    currentTask: "正在撰写本周运营周报",
    avatar: "/agents/operations.png",
    color: "from-indigo-400 to-purple-500",
    accent: "#818cf8",
  },
];
