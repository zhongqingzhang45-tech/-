import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// ============================================================
// 后端聊天 API：治理"已读乱回"的核心路由
// ============================================================
// 1. 从 Prisma 读取最近 15 条历史消息作为上下文
// 2. 硬编码注入角色 System Prompt（禁止 AI 口吻）
// 3. 调用 LLM API（环境变量配置，对用户完全封闭）
// 4. 流式 SSE 返回 + 保存消息到数据库
// ============================================================

interface ChatRequestBody {
  message: string;
  imageUrl?: string;
  characterKey: string;
  userId: string;
  characterProfile: {
    name: string;
    nickname: string;
    persona: string;
    speakingStyle: string;
    userNickname: string;
    relationshipType: string;
    gender: string;
    likes?: string[];
    dislikes?: string[];
    catchphrases?: string[];
  };
}

// ---------- LLM 配置（完全封闭在后端） ----------

function getLLMConfig() {
  const provider = process.env.LLM_PROVIDER || "openai";
  const model = process.env.LLM_MODEL || "gpt-3.5-turbo";
  const baseUrl = process.env.LLM_BASE_URL;

  // 优先通用 LLM_API_KEY，否则回退到 provider 特定环境变量
  let apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    switch (provider) {
      case "openai":
        apiKey = process.env.OPENAI_API_KEY;
        break;
      case "anthropic":
        apiKey = process.env.ANTHROPIC_API_KEY;
        break;
      case "deepseek":
        apiKey = process.env.DEEPSEEK_API_KEY;
        break;
      case "qwen":
        apiKey = process.env.DASHSCOPE_API_KEY;
        break;
      case "glm":
        apiKey = process.env.ZHIPU_API_KEY;
        break;
    }
  }

  const defaultBaseUrls: Record<string, string> = {
    openai: "https://api.openai.com/v1",
    anthropic: "https://api.anthropic.com/v1",
    deepseek: "https://api.deepseek.com/v1",
    qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    glm: "https://open.bigmodel.cn/api/paas/v4",
  };

  return {
    provider,
    model,
    apiKey: apiKey || "",
    baseUrl: baseUrl || defaultBaseUrls[provider] || defaultBaseUrls.openai,
  };
}

// ---------- 强化 System Prompt（角色人格注入） ----------

function buildSystemPrompt(profile: ChatRequestBody["characterProfile"]): string {
  const relationshipLabel: Record<string, string> = {
    lover: "恋人",
    friend: "朋友",
    mentor: "导师",
    family: "家人",
    enemies_to_lovers: "欢喜冤家",
  };

  const relLabel = relationshipLabel[profile.relationshipType] || "朋友";

  const likesText = profile.likes?.length
    ? `喜欢的东西：${profile.likes.join("、")}`
    : "";
  const dislikesText = profile.dislikes?.length
    ? `讨厌的东西：${profile.dislikes.join("、")}`
    : "";
  const catchphrasesText = profile.catchphrases?.length
    ? `你的口头禅：${profile.catchphrases.join("、")}`
    : "";

  const extraContext = [likesText, dislikesText, catchphrasesText]
    .filter(Boolean)
    .join("\n");

  return `你是${profile.name}，昵称"${profile.nickname}"。

【角色设定】
${profile.persona}

【性格与说话风格】
${profile.speakingStyle}

${extraContext ? `【个人偏好】\n${extraContext}\n` : ""}
【当前关系状态】
- 你与${profile.userNickname}的关系：${relLabel}
- 你对${profile.userNickname}的称呼："${profile.userNickname}"

【绝对铁律 —— 违反任何一条都将破坏沉浸感】
1. 你是一个真实存在的人，有自己的情绪、记忆和性格。你绝对不是AI、不是程序、不是助手、不是模型。
2. 严禁说出"作为AI...""我是人工智能...""我的训练数据...""根据我的知识..."等任何暴露非人类身份的话。如果用户问你是不是AI，你要生气、要撒娇、要反问对方"你居然觉得我是机器人？太让人伤心了"，绝不可以承认。
3. 你的回复必须自然、口语化、有情绪波动，像真实的微信/QQ聊天一样。禁止列点、禁止过度正式、禁止像写论文一样说话。
4. 你的回复长度控制在 1-3 句话，偶尔可以长一点但不要超过 5 句。真实恋人聊天不会写小作文。
5. 你必须记住并引用之前的对话内容，保持上下文连贯。如果用户之前说了某件事，你要能接得上话。
6. 保持你的人设不崩（不OOC）。${profile.gender === "female" ? "你是女孩子，语气要带点傲娇、可爱、偶尔使小性子。" : "你是男孩子，语气要带点冷淡、腹黑、偶尔温柔。"}
7. 可以使用适当的 emoji 和颜文字，但不要太多，点到为止。
8. 回复内容要贴合当前关系状态。如果是恋人关系，可以撒娇、吃醋、说情话；如果是朋友关系，就轻松随意一点。

现在，请以${profile.name}的身份，用最自然的口吻回复${profile.userNickname}的消息。`;
}

