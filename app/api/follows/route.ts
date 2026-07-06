import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface FollowRequest {
  followingId: string;
  userId?: string;
}

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const type = searchParams.get("type") || "following";

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (type === "followers") {
      const follows = await prisma.follow.findMany({
        where: { followingId: userId },
        include: { follower: { select: { id: true, nickname: true, avatar: true } } },
      });
      const data = follows.map((f) => f.follower);
      return NextResponse.json({ data, count: data.length });
    } else {
      const follows = await prisma.follow.findMany({
        where: { followerId: userId },
        include: { following: { select: { id: true, nickname: true, avatar: true } } },
      });
      const data = follows.map((f) => f.following);
      return NextResponse.json({ data, count: data.length });
    }
  } catch (error) {
    console.error("[Follows API] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: FollowRequest = await request.json();
    const { followingId } = body;

    if (!followingId) {
      return NextResponse.json({ error: "followingId is required" }, { status: 400 });
    }

    const sessionUserId = await getUserIdFromSession(request);
    const userId = sessionUserId || body.userId || "anonymous";

    if (userId === followingId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId } },
    });

    if (existingFollow) {
      await prisma.follow.delete({ where: { id: existingFollow.id } });
      
      const followersCount = await prisma.follow.count({ where: { followingId } });
      const followingCount = await prisma.follow.count({ where: { followerId: userId } });

      return NextResponse.json({
        success: true,
        followed: false,
        followersCount,
        followingCount,
      });
    }

    await prisma.follow.create({
      data: { followerId: userId, followingId },
    });

    const followersCount = await prisma.follow.count({ where: { followingId } });
    const followingCount = await prisma.follow.count({ where: { followerId: userId } });

    return NextResponse.json({
      success: true,
      followed: true,
      followersCount,
      followingCount,
    });
  } catch (error) {
    console.error("[Follows API] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}