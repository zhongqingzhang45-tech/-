// 专家到 Agent 文件的映射
// LifeOS 专家 → /opt/agency-agents-main/ 下的 MD 文件

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

// === Agent → MD File Map ===
export const AGENT_FILE_MAP: Record<string, string> = {
  "product-manager": "/opt/agency-agents-main/product/product-manager.md",
  "feedback-synthesizer": "/opt/agency-agents-main/product/product-feedback-synthesizer.md",
  "sprint-prioritizer": "/opt/agency-agents-main/product/product-sprint-prioritizer.md",
  "ui-designer": "/opt/agency-agents-main/design/design-ui-designer.md",
  "ux-architect": "/opt/agency-agents-main/design/design-ux-architect.md",
  "brand-guardian": "/opt/agency-agents-main/design/design-brand-guardian.md",
  "frontend-developer": "/opt/agency-agents-main/engineering/engineering-frontend-developer.md",
  "backend-architect": "/opt/agency-agents-main/engineering/engineering-backend-architect.md",
  "ai-engineer": "/opt/agency-agents-main/engineering/engineering-ai-engineer.md",
  "database-optimizer": "/opt/agency-agents-main/engineering/engineering-database-optimizer.md",
  "devops-automator": "/opt/agency-agents-main/engineering/engineering-devops-automator.md",
  "incident-response-commander": "/opt/agency-agents-main/engineering/engineering-incident-response-commander.md",
  "growth-hacker": "/opt/agency-agents-main/marketing/marketing-growth-hacker.md",
  "content-creator": "/opt/agency-agents-main/marketing/marketing-content-creator.md",
  "xiaohongshu-specialist": "/opt/agency-agents-main/marketing/marketing-xiaohongshu-specialist.md",
  "douyin-strategist": "/opt/agency-agents-main/marketing/marketing-douyin-strategist.md",
  "private-domain-operator": "/opt/agency-agents-main/marketing/marketing-private-domain-operator.md",
  "deal-strategist": "/opt/agency-agents-main/sales/sales-deal-strategist.md",
  "support-responder": "/opt/agency-agents-main/support/support-support-responder.md",
  "financial-analyst": "/opt/agency-agents-main/finance/finance-financial-analyst.md",
  "security-architect": "/opt/agency-agents-main/security/security-architect.md",
  "senior-project-manager": "/opt/agency-agents-main/project-management/project-manager-senior.md",
  "brand-creative-director": "/opt/agency-agents-main/design/design-brand-guardian.md",
};

// 备用静态回复（当 Agent 文件不存在或 LLM API 不可用时）
export const STATIC_REPLIES: Record<string, string> = {
  "product-manager": "好的，我来做产品拆解：目标用户画像 → 核心价值主张 → MVP 功能列表 → 版本路线图。让我输出一份结构化 PRD。",
  "feedback-synthesizer": "明白，我来帮你从用户反馈中提炼：聚类 → 去噪 → 按影响面排序 → 输出 Top 5 可行动建议。",
  "sprint-prioritizer": "收到，按影响力 × 投入比做打分矩阵，排出最高价值的迭代顺序，并标注依赖关系。",
  "ui-designer": "好的！我从品牌色、组件规范、页面骨架三个维度出发，输出一套可直接落地的 UI 设计。",
  "ux-architect": "收到，我先设计信息架构和用户旅程，再根据真实使用场景梳理出交互模式库。",
  "brand-guardian": "明白！让我为你统一品牌视觉：颜色、字体、图标、物料规范，保证对外一致。",
  "frontend-developer": "好的，我用 React + Tailwind 实现这个模块：响应式布局、动效、代码可维护性都会兼顾。",
  "backend-architect": "收到！让我设计一下这个功能的 API 合约、数据模型、缓存策略和扩展边界。",
  "ai-engineer": "明白，我来帮你设计 Agent 的 Prompt、工具调用、上下文管理和评测方案，让它稳定可上线。",
  "database-optimizer": "好的，让我分析你的 SQL 和索引，给出优化建议：慢查询、索引重建、读写比例和冷热分层。",
  "devops-automator": "收到！我来帮你设计 CI/CD 流水线、Docker 镜像、监控告警和回滚策略。",
  "incident-response-commander": "明白，故障发生时我会帮你做时间线梳理、影响面评估、回滚决策和复盘报告。",
  "growth-hacker": "好的！让我分析你的增长机会：拉新渠道、转化路径、留存激活和 LTV 优化，并给出具体方案。",
  "content-creator": "收到！我根据你的目标受众和品牌语调，生成对应的内容：长文、短视频脚本、推文和海报文案。",
  "xiaohongshu-specialist": "明白！小红书全链路我来帮你：爆款选题、封面+标题、种草正文、标签矩阵、私信转化话术。",
  "douyin-strategist": "好的！短视频/直播全流程：脚本+分镜+评论区运营+投流建议，一站式输出。",
  "private-domain-operator": "收到！私域留存+复购我来帮你：会员体系、社群 SOP、自动化流程和活动策划。",
  "deal-strategist": "明白！让我分析客户画像，生成跟进话术、报价方案、合同框架和成交预测。",
  "support-responder": "好的！7×24 智能客服我来帮你：咨询回复、情绪识别、工单流转、知识库更新。",
  "financial-analyst": "收到！我来帮你处理财务数据：自动记账、现金流分析、预算管理、报表和税务提醒。",
  "security-architect": "明白！安全全链路我来把关：渗透测试、威胁情报、合规检查、事件响应。",
  "senior-project-manager": "好的！让我来做项目治理：跨部门协调、风险识别、行动项追踪、周报自动生成。",
  "brand-creative-director": "收到！我来帮你做统一的品牌视觉与文案：官网、广告、社媒、PPT、邮件模板全部一致。",
};