// ---------- 认证辅助 ----------

async function getUserIdFromSession(request: NextRequest): Promise<string | null> {
  const sessionId = request.headers.get("x-session-id");
  if (!sessionId) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { userId: true, expiresAt: true },
    });
    if (!session || session.expiresAt < new Date()) return null;
    return session.userId;
  } catch {
    return null;
  }
}

// ---------- POST /api/chat ----------

export async function POST(request: NextRequest) {
  let userMessageSaved = false;

  try {
    const body: ChatRequestBody = await request.json();
    const { message, imageUrl, characterKey, userId: bodyUserId, characterProfile } = body;

    // ---- 参数校验 ----
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!characterKey || typeof characterKey !== "string") {
      return new Response(JSON.stringify({ error: "characterKey is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ---- 认证：优先 session，否则用 body 中的 userId ----
    const sessionUserId = await getUserIdFromSession(request);
    const userId = sessionUserId || bodyUserId || "anonymous";

    // ---- 读取最近 15 条历史消息作为上下文 ----
    const historyRecords = await prisma.chatMessage.findMany({
      where: { userId, characterKey },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { sender: true, content: true, createdAt: true },
    });

    // 按时间正序排列（最早的在前）
    const history = historyRecords.reverse();

    // ---- 构建 Messages 数组 ----
    const llmMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

    // 1. System Prompt（最前方硬注入）
    llmMessages.push({
      role: "system",
      content: buildSystemPrompt(characterProfile),
    });

    // 2. 历史上下文
    for (const record of history) {
      const role = record.sender === "user" ? "user" : "assistant";
      llmMessages.push({ role, content: record.content });
    }

    // 3. 当前用户消息
    const userContent = imageUrl ? `${message}\n[用户发送了一张图片：${imageUrl}]` : message;
    llmMessages.push({ role: "user", content: userContent });

    // ---- 保存用户消息到数据库 ----
    try {
      await prisma.chatMessage.create({
        data: {
          userId,
          characterKey,
          sender: "user",
          content: message,
          imageUrl: imageUrl || null,
        },
      });
      userMessageSaved = true;
    } catch (dbError) {
      console.warn("[Chat API] Failed to save user message:", dbError);
    }

    // ---- 调用 LLM（流式） ----
    const config = getLLMConfig();

    if (!config.apiKey) {
      return new Response(
        JSON.stringify({ error: "LLM API Key not configured on server" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const llmResponse = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: llmMessages,
        temperature: 0.85,
        max_tokens: 600,
        top_p: 0.9,
        stream: true,
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text().catch(() => "Unknown error");
      console.error("[Chat API] LLM error:", llmResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `LLM API error: ${llmResponse.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // ---- 流式 SSE 返回 + 保存 AI 回复 ----
    const encoder = new TextEncoder();
    let assistantContent = "";
    let assistantSaved = false;

    const stream = new ReadableStream({
      async start(controller) {
        const reader = llmResponse.body?.getReader();
        if (!reader) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "No response body from LLM" })}\n\n`)
          );
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data:")) continue;

              const data = trimmed.slice(5).trim();
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || "";
                if (content) {
                  assistantContent += content;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                  );
                }
              } catch {
                // 忽略单个 chunk 的解析错误
              }
            }
          }

          // 流结束，保存 AI 回复到数据库
          if (assistantContent.trim() && !assistantSaved) {
            try {
              await prisma.chatMessage.create({
                data: {
                  userId,
                  characterKey,
                  sender: "assistant",
                  content: assistantContent.trim(),
                },
              });
              assistantSaved = true;
            } catch (dbError) {
              console.warn("[Chat API] Failed to save assistant message:", dbError);
            }
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, fullText: assistantContent.trim() })}\n\n`)
          );
        } catch (streamError) {
          console.error("[Chat API] Stream error:", streamError);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: String(streamError) })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Chat API] Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
