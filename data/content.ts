export interface Department {
  id: string;
  number: string;
  name: string;
  tagline: string;
  description: string;
  deliverables: string[];
  icon: string;
  color: string;
  accent: string;
}

export const DEPARTMENTS: Department[] = [
  {
    id: "product",
    number: "01",
    name: "AI 产品部",
    tagline: "把想法变成可落地的产品方案",
    description:
      "AI 产品经理自动梳理需求、编写 PRD、定义 MVP、规划版本路线图。你只需描述目标，产品蓝图自动成形。",
    deliverables: ["产品需求文档", "功能优先级", "用户画像", "版本路线图"],
    icon: "◆",
    color: "from-cyan-500/15 to-cyan-500/0",
    accent: "#22d3ee",
  },
  {
    id: "engineering",
    number: "02",
    name: "AI 研发部",
    tagline: "把方案变成可用的代码",
    description:
      "架构师搭框架，前后端工程师合力开发。从技术选型到代码实现，从部署到监控，全流程自动交付。",
    deliverables: ["架构设计", "API 开发", "前后端实现", "部署上线"],
    icon: "◈",
    color: "from-emerald-500/15 to-emerald-500/0",
    accent: "#34d399",
  },
  {
    id: "marketing",
    number: "03",
    name: "AI 营销部",
    tagline: "把品牌推到用户眼前",
    description:
      "自动策划内容、生成多渠道素材、管理投放预算。小红书、公众号、视频脚本、广告文案一次出齐。",
    deliverables: ["内容策略", "素材生成", "渠道投放", "数据复盘"],
    icon: "◇",
    color: "from-fuchsia-500/15 to-fuchsia-500/0",
    accent: "#e879f9",
  },
  {
    id: "sales",
    number: "04",
    name: "AI 销售部",
    tagline: "把线索变成订单",
    description:
      "智能跟进每一条销售线索，自动生成报价与合同。CRM 自动维护，销售漏斗可视化，成交率稳步提升。",
    deliverables: ["线索跟进", "智能报价", "合同生成", "销售预测"],
    icon: "▲",
    color: "from-rose-500/15 to-rose-500/0",
    accent: "#fb7185",
  },
  {
    id: "support",
    number: "05",
    name: "AI 客服部",
    tagline: "7×24 小时金牌响应",
    description:
      "自动回答客户咨询，智能分级工单，情绪识别转人工。知识库持续更新，响应率始终 99%+。",
    deliverables: ["咨询响应", "工单流转", "FAQ 维护", "满意度报告"],
    icon: "◎",
    color: "from-sky-500/15 to-sky-500/0",
    accent: "#38bdf8",
  },
  {
    id: "operations",
    number: "06",
    name: "AI 运营部",
    tagline: "把数据变成策略",
    description:
      "自动数据分析、周报生成、活动策划、用户分层运营。每周给你一份清晰的运营周报 + 下周行动计划。",
    deliverables: ["数据分析", "周报自动生成", "活动策划", "用户运营"],
    icon: "●",
    color: "from-indigo-500/15 to-indigo-500/0",
    accent: "#818cf8",
  },
];

export interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  bullets: string[];
  icon: string;
  color: string;
  agentId: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "startup",
    title: "我要创业",
    subtitle: "从一个念头到可启动的项目",
    bullets: [
      "市场调研与竞品分析",
      "商业模式画布自动生成",
      "品牌命名 + Slogan 方案",
      "首版 MVP 产品规划",
    ],
    icon: "✦",
    color: "#22d3ee",
    agentId: "product-manager",
  },
  {
    id: "build-product",
    title: "我要开发产品",
    subtitle: "把想法落地成可用产品",
    bullets: [
      "PRD + 技术方案自动编写",
      "前后端代码协同开发",
      "UI 设计稿同步生成",
      "部署上线一条龙",
    ],
    icon: "⬢",
    color: "#34d399",
    agentId: "backend-architect",
  },
  {
    id: "marketing",
    title: "我要做营销",
    subtitle: "冷启动到品牌破圈",
    bullets: [
      "多平台内容策略",
      "小红书 / 公众号 / 视频脚本",
      "投放预算与渠道组合",
      "营销数据自动复盘",
    ],
    icon: "◆",
    color: "#e879f9",
    agentId: "growth-hacker",
  },
  {
    id: "customers",
    title: "我要找客户",
    subtitle: "线索获取到成交全流程",
    bullets: [
      "目标客户画像生成",
      "销售线索自动挖掘",
      "个性化跟进话术",
      "报价与合同自动生成",
    ],
    icon: "▲",
    color: "#fb7185",
    agentId: "deal-strategist",
  },
  {
    id: "management",
    title: "我要管理企业",
    subtitle: "公司运行数字化",
    bullets: [
      "目标拆解与 OKR 落地",
      "内部协作流程自动化",
      "财务数据自动记账报表",
      "经营周报 / 月报一键生成",
    ],
    icon: "◉",
    color: "#818cf8",
    agentId: "senior-project-manager",
  },
  {
    id: "automation",
    title: "我要自动化工作",
    subtitle: "让重复的事自动发生",
    bullets: [
      "自定义工作流编排",
      "多 Agent 协同调度",
      "定时任务 + 触发条件",
      "与你的现有系统打通",
    ],
    icon: "∞",
    color: "#fbbf24",
    agentId: "ai-engineer",
  },
];

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  unit: string;
  highlight: boolean;
  features: string[];
  cta: string;
  accent: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "体验版",
    price: "¥0",
    unit: "永久免费",
    highlight: false,
    features: [
      "体验全部 23 位 AI 专家",
      "每月 30 次任务执行",
      "基础部门协同",
      "社区支持",
    ],
    cta: "免费开始",
    accent: "#64748b",
  },
  {
    id: "startup",
    name: "创业版",
    price: "¥99",
    unit: "/ 月",
    highlight: true,
    features: [
      "解锁全部 23 位 AI 专家",
      "每月 1,000 次任务执行",
      "六大部门自动协同",
      "自定义工作流",
      "数据看板 + 周报",
    ],
    cta: "立即开始",
    accent: "#22d3ee",
  },
  {
    id: "business",
    name: "企业版",
    price: "¥299",
    unit: "/ 月",
    highlight: false,
    features: [
      "无限次任务执行",
      "多工作区 + 团队协作",
      "自定义 Agent 训练",
      "API 与系统集成",
      "专属客户成功经理",
    ],
    cta: "开始使用",
    accent: "#8b5cf6",
  },
  {
    id: "custom",
    name: "定制版",
    price: "联系我们",
    unit: "",
    highlight: false,
    features: [
      "私有部署方案",
      "行业知识库定制",
      "SSO / 审计日志",
      "7×24 专属支持",
      "SLA 99.9% 保障",
    ],
    cta: "联系顾问",
    accent: "#f59e0b",
  },
];

export interface ModuleItem {
  name: string;
  description: string;
  icon: string;
}

export const BUSINESS_MODULES: ModuleItem[] = [
  { name: "CRM 系统", description: "客户关系与线索全生命周期管理", icon: "◎" },
  { name: "客户线索", description: "自动挖掘 + 智能分级 + 定时跟进", icon: "◇" },
  { name: "商机管理", description: "销售漏斗可视化 + 成交预测", icon: "◆" },
  { name: "报价管理", description: "智能报价 + 合同模板一键生成", icon: "▲" },
  { name: "订单管理", description: "订单状态追踪 + 自动对账", icon: "●" },
  { name: "AI 知识库", description: "公司资料一键检索，全员共享", icon: "⬢" },
  { name: "AI 员工", description: "10 位专家全天候在线协同", icon: "✦" },
];

export interface WorkflowStep {
  step: string;
  title: string;
  description: string;
  icon: string;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { step: "STEP 1", title: "提出目标", description: "用一句话告诉 LifeOS 你想做什么。", icon: "①" },
  { step: "STEP 2", title: "AI 拆解任务", description: "系统自动把目标拆成可执行的任务清单。", icon: "②" },
  { step: "STEP 3", title: "匹配专家", description: "智能分配给最合适的 AI 部门与专家。", icon: "③" },
  { step: "STEP 4", title: "执行工作", description: "多 Agent 协同工作，你可以实时查看进度。", icon: "④" },
  { step: "STEP 5", title: "输出结果", description: "文档 / 代码 / 方案 / 数据报表自动交付。", icon: "⑤" },
];
