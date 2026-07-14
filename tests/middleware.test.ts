/**
 * 中间件鉴权测试
 *
 * 运行：npm test 或 npx tsx --test tests/middleware.test.ts
 *
 * 测试 middleware 中的路径白名单与鉴权逻辑（纯函数级别）。
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

// ====== 从 middleware 中提取的纯函数（镜像实现，便于测试逻辑） ======

const PUBLIC_PATHS = ["/", "/lover/login", "/lover/register", "/lover/forgot-password"];
const PUBLIC_PATH_PREFIXES = ["/lover/login/", "/lover/register/", "/lover/forgot-password/"];
const PUBLIC_API_PREFIXES = [
  "/api/auth",
  "/api/users",
  "/api/health",
  "/api/sms",
  "/api/payment/notify",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  for (const prefix of PUBLIC_PATH_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  // 静态资源
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return true;
  }
  return false;
}

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// ====== 测试用例 ======

describe("中间件 - 公开页面路径", () => {
  test("首页应被视为公开路径", () => {
    assert.equal(isPublicPath("/"), true);
  });

  test("登录/注册/忘记密码应被视为公开路径", () => {
    assert.equal(isPublicPath("/lover/login"), true);
    assert.equal(isPublicPath("/lover/register"), true);
    assert.equal(isPublicPath("/lover/forgot-password"), true);
  });

  test("主应用 /lover 应被视为非公开路径", () => {
    assert.equal(isPublicPath("/lover"), false);
  });

  test("静态资源应被视为公开路径", () => {
    assert.equal(isPublicPath("/_next/static/chunk.js"), true);
    assert.equal(isPublicPath("/favicon.ico"), true);
    assert.equal(isPublicPath("/logo.png"), true);
  });
});

describe("中间件 - 公开 API 路径", () => {
  test("鉴权 API 应被视为公开", () => {
    assert.equal(isPublicApi("/api/auth/login"), true);
    assert.equal(isPublicApi("/api/auth/session"), true);
  });

  test("用户注册 API 应被视为公开", () => {
    assert.equal(isPublicApi("/api/users"), true);
  });

  test("健康检查 API 应被视为公开", () => {
    assert.equal(isPublicApi("/api/health"), true);
  });

  test("短信 API 应被视为公开", () => {
    assert.equal(isPublicApi("/api/sms/send"), true);
    assert.equal(isPublicApi("/api/sms/verify"), true);
  });

  test("支付回调 API 应被视为公开", () => {
    assert.equal(isPublicApi("/api/payment/notify/wechat"), true);
    assert.equal(isPublicApi("/api/payment/notify/alipay"), true);
  });

  test("创建订单 API 应被视为非公开", () => {
    assert.equal(isPublicApi("/api/payment/create"), false);
  });

  test("查询订单 API 应被视为非公开", () => {
    assert.equal(isPublicApi("/api/payment/orders"), false);
  });

  test("聊天 API 应被视为非公开", () => {
    assert.equal(isPublicApi("/api/chat"), false);
  });

  test("LLM 配置 API 应被视为非公开", () => {
    assert.equal(isPublicApi("/api/llm-config"), false);
  });
});

describe("中间件 - 鉴权决策", () => {
  // 模拟中间件鉴权决策
  function decideAuth(pathname: string, hasSessionCookie: boolean, hasSessionHeader: boolean): "public" | "redirect" | "unauthorized" | "ok" {
    if (isPublicPath(pathname)) return "public";
    if (pathname.startsWith("/api/")) {
      if (isPublicApi(pathname)) return "public";
      if (!hasSessionHeader) return "unauthorized";
      return "ok";
    }
    // 页面请求
    if (!hasSessionCookie && !hasSessionHeader) return "redirect";
    return "ok";
  }

  test("公开页面无需鉴权", () => {
    assert.equal(decideAuth("/", false, false), "public");
    assert.equal(decideAuth("/lover/login", false, false), "public");
  });

  test("受保护页面无 session 应重定向", () => {
    assert.equal(decideAuth("/lover", false, false), "redirect");
    assert.equal(decideAuth("/lover/dashboard", false, false), "redirect");
  });

  test("受保护页面有 cookie 应放行", () => {
    assert.equal(decideAuth("/lover", true, false), "ok");
  });

  test("受保护 API 无 session header 应返回 401", () => {
    assert.equal(decideAuth("/api/payment/create", false, false), "unauthorized");
    assert.equal(decideAuth("/api/chat", false, false), "unauthorized");
    assert.equal(decideAuth("/api/llm-config", false, false), "unauthorized");
  });

  test("受保护 API 有 session header 应放行", () => {
    assert.equal(decideAuth("/api/payment/create", false, true), "ok");
    assert.equal(decideAuth("/api/chat", false, true), "ok");
  });

  test("公开 API 无 session 也应放行", () => {
    assert.equal(decideAuth("/api/auth/login", false, false), "public");
    assert.equal(decideAuth("/api/sms/send", false, false), "public");
    assert.equal(decideAuth("/api/payment/notify/wechat", false, false), "public");
  });
});
