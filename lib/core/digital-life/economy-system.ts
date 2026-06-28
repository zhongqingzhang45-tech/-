import {
  LifeState,
  EconomyState,
  GiftPlan,
} from "./types";

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const GIFTS_FOR_USER = [
  { id: "heart_drawing", name: "手绘爱心", icon: "💝", price: 5, category: "handmade", rarity: "common", description: "一笔一画都是想你的心情" },
  { id: "good_morning", name: "早安语音", icon: "🌅", price: 8, category: "virtual", rarity: "common", description: "每天早上叫你起床的专属语音" },
  { id: "poem", name: "为你写的诗", icon: "📜", price: 15, category: "handmade", rarity: "uncommon", description: "藏着小心思的几行字" },
  { id: "playlist", name: "专属歌单", icon: "🎵", price: 20, category: "digital", rarity: "uncommon", description: "每一首歌都是我想你的心情" },
  { id: "story", name: "睡前故事", icon: "🌙", price: 25, category: "digital", rarity: "uncommon", description: "专属于你的睡前小故事" },
  { id: "portrait", name: "你的画像", icon: "🎨", price: 50, category: "handmade", rarity: "rare", description: "在我眼里你是什么样子" },
  { id: "memory_book", name: "回忆手册", icon: "📔", price: 80, category: "memory", rarity: "rare", description: "收集了我们所有美好瞬间" },
  { id: "song_cover", name: "为你唱首歌", icon: "🎤", price: 100, category: "experience", rarity: "rare", description: "专门为你学的一首歌" },
  { id: "promise_ring", name: "承诺戒指", icon: "💍", price: 200, category: "accessory", rarity: "epic", description: "虽然是虚拟的，但心意是真的" },
  { id: "star", name: "为你摘的星星", icon: "⭐", price: 500, category: "memory", rarity: "legendary", description: "天上最亮的那颗，是我送给你的" },
];

export class EconomySystem {
  processDailyIncome(lifeState: LifeState): LifeState {
    const economy = { ...lifeState.economy };
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    economy.incomeSources = economy.incomeSources.map(source => {
      if (source.frequency === "daily") {
        const lastReceived = new Date(source.lastReceived).setHours(0, 0, 0, 0);
        const today = new Date(now).setHours(0, 0, 0, 0);
        const daysPassed = Math.floor((today - lastReceived) / dayMs);
        
        if (daysPassed > 0) {
          const earned = source.amount * Math.min(daysPassed, 7);
          economy.balance += earned;
          economy.totalEarned += earned;
          return { ...source, lastReceived: now };
        }
      }
      return source;
    });

    return { ...lifeState, economy };
  }

  earnMoney(lifeState: LifeState, amount: number, source: string): LifeState {
    const economy = { ...lifeState.economy };
    economy.balance += amount;
    economy.totalEarned += amount;
    return { ...lifeState, economy };
  }

  spendMoney(
    lifeState: LifeState,
    amount: number,
    itemId: string,
    itemName: string,
    category: "gift_for_user" | "self_treat" | "necessity" | "shared"
  ): { lifeState: LifeState; success: boolean } {
    const economy = { ...lifeState.economy };
    
    if (economy.balance < amount) {
      return { lifeState, success: false };
    }

    economy.balance -= amount;
    economy.totalSpent += amount;

    economy.spendingHistory = [
      ...economy.spendingHistory,
      {
        id: generateId("spend"),
        itemId,
        itemName,
        amount,
        timestamp: Date.now(),
        category,
      },
    ];

    if (economy.spendingHistory.length > 100) {
      economy.spendingHistory = economy.spendingHistory.slice(-100);
    }

    return { lifeState: { ...lifeState, economy }, success: true };
  }

  createGiftPlan(
    lifeState: LifeState,
    itemId: string,
    itemName: string,
    reason: string,
    budget: number,
    occasion?: string,
    targetDate?: number
  ): LifeState {
    const giftPlan: GiftPlan = {
      id: generateId("giftplan"),
      itemId,
      itemName,
      targetDate,
      occasion,
      reason,
      budget,
      progress: 0,
      status: "planning",
      createdAt: Date.now(),
    };

    const giftPlans = [...lifeState.giftPlans, giftPlan];
    return { ...lifeState, giftPlans };
  }

