import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/memories - List memories
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const characterKey = searchParams.get("characterKey");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const where: any = { userId };
    if (characterKey) where.characterKey = characterKey;
    if (type) where.type = type;

    const memories = await prisma.memory.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ memories });
  } catch (error) {
    console.error("Failed to list memories:", error);
    return NextResponse.json(
      { error: "Failed to list memories" },
      { status: 500 }
    );
  }
}

// POST /api/memories - Create memory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, characterKey, type, content, importance, emotionalTone, tags } = body;

    if (!userId || !characterKey || !type || !content) {
      return NextResponse.json(
        { error: "userId, characterKey, type, and content are required" },
        { status: 400 }
      );
    }

    const memory = await prisma.memory.create({
      data: {
        userId,
        characterKey,
        type,
        content,
        importance: importance ?? 0.5,
        emotionalTone: emotionalTone ?? 0,
        tags: tags || [],
      },
    });

    return NextResponse.json({ memory }, { status: 201 });
  } catch (error) {
    console.error("Failed to create memory:", error);
    return NextResponse.json(
      { error: "Failed to create memory" },
      { status: 500 }
    );
  }
}

// PUT /api/memories/batch - Batch create memories
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { memories } = body;

    if (!Array.isArray(memories) || memories.length === 0) {
      return NextResponse.json(
        { error: "memories array is required" },
        { status: 400 }
      );
    }

    const result = await prisma.memory.createMany({
      data: memories.map((m: any) => ({
        userId: m.userId,
        characterKey: m.characterKey,
        type: m.type,
        content: m.content,
        importance: m.importance ?? 0.5,
        emotionalTone: m.emotionalTone ?? 0,
        tags: m.tags || [],
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ count: result.count });
  } catch (error) {
    console.error("Failed to batch create memories:", error);
    return NextResponse.json(
      { error: "Failed to batch create memories" },
      { status: 500 }
    );
  }
}
