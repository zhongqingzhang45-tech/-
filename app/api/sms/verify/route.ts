import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

function generateSalt(): string {
  return crypto.randomBytes(32).toString("hex");
}

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// POST /api/sms/verify — 验证短信验证码并登录/注册
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code, purpose } = body as { phone: string; code: string; purpose: "register" | "login" | "reset_password"; newPassword?: string };

    if (!phone || !code || !purpose) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 查找最新的未消费验证码
    const smsCode = await prisma.smsCode.findFirst({
      where: { phone, purpose, consumed: false },
      orderBy: { createdAt: "desc" },
    });

    if (!smsCode) {
      return NextResponse.json({ error: "验证码不存在或已使用" }, { status: 400 });
    }

    if (smsCode.expiresAt < new Date()) {
      return NextResponse.json({ error: "验证码已过期" }, { status: 400 });
    }

    if (smsCode.code !== code) {
      return NextResponse.json({ error: "验证码不正确" }, { status: 400 });
    }

    // 标记验证码已消费
    await prisma.smsCode.update({
      where: { id: smsCode.id },
      data: { consumed: true },
    });

    // 根据用途处理
    if (purpose === "login") {
      // 手机号登录：查找或创建用户
      let user = await prisma.user.findFirst({ where: { phone } });
      if (!user) {
        return NextResponse.json({ error: "该手机号未注册" }, { status: 404 });
      }

      // 创建 session
      const now = new Date();
      const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
      await prisma.session.deleteMany({ where: { userId: user.id } });
      const session = await prisma.session.create({
        data: { userId: user.id, expiresAt },
      });
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: now } });

      const { passwordHash, salt, ...userWithoutSensitive } = user as any;
      return NextResponse.json({
        user: { ...userWithoutSensitive, lastLoginAt: now },
        sessionId: session.id,
        expiresAt: session.expiresAt,
        message: "登录成功",
      });
    }

    if (purpose === "reset_password") {
      // 重置密码：需要 newPassword
      const { newPassword } = body;
      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json({ error: "新密码至少 8 位字符" }, { status: 400 });
      }

      // 通过手机号找用户
      const user = await prisma.user.findFirst({ where: { phone } });
      if (!user) {
        return NextResponse.json({ error: "该手机号未注册" }, { status: 404 });
      }

      const newSalt = generateSalt();
      const newPasswordHash = hashPassword(newPassword, newSalt);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash, salt: newSalt },
      });

      return NextResponse.json({ success: true, message: "密码重置成功" });
    }

    return NextResponse.json({ error: "未知的验证用途" }, { status: 400 });
  } catch (error) {
    console.error("验证码验证失败:", error);
    return NextResponse.json({ error: "验证码验证失败" }, { status: 500 });
  }
}
