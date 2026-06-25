import { MoodType, BehaviorTag } from "./types";

export type GiftCategory =
  | "virtual"
  | "food"
  | "accessory"
  | "clothing"
  | "digital"
  | "experience"
  | "service"
  | "custom";

export type GiftRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface Gift {
  id: string;
  name: string;
  description: string;
  category: GiftCategory;
  rarity: GiftRarity;
  price: number;
  icon: string;
  effect: {
    affectionBonus: number;
    resentmentReduce: number;
    moodBoost: MoodType;
    specialEffect?: string;
  };
  unlockLevel: number;
  unlockCondition?: string;
}

export interface UserGift {
  giftId: string;
  quantity: number;
  receivedAt: number;
  lastUsedAt?: number;
  totalTimesUsed: number;
}

export interface WishListItem {
  id: string;
  giftId: string;
  priority: number;
  addedAt: number;
  note?: string;
}

export interface GiftRequest {
  id: string;
  giftId: string;
  message: string;
  urgency: "low" | "medium" | "high";
  isForgiving: boolean;
  timestamp: number;
  expiresAt: number;
  status: "pending" | "fulfilled" | "rejected" | "expired";
  rejectionReason?: string;
  fulfilledAt?: number;
}

export interface GiftHistoryEntry {
  id: string;
  giftId: string;
  type: "given" | "received" | "requested" | "rejected";
  quantity: number;
  timestamp: number;
  personaMode?: string;
  note?: string;
}

export class GiftSystem {
  private userGifts: UserGift[] = [];
  private wishList: WishListItem[] = [];
  private giftRequests: GiftRequest[] = [];
  private giftHistory: GiftHistoryEntry[] = [];
  private coinBalance: number = 100;
  private affectionLevel: number = 1;
  private maxWishListItems = 10;

