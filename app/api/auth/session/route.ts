import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

// GET /api/auth/session - Validate session and get current user
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id");

    if (!sessionId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: sessionId } });
      return NextResponse.json(
        { authenticated: false, expired: true },
        { status: 401 }
      );
    }

    const { passwordHash, salt, ...userWithoutSensitive } = session.user as any;

    return NextResponse.json({
      authenticated: true,
      user: userWithoutSensitive,
      session: {
        id: session.id,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error("Session validation failed:", error);
    return NextResponse.json(
      { error: "Session validation failed" },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/session - Logout (invalidate session)
export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "No session provided" },
        { status: 400 }
      );
    }

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await prisma.session.delete({ where: { id: sessionId } });

    return NextResponse.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout failed:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
