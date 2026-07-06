import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface CreatePostRequest {
  content: string;
  imageUrl?: string;
  isAI?: boolean;
  characterKey?: string;
  aiPersonaMode?: string;
  userId?: string;
}

interface GetPostsRequest {
  page?: number;
  limit?: number;
  userId?: string;
  isAI?: boolean;
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const userId = searchParams.get("userId");
    const isAI = searchParams.get("isAI") === "true";

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (searchParams.has("isAI")) where.isAI = isAI;

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, nickname: true, avatar: true } },
        likes: { select: { userId: true } },
        comments: { select: { id: true } },
        reposts: { select: { userId: true } },
      },
    });

    const total = await prisma.post.count({ where });

    const postsWithCounts = posts.map((post) => ({
      ...post,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
      repostsCount: post.reposts.length,
      isLiked: false,
    }));

    return NextResponse.json({
      data: postsWithCounts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[Posts API] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePostRequest = await request.json();
    const { content, imageUrl, isAI, characterKey, aiPersonaMode } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }
    if (content.length > 10000) {
      return NextResponse.json({ error: "content too long" }, { status: 400 });
    }

    const sessionUserId = await getUserIdFromSession(request);
    const userId = sessionUserId || body.userId || "anonymous";

    const post = await prisma.post.create({
      data: {
        userId,
        content,
        imageUrl: imageUrl || null,
        isAI: isAI || false,
        characterKey: characterKey || null,
        aiPersonaMode: aiPersonaMode || null,
      },
      include: {
        user: { select: { id: true, nickname: true, avatar: true } },
      },
    });

    if (isAI && characterKey) {
      await prisma.aICommunityInteraction.create({
        data: {
          userId,
          characterKey,
          actionType: "post",
          targetPostId: post.id,
          content,
        },
      });
    }

    return NextResponse.json({
      ...post,
      likesCount: 0,
      commentsCount: 0,
      repostsCount: 0,
      isLiked: false,
    }, { status: 201 });
  } catch (error) {
    console.error("[Posts API] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}