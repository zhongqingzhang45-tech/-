import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface CreateLikeRequest {
  postId?: string;
  commentId?: string;
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

export async function POST(request: NextRequest) {
  try {
    const body: CreateLikeRequest = await request.json();
    const { postId, commentId, isAI, characterKey } = body;

    if (!postId && !commentId) {
      return NextResponse.json({ error: "postId or commentId is required" }, { status: 400 });
    }

    const sessionUserId = await getUserIdFromSession(request);
    const userId = sessionUserId || body.userId || "anonymous";

    const existingLike = await prisma.like.findFirst({
      where: { userId, postId, commentId },
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      
      const postLikeCount = postId ? await prisma.like.count({ where: { postId } }) : 0;
      const commentLikeCount = commentId ? await prisma.like.count({ where: { commentId } }) : 0;

      return NextResponse.json({
        success: true,
        liked: false,
        postLikeCount,
        commentLikeCount,
      });
    }

    const like = await prisma.like.create({
      data: {
        userId,
        postId: postId || null,
        commentId: commentId || null,
        isAI: isAI || false,
        characterKey: characterKey || null,
      },
    });

    if (isAI && characterKey) {
      await prisma.aICommunityInteraction.create({
        data: {
          userId,
          characterKey,
          actionType: "like",
          targetPostId: postId || null,
          targetCommentId: commentId || null,
        },
      });
    }

    const postLikeCount = postId ? await prisma.like.count({ where: { postId } }) : 0;
    const commentLikeCount = commentId ? await prisma.like.count({ where: { commentId } }) : 0;

    return NextResponse.json({
      success: true,
      liked: true,
      postLikeCount,
      commentLikeCount,
    });
  } catch (error) {
    console.error("[Likes API] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}