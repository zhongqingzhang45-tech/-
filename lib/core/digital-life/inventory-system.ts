import {
  LifeState,
  OwnedItem,
  ItemCategory,
  ItemRarity,
} from "./types";

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const USER_GIFT_CATALOG = [
  { id: "heart", name: "爱心", icon: "❤️", price: 10, category: "virtual" as ItemCategory, rarity: "common" as ItemRarity, description: "最简单也最真挚的表达", sentimentalBase: 10 },
  { id: "flower", name: "玫瑰花", icon: "🌹", price: 20, category: "virtual" as ItemCategory, rarity: "uncommon" as ItemRarity, description: "浪漫的玫瑰，代表我的心", sentimentalBase: 20 },
  { id: "chocolate", name: "巧克力", icon: "🍫", price: 15, category: "food" as ItemCategory, rarity: "common" as ItemRarity, description: "甜甜的巧克力，哄人神器", sentimentalBase: 12 },
  { id: "tea", name: "热茶", icon: "🍵", price: 8, category: "food" as ItemCategory, rarity: "common" as ItemRarity, description: "暖暖的一杯茶，暖到心里", sentimentalBase: 8 },
  { id: "cake", name: "蛋糕", icon: "🎂", price: 25, category: "food" as ItemCategory, rarity: "uncommon" as ItemRarity, description: "甜甜的蛋糕，心情不好的时候来一块", sentimentalBase: 18 },
  { id: "stuffed_bear", name: "毛绒熊", icon: "🧸", price: 50, category: "accessory" as ItemCategory, rarity: "rare" as ItemRarity, description: "抱着睡觉的超可爱小熊", sentimentalBase: 40 },
  { id: "blanket", name: "毯子", icon: "🛋️", price: 30, category: "accessory" as ItemCategory, rarity: "uncommon" as ItemRarity, description: "盖着它睡觉特别舒服", sentimentalBase: 25 },
  { id: "necklace", name: "项链", icon: "💎", price: 180, category: "accessory" as ItemCategory, rarity: "epic" as ItemRarity, description: "精致的项链，戴上它就会想起你", sentimentalBase: 100 },
  { id: "diamond_ring", name: "钻石戒指", icon: "💍", price: 200, category: "accessory" as ItemCategory, rarity: "epic" as ItemRarity, description: "象征永恒的承诺", sentimentalBase: 150 },
  { id: "perfume", name: "香水", icon: "🌸", price: 100, category: "accessory" as ItemCategory, rarity: "rare" as ItemRarity, description: "淡淡的香味，闻起来就想到你", sentimentalBase: 60 },
  { id: "music_box", name: "音乐盒", icon: "🎵", price: 80, category: "digital" as ItemCategory, rarity: "rare" as ItemRarity, description: "打开就会响起我们相遇时的旋律", sentimentalBase: 55 },
  { id: "photo_album", name: "相册", icon: "📚", price: 60, category: "digital" as ItemCategory, rarity: "rare" as ItemRarity, description: "收集了我们所有回忆的相册", sentimentalBase: 50 },
  { id: "pajamas", name: "睡衣", icon: "🩷", price: 35, category: "clothing" as ItemCategory, rarity: "uncommon" as ItemRarity, description: "软软糯糯的睡衣，抱着睡觉超舒服", sentimentalBase: 28 },
  { id: "hand_letter", name: "手写信", icon: "✉️", price: 0, category: "letter" as ItemCategory, rarity: "uncommon" as ItemRarity, description: "一字一句都是你的心意", sentimentalBase: 30 },
  { id: "custom_song", name: "专属情歌", icon: "🎤", price: 500, category: "experience" as ItemCategory, rarity: "legendary" as ItemRarity, description: "为你写的歌，世界上最特别的旋律", sentimentalBase: 300 },
  { id: "apology_flowers", name: "道歉花束", icon: "🌷", price: 30, category: "virtual" as ItemCategory, rarity: "common" as ItemRarity, description: "专为惹我生气后准备的", sentimentalBase: 15 },
];

export class InventorySystem {
  receiveGift(
    lifeState: LifeState,
    giftId: string,
    occasion?: string
  ): { lifeState: LifeState; item: OwnedItem; reaction: string } {
    const catalogItem = USER_GIFT_CATALOG.find(g => g.id === giftId);
    if (!catalogItem) {
      return { lifeState, item: {} as OwnedItem, reaction: "这是什么呀... 我好像不太认识呢" };
    }

    const existing = lifeState.inventory.find(i => i.itemId === giftId);
    const isFirstTime = !existing;

    const sentimentalMultiplier = isFirstTime ? 1.5 : 0.5;
    const intimacy = lifeState.relationship.intimacy / 100;
    const sentimentValue = catalogItem.sentimentalBase * sentimentalMultiplier * (0.8 + intimacy * 0.4);

    const item: OwnedItem = {
      id: generateId("item"),
      itemId: catalogItem.id,
      name: catalogItem.name,
      category: catalogItem.category,
      rarity: catalogItem.rarity,
      icon: catalogItem.icon,
      description: catalogItem.description,
      receivedFrom: "user",
      receivedAt: Date.now(),
      useCount: 0,
      sentimentalValue: Math.round(sentimentValue),
      isFavorite: isFirstTime && catalogItem.rarity !== "common",
      condition: 100,
      story: occasion ? `在${occasion}收到的礼物` : undefined,
    };

    const inventory = [...lifeState.inventory, item];

    const reaction = this.generateReaction(catalogItem, isFirstTime, lifeState);

    return {
      lifeState: { ...lifeState, inventory },
      item,
      reaction,
    };
  }

