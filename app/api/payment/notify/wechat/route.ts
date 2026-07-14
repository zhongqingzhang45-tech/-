import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/payment/notify/wechat — 微信支付回调
// 微信支付成功后会以 POST XML/JSON 通知此接口
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let payload: any;

    if (contentType.includes("application/json")) {
      payload = await request.json();
    } else {
      // 微信可能发 XML
      const text = await request.text();
      // 简易解析：实际应使用 xml2js
      payload = { out_trade_no: text.match(/<out_trade_no><!\[CDATA\[(.+?)\]\]>/)?.[1],
                  transaction_id: text.match(/<transaction_id><!\[CDATA\[(.+?)\]\]>/)?.[1],
                  result_code: text.match(/<result_code><!\[CDATA\[(.+?)\]\]>/)?.[1] };
    }

    const orderNo = payload.out_trade_no;
    const tradeNo = payload.transaction_id;
    const resultCode = payload.result_code;

    if (!orderNo) {
      return NextResponse.json({ code: "FAIL", message: "缺少订单号" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { orderNo } });
    if (!order) {
      return NextResponse.json({ code: "FAIL", message: "订单不存在" }, { status: 404 });
    }

    if (order.status === "paid") {
      // 幂等：已处理过
      return NextResponse.json({ code: "SUCCESS", message: "OK" });
    }

    if (resultCode === "SUCCESS") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "paid", tradeNo, paidAt: new Date() },
      });

      // 发放权益
      await grantOrderBenefits(order);
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "failed" },
      });
    }

    return NextResponse.json({ code: "SUCCESS", message: "OK" });
  } catch (error) {
    console.error("微信支付回调处理失败:", error);
    return NextResponse.json({ code: "FAIL", message: "内部错误" }, { status: 500 });
  }
}

// 订单权益发放
async function grantOrderBenefits(order: any) {
  const metadata = order.metadata as any;
  if (!metadata) return;

  if (order.type === "membership") {
    const tier = metadata.tier;
    const durationMs = metadata.duration === "yearly" ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const expiry = new Date(Date.now() + durationMs);

    await prisma.user.update({
      where: { id: order.userId },
      data: { membershipTier: tier, membershipExpiry: expiry },
    });
  } else if (order.type === "coins") {
    const coinsToAdd = (metadata.coins || 0) + (metadata.bonus || 0);
    if (coinsToAdd > 0) {
      await prisma.user.update({
        where: { id: order.userId },
        data: { coins: { increment: coinsToAdd } },
      });
    }
  }
}