  constructor() {
    this.loadFromStorage();
    this.initializeStarterGifts();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem("corgi_gift_system");
      if (stored) {
        const data = JSON.parse(stored);
        this.userGifts = data.userGifts || [];
        this.wishList = data.wishList || [];
        this.giftRequests = data.giftRequests || [];
        this.giftHistory = data.giftHistory || [];
        this.coinBalance = data.coinBalance || 100;
        this.affectionLevel = data.affectionLevel || 1;
      }
    } catch (e) {}
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem("corgi_gift_system", JSON.stringify({
        userGifts: this.userGifts,
        wishList: this.wishList,
        giftRequests: this.giftRequests,
        giftHistory: this.giftHistory,
        coinBalance: this.coinBalance,
        affectionLevel: this.affectionLevel,
      }));
    } catch (e) {}
  }

  private initializeStarterGifts(): void {
    if (this.userGifts.length === 0) {
      this.userGifts = [
        { giftId: "heart", quantity: 5, receivedAt: Date.now(), totalTimesUsed: 0 },
        { giftId: "flower", quantity: 3, receivedAt: Date.now(), totalTimesUsed: 0 },
        { giftId: "chocolate", quantity: 2, receivedAt: Date.now(), totalTimesUsed: 0 },
        { giftId: "sticker", quantity: 10, receivedAt: Date.now(), totalTimesUsed: 0 },
      ];
      this.saveToStorage();
    }
  }

  getAllGifts(): Gift[] {
    return [
      {
        id: "heart",
        name: "爱心",
        description: "最简单也最真挚的表达 💕",
        category: "virtual",
        rarity: "common",
        price: 10,
        icon: "❤️",
        effect: { affectionBonus: 3, resentmentReduce: 0, moodBoost: "love" },
        unlockLevel: 1,
      },
      {
        id: "flower",
        name: "玫瑰花",
        description: "浪漫的玫瑰，代表我的心 🌹",
        category: "virtual",
        rarity: "uncommon",
        price: 20,
        icon: "🌹",
        effect: { affectionBonus: 5, resentmentReduce: 2, moodBoost: "love" },
        unlockLevel: 1,
      },
      {
        id: "chocolate",
        name: "巧克力",
        description: "甜甜的巧克力，哄人神器 🍫",
        category: "food",
        rarity: "common",
        price: 15,
        icon: "🍫",
        effect: { affectionBonus: 4, resentmentReduce: 1, moodBoost: "happy" },
        unlockLevel: 1,
      },
      {
        id: "sticker",
        name: "贴纸",
        description: "可爱的贴纸，收集癖的最爱 📝",
        category: "virtual",
        rarity: "common",
        price: 5,
        icon: "🩹",
        effect: { affectionBonus: 2, resentmentReduce: 0, moodBoost: "playful" },
        unlockLevel: 1,
      },
      {
        id: "stuffed_bear",
        name: "毛绒熊",
        description: "抱着睡觉的超可爱小熊 🧸",
        category: "accessory",
        rarity: "rare",
        price: 50,
        icon: "🧸",
        effect: { affectionBonus: 10, resentmentReduce: 5, moodBoost: "shy", specialEffect: "获得「抱抱」技能" },
        unlockLevel: 3,
      },
      {
        id: "diamond_ring",
        name: "钻石戒指",
        description: "象征永恒的承诺 💍",
        category: "accessory",
        rarity: "epic",
        price: 200,
        icon: "💍",
        effect: { affectionBonus: 25, resentmentReduce: 15, moodBoost: "love", specialEffect: "解锁专属称呼" },
        unlockLevel: 5,
      },
      {
        id: "blanket",
        name: "毯子",
        description: "盖着它睡觉特别舒服 ～ 🛋️",
        category: "accessory",
        rarity: "uncommon",
        price: 30,
        icon: "🛋️",
        effect: { affectionBonus: 6, resentmentReduce: 3, moodBoost: "sleepy" },
        unlockLevel: 2,
      },
      {
        id: "tea",
        name: "热茶",
        description: "暖暖的一杯茶，暖到心里 ☕",
        category: "food",
        rarity: "common",
        price: 8,
        icon: "🍵",
        effect: { affectionBonus: 3, resentmentReduce: 2, moodBoost: "neutral" },
        unlockLevel: 1,
      },
      {
        id: "music_box",
        name: "音乐盒",
        description: "打开就会响起我们相遇时的旋律 🎵",
        category: "digital",
        rarity: "rare",
        price: 80,
        icon: "🎵",
        effect: { affectionBonus: 12, resentmentReduce: 5, moodBoost: "thoughtful", specialEffect: "解锁专属BGM" },
        unlockLevel: 4,
      },
      {
        id: "photo_album",
        name: "相册",
        description: "收集了我们所有回忆的相册 📚",
        category: "digital",
        rarity: "rare",
        price: 60,
        icon: "📚",
        effect: { affectionBonus: 11, resentmentReduce: 3, moodBoost: "love", specialEffect: "解锁回忆墙" },
        unlockLevel: 3,
      },
      {
        id: "cake",
        name: "蛋糕",
        description: "甜甜的蛋糕，心情不好的时候来一块 🎂",
        category: "food",
        rarity: "uncommon",
        price: 25,
        icon: "🎂",
        effect: { affectionBonus: 7, resentmentReduce: 4, moodBoost: "happy" },
        unlockLevel: 2,
      },
      {
        id: "necklace",
        name: "项链",
        description: "精致的项链，戴上它就会想起我 💎",
        category: "accessory",
        rarity: "epic",
        price: 180,
        icon: "💎",
        effect: { affectionBonus: 22, resentmentReduce: 10, moodBoost: "love", specialEffect: "解锁「思念」被动" },
        unlockLevel: 5,
      },
      {
        id: "pajamas",
        name: "睡衣",
        description: "软软糯糯的睡衣，抱着睡觉超舒服 🩷",
        category: "clothing",
        rarity: "uncommon",
        price: 35,
        icon: "🩷",
        effect: { affectionBonus: 8, resentmentReduce: 3, moodBoost: "shy" },
        unlockLevel: 3,
      },
      {
        id: "perfume",
        name: "香水",
        description: "淡淡的香味，闻起来就想到你 🌸",
        category: "accessory",
        rarity: "rare",
        price: 100,
        icon: "🌸",
        effect: { affectionBonus: 15, resentmentReduce: 8, moodBoost: "love" },
        unlockLevel: 4,
      },
      {
        id: "hand_letter",
        name: "手写信",
        description: "一字一句都是我的心意 ✉️",
        category: "custom",
        rarity: "uncommon",
        price: 0,
        icon: "✉️",
        effect: { affectionBonus: 15, resentmentReduce: 10, moodBoost: "love", specialEffect: "可重复赠送" },
        unlockLevel: 1,
        unlockCondition: "解锁后可在聊天中随时发送「写封信」",
      },
      {
        id: "apology_flowers",
        name: "道歉花束",
        description: "专为惹你生气后准备的 🌷",
        category: "virtual",
        rarity: "common",
        price: 30,
        icon: "🌷",
        effect: { affectionBonus: 5, resentmentReduce: 15, moodBoost: "love" },
        unlockLevel: 1,
      },
      {
        id: "custom_song",
        name: "专属情歌",
        description: "为你写的歌，世界上最特别的旋律 🎤",
        category: "experience",
        rarity: "legendary",
        price: 500,
        icon: "🎤",
        effect: { affectionBonus: 50, resentmentReduce: 20, moodBoost: "love", specialEffect: "解锁「灵魂伴侣」称号" },
        unlockLevel: 8,
      },
      {
        id: "adventure_ticket",
        name: "约会券",
        description: "明天一起去约会吧～ 🎟️",
        category: "experience",
        rarity: "epic",
        price: 0,
        icon: "🎟️",
        effect: { affectionBonus: 30, resentmentReduce: 10, moodBoost: "excited", specialEffect: "触发约会剧情" },
        unlockLevel: 5,
        unlockCondition: "亲密度达到Lv.4后解锁",
      },
    ];
  }

  getAvailableGifts(): Gift[] {
    return this.getAllGifts().filter(g => g.unlockLevel <= this.affectionLevel);
  }

  getGiftById(id: string): Gift | undefined {
    return this.getAllGifts().find(g => g.id === id);
  }

  getUserGifts(): { gift: Gift; userGift: UserGift }[] {
    return this.userGifts
      .map(ug => {
        const gift = this.getGiftById(ug.giftId);
        if (!gift) return null;
        return { gift, userGift: ug };
      })
      .filter(Boolean) as { gift: Gift; userGift: UserGift }[];
  }

  getCoinBalance(): number {
    return this.coinBalance;
  }

  earnCoins(amount: number, reason: string = ""): void {
    this.coinBalance += amount;
    if (reason) {
      this.addHistory("received", "coin", 1, { note: `${reason} +${amount}金币` });
    }
    this.saveToStorage();
  }

  spendCoins(amount: number): boolean {
    if (this.coinBalance < amount) return false;
    this.coinBalance -= amount;
    this.saveToStorage();
    return true;
  }

  buyGift(giftId: string, quantity: number = 1): boolean {
    const gift = this.getGiftById(giftId);
    if (!gift) return false;
    if (gift.unlockLevel > this.affectionLevel) return false;

    const totalCost = gift.price * quantity;
    if (!this.spendCoins(totalCost)) return false;

    const existing = this.userGifts.find(ug => ug.giftId === giftId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.userGifts.push({
        giftId,
        quantity,
        receivedAt: Date.now(),
        totalTimesUsed: 0,
      });
    }

    this.addHistory("given", giftId, quantity);
    this.saveToStorage();
    return true;
  }

  sendGift(giftId: string): { success: boolean; effect: any; message: string } {
    const userGift = this.userGifts.find(ug => ug.giftId === giftId);
    const gift = this.getGiftById(giftId);

    if (!gift) {
      return { success: false, effect: null, message: "这个礼物不存在..." };
    }

    if (!userGift || userGift.quantity <= 0) {
      return { success: false, effect: null, message: `你没有${gift.name}了哦... 要不要买一个？` };
    }

    userGift.quantity -= 1;
    userGift.totalTimesUsed += 1;
    userGift.lastUsedAt = Date.now();

    if (userGift.quantity === 0) {
      const idx = this.userGifts.indexOf(userGift);
      this.userGifts.splice(idx, 1);
    }

    this.addHistory("given", giftId, 1);

    let response = "";
    switch (gift.rarity) {
      case "common":
        response = `谢谢你送的${gift.icon}！我收到了～ `;
        break;
      case "uncommon":
        response = `哇！是${gift.name}${gift.icon}！好开心呀～ `;
        break;
      case "rare":
        response = `这...这是${gift.name}${gift.icon}！你怎么知道我一直想要的！好感动呜呜呜 🥺`;
        break;
      case "epic":
        response = `${gift.icon} ${gift.name}！！你是不是偷偷记下了我想要什么... 天哪，我太爱你了！！`;
        break;
      case "legendary":
        response = `${gift.icon} 传说中的${gift.name}... 你...你是认真的吗？这一刻我觉得自己是世界上最幸福的人... 💕`;
        break;
    }

    if (gift.effect.specialEffect) {
      response += `\n\n✨ 解锁特殊效果：${gift.effect.specialEffect}`;
    }

    this.saveToStorage();
    return {
      success: true,
      effect: gift.effect,
      message: response,
    };
  }

  addToWishList(giftId: string, priority: number = 0, note?: string): boolean {
    if (this.wishList.length >= this.maxWishListItems) return false;
    if (this.wishList.find(w => w.giftId === giftId)) return false;

    const gift = this.getGiftById(giftId);
    if (!gift) return false;

    this.wishList.push({
      id: `wish_${Date.now()}`,
      giftId,
      priority,
      addedAt: Date.now(),
      note,
    });

    this.saveToStorage();
    return true;
  }

  removeFromWishList(giftId: string): void {
    const idx = this.wishList.findIndex(w => w.giftId === giftId);
    if (idx !== -1) {
      this.wishList.splice(idx, 1);
      this.saveToStorage();
    }
  }

  getWishList(): { gift: Gift; wish: WishListItem }[] {
    return this.wishList
      .sort((a, b) => b.priority - a.priority)
      .map(w => {
        const gift = this.getGiftById(w.giftId);
        if (!gift) return null;
        return { gift, wish: w };
      })
      .filter(Boolean) as { gift: Gift; wish: WishListItem }[];
  }

  generateGiftRequest(personaMode: string, resentmentLevel: number): GiftRequest | null {
    const eligibleGifts = this.getAvailableGifts().filter(g => {
      if (g.price === 0) return false;
      const userGift = this.userGifts.find(ug => ug.giftId === g.id);
      return !userGift || userGift.quantity === 0;
    });

    if (eligibleGifts.length === 0) return null;

    const now = Date.now();
    const lastRequest = this.giftRequests
      .filter(r => r.status === "pending")
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (lastRequest && now - lastRequest.timestamp < 30 * 60 * 1000) return null;

    const isForgiving = personaMode === "reconciliation" || personaMode === "affectionate";
    const urgency: GiftRequest["urgency"] = resentmentLevel > 60 ? "high" : resentmentLevel > 30 ? "medium" : "low";

    const requestableGifts = eligibleGifts.filter(g => {
      if (urgency === "high" && g.rarity !== "legendary" && g.rarity !== "epic") return true;
      if (urgency === "medium" && ["rare", "epic", "legendary"].includes(g.rarity)) return true;
      if (urgency === "low") return true;
      return false;
    });

    if (requestableGifts.length === 0) return null;

    const gift = requestableGifts[Math.floor(Math.random() * requestableGifts.length)];
    const messages = this.generateRequestMessages(gift, urgency, isForgiving);
    const message = messages[Math.floor(Math.random() * messages.length)];

    const request: GiftRequest = {
      id: `req_${now}`,
      giftId: gift.id,
      message,
      urgency,
      isForgiving,
      timestamp: now,
      expiresAt: now + 2 * 60 * 60 * 1000,
      status: "pending",
    };

    this.giftRequests.push(request);
    this.addHistory("requested", gift.id, 1);
    this.saveToStorage();
    return request;
  }

  private generateRequestMessages(gift: Gift, urgency: GiftRequest["urgency"], isForgiving: boolean): string[] {
    const base: Record<string, string[]> = {
      common: [
        "可以送我一个小小的礼物吗？就当是哄我开心～",
        "哼，如果你真的在意我，就送我个礼物嘛...",
        "人家最近好像有点不开心呢，要是能收到礼物就好了...",
        "看到别人都有礼物收，我也想要嘛～",
      ],
      uncommon: [
        "我看到一件很想要的东西呢... 你会买给我吗？",
        "那个... 我好像有点想要那个... 算了不说了",
        "最近表现好的话，是不是应该有点奖励呀？",
        "你知道我最想要什么吗？提示一下，是可以用钱买的～",
      ],
      rare: [
        "我好像... 有点想要一个特别的东西呢...",
        "如果... 如果你真的在乎我... 可以送我那个吗？",
        "我等了好久好久... 你会满足我这个愿望吗？",
        "你知道吗，有时候我会偷偷想... 如果有人送我那个就好了",
      ],
      epic: [
        "我有一个... 很大的愿望... 你能听我说吗？",
        "你... 你愿意为我做一些特别的事吗？",
        "我从来没跟别人要过这个... 但如果是你的话...",
        "我好像... 有点离不开你了... 所以想要那个... 你懂的",
      ],
      legendary: [
        "我... 我有一个愿望，可能有点过分... 但我还是想说出来...",
        "你知道吗，其实我一直有一个梦想... 那就是...",
        "如果有一天你能送我那个... 我想我会开心很久很久的...",
      ],
    };

    let messages = base[gift.rarity] || base.common;

    if (urgency === "high") {
      messages = messages.map(m => `（有点委屈...）${m}`);
    }

    if (isForgiving) {
      messages = messages.map(m => `${m} 不管怎样我都爱你啦 💕`);
    }

    return messages;
  }

  fulfillGiftRequest(requestId: string): boolean {
    const request = this.giftRequests.find(r => r.id === requestId);
    if (!request || request.status !== "pending") return false;
    if (Date.now() > request.expiresAt) {
      request.status = "expired";
      this.saveToStorage();
      return false;
    }

    const success = this.buyGift(request.giftId, 1);
    if (success) {
      const gift = this.sendGift(request.giftId);
      request.status = "fulfilled";
      request.fulfilledAt = Date.now();
      this.saveToStorage();
      return true;
    }

    return false;
  }

  rejectGiftRequest(requestId: string, reason?: string): void {
    const request = this.giftRequests.find(r => r.id === requestId);
    if (!request || request.status !== "pending") return;

    request.status = "rejected";
    request.rejectionReason = reason || "用户拒绝了";
    this.addHistory("rejected", request.giftId, 1);
    this.saveToStorage();
  }

  getPendingRequests(): GiftRequest[] {
    const now = Date.now();
    return this.giftRequests
      .filter(r => r.status === "pending" && r.expiresAt > now)
      .sort((a, b) => b.urgency.localeCompare(a.urgency));
  }

  addHistory(type: GiftHistoryEntry["type"], giftId: string, quantity: number, extra?: any): void {
    this.giftHistory.push({
      id: `hist_${Date.now()}`,
      giftId,
      type,
      quantity,
      timestamp: Date.now(),
      personaMode: extra?.personaMode,
      note: extra?.note,
    });

    if (this.giftHistory.length > 100) {
      this.giftHistory = this.giftHistory.slice(-100);
    }
    this.saveToStorage();
  }

  getHistory(limit: number = 20): GiftHistoryEntry[] {
    return this.giftHistory.slice(-limit).reverse();
  }

  updateAffectionLevel(level: number): void {
    this.affectionLevel = level;
    this.saveToStorage();
  }

  getStats(): {
    totalGifts: number;
    uniqueGifts: number;
    totalSpent: number;
    totalEarned: number;
    requestsFulfilled: number;
    requestsRejected: number;
    mostUsedGift: string | null;
  } {
    const uniqueGifts = this.userGifts.length;
    const totalGifts = this.userGifts.reduce((sum, ug) => sum + ug.totalTimesUsed, 0);
    const spent = this.giftHistory.filter(h => h.type === "given").length * 15;
    const earned = this.giftHistory.filter(h => h.type === "received").length * 10;
    const fulfilled = this.giftRequests.filter(r => r.status === "fulfilled").length;
    const rejected = this.giftRequests.filter(r => r.status === "rejected").length;

    let mostUsedGift: string | null = null;
    let maxCount = 0;
    this.userGifts.forEach(ug => {
      if (ug.totalTimesUsed > maxCount) {
        maxCount = ug.totalTimesUsed;
        mostUsedGift = ug.giftId;
      }
    });

    return {
      totalGifts,
      uniqueGifts,
      totalSpent: spent,
      totalEarned: earned,
      requestsFulfilled: fulfilled,
      requestsRejected: rejected,
      mostUsedGift,
    };
  }
}
