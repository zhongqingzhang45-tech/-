import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/payment/notify/alipay — 支付宝支付回调
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      payload[key] = value.toString();
    });

    const orderNo = payload.out_trade_no;
    const tradeNo = payload.trade_no;
    const tradeStatus = payload.trade_status;

    if (!orderNo) {
      return NextResponse.json({ code: "FAIL", message: "缺少订单号" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { orderNo } });
    if (!order) {
      return NextResponse.json({ code: "FAIL", message: "订单不存在" }, { status: 404 });
    }

    if (order.status === "paid") {
      return NextResponse.json({ code: "SUCCESS", message: "OK" });
    }

    // 支付宝状态：TRADE_SUCCESS 或 TRADE_FINISHED 表示成功
    if (tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "paid", tradeNo, paidAt: new Date() },
      });

      // 发放权益（与微信回调共用逻辑）
      const metadata = order.metadata as any;
      if (metadata) {
        if (order.type === "membership") {
          const tier = metadata.tier;
          const durationMs = metadata.duration === "yearly" ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
          await prisma.user.update({
            where: { id: order.userId },
            data: { membershipTier: tier, membershipExpiry: new Date(Date.now() + durationMs) },
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
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "failed" },
      });
    }

    return NextResponse.json({ code: "SUCCESS", message: "OK" });
  } catch (error) {
    console.error("支付宝支付回调处理失败:", error);
    return NextResponse.json({ code: "FAIL", message: "内部错误" }, { status: 500 });
  }
}
