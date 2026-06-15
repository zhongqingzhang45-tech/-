import { NextResponse } from "next/server";
import { AlipaySdk } from "alipay-sdk";

// Pricing plan config
const PLANS: Record<string, { name: string; price: string; period: string }> = {
  startup: { name: "LifeOS 创业版", price: "99", period: "每月" },
  business: { name: "LifeOS 企业版", price: "299", period: "每月" },
  custom: { name: "LifeOS 定制版", price: "0", period: "联系顾问" },
};

export const dynamic = "force-dynamic";

function getAlipay() {
  return new AlipaySdk({
    appId: process.env.ALIPAY_APP_ID || "",
    privateKey: process.env.ALIPAY_PRIVATE_KEY || "",
    alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || "",
    gateway: process.env.ALIPAY_GATEWAY || "https://openapi.alipay.com/gateway.do",
  });
}

export async function POST(req: Request) {
  try {
    const { planId, userEmail } = await req.json();

    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json({ success: false, error: "无效的套餐" }, { status: 400 });
    }

    // For custom plan, redirect to contact
    if (planId === "custom") {
      return NextResponse.json({
        success: true,
        redirect: "mailto:sales@lifesys.top?subject=LifeOS定制方案咨询",
      });
    }

    const outTradeNo = `LIFEOS_${planId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const notifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://ai.lifesys.top"}/api/payment/alipay/notify`;
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://ai.lifesys.top"}/?payment=success&plan=${planId}`;

    const alipaySdk = getAlipay();

    // Use pageExec for computer website payment
    const result = await alipaySdk.pageExec("POST", {
      bizContent: {
        outTradeNo,
        totalAmount: plan.price,
        subject: `${plan.name} - ${plan.period}`,
        productCode: "FAST_INSTANT_TRADE_PAY",
        body: `LifeOS ${plan.name}订阅费用，用户: ${userEmail || "未登录"}`,
      },
      returnUrl,
      notifyUrl,
    });

    if (typeof result === "string") {
      return NextResponse.json({ success: true, payUrl: result, outTradeNo });
    }

    return NextResponse.json({ success: false, error: "支付链接生成失败" }, { status: 500 });
  } catch (error) {
    console.error("Alipay payment error:", error);
    return NextResponse.json({ success: false, error: "支付服务暂时不可用" }, { status: 500 });
  }
}
