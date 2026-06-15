"use client";

import { useEffect, useState } from "react";

interface Props {
  planId: string;
  planName: string;
  planPrice: string;
  onClose: () => void;
}

export function PaymentModal({ planId, planName, planPrice, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleAlipay = async () => {
    setLoading(true);
    setError("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("lifeos_token") : null;
      const userData = typeof window !== "undefined" ? localStorage.getItem("lifeos_user") : null;
      const email = userData ? JSON.parse(userData)?.email : "";

      const res = await fetch("/api/payment/alipay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, userEmail: email }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "支付初始化失败");
        return;
      }

      if (data.redirect) {
        window.location.href = data.redirect;
        return;
      }

      if (data.payUrl) {
        window.location.href = data.payUrl;
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md animate-modal-in">
        {/* Glow */}
        <div className="pointer-events-none absolute -top-16 left-1/2 h-48 w-full -translate-x-1/2 rounded-full bg-brand-400/15 blur-[80px]" />

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0f1e]/95 backdrop-blur-2xl shadow-2xl">
          {/* Header art */}
          <div className="relative h-16 overflow-hidden bg-gradient-to-br from-brand-400/20 to-fuchsia-500/20">
            <svg className="absolute inset-0 h-full w-full opacity-20" viewBox="0 0 400 64" preserveAspectRatio="none">
              <path d="M0,32 Q200,0 400,32" stroke="rgba(34,211,238,0.5)" strokeWidth="1" fill="none" />
              <path d="M0,40 Q200,60 400,20" stroke="rgba(232,121,249,0.4)" strokeWidth="1" fill="none" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-between px-8">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-brand-400">确认订单</div>
                <h2 className="text-lg font-semibold text-white">{planName}</h2>
              </div>
              <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition">✕</button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Order summary */}
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">产品</span>
                <span className="text-sm font-medium text-white">{planName}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">周期</span>
                <span className="text-sm text-gray-300">每月</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className="text-sm text-gray-400">应付金额</span>
                <span className="text-2xl font-bold text-brand-400">¥{planPrice}</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="mb-5">
              <div className="mb-2 text-xs text-gray-400 uppercase tracking-wider">支付方式</div>
              <button
                className="flex w-full items-center gap-3 rounded-xl border border-brand-400/30 bg-brand-400/5 p-4 transition hover:bg-brand-400/10"
              >
                {/* Alipay logo */}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1677ff]">
                  <span className="text-sm font-bold text-white">支</span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">支付宝</div>
                  <div className="text-xs text-gray-400">推荐有支付宝账号的用户使用</div>
                </div>
                <span className="ml-auto text-brand-400">✓</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={handleAlipay}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#1677ff] to-[#4096ff] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1677ff]/25 transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  正在唤起支付宝...
                </span>
              ) : (
                <>
                  使用支付宝支付 <span className="ml-1 font-bold">¥{planPrice}</span>
                </>
              )}
            </button>

            {/* Security note */}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-500">
              <span className="text-brand-400">🔒</span>
              支付安全由支付宝保障，资金直接进入商户账户
            </div>

            <div className="mt-3 text-center">
              <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-300 transition">
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
