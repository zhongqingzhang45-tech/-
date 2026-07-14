import { NextRequest, NextResponse } from "next/server";

// 不需要鉴权的公开路径
const PUBLIC_PATHS = [
  "/",
  "/lover/login",
  "/lover/register",
  "/lover/forgot-password",
];

// 不需要鉴权的 API 路径前缀
const PUBLIC_API_PREFIXES = [
  "/api/auth",
  "/api/users",
  "/api/health",
  "/api/sms",
  "/api/payment/notify", // 支付回调（第三方调用，无 session）
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // 静态资源
  if (pathname.startsWith("/_next") || pathname.startsWith("/vendor") || pathname.startsWith("/live2d-models")) return true;
  if (pathname === "/favicon.ico") return true;
  return false;
}

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公开页面直接放行
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 公开 API 直接放行
  if (pathname.startsWith("/api/") && isPublicApi(pathname)) {
    return NextResponse.next();
  }

  // API 请求：校验 x-session-id header
  if (pathname.startsWith("/api/")) {
    const sessionId = request.headers.get("x-session-id");
    if (!sessionId) {
      return NextResponse.json(
        { error: "Authentication required", code: "NO_SESSION" },
        { status: 401 },
      );
    }
    // session 校验由各 API route 内部通过 /api/auth/session 逻辑完成
    // middleware 仅做 header 存在性检查，避免重复查库
    return NextResponse.next();
  }

  // 页面请求：校验 cookie 中的 session
  const sessionCookie = request.cookies.get("lover_session")?.value;
  const localStorageFallback = request.headers.get("x-session-id");

  if (!sessionCookie && !localStorageFallback) {
    const loginUrl = new URL("/lover/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，排除：
     * - _next/static, _next/image
     * - favicon.ico, 各类静态文件
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
