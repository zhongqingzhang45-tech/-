/**
 * 短信验证码逻辑测试
 *
 * 运行：npx tsx --test tests/sms.test.ts
 *
 * 测试手机号格式校验、验证码生成、过期与消费逻辑。
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

// ====== 镜像 SMS API 中的纯函数 ======

const PHONE_REGEX = /^1[3-9]\d{9}$/;
const CODE_VALIDITY_MS = 5 * 60 * 1000; // 5 分钟
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 秒

function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isCodeExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt < now;
}

function isWithinCooldown(lastSentAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - lastSentAt.getTime() < RESEND_COOLDOWN_MS;
}

interface SmsCodeRecord {
  phone: string;
  code: string;
  purpose: "register" | "login" | "reset_password";
  consumed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * 模拟 verify 逻辑：返回结果而不抛出异常
 */
function verifyCode(
  record: SmsCodeRecord | null,
  inputCode: string,
  inputPhone: string,
  purpose: SmsCodeRecord["purpose"],
  now: Date = new Date()
): { ok: true } | { ok: false; error: string } {
  if (!record) return { ok: false, error: "验证码不存在或已使用" };
  if (record.phone !== inputPhone) return { ok: false, error: "验证码不存在或已使用" };
  if (record.purpose !== purpose) return { ok: false, error: "验证码不存在或已使用" };
  if (record.consumed) return { ok: false, error: "验证码不存在或已使用" };
  if (isCodeExpired(record.expiresAt, now)) return { ok: false, error: "验证码已过期" };
  if (record.code !== inputCode) return { ok: false, error: "验证码不正确" };
  return { ok: true };
}

// ====== 测试用例 ======

describe("SMS - 手机号格式校验", () => {
  test("合法手机号应通过校验", () => {
    assert.equal(isValidPhone("13800138000"), true);
    assert.equal(isValidPhone("15912345678"), true);
    assert.equal(isValidPhone("18600000000"), true);
  });

  test("非法手机号应被拒绝", () => {
    assert.equal(isValidPhone("12345678901"), false); // 以 12 开头
    assert.equal(isValidPhone("1380013800"), false); // 10 位
    assert.equal(isValidPhone("138001380001"), false); // 12 位
    assert.equal(isValidPhone("abc"), false);
    assert.equal(isValidPhone(""), false);
    assert.equal(isValidPhone("10000000000"), false); // 以 10 开头
  });
});

describe("SMS - 验证码生成", () => {
  test("生成的验证码应为 6 位数字", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateCode();
      assert.equal(code.length, 6, `验证码长度应为 6，实际为 ${code.length}`);
      assert.ok(/^\d{6}$/.test(code), `验证码应全为数字，实际为 ${code}`);
      const num = parseInt(code, 10);
      assert.ok(num >= 100000 && num <= 999999, `验证码应在 100000-999999 范围内，实际为 ${num}`);
    }
  });
});

describe("SMS - 过期判断", () => {
  test("未过期的验证码应返回 false", () => {
    const now = new Date("2026-07-14T12:00:00Z");
    const expiresAt = new Date("2026-07-14T12:04:00Z"); // 4 分钟后过期
    assert.equal(isCodeExpired(expiresAt, now), false);
  });

  test("已过期的验证码应返回 true", () => {
    const now = new Date("2026-07-14T12:10:00Z");
    const expiresAt = new Date("2026-07-14T12:04:00Z"); // 6 分钟前过期
    assert.equal(isCodeExpired(expiresAt, now), true);
  });

  test("刚好等于过期时间的验证码不算过期（严格小于语义）", () => {
    const now = new Date("2026-07-14T12:05:00Z");
    const expiresAt = new Date("2026-07-14T12:05:00Z"); // 恰好等于
    // API 使用 expiresAt < now，相等时返回 false
    assert.equal(isCodeExpired(expiresAt, now), false);
  });

  test("过期时间后 1ms 应算过期", () => {
    const expiresAt = new Date("2026-07-14T12:05:00Z");
    const now = new Date("2026-07-14T12:05:00.001Z");
    assert.equal(isCodeExpired(expiresAt, now), true);
  });
});

describe("SMS - 重发冷却", () => {
  test("冷却期内应返回 true", () => {
    const now = new Date("2026-07-14T12:00:30Z");
    const lastSent = new Date("2026-07-14T12:00:00Z"); // 30 秒前
    assert.equal(isWithinCooldown(lastSent, now), true);
  });

  test("冷却期外应返回 false", () => {
    const now = new Date("2026-07-14T12:01:30Z");
    const lastSent = new Date("2026-07-14T12:00:00Z"); // 90 秒前
    assert.equal(isWithinCooldown(lastSent, now), false);
  });
});

describe("SMS - 验证码校验逻辑", () => {
  const baseRecord: SmsCodeRecord = {
    phone: "13800138000",
    code: "123456",
    purpose: "login",
    consumed: false,
    expiresAt: new Date("2026-07-14T12:05:00Z"),
    createdAt: new Date("2026-07-14T12:00:00Z"),
  };
  const now = new Date("2026-07-14T12:02:00Z");

  test("正确的验证码应通过", () => {
    const result = verifyCode(baseRecord, "123456", "13800138000", "login", now);
    assert.equal(result.ok, true);
  });

  test("验证码不存在应失败", () => {
    const result = verifyCode(null, "123456", "13800138000", "login", now);
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /不存在/);
  });

  test("手机号不匹配应失败", () => {
    const result = verifyCode(baseRecord, "123456", "13900139000", "login", now);
    assert.equal(result.ok, false);
  });

  test("用途不匹配应失败", () => {
    const result = verifyCode(baseRecord, "123456", "13800138000", "register", now);
    assert.equal(result.ok, false);
  });

  test("已消费的验证码应失败", () => {
    const consumed = { ...baseRecord, consumed: true };
    const result = verifyCode(consumed, "123456", "13800138000", "login", now);
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /已使用/);
  });

  test("过期的验证码应失败", () => {
    const expired = { ...baseRecord, expiresAt: new Date("2026-07-14T11:55:00Z") };
    const result = verifyCode(expired, "123456", "13800138000", "login", now);
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /过期/);
  });

  test("错误的验证码应失败", () => {
    const result = verifyCode(baseRecord, "999999", "13800138000", "login", now);
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /不正确/);
  });
});
