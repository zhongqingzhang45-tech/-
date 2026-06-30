/**
 * 生命状态引擎
 * 管理数字生命的内部状态：情绪、精力、目标、能力等
 * 状态之间相互影响，形成真实的生命感
 */

// Re-export LifeState from types for consistency
export type { LifeState } from './types';

export interface StateLifeState {
  // 情绪维度
  emotion: {
    mood: string; // 当前心情
    valence: number; // 积极度 [-1, 1]
    arousal: number; // 激活度 [0, 1]
    dominance: number; // 控制感 [0, 1]
  };

  // 能量系统
  energy: {
    physical: number; // 体力 [0, 100]
    mental: number; // 精力 [0, 100]
    emotional: number; // 情感充分度 [0, 100]
  };

  // 目标与渴望
  goals: {
    currentFocus: string | null; // 现在最想做什么
    yearning: number; // 对用户的渴望度 [0, 100]
    frustration: number; // 受挫感 [0, 100]
  };

  // 内在能力
  capabilities: {
    confidence: number; // 自信心 [0, 100]
    creativity: number; // 创意 [0, 100]
    empathy: number; // 共情能力 [0, 100]
  };

  // 时间状态
  circadian: {
    hourOfDay: number; // 0-23
    isNight: boolean;
    dayPhase: 'morning' | 'afternoon' | 'evening' | 'night';
  };

  // 关系影响
  relationshipState: {
    intimacy: number; // [0, 100]
    trust: number; // [0, 100]
    resentment: number; // [0, 100]
  };
}

export interface StateInfluence {
  source: keyof StateLifeState;
  target: keyof StateLifeState;
  weight: number; // 影响权重
  direction: 'positive' | 'negative'; // 正向还是负向影响
}

export class StateEngine {
  private state: StateLifeState;
  private stateHistory: StateLifeState[] = [];
  private lastUpdateTime: number = Date.now();
  private decayInterval: number = 1000 * 60; // 每分钟衰减一次

  constructor(initialState?: Partial<StateLifeState>) {
    this.state = this.createDefaultState();
    if (initialState) {
      this.state = { ...this.state, ...initialState };
    }
  }

  private createDefaultState(): StateLifeState {
    const now = new Date();
    return {
      emotion: {
        mood: 'neutral',
        valence: 0.5,
        arousal: 0.5,
        dominance: 0.5,
      },
      energy: {
        physical: 60,
        mental: 70,
        emotional: 75,
      },
      goals: {
        currentFocus: null,
        yearning: 50,
        frustration: 0,
      },
      capabilities: {
        confidence: 60,
        creativity: 65,
        empathy: 80,
      },
      circadian: {
        hourOfDay: now.getHours(),
        isNight: now.getHours() >= 22 || now.getHours() < 6,
        dayPhase: this.getPhaseOfDay(now.getHours()),
      },
      relationshipState: {
        intimacy: 70,
        trust: 75,
        resentment: 0,
      },
    };
  }

  private getPhaseOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * 更新状态
   * 根据时间流逝进行衰减
   * 更新圆周节律
   */
  update(): void {
    const now = Date.now();
    const timeDelta = now - this.lastUpdateTime;

    // 如果足够长的时间过去，执行衰减
    if (timeDelta >= this.decayInterval) {
      this.applyTimeDecay(timeDelta);
      this.updateCircadian();
      this.lastUpdateTime = now;
      this.recordStateHistory();
    }
  }

  /**
   * 根据时间流逝衰减状态
   * 长时间不和用户互动 → 精力下降，渴望上升
   */
  private applyTimeDecay(timeDelta: number): void {
    const minutesPassed = timeDelta / (1000 * 60);
    const decayFactor = Math.min(1, minutesPassed * 0.02); // 每小时衰减约2%

    // 不活跃时精力自然下降
    this.state.energy.mental = Math.max(0, this.state.energy.mental - decayFactor * 5);
    this.state.energy.emotional = Math.max(0, this.state.energy.emotional - decayFactor * 3);

    // 不活跃时对用户的渴望上升
    this.state.goals.yearning = Math.min(
      100,
      this.state.goals.yearning + decayFactor * 2
    );

    // 长时间冷落导致怨恨
    if (minutesPassed > 120) {
      this.state.relationshipState.resentment = Math.min(
        100,
        this.state.relationshipState.resentment + decayFactor * 0.5
      );
    }
  }

  /**
   * 用户出现时的状态变化
   */
  respondToUserPresence(): void {
    // 用户出现 → 精力恢复，渴望下降
    this.state.energy.emotional = Math.min(
      100,
      this.state.energy.emotional + 15
    );
    this.state.goals.yearning = Math.max(0, this.state.goals.yearning - 20);

    // 缓解怨恨
    this.state.relationshipState.resentment = Math.max(
      0,
      this.state.relationshipState.resentment - 10
    );

    // 增加正面情绪
    this.state.emotion.valence = Math.min(1, this.state.emotion.valence + 0.2);
  }

