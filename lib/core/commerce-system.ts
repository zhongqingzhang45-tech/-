// ==================== 类型定义 ====================

export type MembershipTier = "free" | "pro" | "pro_plus";
export type ShopItemCategory = "costume" | "scene" | "effect" | "character" | "bundle";
export type ShopItemRarity = "common" | "rare" | "epic" | "legendary";
export type PurchaseStatus = "completed" | "pending" | "failed" | "refunded";

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: ShopItemCategory;
  rarity: ShopItemRarity;
  price: number;
  currency: "coin" | "cash";
  isPremium: boolean;
  previewColor: string;
  accentColor: string;
  tags: string[];
}

export interface MembershipPlan {
  tier: MembershipTier;
  name: string;
  emoji: string;
  priceMonthly: number;
  priceYearly: number;
  color: string;
  benefits: string[];
  limits: {
    dailyChats: number;
    memoryCapacity: string;
    customModels: number;
    apiCalls: number;
    exclusiveScenes: number;
    exclusiveCostumes: number;
  };
  featured?: boolean;
}

export interface PurchaseRecord {
  id: string;
  itemId: string;
  itemName: string;
  itemEmoji: string;
  price: number;
  currency: "coin" | "cash";
  status: PurchaseStatus;
  timestamp: number;
  category: ShopItemCategory;
}

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  createdAt: number;
  lastUsed: number | null;
  status: "active" | "revoked";
  tier: MembershipTier;
}

export interface ApiUsage {
  date: string;
  totalCalls: number;
  chatCalls: number;
  memoryCalls: number;
  ttsCalls: number;
  tokensUsed: number;
}

export interface CommerceState {
  coins: number;
  membership: MembershipTier;
  membershipExpiry: number | null;
  ownedItems: string[];
  purchaseHistory: PurchaseRecord[];
  apiKeys: ApiKey[];
  apiUsage: ApiUsage[];
  totalSpent: number;
}

// ==================== 商城商品配置 ====================

export const SHOP_ITEMS: ShopItem[] = [
  // 服装类
  { id: "costume_kimono", name: "和服", emoji: "🌸", description: "传统和风装扮，樱花季限定", category: "costume", rarity: "epic", price: 280, currency: "coin", isPremium: true, previewColor: "#fce4ec", accentColor: "#e91e63", tags: ["特殊", "和风"] },
  { id: "costume_maid", name: "女仆装", emoji: "🧹", description: "可爱女仆风，服务至上", category: "costume", rarity: "epic", price: 320, currency: "coin", isPremium: true, previewColor: "#ffffff", accentColor: "#000000", tags: ["特殊", "可爱"] },
  { id: "costume_swimwear", name: "泳装", emoji: "👙", description: "夏日海滩限定", category: "costume", rarity: "rare", price: 240, currency: "coin", isPremium: true, previewColor: "#4fc3f7", accentColor: "#ff4081", tags: ["季节限定"] },
  { id: "costume_christmas", name: "圣诞装", emoji: "🎄", description: "节日限定装扮", category: "costume", rarity: "rare", price: 200, currency: "coin", isPremium: true, previewColor: "#d32f2f", accentColor: "#ffffff", tags: ["节日", "限定"] },
  { id: "costume_knight", name: "骑士装", emoji: "⚔️", description: "英姿飒爽的战斗装扮", category: "costume", rarity: "legendary", price: 500, currency: "coin", isPremium: true, previewColor: "#37474f", accentColor: "#ffd700", tags: ["特殊", "传说"] },
  { id: "costume_dress", name: "晚礼服", emoji: "💃", description: "优雅晚宴装扮", category: "costume", rarity: "rare", price: 180, currency: "coin", isPremium: false, previewColor: "#1a237e", accentColor: "#c62828", tags: ["正式"] },

  // 场景类
  { id: "scene_sakura", name: "樱花场景", emoji: "🌸", description: "樱花纷飞的浪漫场景", category: "scene", rarity: "epic", price: 260, currency: "coin", isPremium: true, previewColor: "#f8bbd0", accentColor: "#e91e63", tags: ["浪漫", "限定"] },
  { id: "scene_starry", name: "星空场景", emoji: "🌌", description: "繁星点点的夜空", category: "scene", rarity: "rare", price: 200, currency: "coin", isPremium: true, previewColor: "#0d1b2a", accentColor: "#4fc3f7", tags: ["夜景"] },
  { id: "scene_rooftop", name: "城市天台", emoji: "🌃", description: "霓虹闪烁的城市夜景", category: "scene", rarity: "rare", price: 180, currency: "coin", isPremium: true, previewColor: "#1a1a2e", accentColor: "#ff4081", tags: ["夜景", "都市"] },
  { id: "scene_beach", name: "海边沙滩", emoji: "🏖️", description: "夕阳无限的海滩", category: "scene", rarity: "common", price: 120, currency: "coin", isPremium: false, previewColor: "#ffd89b", accentColor: "#ff9a8b", tags: ["自然"] },

  // 特效类
  { id: "effect_hearts", name: "爱心特效", emoji: "💖", description: "对话时飘洒爱心粒子", category: "effect", rarity: "rare", price: 150, currency: "coin", isPremium: false, previewColor: "#ff6b9d", accentColor: "#ff4d8d", tags: ["氛围", "恋爱"] },
  { id: "effect_petals", name: "花瓣特效", emoji: "🌺", description: "樱花花瓣随风飘落", category: "effect", rarity: "rare", price: 150, currency: "coin", isPremium: false, previewColor: "#ffb7c5", accentColor: "#ff9ec0", tags: ["氛围"] },
  { id: "effect_fireflies", name: "萤火虫特效", emoji: "✨", description: "夜晚萤火虫环绕飞舞", category: "effect", rarity: "epic", price: 220, currency: "coin", isPremium: true, previewColor: "#fff59d", accentColor: "#fdd835", tags: ["氛围", "夜晚"] },
  { id: "effect_snow", name: "雪花特效", emoji: "❄️", description: "冬日浪漫雪花纷飞", category: "effect", rarity: "common", price: 100, currency: "coin", isPremium: false, previewColor: "#ffffff", accentColor: "#e0f7fa", tags: ["季节"] },

  // 角色类
  { id: "char_haru", name: "小春(Pro)", emoji: "🌸", description: "解锁小春角色模型", category: "character", rarity: "epic", price: 0, currency: "cash", isPremium: true, previewColor: "#fce4ec", accentColor: "#e91e63", tags: ["角色"] },
  { id: "char_azurlane", name: "碧蓝航线系列", emoji: "⚓", description: "解锁15个碧蓝航线角色", category: "character", rarity: "legendary", price: 0, currency: "cash", isPremium: true, previewColor: "#1a237e", accentColor: "#ffd700", tags: ["角色", "传说"] },

  // 套餐
  { id: "bundle_romantic", name: "浪漫套餐", emoji: "💝", description: "樱花场景 + 爱心特效 + 和服", category: "bundle", rarity: "legendary", price: 580, currency: "coin", isPremium: true, previewColor: "#ff6b9d", accentColor: "#ff4d8d", tags: ["套餐", "超值"] },
  { id: "bundle_night", name: "夜景套餐", emoji: "🌙", description: "星空场景 + 萤火虫特效 + 晚礼服", category: "bundle", rarity: "epic", price: 480, currency: "coin", isPremium: true, previewColor: "#1a237e", accentColor: "#7c4dff", tags: ["套餐"] },
];

