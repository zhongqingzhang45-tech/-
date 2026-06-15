import { NextResponse } from "next/server";
import { findUser, generateToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "请填写邮箱和密码" },
        { status: 400 }
      );
    }

    const user = findUser(email.trim());
    if (!user) {
      return NextResponse.json(
        { success: false, error: "邮箱未注册，请先创建账号" },
        { status: 401 }
      );
    }

    if (user.password !== password) {
      return NextResponse.json(
        { success: false, error: "密码错误，请重试" },
        { status: 401 }
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
