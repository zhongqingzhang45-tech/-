import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_PROVIDERS = ["openai", "anthropic", "deepseek", "qwen", "glm", "mock"];

// GET /api/llm-config — 获取当前用户的 LLM 配置
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id");
    if (!sessionId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "会话已过期" }, { status: 401 });
    }

    const config = await prisma.lLMConfig.findUnique({
      where: { userId: session.userId },
    });

    if (!config) {
      // 返回环境变量默认配置（不暴露 apiKey）
      return NextResponse.json({
        provider: process.env.LLM_PROVIDER || "openai",
        model: process.env.LLM_MODEL || "gpt-3.5-turbo",
        baseUrl: process.env.LLM_BASE_URL || null,
        apiKey: null,
        usingEnvConfig: true,
      });
    }

    // 脱敏：apiKey 只返回掩码
    const maskedApiKey = config.apiKey
      ? config.apiKey.slice(0, 6) + "****" + config.apiKey.slice(-4)
      : null;

    return NextResponse.json({
      provider: config.provider,
      model: config.model,
      baseUrl: config.baseUrl,
      apiKey: maskedApiKey,
      hasApiKey: !!config.apiKey,
      usingEnvConfig: false,
    });
  } catch (error) {
    console.error("获取LLM配置失败:", error);
    return NextResponse.json({ error: "获取LLM配置失败" }, { status: 500 });
  }
}

// PUT /api/llm-config — 更新当前用户的 LLM 配置
export async function PUT(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id");
    if (!sessionId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "会话已过期" }, { status: 401 });
    }

    const body = await request.json();
    const { provider, apiKey, model, baseUrl } = body;

    if (provider && !VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json({ error: "不支持的 LLM provider" }, { status: 400 });
    }

    // upsert：不存在则创建，存在则更新
    const config = await prisma.lLMConfig.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        provider: provider || "openai",
        apiKey: apiKey || null,
        model: model || null,
        baseUrl: baseUrl || null,
      },
      update: {
        ...(provider && { provider }),
        ...(apiKey !== undefined && { apiKey: apiKey || null }),
        ...(model !== undefined && { model: model || null }),
        ...(baseUrl !== undefined && { baseUrl: baseUrl || null }),
      },
    });

    const maskedApiKey = config.apiKey
      ? config.apiKey.slice(0, 6) + "****" + config.apiKey.slice(-4)
      : null;

    return NextResponse.json({
      provider: config.provider,
      model: config.model,
      baseUrl: config.baseUrl,
      apiKey: maskedApiKey,
      hasApiKey: !!config.apiKey,
      message: "LLM配置已保存",
    });
  } catch (error) {
    console.error("更新LLM配置失败:", error);
    return NextResponse.json({ error: "更新LLM配置失败" }, { status: 500 });
  }
}

// DELETE /api/llm-config — 删除当前用户的 LLM 配置（恢复使用环境变量）
export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id");
    if (!sessionId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "会话已过期" }, { status: 401 });
    }

    await prisma.lLMConfig.deleteMany({ where: { userId: session.userId } });

    return NextResponse.json({ message: "LLM配置已重置为环境变量默认值" });
  } catch (error) {
    console.error("删除LLM配置失败:", error);
    return NextResponse.json({ error: "删除LLM配置失败" }, { status: 500 });
  }
}
