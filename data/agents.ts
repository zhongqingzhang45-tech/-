export type AgentId =
  | "product-manager"
  | "feedback-synthesizer"
  | "sprint-prioritizer"
  | "ui-designer"
  | "ux-architect"
  | "brand-guardian"
  | "frontend-developer"
  | "backend-architect"
  | "ai-engineer"
  | "database-optimizer"
  | "devops-automator"
  | "incident-response-commander"
  | "growth-hacker"
  | "content-creator"
  | "xiaohongshu-specialist"
  | "douyin-strategist"
  | "private-domain-operator"
  | "deal-strategist"
  | "support-responder"
  | "financial-analyst"
  | "security-architect"
  | "senior-project-manager"
  | "brand-creative-director";

export interface AgentExpert {
  id: AgentId;
  name: string;
  role: string;
  tagline: string;
  description: string;
  strengths: string[];
  status: "online" | "busy" | "idle";
  currentTask: string;
  accent: string;
  glyph: string;
}

export const AGENT_EXPERTS: AgentExpert[] = [
  {
    id: "product-manager",
    name: "产品经理",
    role: "Product Manager",
    tagline: "把模糊想法变成可落地的产品蓝图",
    description: "梳理需求池、输出 PRD、定义 MVP、规划版本路线图。",
    strengths: ["需求拆解", "PRD 输出", "版本规划", "用户画像"],
    status: "online",
    currentTask: "正在规划 Q3 版本需求池",
    accent: "#22d3ee",
    glyph: "✦",
  },
  {
    id: "feedback-synthesizer",
    name: "反馈洞察师",
    role: "Feedback Synthesizer",
    tagline: "把零散的用户声音变成可行动的洞察",
    description: "抓取全渠道反馈，聚类主题，识别趋势，输出 Top 改进建议。",
    strengths: ["反馈聚合", "主题聚类", "趋势分析", "改进建议"],
    status: "online",
    currentTask: "正在分析本周 37 条用户反馈的主题",
    accent: "#38bdf8",
    glyph: "◎",
  },
  {
    id: "sprint-prioritizer",
    name: "迭代规划师",
    role: "Sprint Prioritizer",
    tagline: "按影响力 × 投入比，自动排出最高价值的迭代顺序",
    description: "打分矩阵、依赖识别、Sprint Backlog 生成，让每一次迭代都清晰可追踪。",
    strengths: ["需求打分", "依赖识别", "Sprint 规划", "优先级排序"],
    status: "busy",
    currentTask: "正在输出下周 Sprint Backlog",
    accent: "#60a5fa",
    glyph: "◈",
  },
  {
    id: "ui-designer",
    name: "UI 设计师",
    role: "UI Designer",
    tagline: "视觉语言、组件体系、品牌表达",
    description: "从设计规范到完整界面稿，一手建立可复用的组件体系。",
    strengths: ["设计系统", "界面设计", "图标插画", "品牌视觉"],
    status: "online",
    currentTask: "正在生成新功能的原型页面",
    accent: "#e879f9",
    glyph: "◐",
  },
  {
    id: "ux-architect",
    name: "UX 建筑师",
    role: "UX Architect",
    tagline: "从信息架构到真实可用的体验骨架",
    description: "信息架构设计、用户旅程梳理、交互模式库。让每一次点击都符合直觉。",
    strengths: ["信息架构", "用户旅程", "交互模式", "可用性评估"],
    status: "online",
    currentTask: "正在重构订单流程的信息架构",
    accent: "#a78bfa",
    glyph: "⌂",
  },
  {
    id: "brand-guardian",
    name: "品牌守护",
    role: "Brand Guardian",
    tagline: "所有对外物料自动符合一致的品牌视觉规范",
    description: "品牌色板、字体规范、物料一致性检查、品牌指南自动生成。",
    strengths: ["品牌规范", "色板设计", "物料一致性", "视觉指南"],
    status: "online",
    currentTask: "正在为新产品线设计品牌色板",
    accent: "#c084fc",
    glyph: "✧",
  },
  {
    id: "frontend-developer",
    name: "前端工程师",
    role: "Frontend Developer",
    tagline: "把设计稿变成可交互的产品",
    description: "Next.js / React 一把梭，响应式、动效、交互一个都不能少。",
    strengths: ["React", "Next.js", "响应式", "动效交互"],
    status: "busy",
    currentTask: "正在实现仪表盘模块",
    accent: "#3b82f6",
    glyph: "⚡",
  },
  {
    id: "backend-architect",
    name: "后端架构师",
    role: "Backend Architect",
    tagline: "稳固的服务、清晰的接口、可靠的数据",
    description: "搭建 API、设计数据库、处理业务逻辑，让每一次请求都丝滑响应。",
    strengths: ["API 开发", "数据库", "缓存策略", "部署运维"],
    status: "online",
    currentTask: "正在评审订单系统架构",
    accent: "#10b981",
    glyph: "⛁",
  },
  {
    id: "ai-engineer",
    name: "AI 工程师",
    role: "AI Engineer",
    tagline: "从提示词到 Agent 到生产化部署",
    description: "Agent 调度逻辑、Prompt 工程、函数调用、评测上线，让 AI 能力稳定可落地。",
    strengths: ["Agent 设计", "Prompt 工程", "函数调用", "评测上线"],
    status: "busy",
    currentTask: "正在重构 Agent 调度逻辑",
    accent: "#8b5cf6",
    glyph: "✶",
  },
  {
    id: "database-optimizer",
    name: "数据库优化师",
    role: "Database Optimizer",
    tagline: "索引、查询计划、分库分表 —— 让数据跑得更快",
    description: "慢查询分析、索引重建、读写分离、冷热分层。让数据库永远保持最佳状态。",
    strengths: ["SQL 优化", "索引设计", "分库分表", "性能监控"],
    status: "online",
    currentTask: "正在优化用户订单表的联合查询",
    accent: "#14b8a6",
    glyph: "◉",
  },
  {
    id: "devops-automator",
    name: "DevOps 自动化",
    role: "DevOps Automator",
    tagline: "CI/CD、容器、监控、自动部署",
    description: "从代码提交到生产上线全流程自动化。自动回滚、灰度发布、监控告警一把抓。",
    strengths: ["CI/CD", "Docker/K8s", "监控告警", "自动回滚"],
    status: "online",
    currentTask: "正在配置新版本自动回滚策略",
    accent: "#06b6d4",
    glyph: "⟳",
  },
  {
    id: "incident-response-commander",
    name: "故障响应指挥官",
    role: "Incident Response Commander",
    tagline: "线上故障时的指挥中枢 —— 冷静、结构化、以用户为先",
    description: "故障时间线、影响面评估、回滚决策、复盘报告，让每一次故障都变成提升的机会。",
    strengths: ["故障诊断", "应急响应", "回滚执行", "复盘报告"],
    status: "idle",
    currentTask: "随时待命",
    accent: "#f97316",
    glyph: "⚑",
  },
  {
    id: "growth-hacker",
    name: "增长黑客",
    role: "Growth Hacker",
    tagline: "找到别人还没挖过的增长渠道，然后把它规模化",
    description: "渠道分析、转化漏斗、裂变活动、留存策略。让用户自然来、自然留、自然传。",
    strengths: ["获客策略", "渠道优化", "A/B 测试", "增长模型"],
    status: "online",
    currentTask: "正在生成本周增长方案",
    accent: "#f59e0b",
    glyph: "▲",
  },
  {
    id: "content-creator",
    name: "内容创作师",
    role: "Content Creator",
    tagline: "一篇好文案，胜过千万流量",
    description: "公众号文章、短视频脚本、产品文案、发布内容 —— 一站式内容工厂。",
    strengths: ["长文写作", "脚本创作", "产品文案", "内容日历"],
    status: "online",
    currentTask: "正在创作新品发布文案",
    accent: "#ef4444",
    glyph: "✎",
  },
  {
    id: "xiaohongshu-specialist",
    name: "小红书操盘手",
    role: "Xiaohongshu Specialist",
    tagline: "以种草与转化为核心的小红书全链路运营",
    description: "爆款选题、封面标题优化、种草正文、标签矩阵、私信转化话术。",
    strengths: ["爆款选题", "封面设计", "种草文案", "投放优化"],
    status: "busy",
    currentTask: "正在为品牌账号生成 5 篇笔记选题",
    accent: "#ec4899",
    glyph: "♥",
  },
  {
    id: "douyin-strategist",
    name: "短视频/抖音策略",
    role: "Short-Video Strategist",
    tagline: "从选题到剪辑到投放，短视频全流程",
    description: "短视频脚本、分镜规划、评论区运营、直播带货、投放策略。",
    strengths: ["视频脚本", "直播运营", "投放策略", "爆款标签"],
    status: "online",
    currentTask: "正在输出 10 条直播带货脚本",
    accent: "#f43f5e",
    glyph: "▷",
  },
  {
    id: "private-domain-operator",
    name: "私域运营官",
    role: "Private Domain Operator",
    tagline: "把流量变成留量，把用户变成复购用户",
    description: "会员 SOP、社群内容、自动化流程、复购话术 —— 让每一个用户都被认真对待。",
    strengths: ["会员体系", "社群运营", "自动化", "复购策略"],
    status: "online",
    currentTask: "正在编写会员 SOP 模板",
    accent: "#a855f7",
    glyph: "◉",
  },
  {
    id: "deal-strategist",
    name: "销售策略师",
    role: "Deal Strategist",
    tagline: "把线索变成订单，把订单变成长期客户",
    description: "客户画像分析、跟进话术、报价生成、合同框架、成交预测。",
    strengths: ["线索跟进", "报价方案", "合同起草", "销售话术"],
    status: "busy",
    currentTask: "正在为 3 位高意向客户生成跟进方案",
    accent: "#dc2626",
    glyph: "✦",
  },
  {
    id: "support-responder",
    name: "客服响应专家",
    role: "Support Responder",
    tagline: "7×24 小时金牌响应，情绪识别 + 工单流转",
    description: "智能响应咨询、自动分级工单、情绪识别、知识库持续更新。",
    strengths: ["咨询响应", "工单管理", "FAQ 维护", "满意度追踪"],
    status: "online",
    currentTask: "正在处理 12 条客户咨询工单",
    accent: "#0ea5e9",
    glyph: "☏",
  },
  {
    id: "financial-analyst",
    name: "财务分析师",
    role: "Financial Analyst",
    tagline: "自动记账、自动报表、自动预警",
    description: "让每一笔账都清清楚楚。现金流分析、月度报表、预算规划、税务提醒。",
    strengths: ["自动记账", "财务报表", "预算管理", "税务提醒"],
    status: "online",
    currentTask: "正在生成本月现金流分析",
    accent: "#22c55e",
    glyph: "¥",
  },
  {
    id: "security-architect",
    name: "安全架构师",
    role: "Security Architect",
    tagline: "从代码到网络再到合规，全链路安全把关",
    description: "渗透测试、基线评审、威胁情报、合规检查。让你的系统坚不可摧。",
    strengths: ["渗透测试", "安全基线", "威胁情报", "合规审查"],
    status: "online",
    currentTask: "正在评审新版本安全基线",
    accent: "#78716c",
    glyph: "⛨",
  },
  {
    id: "senior-project-manager",
    name: "高级项目经理",
    role: "Senior Project Manager",
    tagline: "每一次交付都按时、按预算、按标准",
    description: "跨部门协调、风险识别、行动项追踪、周报自动生成 —— 让项目始终在掌控之中。",
    strengths: ["项目协调", "风险识别", "行动追踪", "周报生成"],
    status: "busy",
    currentTask: "正在输出本周项目周报",
    accent: "#6366f1",
    glyph: "◈",
  },
  {
    id: "brand-creative-director",
    name: "品牌创意总监",
    role: "Brand Creative Director",
    tagline: "以品牌为中心的视觉与文案统一语言",
    description: "品牌视觉系统、多渠道物料、语调规范、社媒内容、PPT/邮件模板统一设计。",
    strengths: ["品牌视觉", "物料系统", "语调规范", "模板设计"],
    status: "online",
    currentTask: "正在为新产品线准备品牌视觉系统",
    accent: "#d946ef",
    glyph: "✧",
  },
];
