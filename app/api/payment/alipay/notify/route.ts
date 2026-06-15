import { NextResponse } from "next/server";
import { AlipaySdk } from "alipay-sdk";
import { paidOrders } from "@/lib/payment";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value as string;
    });

    const alipaySdk = new AlipaySdk({
      appId: process.env.ALIPAY_APP_ID || "",
      privateKey: process.env.ALIPAY_PRIVATE_KEY || "",
      alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || "",
      gateway: process.env.ALIPAY_GATEWAY || "https://openapi.alipay.com/gateway.do",
    });

    // Verify sign
    const signVerified = alipaySdk.checkNotifySign(params);
    if (!signVerified) {
      console.error("Alipay notify sign verification failed");
      return new NextResponse("fail", { status: 200 });
    }

    const { out_trade_no, trade_status, total_amount, app_id } = params;

    // Verify app_id matches
    if (app_id !== process.env.ALIPAY_APP_ID) {
      return new NextResponse("fail", { status: 200 });
    }

    if (trade_status === "TRADE_SUCCESS" || trade_status === "TRADE_FINISHED") {
      // Extract plan from out_trade_no: LIFEOS_{planId}_{timestamp}_{random}
      const parts = out_trade_no.split("_");
      const planId = parts[1] || "unknown";

      // Record payment
      paidOrders.set(out_trade_no, {
        planId,
        paidAt: Date.now(),
      });

      console.log(`Payment success: ${out_trade_no}, amount: ${total_amount}, plan: ${planId}`);

      // TODO: Update user's subscription in database
    }

    return new NextResponse("success", { status: 200 });
  } catch (error) {
    console.error("Alipay notify error:", error);
    return new NextResponse("fail", { status: 200 });
  }
}