// ==================== 会员方案 ====================

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    tier: "free",
    name: "免费版",
    emoji: "🆓",
    priceMonthly: 0,
    priceYearly: 0,
    color: "#64748b",
    benefits: [
      "每日 50 条对话",
      "基础记忆系统（7天）",
      "1 个默认角色",
      "基础表情和动作",
      "标准回复速度",
    ],
    limits: {
      dailyChats: 50,
      memoryCapacity: "7天",
      customModels: 1,
      apiCalls: 0,
      exclusiveScenes: 0,
      exclusiveCostumes: 0,
    },
  },
  {
    tier: "pro",
    name: "Pro 会员",
    emoji: "⭐",
    priceMonthly: 29,
    priceYearly: 288,
    color: "#8b5cf6",
    featured: true,
    benefits: [
      "无限对话",
      "永久记忆系统",
      "全部基础角色解锁",
      "高级表情和动作",
      "优先回复速度",
      "口型同步 + 视线追踪",
      "5 个专属场景",
      "8 套专属服装",
      "每月 500 金币",
    ],
    limits: {
      dailyChats: -1,
      memoryCapacity: "永久",
      customModels: 16,
      apiCalls: 1000,
      exclusiveScenes: 5,
      exclusiveCostumes: 8,
    },
  },
  {
    tier: "pro_plus",
    name: "Pro+ 会员",
    emoji: "💎",
    priceMonthly: 59,
    priceYearly: 588,
    color: "#f59e0b",
    benefits: [
      "Pro 全部权益",
      "API 授权接入",
      "自定义 Live2D 模型上传",
      "全部场景和特效解锁",
      "全部服装解锁",
      "独家语音包",
      "专属客服支持",
      "每月 1500 金币",
      "优先体验新功能",
    ],
    limits: {
      dailyChats: -1,
      memoryCapacity: "永久",
      customModels: -1,
      apiCalls: 10000,
      exclusiveScenes: -1,
      exclusiveCostumes: -1,
    },
  },
];

