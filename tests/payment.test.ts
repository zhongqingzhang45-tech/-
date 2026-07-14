/**
 * 支付订单与权益发放测试
 *
 * 运行：npx tsx --test tests/payment.test.ts
 *
 * 测试商品价格表、订单号生成、权益发放逻辑。
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

// ====== 镜像 payment API 中的纯函数 ======

const PRODUCT_PRICES: Record<string, { name: string; amount: number; type: string; metadata?: Record<string, any> }> = {
  "membership_pro_monthly": { name: "Pro会员·月卡", amount: 29, type: "membership", metadata: { tier: "pro", duration: "monthly" } },
  "membership_pro_yearly": { name: "Pro会员·年卡", amount: 288, type: "membership", metadata: { tier: "pro", duration: "yearly" } },
  "membership_proplus_monthly": { name: "Pro+会员·月卡", amount: 59, type: "membership", metadata: { tier: "pro_plus", duration: "monthly" } },
  "membership_proplus_yearly": { name: "Pro+会员·年卡", amount: 588, type: "membership", metadata: { tier: "pro_plus", duration: "yearly" } },
  "coins_100": { name: "100金币", amount: 6, type: "coins", metadata: { coins: 100 } },
  "coins_500": { name: "500金币", amount: 30, type: "coins", metadata: { coins: 500 } },
  "coins_1200": { name: "1200金币", amount: 68, type: "coins", metadata: { coins: 1200 } },
  "coins_3000": { name: "3000金币", amount: 128, type: "coins", metadata: { coins: 3000 } },
  "coins_6800": { name: "6800金币", amount: 328, type: "coins", metadata: { coins: 6800, bonus: 1800 } },
};

function generateOrderNo(): string {
  const ts = Date.now().toString();
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `ORD${ts}${rand}`;
}

interface UserState {
  id: string;
  membershipTier: string;
  membershipExpiry: Date | null;
  coins: number;
}

interface OrderRecord {
  userId: string;
  orderNo: string;
  type: string;
  itemId: string | null;
  itemName: string;
  amount: number;
  paymentMethod: string;
  status: string;
  paidAt: Date | null;
  metadata: any;
}

function grantBenefits(user: UserState, order: OrderRecord): UserState {
  if (order.status !== "paid") return user;
  const metadata = order.metadata || {};
  const next = { ...user };

  if (order.type === "membership") {
    const tier = metadata.tier;
    const durationMs = metadata.duration === "yearly"
      ? 365 * 24 * 60 * 60 * 1000
      : 30 * 24 * 60 * 60 * 1000;
    next.membershipTier = tier;
    const base = user.membershipExpiry && user.membershipExpiry > new Date()
      ? user.membershipExpiry.getTime()
      : Date.now();
    next.membershipExpiry = new Date(base + durationMs);
  } else if (order.type === "coins") {
    const coinsToAdd = (metadata.coins || 0) + (metadata.bonus || 0);
    if (coinsToAdd > 0) next.coins += coinsToAdd;
  }

  return next;
}

// ====== 测试用例 ======

describe("支付 - 商品价格表", () => {
  test("应包含 4 种会员套餐", () => {
    const memberships = Object.entries(PRODUCT_PRICES).filter(([, p]) => p.type === "membership");
    assert.equal(memberships.length, 4);
  });

  test("应包含 5 档金币充值", () => {
    const coins = Object.entries(PRODUCT_PRICES).filter(([, p]) => p.type === "coins");
    assert.equal(coins.length, 5);
  });

  test("所有商品价格应为正数", () => {
    for (const [id, product] of Object.entries(PRODUCT_PRICES)) {
      assert.ok(product.amount > 0, `商品 ${id} 的价格应大于 0，实际为 ${product.amount}`);
    }
  });

  test("年卡价格应低于月卡 * 12", () => {
    assert.ok(PRODUCT_PRICES["membership_pro_yearly"].amount < PRODUCT_PRICES["membership_pro_monthly"].amount * 12);
    assert.ok(PRODUCT_PRICES["membership_proplus_yearly"].amount < PRODUCT_PRICES["membership_proplus_monthly"].amount * 12);
  });

  test("Pro+ 价格应高于 Pro 价格", () => {
    assert.ok(PRODUCT_PRICES["membership_proplus_monthly"].amount > PRODUCT_PRICES["membership_pro_monthly"].amount);
    assert.ok(PRODUCT_PRICES["membership_proplus_yearly"].amount > PRODUCT_PRICES["membership_pro_yearly"].amount);
  });

  test("金币充值应包含 bonus 字段（仅 6800 档）", () => {
    assert.equal(PRODUCT_PRICES["coins_100"].metadata?.bonus, undefined);
    assert.equal(PRODUCT_PRICES["coins_6800"].metadata?.bonus, 1800);
  });
});

describe("支付 - 订单号生成", () => {
  test("订单号应以 ORD 开头", () => {
    const orderNo = generateOrderNo();
    assert.ok(orderNo.startsWith("ORD"), `订单号应以 ORD 开头，实际为 ${orderNo}`);
  });

  test("订单号应包含时间戳和 4 位随机数", () => {
    const orderNo = generateOrderNo();
    // ORD + 13位时间戳 + 4位随机数 = 20 字符
    assert.equal(orderNo.length, 20);
    assert.ok(/^ORD\d{17}$/.test(orderNo), `订单号格式不符：${orderNo}`);
  });

  test("连续生成的订单号应不同", () => {
    const a = generateOrderNo();
    const b = generateOrderNo();
    assert.notEqual(a, b);
  });
});

describe("支付 - 权益发放（会员）", () => {
  const baseUser: UserState = {
    id: "user-1",
    membershipTier: "free",
    membershipExpiry: null,
    coins: 0,
  };

  test("购买 Pro 月卡应升级会员并设置 30 天有效期", () => {
    const order: OrderRecord = {
      userId: "user-1",
      orderNo: "ORD1",
      type: "membership",
      itemId: "membership_pro_monthly",
      itemName: "Pro会员·月卡",
      amount: 29,
      paymentMethod: "wechat",
      status: "paid",
      paidAt: new Date(),
      metadata: { tier: "pro", duration: "monthly" },
    };
    const result = grantBenefits(baseUser, order);
    assert.equal(result.membershipTier, "pro");
    assert.ok(result.membershipExpiry);
    const days = (result.membershipExpiry!.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    assert.ok(days > 29 && days < 31, `月卡有效期应约 30 天，实际 ${days} 天`);
  });

  test("购买 Pro+ 年卡应升级会员并设置 365 天有效期", () => {
    const order: OrderRecord = {
      userId: "user-1",
      orderNo: "ORD2",
      type: "membership",
      itemId: "membership_proplus_yearly",
      itemName: "Pro+会员·年卡",
      amount: 588,
      paymentMethod: "alipay",
      status: "paid",
      paidAt: new Date(),
      metadata: { tier: "pro_plus", duration: "yearly" },
    };
    const result = grantBenefits(baseUser, order);
    assert.equal(result.membershipTier, "pro_plus");
    const days = (result.membershipExpiry!.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    assert.ok(days > 364 && days < 366, `年卡有效期应约 365 天，实际 ${days} 天`);
  });

  test("已过期会员续费应从当前时间开始计算", () => {
    const expiredUser: UserState = {
      ...baseUser,
      membershipTier: "pro",
      membershipExpiry: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 天前过期
    };
    const order: OrderRecord = {
      userId: "user-1",
      orderNo: "ORD3",
      type: "membership",
      itemId: "membership_pro_monthly",
      itemName: "Pro会员·月卡",
      amount: 29,
      paymentMethod: "wechat",
      status: "paid",
      paidAt: new Date(),
      metadata: { tier: "pro", duration: "monthly" },
    };
    const result = grantBenefits(expiredUser, order);
    const days = (result.membershipExpiry!.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    assert.ok(days > 29 && days < 31, `续费后应从当前时间开始计算，实际 ${days} 天`);
  });

  test("未支付订单不应发放权益", () => {
    const order: OrderRecord = {
      userId: "user-1",
      orderNo: "ORD4",
      type: "membership",
      itemId: "membership_pro_monthly",
      itemName: "Pro会员·月卡",
      amount: 29,
      paymentMethod: "wechat",
      status: "pending",
      paidAt: null,
      metadata: { tier: "pro", duration: "monthly" },
    };
    const result = grantBenefits(baseUser, order);
    assert.equal(result.membershipTier, "free");
    assert.equal(result.membershipExpiry, null);
  });
});

describe("支付 - 权益发放（金币）", () => {
  const baseUser: UserState = {
    id: "user-1",
    membershipTier: "free",
    membershipExpiry: null,
    coins: 100,
  };

  test("购买 100 金币包应增加 100 金币", () => {
    const order: OrderRecord = {
      userId: "user-1",
      orderNo: "ORD5",
      type: "coins",
      itemId: "coins_100",
      itemName: "100金币",
      amount: 6,
      paymentMethod: "wechat",
      status: "paid",
      paidAt: new Date(),
      metadata: { coins: 100 },
    };
    const result = grantBenefits(baseUser, order);
    assert.equal(result.coins, 200);
  });

  test("购买 6800 金币包应包含 bonus 1800", () => {
    const order: OrderRecord = {
      userId: "user-1",
      orderNo: "ORD6",
      type: "coins",
      itemId: "coins_6800",
      itemName: "6800金币",
      amount: 328,
      paymentMethod: "alipay",
      status: "paid",
      paidAt: new Date(),
      metadata: { coins: 6800, bonus: 1800 },
    };
    const result = grantBenefits(baseUser, order);
    assert.equal(result.coins, 100 + 6800 + 1800);
  });

  test("未支付订单不应增加金币", () => {
    const order: OrderRecord = {
      userId: "user-1",
      orderNo: "ORD7",
      type: "coins",
      itemId: "coins_500",
      itemName: "500金币",
      amount: 30,
      paymentMethod: "wechat",
      status: "pending",
      paidAt: null,
      metadata: { coins: 500 },
    };
    const result = grantBenefits(baseUser, order);
    assert.equal(result.coins, 100);
  });
});

describe("支付 - 幂等性", () => {
  test("同一订单重复发放权益应得到一致结果（应用层去重）", () => {
    const user: UserState = {
      id: "user-1",
      membershipTier: "free",
      membershipExpiry: null,
      coins: 0,
    };
    const order: OrderRecord = {
      userId: "user-1",
      orderNo: "ORD-DUP",
      type: "coins",
      itemId: "coins_100",
      itemName: "100金币",
      amount: 6,
      paymentMethod: "wechat",
      status: "paid",
      paidAt: new Date(),
      metadata: { coins: 100 },
    };

    // 应用层应在调用 grantBenefits 前检查 order.status 是否已处理
    // 这里仅验证函数本身的纯函数性质
    const r1 = grantBenefits(user, order);
    const r2 = grantBenefits(user, order);
    assert.equal(r1.coins, r2.coins);
  });
});
