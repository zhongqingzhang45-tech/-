import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/diaries - List diaries
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const characterKey = searchParams.get("characterKey");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const where: any = { userId };
    if (characterKey) where.characterKey = characterKey;

    const [total, diaries] = await Promise.all([
      prisma.diary.count({ where }),
      prisma.diary.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { tags: true },
        orderBy: { date: "desc" },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      diaries,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    console.error("Failed to list diaries:", error);
    return NextResponse.json(
      { error: "Failed to list diaries" },
      { status: 500 }
    );
  }
}

// POST /api/diaries - Create diary
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, characterKey, title, content, mood, moodEmoji, tags, isAIGenerated } = body;

    if (!userId || !characterKey || !title || !content) {
      return NextResponse.json(
        { error: "userId, characterKey, title, and content are required" },
        { status: 400 }
      );
    }

    const diary = await prisma.diary.create({
      data: {
        userId,
        characterKey,
        title,
        content,
        mood: mood || "平静",
        moodEmoji: moodEmoji || "😊",
        isAIGenerated: isAIGenerated ?? true,
        tags: tags
          ? { create: tags.map((tag: string) => ({ tag })) }
          : undefined,
      },
      include: { tags: true },
    });

    return NextResponse.json({ diary }, { status: 201 });
  } catch (error) {
    console.error("Failed to create diary:", error);
    return NextResponse.json(
      { error: "Failed to create diary" },
      { status: 500 }
    );
  }
}
