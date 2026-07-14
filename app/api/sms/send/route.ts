import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// POST /api/sms/send — 发送短信验证码
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, purpose } = body as { phone: string; purpose: "register" | "login" | "reset_password" };

    if (!phone || !purpose) {
      return NextResponse.json({ error: "缺少手机号或用途" }, { status: 400 });
    }

    // 手机号格式校验（中国大陆）
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: "手机号格式不正确" }, { status: 400 });
    }

    // 频率限制：同一手机号 60 秒内只能发一次
    const recentCode = await prisma.smsCode.findFirst({
      where: {
        phone,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });
    if (recentCode) {
      return NextResponse.json({ error: "验证码发送过于频繁，请 60 秒后重试" }, { status: 429 });
    }

    // 生成 6 位验证码
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 分钟有效

    // 存入数据库
    await prisma.smsCode.create({
      data: { phone, code, purpose, expiresAt },
    });

    // TODO: 实际发送短信（阿里云/腾讯云 SMS SDK）
    // 开发环境：直接返回验证码（生产环境必须移除）
    const isDev = process.env.NODE_ENV === "development";

    console.log(`[SMS] 验证码: ${phone} -> ${code} (purpose: ${purpose})`);

    return NextResponse.json({
      success: true,
      message: "验证码已发送",
      ...(isDev ? { devCode: code } : {}),
    });
  } catch (error) {
    console.error("发送验证码失败:", error);
    return NextResponse.json({ error: "发送验证码失败" }, { status: 500 });
  }
}