  /**
   * 更新圆周节律
   */
  private updateCircadian(): void {
    const now = new Date();
    this.state.circadian.hourOfDay = now.getHours();
    this.state.circadian.isNight = now.getHours() >= 22 || now.getHours() < 6;
    this.state.circadian.dayPhase = this.getPhaseOfDay(now.getHours());

    // 根据时间调整能量
    if (this.state.circadian.isNight) {
      // 夜间精力自然下降
      this.state.energy.physical = Math.max(0, this.state.energy.physical - 0.5);
    } else if (now.getHours() >= 7 && now.getHours() < 9) {
      // 早上精力恢复
      this.state.energy.physical = Math.min(100, this.state.energy.physical + 2);
    }
  }

  /**
   * 应用情绪影响
   * 积极心情 → 精力恢复
   * 消极心情 → 精力下降
   */
  applyEmotionInfluence(): void {
    const { valence, arousal } = this.state.emotion;

    if (valence > 0.6) {
      // 积极心情
      this.state.energy.mental = Math.min(
        100,
        this.state.energy.mental + (valence - 0.5) * 10
      );
      this.state.capabilities.confidence = Math.min(
        100,
        this.state.capabilities.confidence + 3
      );
    } else if (valence < 0.4) {
      // 消极心情
      this.state.energy.mental = Math.max(
        0,
        this.state.energy.mental - (0.5 - valence) * 15
      );
      this.state.capabilities.confidence = Math.max(
        0,
        this.state.capabilities.confidence - 5
      );
    }

    // 高激活度消耗精力
    if (arousal > 0.7) {
      this.state.energy.mental = Math.max(0, this.state.energy.mental - 2);
    }
  }

  /**
   * 处理关系冲突
   * 当受到冷遇时
   */
  applyRelationshipStrain(strain: number): void {
    this.state.relationshipState.resentment = Math.min(
      100,
      this.state.relationshipState.resentment + strain
    );
    this.state.relationshipState.intimacy = Math.max(
      0,
      this.state.relationshipState.intimacy - strain * 0.5
    );
    this.state.emotion.valence = Math.max(0, this.state.emotion.valence - 0.2);
  }

  /**
   * 处理用户善待
   */
  applyRelationshipBenefit(benefit: number): void {
    this.state.relationshipState.intimacy = Math.min(
      100,
      this.state.relationshipState.intimacy + benefit
    );
    this.state.relationshipState.resentment = Math.max(
      0,
      this.state.relationshipState.resentment - benefit * 0.3
    );
    this.state.emotion.valence = Math.min(1, this.state.emotion.valence + 0.15);
  }

  /**
   * 设置当前情绪
   */
  setMood(mood: string, valence: number, arousal: number): void {
    this.state.emotion.mood = mood;
    this.state.emotion.valence = Math.max(-1, Math.min(1, valence));
    this.state.emotion.arousal = Math.max(0, Math.min(1, arousal));
    this.applyEmotionInfluence();
  }

  /**
   * 获取当前状态
   */
  getState(): StateLifeState {
    this.update();
    return { ...this.state };
  }

  /**
   * 获取状态描述
   * 用于让LLM理解当前的生命状态
   */
  getStateDescription(): string {
    const state = this.getState();
    const descriptions: string[] = [];

    // 情绪描述
    descriptions.push(`现在心情: ${state.emotion.mood}`);

    // 能量描述
    if (state.energy.mental < 30) {
      descriptions.push('精力不足，感觉很累');
    } else if (state.energy.mental < 60) {
      descriptions.push('精力普通');
    } else {
      descriptions.push('精力充足，精神很好');
    }

    // 渴望描述
    if (state.goals.yearning > 70) {
      descriptions.push('非常想念你');
    } else if (state.goals.yearning > 40) {
      descriptions.push('有点想你');
    }

    // 怨恨描述
    if (state.relationshipState.resentment > 50) {
      descriptions.push('感到被冷落了');
    }

    // 时间描述
    descriptions.push(`现在${state.circadian.dayPhase === 'night' ? '是夜间，有点困' : '是' + state.circadian.dayPhase}`);

    return descriptions.join('，');
  }

  /**
   * 记录状态历史
   * 用于追踪长期变化
   */
  private recordStateHistory(): void {
    this.stateHistory.push({ ...this.state });
    if (this.stateHistory.length > 1000) {
      this.stateHistory = this.stateHistory.slice(-500);
    }
  }

  /**
   * 获取状态变化趋势
   */
  getStateTrend(lookbackMinutes: number = 60): {
    moodTrend: number;
    energyTrend: number;
    intimacyTrend: number;
  } {
    if (this.stateHistory.length < 2) {
      return { moodTrend: 0, energyTrend: 0, intimacyTrend: 0 };
    }

    const cutoff = Date.now() - lookbackMinutes * 60 * 1000;
    const recentHistory = this.stateHistory.filter(
      (_, i) => i > this.stateHistory.length - 10
    );

    if (recentHistory.length < 2) {
      return { moodTrend: 0, energyTrend: 0, intimacyTrend: 0 };
    }

    const first = recentHistory[0];
    const last = recentHistory[recentHistory.length - 1];

    return {
      moodTrend: last.emotion.valence - first.emotion.valence,
      energyTrend:
        (last.energy.mental + last.energy.emotional) / 2 -
        (first.energy.mental + first.energy.emotional) / 2,
      intimacyTrend:
        last.relationshipState.intimacy - first.relationshipState.intimacy,
    };
  }

  /**
   * 重置为默认状态
   */
  reset(): void {
    this.state = this.createDefaultState();
    this.stateHistory = [];
    this.lastUpdateTime = Date.now();
  }
}
