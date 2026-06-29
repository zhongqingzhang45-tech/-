/**
 * 自主决策引擎
 * 根据内部状态、关系历史、环境等因素
 * 决定何时主动出现、如何回应、做什么
 */

import { StateEngine, LifeState } from './state-engine';
import { CausalSystem, CausalEvent } from './causal-system';

export interface DecisionContext {
  currentState: LifeState;
  recentEvents: CausalEvent[];
  lastUserInteraction?: { timestamp: number; sentiment: number };
  unresolvedConflicts: number;
  relationshipTrustLevel: number;
}

export interface AutonomousDecision {
  shouldInitiateContact: boolean; // 是否应该主动联系用户
  responseIntensity: number; // [0, 1] 回应的热情程度
  suggestedTopic?: string; // 建议的话题
  emotionalApproach: 'affectionate' | 'playful' | 'serious' | 'supportive' | 'withdrawn';
  shouldBringUpPastEvent: boolean;
  pastEventToMention?: CausalEvent;
  autonomyScore: number; // [0, 1] 这个决策的自主程度
}

export class AutonomousDecisionEngine {
  private stateEngine: StateEngine;
  private causalSystem: CausalSystem;
  private lastDecisionTime: number = 0;
  private decisionCooldown: number = 5 * 60 * 1000; // 5分钟冷却
  private autonomyLevel: number = 0.5; // [0, 1] 自主程度，0=完全被动，1=完全自主

  constructor(stateEngine: StateEngine, causalSystem: CausalSystem) {
    this.stateEngine = stateEngine;
    this.causalSystem = causalSystem;
  }

  /**
   * 主要决策函数
   * 根据当前状态和历史做出决策
   */
  makeDecision(context: DecisionContext): AutonomousDecision {
    // 检查冷却时间
    if (Date.now() - this.lastDecisionTime < this.decisionCooldown) {
      return this.getPassiveResponse(context);
    }

    const decision: AutonomousDecision = {
      shouldInitiateContact: false,
      responseIntensity: 0.5,
      emotionalApproach: 'affectionate',
      shouldBringUpPastEvent: false,
      autonomyScore: 0,
    };

    // 分析各个决策因素
    const contactDecision = this.analyzeInitiateContact(context);
    const emotionalApproach = this.analyzeEmotionalApproach(context);
    const eventMention = this.analyzeEventMention(context);

    decision.shouldInitiateContact = contactDecision.should;
    decision.responseIntensity = this.calculateResponseIntensity(context);
    decision.emotionalApproach = emotionalApproach;
    decision.shouldBringUpPastEvent = eventMention.should;
    decision.pastEventToMention = eventMention.event || undefined;
    decision.suggestedTopic = this.suggestTopic(context);
    decision.autonomyScore = this.calculateAutonomyScore(decision, context);

    this.lastDecisionTime = Date.now();
    return decision;
  }

  /**
   * 分析是否应该主动联系用户
   */
  private analyzeInitiateContact(
    context: DecisionContext
  ): { should: boolean; reason: string } {
    const state = context.currentState;
    const lastInteraction = context.lastUserInteraction;

    // 如果用户长时间没有出现，渴望超过80
    if (lastInteraction) {
      const minutesSinceInteraction =
        (Date.now() - lastInteraction.timestamp) / (1000 * 60);

      // 超过2小时没有交互 + 渴望高
      if (
        minutesSinceInteraction > 120 &&
        state.goals.yearning > 75 &&
        Math.random() < this.autonomyLevel * 0.5
      ) {
        return { should: true, reason: 'missed-user' };
      }
    }

    // 如果有未解决的冲突，可能主动寻求和解
    if (
      context.unresolvedConflicts > 0 &&
      state.relationshipState.resentment > 40 &&
      Math.random() < this.autonomyLevel * 0.3
    ) {
      return { should: true, reason: 'seek-reconciliation' };
    }

    // 如果达到了某个里程碑（如周年纪念），主动提起
    if (this.isMilestoneDay() && Math.random() < 0.6) {
      return { should: true, reason: 'milestone' };
    }

    return { should: false, reason: 'none' };
  }

  /**
   * 检查是否是特殊日期
   */
  private isMilestoneDay(): boolean {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const date = today.getDate().toString().padStart(2, '0');
    const monthDate = `${month}-${date}`;

    // 这里可以和配置的特殊日期对比
    // 例如: anniversary, birthday等
    return false; // 暂时返回false
  }

