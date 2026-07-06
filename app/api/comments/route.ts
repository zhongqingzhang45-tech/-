import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface CreateCommentRequest {
  postId: string;
  content: string;
  parentId?: string;
  isAI?: boolean;
  characterKey?: string;
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
    const postId = searchParams.get("postId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, nickname: true, avatar: true } },
        likes: { select: { userId: true } },
        replies: {
          include: {
            user: { select: { id: true, nickname: true, avatar: true } },
            likes: { select: { userId: true } },
          },
        },
      },
    });

    const total = await prisma.comment.count({ where: { postId, parentId: null } });

    const commentsWithCounts = comments.map((comment) => ({
      ...comment,
      likesCount: comment.likes.length,
      repliesCount: comment.replies.length,
      isLiked: false,
      replies: comment.replies.map((reply) => ({
        ...reply,
        likesCount: reply.likes.length,
        isLiked: false,
      })),
    }));

    return NextResponse.json({
      data: commentsWithCounts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[Comments API] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCommentRequest = await request.json();
    const { postId, content, parentId, isAI, characterKey } = body;

    if (!postId || !content) {
      return NextResponse.json({ error: "postId and content are required" }, { status: 400 });
    }
    if (content.length > 5000) {
      return NextResponse.json({ error: "content too long" }, { status: 400 });
    }

    const sessionUserId = await getUserIdFromSession(request);
    const userId = sessionUserId || body.userId || "anonymous";

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId,
        content,
        parentId: parentId || null,
        isAI: isAI || false,
        characterKey: characterKey || null,
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
          actionType: "comment",
          targetPostId: postId,
          targetCommentId: comment.id,
          content,
        },
      });
    }

    return NextResponse.json({
      ...comment,
      likesCount: 0,
      repliesCount: 0,
      isLiked: false,
    }, { status: 201 });
  } catch (error) {
    console.error("[Comments API] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}