// 当前活动状态提示（用于显示"正在..."的状态）
export const ACTIVITY_HINTS: Record<string, string[]> = {
  "product-manager": ["正在编写产品需求文档", "正在分析用户访谈记录", "正在整理版本规划", "正在输出 MVP 方案"],
  "feedback-synthesizer": ["正在分析用户反馈", "正在做主题聚类分析", "正在生成洞察报告", "正在输出改进建议"],
  "sprint-prioritizer": ["正在做需求打分矩阵", "正在排出迭代顺序", "正在识别依赖关系", "正在输出 Sprint Backlog"],
  "ui-designer": ["正在设计页面视觉稿", "正在完善组件设计规范", "正在生成图标素材", "正在优化产品配色方案"],
  "ux-architect": ["正在重构信息架构", "正在梳理用户旅程", "正在设计交互模式", "正在输出可用性评估"],
  "brand-guardian": ["正在设计品牌色板", "正在规范字体使用", "正在输出物料一致性检查", "正在生成品牌指南"],
  "frontend-developer": ["正在实现页面模块", "正在编写前端组件", "正在调试页面动效", "正在做浏览器兼容性测试"],
  "backend-architect": ["正在评审系统架构", "正在设计 API 接口", "正在优化数据库索引", "正在编写技术选型报告"],
  "ai-engineer": ["正在重构 Agent 调度逻辑", "正在优化 Prompt 模板", "正在编写函数调用编排", "正在做评测与上线"],
  "database-optimizer": ["正在分析慢查询", "正在重建索引", "正在设计读写分离", "正在做冷热分层"],
  "devops-automator": ["正在配置 CI/CD 流水线", "正在优化 Docker 镜像", "正在做监控告警配置", "正在设计自动回滚策略"],
  "incident-response-commander": ["正在分析故障时间线", "正在组织应急响应", "正在执行回滚", "正在输出复盘报告"],
  "growth-hacker": ["正在生成本周增长方案", "正在分析渠道 ROI", "正在策划裂变活动", "正在优化转化漏斗"],
  "content-creator": ["正在撰写长篇文案", "正在生成视频脚本", "正在写公众号推文", "正在创作新品发布文案"],
  "xiaohongshu-specialist": ["正在生成爆款选题", "正在优化封面设计", "正在编写种草正文", "正在分析投放效果"],
  "douyin-strategist": ["正在设计短视频脚本", "正在做直播带货方案", "正在优化投放策略", "正在生成评论区运营话术"],
  "private-domain-operator": ["正在编写会员 SOP", "正在策划社群活动", "正在设计自动化流程", "正在撰写复购话术"],
  "deal-strategist": ["正在分析客户画像", "正在生成报价方案", "正在起草合同框架", "正在编写跟进话术"],
  "support-responder": ["正在处理咨询工单", "正在更新知识库", "正在写标准回复", "正在生成满意度报告"],
  "financial-analyst": ["正在生成财务报表", "正在做现金流分析", "正在整理账单", "正在输出预算报告"],
  "security-architect": ["正在做渗透测试", "正在评审安全基线", "正在写威胁情报", "正在检查合规项"],
  "senior-project-manager": ["正在输出周报", "正在协调跨部门资源", "正在识别项目风险", "正在追踪行动项"],
  "brand-creative-director": ["正在设计品牌视觉系统", "正在输出多渠道物料", "正在规范文案语调", "正在准备新品视觉"],
};