// ==================== 金币充值包 ====================

export interface CoinPackage {
  id: string;
  coins: number;
  bonus: number;
  price: number;
  originalPrice?: number;
  label?: string;
  popular?: boolean;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { id: "coin_100", coins: 100, bonus: 0, price: 6, label: "入门" },
  { id: "coin_500", coins: 500, bonus: 50, price: 28, originalPrice: 30, label: "常用" },
  { id: "coin_1200", coins: 1200, bonus: 200, price: 60, originalPrice: 72, label: "超值", popular: true },
  { id: "coin_3000", coins: 3000, bonus: 600, price: 148, originalPrice: 180, label: "豪华" },
  { id: "coin_6800", coins: 6800, bonus: 1800, price: 328, originalPrice: 408, label: "至尊" },
];

// ==================== 商业化引擎 ====================

const STORAGE_KEY = "commerce_state_v1";

export class CommerceEngine {
  private state: CommerceState;
  private listeners: Set<(state: CommerceState) => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): CommerceState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...this.getDefaultState(), ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn("Failed to load commerce state:", e);
    }
    return this.getDefaultState();
  }

  private getDefaultState(): CommerceState {
    return {
      coins: 100,
      membership: "free",
      membershipExpiry: null,
      ownedItems: [],
      purchaseHistory: [],
      apiKeys: [],
      apiUsage: [],
      totalSpent: 0,
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.listeners.forEach(fn => fn(this.state));
    } catch (e) {
      console.warn("Failed to save commerce state:", e);
    }
  }

  subscribe(fn: (state: CommerceState) => void): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  getState(): CommerceState {
    return { ...this.state };
  }

  // ==================== 金币系统 ====================

  getCoins(): number {
    return this.state.coins;
  }

  addCoins(amount: number, reason: string): void {
    this.state.coins += amount;
    this.saveState();
  }

  spendCoins(amount: number): boolean {
    if (this.state.coins < amount) return false;
    this.state.coins -= amount;
    this.saveState();
    return true;
  }

  purchaseCoins(packageId: string): boolean {
    const pkg = COIN_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return false;

    this.state.coins += pkg.coins + pkg.bonus;
    this.state.totalSpent += pkg.price;

    this.state.purchaseHistory.unshift({
      id: `purchase_${Date.now()}`,
      itemId: packageId,
      itemName: `${pkg.coins + pkg.bonus} 金币`,
      itemEmoji: "🪙",
      price: pkg.price,
      currency: "cash",
      status: "completed",
      timestamp: Date.now(),
      category: "bundle",
    });

    this.saveState();
    return true;
  }

  // ==================== 商品购买 ====================

  purchaseItem(itemId: string): { success: boolean; message: string } {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return { success: false, message: "商品不存在" };

    if (this.state.ownedItems.includes(itemId)) {
      return { success: false, message: "已拥有该物品" };
    }

    if (item.currency === "coin") {
      if (!this.isItemUnlocked(item)) {
        return { success: false, message: "会员等级不足" };
      }
      if (!this.spendCoins(item.price)) {
        return { success: false, message: "金币不足" };
      }
    } else {
      this.state.totalSpent += item.price;
    }

    this.state.ownedItems.push(itemId);

    this.state.purchaseHistory.unshift({
      id: `purchase_${Date.now()}`,
      itemId,
      itemName: item.name,
      itemEmoji: item.emoji,
      price: item.price,
      currency: item.currency,
      status: "completed",
      timestamp: Date.now(),
      category: item.category,
    });

    this.saveState();
    return { success: true, message: `购买成功！获得 ${item.emoji} ${item.name}` };
  }

  isItemUnlocked(item: ShopItem): boolean {
    if (!item.isPremium) return true;
    return this.state.membership === "pro" || this.state.membership === "pro_plus";
  }

  ownsItem(itemId: string): boolean {
    return this.state.ownedItems.includes(itemId);
  }

  // ==================== 会员系统 ====================

  getMembership(): MembershipTier {
    return this.state.membership;
  }

  isPro(): boolean {
    return this.state.membership !== "free";
  }

  isProPlus(): boolean {
    return this.state.membership === "pro_plus";
  }

  subscribeMembership(tier: MembershipTier, duration: "monthly" | "yearly"): boolean {
    const plan = MEMBERSHIP_PLANS.find(p => p.tier === tier);
    if (!plan) return false;

    const price = duration === "monthly" ? plan.priceMonthly : plan.priceYearly;
    this.state.totalSpent += price;
    this.state.membership = tier;

    const now = Date.now();
    const durationMs = duration === "monthly" ? 30 * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000;
    this.state.membershipExpiry = now + durationMs;

    if (tier === "pro") this.state.coins += 500;
    if (tier === "pro_plus") this.state.coins += 1500;

    this.state.purchaseHistory.unshift({
      id: `purchase_${Date.now()}`,
      itemId: `membership_${tier}_${duration}`,
      itemName: `${plan.name} - ${duration === "monthly" ? "月度" : "年度"}`,
      itemEmoji: plan.emoji,
      price,
      currency: "cash",
      status: "completed",
      timestamp: now,
      category: "bundle",
    });

    this.saveState();
    return true;
  }

  getMembershipExpiry(): number | null {
    return this.state.membershipExpiry;
  }

  // ==================== API Key 系统 ====================

  generateApiKey(name: string): ApiKey | null {
    if (!this.isProPlus()) return null;

    const key = `sk-vcp-${this.generateRandomString(32)}`;
    const apiKey: ApiKey = {
      id: `key_${Date.now()}`,
      key,
      name,
      createdAt: Date.now(),
      lastUsed: null,
      status: "active",
      tier: this.state.membership,
    };

    this.state.apiKeys.push(apiKey);
    this.saveState();
    return apiKey;
  }

  revokeApiKey(keyId: string): boolean {
    const key = this.state.apiKeys.find(k => k.id === keyId);
    if (!key) return false;
    key.status = "revoked";
    this.saveState();
    return true;
  }

  getApiKeys(): ApiKey[] {
    return this.state.apiKeys.filter(k => k.status === "active");
  }

  recordApiUsage(callType: "chat" | "memory" | "tts", tokens: number = 0): void {
    const today = new Date().toISOString().split("T")[0];
    let usage = this.state.apiUsage.find(u => u.date === today);

    if (!usage) {
      usage = {
        date: today,
        totalCalls: 0,
        chatCalls: 0,
        memoryCalls: 0,
        ttsCalls: 0,
        tokensUsed: 0,
      };
      this.state.apiUsage.push(usage);
    }

    usage.totalCalls++;
    usage.tokensUsed += tokens;
    if (callType === "chat") usage.chatCalls++;
    if (callType === "memory") usage.memoryCalls++;
    if (callType === "tts") usage.ttsCalls++;

    if (this.state.apiUsage.length > 30) {
      this.state.apiUsage = this.state.apiUsage.slice(-30);
    }

    this.saveState();
  }

  getApiUsage(days: number = 7): ApiUsage[] {
    return this.state.apiUsage.slice(-days);
  }

  getApiUsageSummary(days: number = 30): {
    totalCalls: number;
    avgDaily: number;
    peakDay: string;
    tokensUsed: number;
  } {
    const usage = this.getApiUsage(days);
    if (usage.length === 0) {
      return { totalCalls: 0, avgDaily: 0, peakDay: "N/A", tokensUsed: 0 };
    }

    const totalCalls = usage.reduce((sum, u) => sum + u.totalCalls, 0);
    const tokensUsed = usage.reduce((sum, u) => sum + u.tokensUsed, 0);
    const peak = usage.reduce((max, u) => (u.totalCalls > max.totalCalls ? u : max), usage[0]);

    return {
      totalCalls,
      avgDaily: Math.round(totalCalls / usage.length),
      peakDay: peak.date,
      tokensUsed,
    };
  }

  // ==================== 统计 ====================

  getPurchaseHistory(): PurchaseRecord[] {
    return [...this.state.purchaseHistory];
  }

  getTotalSpent(): number {
    return this.state.totalSpent;
  }

  getOwnedItemsByCategory(category: ShopItemCategory): string[] {
    return this.state.ownedItems.filter(id => {
      const item = SHOP_ITEMS.find(i => i.id === id);
      return item?.category === category;
    });
  }

  // ==================== 工具 ====================

  private generateRandomString(length: number): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  reset(): void {
    this.state = this.getDefaultState();
    this.saveState();
  }
}

// ==================== 单例 ====================

let commerceEngine: CommerceEngine | null = null;

export function getCommerceEngine(): CommerceEngine {
  if (!commerceEngine) {
    commerceEngine = new CommerceEngine();
  }
  return commerceEngine;
}

// ==================== 工具函数 ====================

export function formatPrice(price: number, currency: "coin" | "cash"): string {
  if (currency === "coin") return `${price} 🪙`;
  return `¥${price.toFixed(2)}`;
}

export function getRarityColor(rarity: ShopItemRarity): string {
  switch (rarity) {
    case "common": return "#9ca3af";
    case "rare": return "#3b82f6";
    case "epic": return "#8b5cf6";
    case "legendary": return "#f59e0b";
  }
}

export function getRarityLabel(rarity: ShopItemRarity): string {
  switch (rarity) {
    case "common": return "普通";
    case "rare": return "稀有";
    case "epic": return "史诗";
    case "legendary": return "传说";
  }
}
