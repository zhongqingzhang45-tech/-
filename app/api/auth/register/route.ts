import { NextResponse } from "next/server";
import { createUser, generateToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: "请填写所有字段" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "密码至少 6 位" },
        { status: 400 }
      );
    }

    const user = createUser(email.trim(), password, name.trim());
    if (!user) {
      return NextResponse.json(
        { success: false, error: "该邮箱已注册，请直接登录" },
        { status: 409 }
      );
    }

    const token = generateToken(email);

    return NextResponse.json({
      success: true,
      token,
      user: { email: user.email, name: user.name },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
