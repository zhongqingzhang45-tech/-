import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// 商品价格表
const PRODUCT_PRICES: Record<string, { name: string; amount: number; type: string; metadata?: Record<string, any> }> = {
  // 会员
  "membership_pro_monthly":   { name: "Pro会员·月卡",  amount: 29,  type: "membership", metadata: { tier: "pro", duration: "monthly" } },
  "membership_pro_yearly":    { name: "Pro会员·年卡",  amount: 288, type: "membership", metadata: { tier: "pro", duration: "yearly" } },
  "membership_proplus_monthly": { name: "Pro+会员·月卡", amount: 59,  type: "membership", metadata: { tier: "pro_plus", duration: "monthly" } },
  "membership_proplus_yearly":  { name: "Pro+会员·年卡", amount: 588, type: "membership", metadata: { tier: "pro_plus", duration: "yearly" } },
  // 金币充值
  "coins_100":   { name: "100金币",  amount: 6,   type: "coins", metadata: { coins: 100 } },
  "coins_500":   { name: "500金币",  amount: 30,  type: "coins", metadata: { coins: 500 } },
  "coins_1200":  { name: "1200金币", amount: 68,  type: "coins", metadata: { coins: 1200 } },
  "coins_3000":  { name: "3000金币", amount: 128, type: "coins", metadata: { coins: 3000 } },
  "coins_6800":  { name: "6800金币", amount: 328, type: "coins", metadata: { coins: 6800, bonus: 1800 } },
};

function generateOrderNo(): string {
  const ts = Date.now().toString();
  const rand = crypto.randomBytes(4).toString("hex");
  return `ORD${ts}${rand}`;
}

// POST /api/payment/create — 创建支付订单
export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id");
    if (!sessionId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 验证 session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "会话已过期" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, paymentMethod } = body as { productId: string; paymentMethod: "wechat" | "alipay" };

    if (!productId || !paymentMethod) {
      return NextResponse.json({ error: "缺少商品ID或支付方式" }, { status: 400 });
    }

    const product = PRODUCT_PRICES[productId];
    if (!product) {
      return NextResponse.json({ error: "无效的商品ID" }, { status: 400 });
    }

    if (!["wechat", "alipay"].includes(paymentMethod)) {
      return NextResponse.json({ error: "不支持的支付方式" }, { status: 400 });
    }

    const orderNo = generateOrderNo();

    const order = await prisma.order.create({
      data: {
        userId: session.userId,
        orderNo,
        type: product.type,
        itemName: product.name,
        amount: product.amount,
        paymentMethod,
        status: "pending",
        metadata: (product.metadata ?? null) as any,
      },
    });

    // 生成支付链接（模拟，实际对接微信/支付宝 SDK）
    const payUrl = paymentMethod === "wechat"
      ? `https://pay.weixin.qq.com/wxpay/pay?out_trade_no=${orderNo}&total_fee=${Math.round(product.amount * 100)}`
      : `https://openapi.alipay.com/gateway.do?out_trade_no=${orderNo}&total_amount=${product.amount}`;

    return NextResponse.json({
      orderId: order.id,
      orderNo: order.orderNo,
      amount: product.amount,
      payUrl,
      paymentMethod,
      status: "pending",
      message: "订单创建成功，请前往支付",
    });
  } catch (error) {
    console.error("创建支付订单失败:", error);
    return NextResponse.json({ error: "创建支付订单失败" }, { status: 500 });
  }
}
