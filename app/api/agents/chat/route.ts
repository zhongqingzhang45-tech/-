import { NextResponse } from "next/server";
import { AGENT_EXPERTS } from "@/data/agents";

export const dynamic = "force-dynamic";

const ACTIVITIES: Record<string, string[]> = {
  "product-manager": [
    "正在编写产品需求文档",
    "正在分析用户访谈记录",
    "正在整理本周版本规划",
    "正在输出 MVP 方案",
  ],
  "ui-designer": [
    "正在设计 Landing 页视觉稿",
    "正在完善组件设计规范",
    "正在生成图标素材",
    "正在优化产品配色方案",
  ],
  architect: [
    "正在评审系统架构方案",
    "正在设计 API 接口规范",
    "正在优化数据库索引",
    "正在编写技术选型报告",
  ],
  frontend: [
    "正在实现仪表盘模块",
    "正在编写前端组件代码",
    "正在调试页面动效",
    "正在做浏览器兼容性测试",
  ],
  backend: [
    "正在开发订单系统 API",
    "正在优化数据库查询",
    "正在编写单元测试",
    "正在部署测试环境",
  ],
  growth: [
    "正在生成本周增长方案",
    "正在分析渠道 ROI",
    "正在策划裂变活动",
    "正在优化转化漏斗",
  ],
  sales: [
    "正在跟进 5 条销售线索",
    "正在生成客户报价单",
    "正在起草合作合同",
    "正在撰写跟进邮件",
  ],
  support: [
    "正在处理客户咨询工单",
    "正在更新知识库文章",
    "正在分析客户反馈",
    "正在生成满意度报告",
  ],
  finance: [
    "正在生成本月财务报表",
    "正在整理发票和账单",
    "正在做现金流分析",
    "正在提醒税务事项",
  ],
  operations: [
    "正在撰写本周运营周报",
    "正在分析运营数据",
    "正在策划用户活动",
    "正在做用户分层分析",
  ],
};

export async function POST(req: Request) {
  try {
    const { agentId, message } = await req.json();

    if (!agentId || !AGENT_EXPERTS.find((a) => a.id === agentId)) {
      return NextResponse.json(
        { success: false, error: "Unknown agent" },
        { status: 400 }
      );
    }

    const activities = ACTIVITIES[agentId] || [];
    const activity =
      activities[Math.floor(Math.random() * activities.length)] ||
      "正在处理您的请求";

    const sampleReplies: Record<string, string> = {
      "product-manager":
        "好的，让我先拆解你的目标。初步判断这需要：1) 用户画像梳理 2) 核心功能列表 3) MVP 优先级规划。我这就输出一份结构化方案。",
      "ui-designer":
        "明白！我会从以下几个维度设计视觉：品牌色、组件规范、页面结构。让我先出一版设计稿。",
      architect:
        "收到，让我分析一下技术需求。建议采用 Next.js + PostgreSQL + Redis 的架构，我会给出详细的模块划分和接口设计。",
      frontend: "好的，我会用 React + Tailwind 实现这个模块，包含响应式布局和微交互动效。",
      backend: "明白，让我设计一下这个功能的 API 接口、数据结构和业务逻辑层。",
      growth:
        "好的！让我分析一下增长机会：拉新渠道推荐 + 转化路径优化 + 留存策略，我会生成一份完整方案。",
      sales: "收到，让我生成一份跟进方案：客户画像分析 + 话术建议 + 报价方案 + 下一步动作清单。",
      support: "你好！让我来帮你处理这个咨询。请问可以先告诉我：你的具体问题是什么？我会给你一份清晰的解决方案。",
      finance: "明白！我来帮你整理财务数据。给我一些关键数字，我会输出结构化的报表和决策建议。",
      operations: "收到！我来帮你分析运营数据并生成周报：核心指标 + 洞察结论 + 下周行动计划。",
    };

    const reply =
      sampleReplies[agentId] ||
      "收到你的请求，让我分析一下，然后给出具体的执行方案。";

    return NextResponse.json({
      success: true,
      agentId,
      reply,
      activity,
      thinkingTimeMs: 420 + Math.floor(Math.random() * 800),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to process chat" },
      { status: 500 }
    );
  }
}
