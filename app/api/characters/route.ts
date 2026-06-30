import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/characters - List characters for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const characters = await prisma.character.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ characters });
  } catch (error) {
    console.error("Failed to list characters:", error);
    return NextResponse.json(
      { error: "Failed to list characters" },
      { status: 500 }
    );
  }
}

// POST /api/characters - Create or update character state
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      characterKey,
      name,
      nickname,
      userNickname,
      gender,
      relationshipType,
      live2dModel,
      affection,
      resentment,
      trust,
      intimacy,
      energy,
      mood,
      arousal,
      valence,
      dominance,
      level,
      experience,
      streakDays,
    } = body;

    if (!userId || !characterKey) {
      return NextResponse.json(
        { error: "userId and characterKey are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.character.findUnique({
      where: { userId_characterKey: { userId, characterKey } },
    });

    const data: any = {};

    if (name !== undefined) data.name = name;
    if (nickname !== undefined) data.nickname = nickname;
    if (userNickname !== undefined) data.userNickname = userNickname;
    if (gender !== undefined) data.gender = gender;
    if (relationshipType !== undefined) data.relationshipType = relationshipType;
    if (live2dModel !== undefined) data.live2dModel = live2dModel;
    if (affection !== undefined) data.affection = affection;
    if (resentment !== undefined) data.resentment = resentment;
    if (trust !== undefined) data.trust = trust;
    if (intimacy !== undefined) data.intimacy = intimacy;
    if (energy !== undefined) data.energy = energy;
    if (mood !== undefined) data.mood = mood;
    if (arousal !== undefined) data.arousal = arousal;
    if (valence !== undefined) data.valence = valence;
    if (dominance !== undefined) data.dominance = dominance;
    if (level !== undefined) data.level = level;
    if (experience !== undefined) data.experience = experience;
    if (streakDays !== undefined) data.streakDays = streakDays;
    data.lastActiveAt = new Date();

    let character;
    if (existing) {
      character = await prisma.character.update({
        where: { id: existing.id },
        data,
      });
    } else {
      character = await prisma.character.create({
        data: {
          userId,
          characterKey,
          name: name || "未命名",
          nickname: nickname || "",
          userNickname: userNickname || "宝贝",
          gender: gender || "female",
          relationshipType: relationshipType || "lover",
          live2dModel: live2dModel || null,
          affection: affection ?? 50,
          resentment: resentment ?? 0,
          trust: trust ?? 50,
          intimacy: intimacy ?? 30,
          energy: energy ?? 100,
          mood: mood || "neutral",
          arousal: arousal ?? 0.5,
          valence: valence ?? 0.5,
          dominance: dominance ?? 0.5,
          level: level ?? 1,
          experience: experience ?? 0,
          streakDays: streakDays ?? 0,
        },
      });
    }

    return NextResponse.json({ character });
  } catch (error) {
    console.error("Failed to save character:", error);
    return NextResponse.json(
      { error: "Failed to save character" },
      { status: 500 }
    );
  }
}
