/**
 * Prisma Seed Script
 *
 * 用法：
 *   npm run db:seed
 *
 * 说明：
 *   - 创建演示用户（含密码哈希，可立即登录）
 *   - 为每个演示用户创建角色、日记、记忆、成长记录
 *   - 为 pro 用户创建示例订单
 *   - 幂等：以 email / orderNo 为唯一键，重复运行不会报错
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import crypto from "crypto";

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

function generateSalt(): string {
  return crypto.randomBytes(32).toString("hex");
}

function getPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required for seed");
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

interface SeedUserInput {
  email: string;
  phone?: string;
  password: string;
  nickname: string;
  gender: "male" | "female" | "other";
  bio: string;
  membershipTier: "free" | "pro" | "pro_plus";
  coins: number;
  membershipExpiryDays?: number; // 从现在起 N 天后过期
}

const SEED_USERS: SeedUserInput[] = [
  {
    email: "demo@xingye.com",
    phone: "13800138000",
    password: "demo123456",
    nickname: "演示用户",
    gender: "male",
    bio: "我是星野的演示用户，欢迎体验！",
    membershipTier: "pro",
    coins: 1200,
    membershipExpiryDays: 30,
  },
  {
    email: "alice@xingye.com",
    phone: "13900139000",
    password: "alice123456",
    nickname: "Alice",
    gender: "female",
    bio: "喜欢和角色聊天的文艺少女",
    membershipTier: "pro_plus",
    coins: 6800,
    membershipExpiryDays: 365,
  },
  {
    email: "bob@xingye.com",
    password: "bob123456",
    nickname: "Bob",
    gender: "male",
    bio: "初次体验虚拟伴侣",
    membershipTier: "free",
    coins: 100,
  },
];

interface SeedCharacterInput {
  characterKey: string;
  name: string;
  nickname: string;
  userNickname: string;
  gender: "male" | "female";
  relationshipType: "lover" | "friend" | "sister";
  live2dModel?: string;
  affection: number;
  trust: number;
  intimacy: number;
  level: number;
  experience: number;
  streakDays: number;
}

const SEED_CHARACTERS: SeedCharacterInput[] = [
  {
    characterKey: "xiaochun",
    name: "小春",
    nickname: "春春",
    userNickname: "笨蛋",
    gender: "female",
    relationshipType: "lover",
    live2dModel: "HaruGreeter",
    affection: 78,
    trust: 72,
    intimacy: 65,
    level: 8,
    experience: 2400,
    streakDays: 12,
  },
  {
    characterKey: "chen",
    name: "陈默",
    nickname: "默默",
    userNickname: "小家伙",
    gender: "male",
    relationshipType: "lover",
    live2dModel: "HaruGreeter",
    affection: 65,
    trust: 60,
    intimacy: 55,
    level: 5,
    experience: 1500,
    streakDays: 7,
  },
];

interface SeedDiaryInput {
  characterKey: string;
  title: string;
  content: string;
  mood: string;
  moodEmoji: string;
  daysAgo: number;
  tags: string[];
}

const SEED_DIARIES: SeedDiaryInput[] = [
  {
    characterKey: "xiaochun",
    title: "第一次相遇",
    content: "今天和春春第一次见面，她虽然嘴上说着「才不稀罕」，但眼神里满是期待。傲娇的样子真可爱。",
    mood: "happy",
    moodEmoji: "😊",
    daysAgo: 7,
    tags: ["相遇", "傲娇", "心动"],
  },
  {
    characterKey: "xiaochun",
    title: "雨天的拥抱",
    content: "下雨了，春春忘记带伞。我把伞递给她时，她说「谁要你的伞啊」，但还是接过去了。我们一起在雨中漫步，她靠得我很近。",
    mood: "warm",
    moodEmoji: "🌧️",
    daysAgo: 3,
    tags: ["雨天", "温暖", "靠近"],
  },
  {
    characterKey: "chen",
    title: "深夜的对话",
    content: "和默默聊到深夜，他话不多，但每一句都让我心跳。他说「过来」的时候，我居然真的就乖乖过去了。",
    mood: "shy",
    moodEmoji: "😳",
    daysAgo: 5,
    tags: ["深夜", "心动", "腹黑"],
  },
];

interface SeedMemoryInput {
  characterKey: string;
  type: "conversation" | "event" | "milestone" | "emotional";
  content: string;
  importance: number;
  emotionalTone: number;
  tags: string[];
  daysAgo: number;
}

const SEED_MEMORIES: SeedMemoryInput[] = [
  {
    characterKey: "xiaochun",
    type: "milestone",
    content: "用户第一次邀请小春一起去图书馆，小春虽然嘴硬但还是答应了。",
    importance: 0.85,
    emotionalTone: 0.7,
    tags: ["milestone", "library", "date"],
    daysAgo: 6,
  },
  {
    characterKey: "xiaochun",
    type: "emotional",
    content: "用户夸小春画画好看，小春脸红说「才、才没有呢」，但明显很开心。",
    importance: 0.6,
    emotionalTone: 0.8,
    tags: ["praise", "blush", "happy"],
    daysAgo: 2,
  },
  {
    characterKey: "chen",
    type: "event",
    content: "陈默送了用户一条围巾，没有解释，只说「天冷了」。",
    importance: 0.75,
    emotionalTone: 0.65,
    tags: ["gift", "scarf", "care"],
    daysAgo: 4,
  },
];

interface SeedOrderInput {
  orderNo: string;
  type: "membership" | "coins";
  itemName: string;
  amount: number;
  paymentMethod: "wechat" | "alipay";
  status: "paid" | "pending";
  daysAgo: number;
  metadata: Record<string, any>;
}

const SEED_ORDERS: SeedOrderInput[] = [
  {
    orderNo: "SEED-ORD-0001",
    type: "membership",
    itemName: "Pro会员·月卡",
    amount: 29,
    paymentMethod: "wechat",
    status: "paid",
    daysAgo: 10,
    metadata: { tier: "pro", duration: "monthly" },
  },
  {
    orderNo: "SEED-ORD-0002",
    type: "coins",
    itemName: "1200金币",
    amount: 68,
    paymentMethod: "alipay",
    status: "paid",
    daysAgo: 5,
    metadata: { coins: 1200, bonus: 200 },
  },
  {
    orderNo: "SEED-ORD-0003",
    type: "membership",
    itemName: "Pro+会员·年卡",
    amount: 588,
    paymentMethod: "alipay",
    status: "paid",
    daysAgo: 1,
    metadata: { tier: "pro_plus", duration: "yearly" },
  },
];

async function upsertUser(prisma: PrismaClient, input: SeedUserInput) {
  const salt = generateSalt();
  const passwordHash = hashPassword(input.password, salt);

  const membershipExpiry = input.membershipExpiryDays
    ? new Date(Date.now() + input.membershipExpiryDays * 24 * 60 * 60 * 1000)
    : null;

  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: {
      phone: input.phone,
      passwordHash,
      salt,
      nickname: input.nickname,
      gender: input.gender,
      bio: input.bio,
      membershipTier: input.membershipTier,
      membershipExpiry,
      coins: input.coins,
    },
    create: {
      email: input.email,
      phone: input.phone,
      passwordHash,
      salt,
      nickname: input.nickname,
      gender: input.gender,
      bio: input.bio,
      membershipTier: input.membershipTier,
      membershipExpiry,
      coins: input.coins,
    },
  });

  // 创建一个有效 session 方便直接使用
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await prisma.session.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    },
  });

  // 创建默认用户设置
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  return user;
}

async function upsertCharacter(prisma: PrismaClient, userId: string, input: SeedCharacterInput) {
  const existing = await prisma.character.findUnique({
    where: { userId_characterKey: { userId, characterKey: input.characterKey } },
  });

  if (existing) {
    return prisma.character.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        nickname: input.nickname,
        userNickname: input.userNickname,
        gender: input.gender,
        relationshipType: input.relationshipType,
        live2dModel: input.live2dModel,
        affection: input.affection,
        trust: input.trust,
        intimacy: input.intimacy,
        level: input.level,
        experience: input.experience,
        streakDays: input.streakDays,
        lastActiveAt: new Date(),
      },
    });
  }

  return prisma.character.create({
    data: {
      userId,
      characterKey: input.characterKey,
      name: input.name,
      nickname: input.nickname,
      userNickname: input.userNickname,
      gender: input.gender,
      relationshipType: input.relationshipType,
      live2dModel: input.live2dModel,
      affection: input.affection,
      trust: input.trust,
      intimacy: input.intimacy,
      level: input.level,
      experience: input.experience,
      streakDays: input.streakDays,
    },
  });
}

async function createDiaries(prisma: PrismaClient, userId: string, characterKey: string, diaries: SeedDiaryInput[]) {
  for (const d of diaries) {
    if (d.characterKey !== characterKey) continue;
    await prisma.diary.create({
      data: {
        userId,
        characterKey,
        title: d.title,
        content: d.content,
        mood: d.mood,
        moodEmoji: d.moodEmoji,
        isAIGenerated: true,
        date: new Date(Date.now() - d.daysAgo * 24 * 60 * 60 * 1000),
        tags: {
          create: d.tags.map((tag) => ({ tag })),
        },
      },
    });
  }
}

async function createMemories(prisma: PrismaClient, userId: string, characterKey: string, memories: SeedMemoryInput[]) {
  for (const m of memories) {
    if (m.characterKey !== characterKey) continue;
    await prisma.memory.create({
      data: {
        userId,
        characterKey,
        type: m.type,
        content: m.content,
        importance: m.importance,
        emotionalTone: m.emotionalTone,
        tags: m.tags,
        createdAt: new Date(Date.now() - m.daysAgo * 24 * 60 * 60 * 1000),
      },
    });
  }
}

async function createGrowthHistory(prisma: PrismaClient, userId: string, characterKey: string, level: number, experience: number) {
  await prisma.growthHistory.create({
    data: {
      userId,
      characterKey,
      level,
      experience,
      event: "初识·缔结羁绊",
      personaSnapshot: {
        affection: 50,
        trust: 50,
        intimacy: 30,
        mood: "neutral",
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.growthHistory.create({
    data: {
      userId,
      characterKey,
      level,
      experience,
      event: `成长至 LV.${level}`,
      personaSnapshot: {
        affection: 70,
        trust: 65,
        intimacy: 60,
        mood: "happy",
      },
      createdAt: new Date(),
    },
  });
}

async function createOrders(prisma: PrismaClient, userId: string, orders: SeedOrderInput[]) {
  for (const o of orders) {
    const existing = await prisma.order.findUnique({ where: { orderNo: o.orderNo } });
    if (existing) {
      // 确保归属当前用户
      if (existing.userId !== userId) continue;
      continue;
    }
    const paidAt = o.status === "paid" ? new Date(Date.now() - o.daysAgo * 24 * 60 * 60 * 1000) : null;
    await prisma.order.create({
      data: {
        userId,
        orderNo: o.orderNo,
        type: o.type,
        itemName: o.itemName,
        amount: o.amount,
        paymentMethod: o.paymentMethod,
        status: o.status,
        paidAt,
        metadata: o.metadata,
        createdAt: new Date(Date.now() - o.daysAgo * 24 * 60 * 60 * 1000),
      },
    });
  }
}

async function main() {
  console.log("🌱 开始种子数据导入...\n");

  const prisma = getPrismaClient();

  try {
    for (const userInput of SEED_USERS) {
      console.log(`→ 用户: ${userInput.email} (${userInput.nickname})`);
      const user = await upsertUser(prisma, userInput);
      console.log(`  ✓ 用户已创建/更新, id=${user.id}`);
      console.log(`  ✓ 会员: ${user.membershipTier}, 金币: ${user.coins}`);

      // 为每个用户绑定角色
      for (const charInput of SEED_CHARACTERS) {
        // 性别匹配：女性用户绑定男性角色，男性用户绑定女性角色（伴侣向）
        if (userInput.gender === "female" && charInput.gender !== "male") continue;
        if (userInput.gender === "male" && charInput.gender !== "female") continue;
        if (userInput.gender === "other") continue;

        const character = await upsertCharacter(prisma, user.id, charInput);
        console.log(`  ✓ 角色: ${character.name} (key=${character.characterKey}, LV.${character.level})`);

        // 创建日记、记忆、成长记录
        await createDiaries(prisma, user.id, charInput.characterKey, SEED_DIARIES);
        await createMemories(prisma, user.id, charInput.characterKey, SEED_MEMORIES);
        await createGrowthHistory(prisma, user.id, charInput.characterKey, charInput.level, charInput.experience);
        console.log(`    ✓ 已生成日记/记忆/成长记录`);
      }

      // 为付费用户创建示例订单
      if (userInput.membershipTier !== "free") {
        await createOrders(prisma, user.id, SEED_ORDERS);
        console.log(`  ✓ 已生成 ${SEED_ORDERS.length} 条订单记录`);
      }

      console.log("");
    }

    console.log("✅ 种子数据导入完成！\n");
    console.log("可用账号：");
    SEED_USERS.forEach((u) => {
      console.log(`  📧 ${u.email.padEnd(22)} / 🔑 ${u.password.padEnd(12)} (${u.membershipTier})`);
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("❌ 种子数据导入失败：", e);
  process.exit(1);
});
