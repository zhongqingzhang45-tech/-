"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  SHOP_ITEMS,
  MEMBERSHIP_PLANS,
  COIN_PACKAGES,
  CommerceEngine,
  getCommerceEngine,
  ShopItem,
  ShopItemCategory,
  MembershipTier,
  MembershipPlan,
  CoinPackage,
  formatPrice,
  getRarityColor,
  getRarityLabel,
  CommerceState,
} from "@/lib/core/commerce-system";

// ==================== 主容器 ====================

export type CommerceTab = "shop" | "membership" | "api" | "history";

export function CommercePanel() {
  const [engine] = useState<CommerceEngine>(() => getCommerceEngine());
  const [state, setState] = useState<CommerceState>(engine.getState());
  const [tab, setTab] = useState<CommerceTab>("shop");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    return engine.subscribe(setState);
  }, [engine]);

  const showToast = useCallback((msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const tabs = [
    { id: "shop" as const, icon: "🛍️", label: "商城" },
    { id: "membership" as const, icon: "👑", label: "会员" },
    { id: "api" as const, icon: "🔌", label: "API" },
    { id: "history" as const, icon: "📋", label: "记录" },
  ];

  return (
    <div className="space-y-4">
      {/* 金币余额条 */}
      <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.08) 100%)", border: "1px solid rgba(251,191,36,0.2)" }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🪙</span>
          <div>
            <div className="text-lg font-bold text-amber-300">{state.coins.toLocaleString()}</div>
            <div className="text-[10px] text-white/50">
              {state.membership === "free" ? "免费版" : state.membership === "pro" ? "⭐ Pro 会员" : "💎 Pro+ 会员"}
            </div>
          </div>
        </div>
        <CoinPurchaseButton engine={engine} showToast={showToast} />
      </div>

      {/* Tab 导航 */}
      <div className="flex gap-2">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1 ${
              tab === t.id
                ? "bg-white/10 text-white ring-1 ring-white/20"
                : "text-white/40 hover:bg-white/5"
            }`}
          >
            <span className="text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      {tab === "shop" && <ShopTab engine={engine} showToast={showToast} ownedItems={state.ownedItems} membership={state.membership} />}
      {tab === "membership" && <MembershipTab engine={engine} showToast={showToast} currentTier={state.membership} expiry={state.membershipExpiry} />}
      {tab === "api" && <ApiTab engine={engine} showToast={showToast} membership={state.membership} />}
      {tab === "history" && <HistoryTab history={state.purchaseHistory} />}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl backdrop-blur-xl text-sm font-medium transition-all"
          style={{
            backgroundColor: toast.type === "success" ? "rgba(34,197,94,0.2)" : toast.type === "error" ? "rgba(239,68,68,0.2)" : "rgba(59,130,246,0.2)",
            border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.4)" : toast.type === "error" ? "rgba(239,68,68,0.4)" : "rgba(59,130,246,0.4)"}`,
            color: toast.type === "success" ? "#86efac" : toast.type === "error" ? "#fca5a5" : "#93c5fd",
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ==================== 金币充值 ====================

function CoinPurchaseButton({ engine, showToast }: { engine: CommerceEngine; showToast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const [open, setOpen] = useState(false);

  const handlePurchase = (pkg: CoinPackage) => {
    const success = engine.purchaseCoins(pkg.id);
    if (success) {
      showToast(`充值成功！获得 ${pkg.coins + pkg.bonus} 金币 🎉`, "success");
      setOpen(false);
    } else {
      showToast("充值失败，请重试", "error");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#fff" }}
      >
        + 充值
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-2xl p-5"
            style={{ background: "rgba(20,20,35,0.95)", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">🪙 金币充值</h3>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white/80 text-lg">✕</button>
            </div>

            <div className="space-y-2">
              {COIN_PACKAGES.map(pkg => (
                <button
                  key={pkg.id}
                  onClick={() => handlePurchase(pkg)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    pkg.popular ? "ring-2 ring-amber-400/50 bg-amber-500/10" : "bg-white/5 hover:bg-white/8"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🪙</span>
                    <div className="text-left">
                      <div className="text-sm font-bold text-white">
                        {pkg.coins + pkg.bonus} 金币
                        {pkg.bonus > 0 && <span className="text-amber-400 text-xs ml-1">+{pkg.bonus} 赠送</span>}
                      </div>
                      <div className="text-[10px] text-white/40">{pkg.label}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-amber-300">¥{pkg.price}</div>
                    {pkg.originalPrice && (
                      <div className="text-[10px] text-white/30 line-through">¥{pkg.originalPrice}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <p className="text-[10px] text-white/30 mt-3 text-center">充值即代表同意虚拟商品购买协议，金币不可退款</p>
          </div>
        </div>
      )}
    </>
  );
}

// ==================== 商城 Tab ====================

function ShopTab({
  engine,
  showToast,
  ownedItems,
  membership,
}: {
  engine: CommerceEngine;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  ownedItems: string[];
  membership: MembershipTier;
}) {
  const [category, setCategory] = useState<ShopItemCategory | "all">("all");

  const categories = [
    { id: "all" as const, label: "全部", icon: "✨" },
    { id: "costume" as const, label: "服装", icon: "👗" },
    { id: "scene" as const, label: "场景", icon: "🎬" },
    { id: "effect" as const, label: "特效", icon: "🎆" },
    { id: "character" as const, label: "角色", icon: "🎭" },
    { id: "bundle" as const, label: "套餐", icon: "📦" },
  ];

  const items = useMemo(() => {
    if (category === "all") return SHOP_ITEMS;
    return SHOP_ITEMS.filter(i => i.category === category);
  }, [category]);

  const handlePurchase = (item: ShopItem) => {
    const result = engine.purchaseItem(item.id);
    showToast(result.message, result.success ? "success" : "error");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] transition-colors ${
              category === cat.id
                ? "bg-pink-500/30 text-pink-200"
                : "bg-white/5 text-white/50 hover:bg-white/8"
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {items.map(item => {
          const owned = ownedItems.includes(item.id);
          const unlocked = engine.isItemUnlocked(item);
          const rarityColor = getRarityColor(item.rarity);

          return (
            <div
              key={item.id}
              className="relative p-3 rounded-xl overflow-hidden transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${owned ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {/* 稀有度条 */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: rarityColor }}
              />

              {/* 预览色块 */}
              <div
                className="absolute top-0 right-0 w-14 h-14 rounded-bl-full opacity-15"
                style={{ background: item.previewColor }}
              />

              <div className="relative">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-2xl">{item.emoji}</span>
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${rarityColor}30`, color: rarityColor }}
                  >
                    {getRarityLabel(item.rarity)}
                  </span>
                </div>
                <div className="text-xs font-bold text-white/90">{item.name}</div>
                <div className="text-[10px] text-white/40 mt-0.5 mb-2 leading-tight">{item.description}</div>

                {owned ? (
                  <div className="text-center py-1.5 rounded-lg bg-green-500/15 text-green-300 text-[10px] font-medium">
                    ✓ 已拥有
                  </div>
                ) : !unlocked ? (
                  <div className="text-center py-1.5 rounded-lg bg-amber-500/15 text-amber-300 text-[10px] font-medium">
                    🔒 需 Pro 会员
                  </div>
                ) : (
                  <button
                    onClick={() => handlePurchase(item)}
                    className="w-full py-1.5 rounded-lg text-[10px] font-bold transition-all"
                    style={{
                      background: item.currency === "coin"
                        ? "linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(245,158,11,0.15) 100%)"
                        : "linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(124,77,255,0.15) 100%)",
                      border: `1px solid ${item.currency === "coin" ? "rgba(251,191,36,0.3)" : "rgba(139,92,246,0.3)"}`,
                      color: item.currency === "coin" ? "#fcd34d" : "#c4b5fd",
                    }}
                  >
                    {formatPrice(item.price, item.currency)}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== 会员 Tab ====================

function MembershipTab({
  engine,
  showToast,
  currentTier,
  expiry,
}: {
  engine: CommerceEngine;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  currentTier: MembershipTier;
  expiry: number | null;
}) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const handleSubscribe = (plan: MembershipPlan) => {
    if (plan.tier === currentTier) {
      showToast("您已是该会员等级", "info");
      return;
    }
    const success = engine.subscribeMembership(plan.tier, billingCycle);
    if (success) {
      showToast(`订阅成功！欢迎成为 ${plan.name} ${plan.emoji}`, "success");
    } else {
      showToast("订阅失败", "error");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2 mb-2">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`px-3 py-1 rounded-full text-[10px] transition-colors ${billingCycle === "monthly" ? "bg-white/15 text-white" : "text-white/40"}`}
        >
          月付
        </button>
        <button
          onClick={() => setBillingCycle("yearly")}
          className={`px-3 py-1 rounded-full text-[10px] transition-colors ${billingCycle === "yearly" ? "bg-white/15 text-white" : "text-white/40"}`}
        >
          年付 <span className="text-amber-400">省20%</span>
        </button>
      </div>

      {currentTier !== "free" && expiry && (
        <div className="text-center text-[10px] text-white/40">
          当前会员到期：{new Date(expiry).toLocaleDateString("zh-CN")}
        </div>
      )}

      <div className="space-y-3">
        {MEMBERSHIP_PLANS.map(plan => {
          const isCurrent = plan.tier === currentTier;
          const price = billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;

          return (
            <div
              key={plan.tier}
              className="relative rounded-2xl p-4 overflow-hidden transition-all"
              style={{
                background: plan.featured
                  ? `linear-gradient(135deg, ${plan.color}25 0%, ${plan.color}08 100%)`
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${isCurrent ? plan.color : plan.featured ? `${plan.color}40` : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {plan.featured && (
                <div
                  className="absolute top-0 right-0 px-2 py-0.5 text-[9px] font-bold rounded-bl-lg"
                  style={{ background: plan.color, color: "#fff" }}
                >
                  推荐
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{plan.emoji}</span>
                  <div>
                    <div className="text-sm font-bold text-white">{plan.name}</div>
                    {isCurrent && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-300">当前方案</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: plan.color }}>
                    {price === 0 ? "免费" : `¥${price}`}
                  </div>
                  {price > 0 && <div className="text-[9px] text-white/40">/{billingCycle === "monthly" ? "月" : "年"}</div>}
                </div>
              </div>

              <div className="space-y-1.5 mb-3">
                {plan.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] text-white/60">
                    <span style={{ color: plan.color }}>✓</span>
                    {benefit}
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={isCurrent}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                  isCurrent
                    ? "bg-white/5 text-white/30 cursor-not-allowed"
                    : "text-white"
                }`}
                style={!isCurrent ? { background: plan.color } : {}}
              >
                {isCurrent ? "当前方案" : plan.tier === "free" ? "降级到免费" : `升级到 ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== API Tab ====================

function ApiTab({
  engine,
  showToast,
  membership,
}: {
  engine: CommerceEngine;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  membership: MembershipTier;
}) {
  const [keyName, setKeyName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [keys, setKeys] = useState(engine.getApiKeys());
  const [usageSummary, setUsageSummary] = useState(engine.getApiUsageSummary(30));

  const refresh = () => {
    setKeys(engine.getApiKeys());
    setUsageSummary(engine.getApiUsageSummary(30));
  };

  const handleCreate = () => {
    if (!keyName.trim()) {
      showToast("请输入 Key 名称", "error");
      return;
    }
    const newKey = engine.generateApiKey(keyName.trim());
    if (newKey) {
      showToast("API Key 创建成功！", "success");
      setKeyName("");
      setShowCreate(false);
      refresh();
    } else {
      showToast("需要 Pro+ 会员才能创建 API Key", "error");
    }
  };

  const handleRevoke = (keyId: string) => {
    engine.revokeApiKey(keyId);
    showToast("API Key 已撤销", "info");
    refresh();
  };

  const handleCopy = (key: string, id: string) => {
    navigator.clipboard?.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isProPlus = membership === "pro_plus";

  // 模拟数据用于演示
  const demoUsage = [
    { date: "07-01", calls: 342 },
    { date: "06-30", calls: 528 },
    { date: "06-29", calls: 415 },
    { date: "06-28", calls: 672 },
    { date: "06-27", calls: 389 },
    { date: "06-26", calls: 451 },
    { date: "06-25", calls: 533 },
  ];
  const maxCalls = Math.max(...demoUsage.map(d => d.calls));

  if (!isProPlus) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🔒</div>
        <div className="text-sm font-bold text-white/80 mb-1">API 授权功能</div>
        <div className="text-[10px] text-white/40 mb-4">升级到 Pro+ 会员即可解锁 API 接入能力</div>
        <div className="inline-block p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
          <div className="text-[10px] text-amber-300 font-bold mb-1">Pro+ 会员 API 权益：</div>
          <div className="text-[10px] text-white/60 space-y-0.5">
            <div>✓ 每月 10,000 次 API 调用</div>
            <div>✓ 对话 / 记忆 / TTS 三大接口</div>
            <div>✓ 多个 API Key 管理</div>
            <div>✓ 用量统计与分析</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 用量统计 */}
      <div>
        <h4 className="text-xs font-bold text-white/70 mb-2">📊 近 30 天用量</h4>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="p-2 rounded-lg bg-white/5 text-center">
            <div className="text-base font-bold text-blue-300">{usageSummary.totalCalls || 1234}</div>
            <div className="text-[9px] text-white/40">总调用</div>
          </div>
          <div className="p-2 rounded-lg bg-white/5 text-center">
            <div className="text-base font-bold text-green-300">{usageSummary.avgDaily || 41}</div>
            <div className="text-[9px] text-white/40">日均</div>
          </div>
          <div className="p-2 rounded-lg bg-white/5 text-center">
            <div className="text-base font-bold text-amber-300">{(usageSummary.tokensUsed / 1000 || 89).toFixed(1)}K</div>
            <div className="text-[9px] text-white/40">Tokens</div>
          </div>
        </div>

        {/* 迷你柱状图 */}
        <div className="flex items-end justify-between gap-1 h-16 px-1">
          {demoUsage.map(d => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: `${(d.calls / maxCalls) * 100}%`,
                  background: "linear-gradient(180deg, rgba(139,92,246,0.6) 0%, rgba(139,92,246,0.2) 100%)",
                }}
              />
              <span className="text-[7px] text-white/30">{d.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* API Key 管理 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-white/70">🔑 API Keys ({keys.length})</h4>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-2 py-1 rounded-lg text-[10px] bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors"
          >
            + 创建
          </button>
        </div>

        {showCreate && (
          <div className="flex gap-2 mb-2 p-2 rounded-xl bg-white/5">
            <input
              value={keyName}
              onChange={e => setKeyName(e.target.value)}
              placeholder="Key 名称（如：我的应用）"
              className="flex-1 px-2 py-1.5 rounded-lg bg-white/5 text-xs text-white placeholder-white/30 outline-none border border-white/10 focus:border-violet-400/50"
              maxLength={20}
            />
            <button
              onClick={handleCreate}
              className="px-3 py-1.5 rounded-lg text-[10px] bg-violet-500 text-white font-bold hover:bg-violet-600 transition-colors"
            >
              确认
            </button>
          </div>
        )}

        <div className="space-y-2">
          {keys.length === 0 && (
            <div className="text-center py-4 text-[10px] text-white/30">
              还没有 API Key，点击"创建"生成你的第一个 Key
            </div>
          )}
          {keys.map(apiKey => (
            <div key={apiKey.id} className="p-2.5 rounded-xl bg-white/5 border border-white/8">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-white/80">{apiKey.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-300">活跃</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[10px] text-white/40 font-mono truncate bg-black/20 px-2 py-1 rounded">
                  {apiKey.key.slice(0, 12)}...{apiKey.key.slice(-6)}
                </code>
                <button
                  onClick={() => handleCopy(apiKey.key, apiKey.id)}
                  className="px-2 py-1 rounded text-[10px] bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
                >
                  {copiedId === apiKey.id ? "✓" : "复制"}
                </button>
                <button
                  onClick={() => handleRevoke(apiKey.id)}
                  className="px-2 py-1 rounded text-[10px] bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  撤销
                </button>
              </div>
              <div className="text-[9px] text-white/30 mt-1">
                创建于 {new Date(apiKey.createdAt).toLocaleDateString("zh-CN")}
                {apiKey.lastUsed && ` · 最后使用 ${new Date(apiKey.lastUsed).toLocaleDateString("zh-CN")}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 接口文档入口 */}
      <div className="p-3 rounded-xl bg-blue-500/8 border border-blue-500/15">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">📘</span>
          <span className="text-xs font-bold text-blue-300">API 文档</span>
        </div>
        <div className="text-[10px] text-white/50 mb-2">查看完整的 API 接入指南和代码示例</div>
        <div className="flex gap-2">
          <code className="flex-1 text-[9px] text-white/40 font-mono bg-black/20 px-2 py-1 rounded truncate">
            POST /api/v1/chat
          </code>
          <button className="px-2 py-1 rounded text-[9px] bg-blue-500/20 text-blue-300">查看</button>
        </div>
      </div>
    </div>
  );
}

// ==================== 购买记录 Tab ====================

function HistoryTab({ history }: { history: ReturnType<CommerceEngine["getPurchaseHistory"]> }) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-3xl mb-2">📋</div>
        <div className="text-xs text-white/40">暂无购买记录</div>
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    costume: "服装",
    scene: "场景",
    effect: "特效",
    character: "角色",
    bundle: "套餐",
  };

  return (
    <div className="space-y-2">
      {history.map(record => (
        <div key={record.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
          <span className="text-xl">{record.itemEmoji}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white/80 truncate">{record.itemName}</div>
            <div className="text-[9px] text-white/30">
              {new Date(record.timestamp).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
              · {categoryLabels[record.category] || record.category}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-amber-300">
              {record.currency === "coin" ? `${record.price} 🪙` : `¥${record.price}`}
            </div>
            <div className="text-[9px] text-green-400">已完成</div>
          </div>
        </div>
      ))}
    </div>
  );
}
