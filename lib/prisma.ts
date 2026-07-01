import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn("DATABASE_URL not set, Prisma client will not work with real database");
    // 构建时返回一个空壳，不会真正连接数据库
    const dummyAdapter = {
      query: async () => ({ rows: [] }),
      executeRaw: async () => 0,
      queryRaw: async () => ({ rows: [] }),
    } as any;
    return new PrismaClient({ adapter: dummyAdapter });
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// 懒加载：只有在真正使用时才初始化
let _prisma: PrismaClient | null = null;

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    if (!_prisma) {
      _prisma = globalForPrisma.prisma ?? createPrismaClient();
      if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = _prisma;
    }
    const value = (_prisma as any)[prop];
    return typeof value === "function" ? value.bind(_prisma) : value;
  },
});
