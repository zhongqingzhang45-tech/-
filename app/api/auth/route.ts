import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const USER_SELECT = {
  id: true,
  email: true,
  nickname: true,
  avatar: true,
  gender: true,
  birthDate: true,
  bio: true,
  theme: true,
  language: true,
  notifications: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
};

// POST /api/auth/login - User login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const passwordHash = hashPassword(password, user.salt);
    if (passwordHash !== user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

    // 删除该用户旧会话，创建新会话
    await prisma.session.deleteMany({ where: { userId: user.id } });
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt,
      },
    });

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: now },
    });

    const userWithoutSensitive = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      gender: user.gender,
      birthDate: user.birthDate,
      bio: user.bio,
      theme: user.theme,
      language: user.language,
      notifications: user.notifications,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: now,
    };

    return NextResponse.json({
      user: userWithoutSensitive,
      sessionId: session.id,
      expiresAt: session.expiresAt,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