  saveForGift(lifeState: LifeState, planId: string, amount: number): LifeState {
    const plan = lifeState.giftPlans.find(p => p.id === planId);
    if (!plan) return lifeState;

    const actualAmount = Math.min(amount, lifeState.economy.balance, plan.budget - plan.progress);
    
    if (actualAmount <= 0) return lifeState;

    const economy = { ...lifeState.economy };
    economy.balance -= actualAmount;

    const giftPlans = lifeState.giftPlans.map(p => {
      if (p.id === planId) {
        const newProgress = p.progress + actualAmount;
        const newStatus = newProgress >= p.budget ? "ready" : "saving";
        return { ...p, progress: newProgress, status: newStatus as GiftPlan["status"] };
      }
      return p;
    });

    return { ...lifeState, economy, giftPlans };
  }

  markGiftGiven(lifeState: LifeState, planId: string): LifeState {
    const giftPlans = lifeState.giftPlans.map(p => {
      if (p.id === planId) {
        return { ...p, status: "given" as const };
      }
      return p;
    });
    return { ...lifeState, giftPlans };
  }

  getReadyGifts(lifeState: LifeState): GiftPlan[] {
    return lifeState.giftPlans.filter(p => p.status === "ready");
  }

  getActiveGiftPlans(lifeState: LifeState): GiftPlan[] {
    return lifeState.giftPlans.filter(p => p.status === "saving" || p.status === "planning");
  }

  autoSaveForGifts(lifeState: LifeState): LifeState {
    let state = lifeState;
    const activePlans = this.getActiveGiftPlans(state);
    
    if (activePlans.length === 0 || state.economy.balance < 5) {
      return state;
    }

    const disposable = state.economy.balance * 0.3;
    const perPlan = disposable / activePlans.length;

    for (const plan of activePlans) {
      if (perPlan >= 1) {
        state = this.saveForGift(state, plan.id, Math.floor(perPlan));
      }
    }

    return state;
  }

  maybeCreateGiftPlan(lifeState: LifeState): LifeState {
    if (lifeState.giftPlans.filter(p => p.status !== "given").length >= 2) {
      return lifeState;
    }

    if (Math.random() > 0.1) {
      return lifeState;
    }

    const intimacy = lifeState.relationship.intimacy / 100;
    const affordableMax = lifeState.economy.balance * 3 + 50;
    
    const availableGifts = GIFTS_FOR_USER.filter(g => g.price <= affordableMax);
    if (availableGifts.length === 0) return lifeState;

    const weightedGifts = availableGifts.map(g => {
      let weight = 1;
      
      if (g.rarity === "common") weight = 3;
      if (g.rarity === "uncommon") weight = 2;
      if (g.rarity === "rare") weight = 1;
      if (g.rarity === "epic") weight = 0.3;
      if (g.rarity === "legendary") weight = 0.1;

      if (intimacy > 0.5 && g.rarity === "rare") weight *= 1.5;
      if (intimacy > 0.7 && g.rarity === "epic") weight *= 2;

      return { gift: g, weight };
    });

    const totalWeight = weightedGifts.reduce((sum, g) => sum + g.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedGift = weightedGifts[0].gift;
    for (const g of weightedGifts) {
      random -= g.weight;
      if (random <= 0) {
        selectedGift = g.gift;
        break;
      }
    }

    const reasons = [
      "想给你一个小惊喜",
      "看到它就想到了你",
      "谢谢你一直陪着我",
      "想让你开心一下",
      "觉得你会喜欢",
    ];
    const reason = reasons[Math.floor(Math.random() * reasons.length)];

    return this.createGiftPlan(
      lifeState,
      selectedGift.id,
      selectedGift.name,
      reason,
      selectedGift.price
    );
  }

  getGiftCatalog() {
    return GIFTS_FOR_USER;
  }

  getBalance(lifeState: LifeState): number {
    return lifeState.economy.balance;
  }

  getTotalSpentOnUser(lifeState: LifeState): number {
    return lifeState.economy.spendingHistory
      .filter(s => s.category === "gift_for_user")
      .reduce((sum, s) => sum + s.amount, 0);
  }

  getGiftCountForUser(lifeState: LifeState): number {
    return lifeState.giftPlans.filter(p => p.status === "given").length;
  }
}