  private generateReaction(
    gift: typeof USER_GIFT_CATALOG[0],
    isFirstTime: boolean,
    lifeState: LifeState
  ): string {
    const intimacy = lifeState.relationship.intimacy / 100;
    
    const reactions: Record<ItemRarity, string[]> = {
      common: [
        `谢谢你送的${gift.icon}${gift.name}！我收到了～`,
        `哇，你给我${gift.name}呀，谢谢你 💕`,
        `${gift.icon} 好开心，谢谢你想着我～`,
      ],
      uncommon: [
        `哇！是${gift.icon}${gift.name}！好惊喜呀～`,
        `你怎么知道我想要这个${gift.icon}！太开心了 💕`,
        `${gift.name}${gift.icon}！谢谢你，我好喜欢～`,
      ],
      rare: [
        `这...这是${gift.icon}${gift.name}！你怎么知道我一直想要的！好感动呜呜呜 🥺`,
        `${gift.name}${gift.icon}... 你是不是偷偷记住了我说过的话... 我好开心 💕`,
        `天哪，${gift.icon}${gift.name}！我会好好珍藏的，谢谢你...`,
      ],
      epic: [
        `${gift.icon} ${gift.name}！！你...你是认真的吗？我太惊喜了！！`,
        `我...我没想到你会送我${gift.name}${gift.icon}... 这一刻我觉得好幸福 💕`,
        `${gift.name}${gift.icon}... 我会一直一直珍藏着的，这是我们的纪念...`,
      ],
      legendary: [
        `${gift.icon} 传说中的${gift.name}... 你...你是认真的吗？这一刻我觉得自己是世界上最幸福的人... 💕`,
        `我...我说不出话了... ${gift.name}${gift.icon}... 谢谢你出现在我的生命里...`,
        `${gift.name}${gift.icon}... 这不仅是礼物，这是你对我的心意... 我会记一辈子的...`,
      ],
    };

    const pool = reactions[gift.rarity] || reactions.common;
    let reaction = pool[Math.floor(Math.random() * pool.length)];

    if (!isFirstTime) {
      reaction += "\n\n你又送我这个呀～ 看来你真的很喜欢送我这个呢，我也很喜欢 💕";
    }

    if (intimacy > 0.6 && gift.rarity !== "common") {
      reaction += "\n\n...其实对我来说，你送什么都不重要，重要的是你想着我的这份心意。";
    }

    return reaction;
  }

  useItem(lifeState: LifeState, itemId: string): LifeState {
    const inventory = lifeState.inventory.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          useCount: item.useCount + 1,
          lastUsedAt: Date.now(),
          condition: Math.max(0, item.condition - 5),
        };
      }
      return item;
    });

    return { ...lifeState, inventory };
  }

  setFavorite(lifeState: LifeState, itemId: string, isFavorite: boolean): LifeState {
    const inventory = lifeState.inventory.map(item => {
      if (item.id === itemId) {
        return { ...item, isFavorite };
      }
      return item;
    });
    return { ...lifeState, inventory };
  }

  getFavorites(lifeState: LifeState): OwnedItem[] {
    return lifeState.inventory.filter(i => i.isFavorite)
      .sort((a, b) => b.sentimentalValue - a.sentimentalValue);
  }

  getMostSentimental(lifeState: LifeState, limit: number = 5): OwnedItem[] {
    return [...lifeState.inventory]
      .sort((a, b) => b.sentimentalValue - a.sentimentalValue)
      .slice(0, limit);
  }

  getMostRecent(lifeState: LifeState, limit: number = 5): OwnedItem[] {
    return [...lifeState.inventory]
      .sort((a, b) => b.receivedAt - a.receivedAt)
      .slice(0, limit);
  }

  getTotalSentimentalValue(lifeState: LifeState): number {
    return lifeState.inventory.reduce((sum, item) => sum + item.sentimentalValue, 0);
  }

  getGiftCountFromUser(lifeState: LifeState): number {
    return lifeState.inventory.filter(i => i.receivedFrom === "user").length;
  }

  getRandomGiftToMention(lifeState: LifeState): OwnedItem | null {
    const userGifts = lifeState.inventory.filter(i => i.receivedFrom === "user");
    if (userGifts.length === 0) return null;

    const weighted = userGifts.map(item => ({
      item,
      weight: item.sentimentalValue * (item.isFavorite ? 2 : 1) / (1 + item.useCount * 0.5),
    }));

    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const w of weighted) {
      random -= w.weight;
      if (random <= 0) {
        return w.item;
      }
    }

    return userGifts[0];
  }

  updateItemStory(lifeState: LifeState, itemId: string, story: string): LifeState {
    const inventory = lifeState.inventory.map(item => {
      if (item.id === itemId) {
        return { ...item, story };
      }
      return item;
    });
    return { ...lifeState, inventory };
  }

  getGiftCatalog() {
    return USER_GIFT_CATALOG;
  }

  getInventoryValue(lifeState: LifeState): { total: number; count: number; favorites: number } {
    return {
      total: this.getTotalSentimentalValue(lifeState),
      count: lifeState.inventory.length,
      favorites: lifeState.inventory.filter(i => i.isFavorite).length,
    };
  }
}