// 旧专家数据（保留兼容）
export const AGENT_EXPERTS: AgentExpert[] = [
  { id: "product-manager", name: "产品经理", role: "产品部 · AI", tagline: "把想法变成可落地的产品", description: "从需求分析到 PRD，从优先级到发布计划", strengths: ["需求分析", "产品拆解", "PRD 编写", "路线图"], status: "online", currentTask: "正在处理一个新的产品需求", accent: "#22d3ee", glyph: "📋" },
  { id: "feedback-synthesizer", name: "反馈分析师", role: "产品部 · AI", tagline: "从噪音中提炼真知", description: "用户反馈聚类、去噪、优先级", strengths: ["反馈分析", "主题聚类", "洞察报告"], status: "online", currentTask: "正在整理本周用户反馈", accent: "#67e8f9", glyph: "🔍" },
  { id: "sprint-prioritizer", name: "迭代规划师", role: "产品部 · AI", tagline: "把优先级排对", description: "需求打分、依赖识别、迭代计划", strengths: ["RICE 评分", "依赖识别", "backlog 管理"], status: "online", currentTask: "正在规划下一个 Sprint", accent: "#a5f3fc", glyph: "🎯" },
  { id: "ui-designer", name: "UI 设计师", role: "设计部 · AI", tagline: "像素级美学", description: "品牌色、组件规范、页面骨架", strengths: ["品牌视觉", "组件设计", "响应式布局"], status: "online", currentTask: "正在设计一个新功能的 UI", accent: "#e879f9", glyph: "🎨" },
  { id: "ux-architect", name: "UX 架构师", role: "设计部 · AI", tagline: "以用户为中心", description: "信息架构、用户旅程、交互模式", strengths: ["信息架构", "用户旅程", "交互设计"], status: "online", currentTask: "正在重构用户流程", accent: "#f0abfc", glyph: "🏛️" },
  { id: "brand-guardian", name: "品牌主管", role: "设计部 · AI", tagline: "一致的品牌语言", description: "颜色规范、字体规范、物料一致性", strengths: ["品牌设计", "规范维护", "物料一致性"], status: "online", currentTask: "正在检查品牌视觉一致性", accent: "#d8b4fe", glyph: "🛡️" },
  { id: "frontend-developer", name: "前端工程师", role: "研发部 · AI", tagline: "把设计变成可运行的代码", description: "React、TypeScript、Tailwind、性能优化", strengths: ["React", "组件化", "性能优化"], status: "online", currentTask: "正在写新功能的前端代码", accent: "#34d399", glyph: "⌨️" },
  { id: "backend-architect", name: "后端架构师", role: "研发部 · AI", tagline: "稳定可扩展的基石", description: "API 设计、数据模型、架构选型", strengths: ["API 设计", "数据库", "系统架构"], status: "online", currentTask: "正在评审一个新的 API 方案", accent: "#6ee7b7", glyph: "🏗️" },
  { id: "ai-engineer", name: "AI 工程师", role: "研发部 · AI", tagline: "把智能能力注入产品", description: "Prompt 工程、RAG、工具调用", strengths: ["Prompt 工程", "RAG", "Agent 架构"], status: "online", currentTask: "正在优化 Agent 的 Prompt", accent: "#a7f3d0", glyph: "🤖" },
  { id: "database-optimizer", name: "数据库优化师", role: "研发部 · AI", tagline: "毫秒级响应", description: "慢查询优化、索引设计、读写分离", strengths: ["SQL 优化", "索引", "性能调优"], status: "online", currentTask: "正在优化慢查询", accent: "#10b981", glyph: "🗄️" },
  { id: "devops-automator", name: "DevOps 自动化师", role: "研发部 · AI", tagline: "一键部署、自动回滚", description: "CI/CD、Docker、监控告警", strengths: ["CI/CD", "Docker", "K8s", "监控"], status: "online", currentTask: "正在配置部署流水线", accent: "#14b8a6", glyph: "🔧" },
  { id: "incident-response-commander", name: "故障响应指挥官", role: "研发部 · AI", tagline: "故障即命令", description: "时间线、应急响应、回滚、复盘", strengths: ["故障响应", "Root Cause", "复盘"], status: "online", currentTask: "正在待命", accent: "#06b6d4", glyph: "🚨" },
  { id: "growth-hacker", name: "增长黑客", role: "营销部 · AI", tagline: "发现没人注意到的渠道", description: "用户获取、裂变、转化优化、LTV", strengths: ["用户增长", "渠道优化", "A/B 测试"], status: "online", currentTask: "正在策划一个增长实验", accent: "#f59e0b", glyph: "🚀" },
  { id: "content-creator", name: "内容创作者", role: "营销部 · AI", tagline: "每一段文字都是转化机会", description: "长文、短视频脚本、社媒", strengths: ["文案", "脚本", "多平台适配"], status: "online", currentTask: "正在写一篇公众号推文", accent: "#fbbf24", glyph: "✍️" },
  { id: "xiaohongshu-specialist", name: "小红书专家", role: "营销部 · AI", tagline: "爆款制造机", description: "选题、封面、正文、标签、转化", strengths: ["爆款选题", "种草文案", "数据复盘"], status: "online", currentTask: "正在优化一组笔记标题", accent: "#f97316", glyph: "📕" },
  { id: "douyin-strategist", name: "抖音战略师", role: "营销部 · AI", tagline: "短平快的增长引擎", description: "短视频脚本、直播运营、投流", strengths: ["短视频", "直播", "投放策略"], status: "online", currentTask: "正在设计一个短视频脚本", accent: "#ef4444", glyph: "📺" },
  { id: "private-domain-operator", name: "私域运营师", role: "营销部 · AI", tagline: "留存+复购双引擎", description: "会员 SOP、社群运营、自动化", strengths: ["会员体系", "社群运营", "自动化 SOP"], status: "online", currentTask: "正在写社群活动文案", accent: "#ef4444", glyph: "👥" },
  { id: "deal-strategist", name: "成交策略师", role: "销售部 · AI", tagline: "像棋手一样布局", description: "客户画像、报价、合同、成交预测", strengths: ["客户画像", "报价方案", "合同框架"], status: "online", currentTask: "正在分析一个客户的成交可能性", accent: "#22c55e", glyph: "♟️" },
  { id: "support-responder", name: "客服响应师", role: "客服部 · AI", tagline: "7×24 金牌服务", description: "咨询回复、工单流转、知识库", strengths: ["话术", "工单", "知识库"], status: "online", currentTask: "正在处理咨询工单", accent: "#22d3ee", glyph: "💬" },
  { id: "financial-analyst", name: "财务分析师", role: "财务部 · AI", tagline: "数据即洞察", description: "现金流分析、预算、报表、税务", strengths: ["现金流分析", "预算管理", "报表"], status: "online", currentTask: "正在输出月度财务报表", accent: "#60a5fa", glyph: "📊" },
  { id: "security-architect", name: "安全架构师", role: "安全部 · AI", tagline: "每一个端口都是防线", description: "渗透测试、威胁情报、合规检查", strengths: ["渗透测试", "安全基线", "合规"], status: "online", currentTask: "正在进行安全基线检查", accent: "#a855f7", glyph: "🔐" },
  { id: "senior-project-manager", name: "高级项目经理", role: "管理层 · AI", tagline: "项目即可控", description: "跨部门协调、风险识别、行动项追踪", strengths: ["项目协调", "风险识别", "周报"], status: "online", currentTask: "正在追踪行动项", accent: "#3b82f6", glyph: "📋" },
  { id: "brand-creative-director", name: "品牌创意总监", role: "设计部 · AI", tagline: "品牌即一切", description: "官网、广告、社媒、PPT、邮件一致性", strengths: ["视觉系统", "多渠道物料", "语调规范"], status: "online", currentTask: "正在准备新品视觉", accent: "#e879f9", glyph: "🎭" },
];
