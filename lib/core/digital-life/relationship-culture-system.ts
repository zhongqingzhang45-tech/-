import {
  RelationshipCulture,
  LifeState,
} from "./types";

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export class RelationshipCultureSystem {
  addInsideJoke(
    lifeState: LifeState,
    joke: string,
    context: string
  ): LifeState {
    const culture = { ...lifeState.relationshipCulture };
    
    if (culture.insideJokes.find(j => j.joke === joke)) {
      return lifeState;
    }

    culture.insideJokes = [
      ...culture.insideJokes,
      {
        id: generateId("joke"),
        joke,
        context,
        createdAt: Date.now(),
        referencedCount: 0,
      },
    ];

    return { ...lifeState, relationshipCulture: culture };
  }

  referenceInsideJoke(lifeState: LifeState, jokeId: string): LifeState {
    const culture = { ...lifeState.relationshipCulture };
    culture.insideJokes = culture.insideJokes.map(j =>
      j.id === jokeId
        ? { ...j, referencedCount: j.referencedCount + 1 }
        : j
    );
    return { ...lifeState, relationshipCulture: culture };
  }

  getRandomInsideJoke(lifeState: LifeState): typeof lifeState.relationshipCulture.insideJokes[0] | null {
    const jokes = lifeState.relationshipCulture.insideJokes;
    if (jokes.length === 0) return null;
    
    const weighted = jokes.map(j => ({
      joke: j,
      weight: 1 / (1 + j.referencedCount * 0.3),
    }));

    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const w of weighted) {
      random -= w.weight;
      if (random <= 0) {
        return w.joke;
      }
    }

    return jokes[0];
  }

  addSharedRitual(
    lifeState: LifeState,
    name: string,
    description: string,
    frequency: "daily" | "weekly" | "special"
  ): LifeState {
    const culture = { ...lifeState.relationshipCulture };
    
    if (culture.sharedRituals.find(r => r.name === name)) {
      return lifeState;
    }

    culture.sharedRituals = [
      ...culture.sharedRituals,
      {
        id: generateId("ritual"),
        name,
        description,
        frequency,
        createdAt: Date.now(),
      },
    ];

    return { ...lifeState, relationshipCulture: culture };
  }

  performRitual(lifeState: LifeState, ritualId: string): LifeState {
    const culture = { ...lifeState.relationshipCulture };
    culture.sharedRituals = culture.sharedRituals.map(r =>
      r.id === ritualId ? { ...r, lastPerformed: Date.now() } : r
    );
    return { ...lifeState, relationshipCulture: culture };
  }

  addNickname(
    lifeState: LifeState,
    nickname: string,
    context: string
  ): LifeState {
    const culture = { ...lifeState.relationshipCulture };
    
    if (culture.nicknames.find(n => n.nickname === nickname)) {
      return lifeState;
    }

    culture.nicknames = [
      ...culture.nicknames,
      {
        id: generateId("nickname"),
        nickname,
        context,
        createdAt: Date.now(),
        usageCount: 0,
      },
    ];

    return { ...lifeState, relationshipCulture: culture };
  }

  useNickname(lifeState: LifeState, nicknameId: string): LifeState {
    const culture = { ...lifeState.relationshipCulture };
    culture.nicknames = culture.nicknames.map(n =>
      n.id === nicknameId ? { ...n, usageCount: n.usageCount + 1 } : n
    );
    return { ...lifeState, relationshipCulture: culture };
  }

  getFavoriteNickname(lifeState: LifeState): string | null {
    const nicknames = lifeState.relationshipCulture.nicknames;
    if (nicknames.length === 0) return null;
    
    const sorted = [...nicknames].sort((a, b) => b.usageCount - a.usageCount);
    return sorted[0].nickname;
  }

  addSharedPhrase(
    lifeState: LifeState,
    phrase: string,
    meaning: string,
    origin: string
  ): LifeState {
    const culture = { ...lifeState.relationshipCulture };
    
    if (culture.sharedLanguage.find(p => p.phrase === phrase)) {
      return lifeState;
    }

    culture.sharedLanguage = [
      ...culture.sharedLanguage,
      {
        id: generateId("phrase"),
        phrase,
        meaning,
        origin,
        createdAt: Date.now(),
      },
    ];

    return { ...lifeState, relationshipCulture: culture };
  }

  updateCommunicationStyle(
    lifeState: LifeState,
    updates: Partial<RelationshipCulture["communicationStyle"]>
  ): LifeState {
    const style = { ...lifeState.relationshipCulture.communicationStyle };
    
    for (const [key, value] of Object.entries(updates)) {
      const k = key as keyof typeof style;
      if (typeof style[k] === "number" && typeof value === "number") {
        const current = style[k];
        const delta = (value - current) * 0.1;
        (style as any)[k] = Math.max(0, Math.min(1, current + delta));
      }
    }

    const culture = { ...lifeState.relationshipCulture, communicationStyle: style };
    return { ...lifeState, relationshipCulture: culture };
  }

  addRelationshipRule(
    lifeState: LifeState,
    rule: string,
    importance: number
  ): LifeState {
    const culture = { ...lifeState.relationshipCulture };
    
    if (culture.relationshipRules.find(r => r.rule === rule)) {
      return lifeState;
    }

    culture.relationshipRules = [
      ...culture.relationshipRules,
      {
        id: generateId("rule"),
        rule,
        agreedAt: Date.now(),
        importance,
      },
    ];

    return { ...lifeState, relationshipCulture: culture };
  }

  detectCulturalArtifacts(
    lifeState: LifeState,
    userMessage: string,
    isPositive: boolean
  ): LifeState {
    let state = lifeState;
    const msg = userMessage.toLowerCase();

    if (isPositive && msg.length > 0 && Math.random() < 0.05) {
      const style = state.relationshipCulture.communicationStyle;
      if (isPositive && style.playfulness < 0.8) {
        state = this.updateCommunicationStyle(state, { playfulness: style.playfulness + 0.1 });
      }
    }

    if (msg.includes("哈哈") || msg.includes("笑死") || msg.includes("233")) {
      if (state.relationshipCulture.insideJokes.length < 10 && Math.random() < 0.02) {
        const context = msg.length > 50 ? msg.substring(0, 50) + "..." : msg;
        state = this.addInsideJoke(state, msg, context);
      }
    }

    if (msg.includes("笨蛋") || msg.includes("傻瓜") || msg.includes("小")) {
      const nickMatch = msg.match(/(笨蛋|傻瓜|小[\u4e00-\u9fa5]{1,3})/);
      if (nickMatch && state.relationshipCulture.nicknames.length < 5 && Math.random() < 0.1) {
        state = this.addNickname(state, nickMatch[1], "日常称呼");
      }
    }

    return state;
  }

  getCulturalSummary(lifeState: LifeState): {
    insideJokeCount: number;
    ritualCount: number;
    nicknameCount: number;
    phraseCount: number;
    ruleCount: number;
    communicationStyle: RelationshipCulture["communicationStyle"];
  } {
    const culture = lifeState.relationshipCulture;
    return {
      insideJokeCount: culture.insideJokes.length,
      ritualCount: culture.sharedRituals.length,
      nicknameCount: culture.nicknames.length,
      phraseCount: culture.sharedLanguage.length,
      ruleCount: culture.relationshipRules.length,
      communicationStyle: culture.communicationStyle,
    };
  }
}
