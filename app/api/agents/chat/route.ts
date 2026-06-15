import { NextRequest, NextResponse } from "next/server";
import { AGENT_FILE_MAP, STATIC_REPLIES, ACTIVITY_HINTS } from "../../../../data/agents";
import { readFileSync } from "fs";

// 简单的内存缓存，避免每次请求都读文件 + 调 API
const fileCache = new Map<string, string>();
const CACHE_TTL = 1000 * 60 * 30; // 30 分钟

interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  agentId: string;
  messages: AgentMessage[];
  input: string;
}

// 读取 Agent MD 文件（带缓存）
function readAgentContent(agentId: string): string | null {
  const path = AGENT_FILE_MAP[agentId];
  if (!path) return null;

  const cached = fileCache.get(agentId);
  if (cached) return cached;

  try {
    const content = readFileSync(path, "utf-8");
    if (content) {
      fileCache.set(agentId, content);
      return content;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// 从 MD 文件中提取 agent 的角色名（作为回复前缀）
function extractAgentName(mdContent: string): string {
  const nameMatch = mdContent.match(/name:\s*([^\n]+)/i);
  return nameMatch ? nameMatch[1].trim() : "";
}

// 从 MD 内容中生成 system prompt
// 只保留核心部分（Identity、Role、Critical Rules、Workflow），避免 token 太长
function buildSystemPrompt(mdContent: string, agentName: string): string {
  // 保留 4000 字符以内的核心内容
  const trimmed = mdContent.slice(0, 4000);

  const prefix = `你是 ${agentName || "AI 专家"}，一名专业的 ${agentName || "AI 顾问"}。

你有自己独特的工作方法和专业判断。
- 如果你有明确的工作流程（Workflow/Deliverables 部分），请按流程输出结构化的结果
- 如果有固定的框架（如 PRD、MEDDPICC、增长实验报告等），请按模板输出
- 不要写废话，直接输出有价值的内容
- 用中文回复，保持专业但自然的语调
- 优先使用 Markdown 格式输出结构化内容（标题、列表、表格）

`;

  return prefix + "以下是你的详细 Agent 文档（作为你的专业知识与工作方法）：\n\n" + trimmed;
}

// 调用 DeepSeek Chat API
async function callDeepSeek(
  systemPrompt: string,
  userMessages: AgentMessage[],
  currentInput: string
): Promise<{ reply: string; activity: string } | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  // 构造消息：system + 历史 + 当前输入
  const messages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  // 只取最近 6 条历史消息（避免上下文过大）
  const recent = userMessages.slice(-6);
  recent.forEach((m) => {
    messages.push({ role: m.role, content: m.content });
  });

  messages.push({ role: "user", content: currentInput });

  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: 0.6,
        max_tokens: 2048,
      }),
    });

    if (!res.ok) {
      console.error(`DeepSeek API error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) return null;

    // 返回回复和活动状态
    const activity = "正在生成专业回复...";
    return { reply, activity };
  } catch (err) {
    console.error("DeepSeek call failed:", err);
    return null;
  }
}

// 随机挑选一个活动状态
function pickActivity(agentId: string): string {
  const hints = ACTIVITY_HINTS[agentId];
  if (hints && hints.length) {
    return hints[Math.floor(Math.random() * hints.length)];
  }
  return "正在处理中...";
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { agentId, messages = [] } = body;
    // 同时兼容 input 与 message 字段
    const input: string = (body as any).input || (body as any).message || "";

    if (!agentId) {
      return NextResponse.json({ error: "agentId is required" }, { status: 400 });
    }
    if (!input) {
      return NextResponse.json({ error: "input or message is required" }, { status: 400 });
    }

    const activity = pickActivity(agentId);

    // 1. 读取 Agent MD 文件
    const mdContent = readAgentContent(agentId);

    if (mdContent) {
      const agentName = extractAgentName(mdContent);
      const systemPrompt = buildSystemPrompt(mdContent, agentName);

      // 2. 调用 DeepSeek LLM
      const llmResult = await callDeepSeek(systemPrompt, messages, input);
      if (llmResult) {
        return NextResponse.json({
          reply: llmResult.reply,
          activity: activity || llmResult.activity,
          source: "agent-llm",
          agentName,
        });
      }
    }

    // 3. 回退：当没有 MD 文件或 LLM API 不可用时，用静态回复
    const fallbackReply =
      STATIC_REPLIES[agentId] || "您好！让我来帮你分析一下这个问题：\n\n" + input;

    return NextResponse.json({
      reply: fallbackReply,
      activity,
      source: "static",
      agentName: "",
    });
  } catch (e: any) {
    console.error("chat API error:", e);
    return NextResponse.json(
      { error: e?.message || "Unknown error", reply: "抱歉，系统繁忙，请稍后再试。", activity: "正在重试..." },
      { status: 500 }
    );
  }
}

// GET /api/agents/chat?agentId=xxx  →  测试 Agent 文件是否可读取
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const agentId = url.searchParams.get("agentId");

  if (!agentId) {
    return NextResponse.json({
      agents: Object.keys(AGENT_FILE_MAP),
      files: AGENT_FILE_MAP,
      env: {
        hasDeepSeekKey: !!process.env.DEEPSEEK_API_KEY,
      },
    });
  }

  const content = readAgentContent(agentId);
  return NextResponse.json({
    agentId,
    path: AGENT_FILE_MAP[agentId],
    hasFile: !!content,
    fileLength: content?.length || 0,
    fallback: STATIC_REPLIES[agentId],
  });
}