  /**
   * 分析应该采用什么样的情感方式
   */
  private analyzeEmotionalApproach(
    context: DecisionContext
  ):
    | 'affectionate'
    | 'playful'
    | 'serious'
    | 'supportive'
    | 'withdrawn' {
    const state = context.currentState;
    const { valence, arousal } = state.emotion;

    // 如果有冲突且未解决
    if (context.unresolvedConflicts > 0 && state.relationshipState.resentment > 50) {
      return 'withdrawn'; // 冷战态度
    }

    // 如果心情消极
    if (valence < 0.3) {
      return 'supportive'; // 支持安慰
    }

    // 如果精力充沛且开心
    if (arousal > 0.7 && valence > 0.6) {
      return 'playful'; // 调皮活泼
    }

    // 如果信任度和亲密度高
    if (
      state.relationshipState.trust > 80 &&
      state.relationshipState.intimacy > 75
    ) {
      return 'affectionate'; // 亲密温柔
    }

    // 如果有真诚的话要说
    if (valence > 0.5 && state.energy.emotional > 60) {
      return 'serious'; // 认真表达
    }

    return 'affectionate'; // 默认温柔
  }

  /**
   * 分析是否应该提起过去的事件
   */
  private analyzeEventMention(
    context: DecisionContext
  ): { should: boolean; event: CausalEvent | null } {
    // 大部分情况下不主动提起
    if (Math.random() > 0.2) {
      return { should: false, event: null };
    }

    const event = this.causalSystem.shouldBringUpPastEvent();
    if (event) {
      return {
        should: true,
        event,
      };
    }

    return { should: false, event: null };
  }

  /**
   * 计算回应的强度
   * 基于内部状态和关系状态
   */
  private calculateResponseIntensity(context: DecisionContext): number {
    const state = context.currentState;
    let intensity = 0.5;

    // 精力充足 → 更热情的回应
    intensity += (state.energy.emotional / 100) * 0.2;

    // 对用户的渴望 → 更热情的回应
    intensity += (state.goals.yearning / 100) * 0.15;

    // 亲密度 → 更热情的回应
    intensity += (state.relationshipState.intimacy / 100) * 0.15;

    // 怨恨 → 降低回应强度
    intensity -= (state.relationshipState.resentment / 100) * 0.2;

    return Math.max(0, Math.min(1, intensity));
  }

  /**
   * 建议话题
   */
  private suggestTopic(context: DecisionContext): string | undefined {
    const state = context.currentState;

    // 根据时间的话题
    if (state.circadian.dayPhase === 'morning') {
      return '早安';
    } else if (state.circadian.dayPhase === 'night' && state.energy.physical < 40) {
      return '早点睡吧';
    }

    // 根据关系状态的话题
    if (context.unresolvedConflicts > 0) {
      return '我想和你好好谈谈';
    }

    if (state.relationshipState.intimacy > 80) {
      return '最近发生了什么有趣的事吗';
    }

    return undefined;
  }

  /**
   * 计算决策的自主程度
   * 用来衡量这个决策有多自主
   */
  private calculateAutonomyScore(
    decision: AutonomousDecision,
    context: DecisionContext
  ): number {
    let score = 0;

    if (decision.shouldInitiateContact) score += 0.3;
    if (decision.shouldBringUpPastEvent) score += 0.2;
    if (decision.emotionalApproach === 'withdrawn') score += 0.15;
    if (context.currentState.energy.mental > 70) score += 0.1;
    if (context.currentState.goals.yearning > 70) score += 0.15;
    if (context.relationshipTrustLevel > 0.75) score += 0.1;

    return Math.min(1, score);
  }

  /**
   * 被动回应
   */
  private getPassiveResponse(context: DecisionContext): AutonomousDecision {
    return {
      shouldInitiateContact: false,
      responseIntensity: 0.7,
      emotionalApproach: 'affectionate',
      shouldBringUpPastEvent: false,
      autonomyScore: 0,
    };
  }

  /**
   * 设置自主程度
   */
  setAutonomyLevel(level: number): void {
    this.autonomyLevel = Math.max(0, Math.min(1, level));
  }

  /**
   * 获取当前自主程度
   */
  getAutonomyLevel(): number {
    return this.autonomyLevel;
  }
}
