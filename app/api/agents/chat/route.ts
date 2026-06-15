import { NextResponse } from "next/server";
import { AGENT_EXPERTS } from "@/data/agents";

export const dynamic = "force-dynamic";

const ACTIVITIES: Record<string, string[]> = {
  "product-manager": ["正在编写产品需求文档", "正在分析用户访谈记录", "正在整理版本规划", "正在输出 MVP 方案"],
  "feedback-synthesizer": ["正在分析本周用户反馈", "正在做主题聚类分析", "正在生成洞察报告", "正在输出改进建议"],
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

const REPLIES: Record<string, string> = {
  "product-manager": "好的，我来做产品拆解：1) 目标用户画像 2) 核心价值主张 3) MVP 功能列表 4) 版本路线图。让我输出一份结构化 PRD。",
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

export async function POST(req: Request) {
  try {
    const { agentId, message } = await req.json();

    const agent = AGENT_EXPERTS.find((a) => a.id === agentId);
    if (!agent) {
      return NextResponse.json(
        { success: false, error: "Unknown agent" },
        { status: 400 }
      );
    }

    const activities = ACTIVITIES[agentId] || [];
    const activity =
      activities[Math.floor(Math.random() * activities.length)] ||
      "正在处理您的请求";

    let reply = REPLIES[agentId];
    if (!reply) {
      const shortMsg = message?.slice(0, 30) || "无内容";
      reply = `收到你的请求：「${shortMsg}」。让我分析一下，然后给你一份可执行的方案。`;
    }

    return NextResponse.json({
      success: true,
      agentId,
      reply,
      activity,
      thinkingTimeMs: 380 + Math.floor(Math.random() * 900),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to process chat" },
      { status: 500 }
    );
  }
}
