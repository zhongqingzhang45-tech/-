import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/growth-history - List growth history
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const characterKey = searchParams.get("characterKey");
    const limit = parseInt(searchParams.get("limit") || "30");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const where: any = { userId };
    if (characterKey) where.characterKey = characterKey;

    const history = await prisma.growthHistory.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Failed to list growth history:", error);
    return NextResponse.json(
      { error: "Failed to list growth history" },
      { status: 500 }
    );
  }
}

// POST /api/growth-history - Record growth event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, characterKey, level, experience, event, personaSnapshot } = body;

    if (!userId || !characterKey) {
      return NextResponse.json(
        { error: "userId and characterKey are required" },
        { status: 400 }
      );
    }

    const record = await prisma.growthHistory.create({
      data: {
        userId,
        characterKey,
        level: level ?? 1,
        experience: experience ?? 0,
        event: event || "",
        personaSnapshot: personaSnapshot || {},
      },
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error("Failed to record growth:", error);
    return NextResponse.json(
      { error: "Failed to record growth" },
      { status: 500 }
    );
  }
}
