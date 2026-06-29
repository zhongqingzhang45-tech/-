import {
  LifeState,
  EmotionState,
  MemoryEntry,
  RelationshipState,
  PersonaState,
  DecisionResult,
} from "./types";

import {
  EventUnderstandingLayer,
  EmotionSystem,
  DecisionEngine,
  PersonaMatrixSystem,
} from "./systems";

// Import the four new engines
import { NeuralDecisionEngine } from "./neural-decision-engine";
import { MemoryEvolutionEngine } from "./memory-evolution-engine";
import { DynamicPersonaEngine } from "./dynamic-persona-engine";
import { RelationshipSimulationEngine } from "./relationship-simulation-engine";

export interface IntegrationConfig {
  useNeuralDecisions?: boolean;
  enableMemoryEvolution?: boolean;
  enableDynamicPersona?: boolean;
  enableRelationshipSimulation?: boolean;
  blendingWeights?: {
    neural: number;
    traditional: number;
  };
}

export interface EngineAnalysis {
  eventAnalysis: any;
  neuralDecision: DecisionResult;
  traditionaDecision: DecisionResult;
  finalDecision: DecisionResult;
  memoryInsights: {
    evolved: MemoryEntry[];
    predictions: string[];
  };
  personaShift: {
    current: PersonaState;
    predicted: PersonaState;
  };
  relationshipForecast: {
    nextState: RelationshipState;
    riskFactors: string[];
    opportunities: string[];
  };
}

/**
 * 集成层：协调四大新引擎与现有系统
 * 功能：
 * 1. 神经决策与传统决策混合
 * 2. 记忆演化与认知融合
 * 3. 动态人格与决策流程整合
 * 4. 关系预测与情感系统同步
 */
export class EngineIntegrationLayer {
  private config: IntegrationConfig;
  
  // 现有系统组件
  private eventUnderstanding: EventUnderstandingLayer;
  private emotionSystem: EmotionSystem;
  private traditionaDecisionEngine: DecisionEngine;
  private personaMatrix: PersonaMatrixSystem;
  
  // 四大新引擎
  private neuralDecisionEngine: NeuralDecisionEngine;
  private memoryEvolutionEngine: MemoryEvolutionEngine;
  private dynamicPersonaEngine: DynamicPersonaEngine;
  private relationshipSimulationEngine: RelationshipSimulationEngine;
  
  // 集成状态
  private analysisHistory: EngineAnalysis[] = [];
  private maxHistorySize: number = 50;
  private lastSyncTime: number = Date.now();

  constructor(
    eventUnderstanding: EventUnderstandingLayer,
    emotionSystem: EmotionSystem,
    traditionaDecisionEngine: DecisionEngine,
    personaMatrix: PersonaMatrixSystem,
    config: IntegrationConfig = {}
  ) {
    this.eventUnderstanding = eventUnderstanding;
    this.emotionSystem = emotionSystem;
    this.traditionaDecisionEngine = traditionaDecisionEngine;
    this.personaMatrix = personaMatrix;

    // 初始化配置
    this.config = {
      useNeuralDecisions: true,
      enableMemoryEvolution: true,
      enableDynamicPersona: true,
      enableRelationshipSimulation: true,
      blendingWeights: {
        neural: 0.6,
        traditional: 0.4,
      },
      ...config,
    };

    // 初始化四大新引擎
    this.neuralDecisionEngine = new NeuralDecisionEngine();
    this.memoryEvolutionEngine = new MemoryEvolutionEngine();
    this.dynamicPersonaEngine = new DynamicPersonaEngine();
    this.relationshipSimulationEngine = new RelationshipSimulationEngine();
  }

  /**
   * 主集成处理：分析用户输入并综合所有引擎的结果
   */
  async processIntegratedAnalysis(
    userInput: string,
    lifeState: LifeState,
    recentMessages: any[],
    imageUrl?: string
  ): Promise<EngineAnalysis> {
    const timestamp = Date.now();

    // 1. 事件理解
    const eventAnalysis = this.eventUnderstanding.analyze(userInput, imageUrl);
    const behaviorTags = this.eventUnderstanding.detectBehaviorTags(
      userInput,
      recentMessages
    );

    // 2. 并行执行决策引擎
    const [neuralDecision, traditionaDecision] = await Promise.all([
      this.config.useNeuralDecisions
        ? this.neuralDecisionEngine.decide(eventAnalysis, lifeState, behaviorTags)
        : Promise.resolve(null),
      Promise.resolve(
        this.traditionaDecisionEngine.decide(eventAnalysis, lifeState, behaviorTags)
      ),
    ]);

    // 3. 融合决策结果
    const finalDecision = this.blendDecisions(
      neuralDecision,
      traditionaDecision,
      lifeState
    );

    // 4. 记忆演化
    const memoryInsights = this.config.enableMemoryEvolution
      ? await this.integrateMemoryEvolution(userInput, eventAnalysis, lifeState)
      : { evolved: [], predictions: [] };

    // 5. 动态人格更新
    const personaShift = this.config.enableDynamicPersona
      ? this.integrateDynamicPersona(
          eventAnalysis,
          lifeState.persona,
          behaviorTags,
          recentMessages
        )
      : {
          current: lifeState.persona,
          predicted: lifeState.persona,
        };

    // 6. 关系预测
    const relationshipForecast = this.config.enableRelationshipSimulation
      ? this.integrateRelationshipSimulation(
          lifeState.relationship,
          lifeState.emotion,
          personaShift.predicted,
          eventAnalysis
        )
      : {
          nextState: lifeState.relationship,
          riskFactors: [],
          opportunities: [],
        };

    // 7. 组合分析结果
    const analysis: EngineAnalysis = {
      eventAnalysis,
      neuralDecision: neuralDecision || traditionaDecision,
      traditionaDecision,
      finalDecision,
      memoryInsights,
      personaShift,
      relationshipForecast,
    };

    // 8. 保存到历史
    this.analysisHistory.push(analysis);
    if (this.analysisHistory.length > this.maxHistorySize) {
      this.analysisHistory.shift();
    }

    this.lastSyncTime = timestamp;
    return analysis;
  }

  /**
   * 融合神经决策和传统决策
   * 权重策略：
   * - 高置信度情况：增加神经决策权重
   * - 风险情况：增加传统决策权重（更保守）
   */
  private blendDecisions(
    neuralDecision: DecisionResult | null,
    traditionaDecision: DecisionResult,
    lifeState: LifeState
  ): DecisionResult {
    if (!neuralDecision) return traditionaDecision;

    const weights = this.config.blendingWeights!;
    const confidence = (neuralDecision as any).confidence || 0.7;
    
    // 根据冲突程度动态调整权重
    const isConflicting =
      neuralDecision.personaMode !== traditionaDecision.personaMode;
    const adjustedWeights = isConflicting
      ? { neural: 0.5, traditional: 0.5 } // 冲突时平衡
      : { neural: weights.neural * confidence, traditional: weights.traditional * (1 - confidence) };

    // 融合决策模式
    const blendedMode =
      adjustedWeights.neural > adjustedWeights.traditional
        ? neuralDecision.personaMode
        : traditionaDecision.personaMode;

    // 融合行动计划
    const blendedActions = this.mergeActionPlans(
      neuralDecision.actionPlan || [],
      traditionaDecision.actionPlan || []
    );

    // 融合情感目标
    const blendedEmotionTarget =
      adjustedWeights.neural > adjustedWeights.traditional
        ? neuralDecision.emotionTarget
        : traditionaDecision.emotionTarget;

    return {
      personaMode: blendedMode,
      actionPlan: blendedActions,
      emotionTarget: blendedEmotionTarget,
      shouldColdTreat:
        neuralDecision.shouldColdTreat || traditionaDecision.shouldColdTreat,
      shouldInitiate:
        neuralDecision.shouldInitiate || traditionaDecision.shouldInitiate,
      reconciliationOffer:
        neuralDecision.reconciliationOffer ||
        traditionaDecision.reconciliationOffer,
    };
  }

  /**
   * 合并来自两个决策引擎的行动计划
   */
  private mergeActionPlans(
    neuralActions: string[],
    traditionaActions: string[]
  ): string[] {
    const merged = new Map<string, number>();

    // 记录来自神经引擎的行动（权重 1.0）
    neuralActions.forEach((action) => {
      merged.set(action, (merged.get(action) || 0) + 1.0);
    });

    // 记录来自传统引擎的行动（权重 0.7）
    traditionaActions.forEach((action) => {
      merged.set(action, (merged.get(action) || 0) + 0.7);
    });

    // 按权重排序返回
    return Array.from(merged.entries())
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0]);
  }

  /**
   * 集成记忆演化引擎
   */
  private async integrateMemoryEvolution(
    userInput: string,
    eventAnalysis: any,
    lifeState: LifeState
  ): Promise<{ evolved: MemoryEntry[]; predictions: string[] }> {
    try {
      const evolved = await this.memoryEvolutionEngine.evolveMemories(
        userInput,
        lifeState.memoryBuffer?.recentMessages || [],
        eventAnalysis.sentiment
      );

      const predictions = this.memoryEvolutionEngine.predictConversationFlow(
        userInput,
        lifeState.memoryBuffer?.recentMessages || []
      );

      return { evolved, predictions };
    } catch (error) {
      console.warn("Memory evolution failed:", error);
      return { evolved: [], predictions: [] };
    }
  }

  /**
   * 集成动态人格引擎
   */
  private integrateDynamicPersona(
    eventAnalysis: any,
    currentPersona: PersonaState,
    behaviorTags: string[],
    recentMessages: any[]
  ): { current: PersonaState; predicted: PersonaState } {
    try {
      const predicted = this.dynamicPersonaEngine.predictPersonaShift(
        eventAnalysis,
        currentPersona,
        behaviorTags,
        recentMessages
      );

      return {
        current: currentPersona,
        predicted,
      };
    } catch (error) {
      console.warn("Dynamic persona prediction failed:", error);
      return {
        current: currentPersona,
        predicted: currentPersona,
      };
    }
  }

  /**
   * 集成关系模拟引擎
   */
  private integrateRelationshipSimulation(
    currentRelationship: RelationshipState,
    currentEmotion: EmotionState,
    predictedPersona: PersonaState,
    eventAnalysis: any
  ): {
    nextState: RelationshipState;
    riskFactors: string[];
    opportunities: string[];
  } {
    try {
      const simulation = this.relationshipSimulationEngine.simulateNextState(
        currentRelationship,
        currentEmotion,
        predictedPersona,
        eventAnalysis.keywords
      );

      const riskFactors = this.relationshipSimulationEngine.identifyRiskFactors(
        currentRelationship,
        predictedPersona
      );

      const opportunities = this.relationshipSimulationEngine.identifyOpportunities(
        currentRelationship,
        predictedPersona
      );

      return {
        nextState: simulation,
        riskFactors,
        opportunities,
      };
    } catch (error) {
      console.warn("Relationship simulation failed:", error);
      return {
        nextState: currentRelationship,
        riskFactors: [],
        opportunities: [],
      };
    }
  }

  /**
   * 应用集成分析结果到生命状态
   */
  applyAnalysisToLifeState(
    lifeState: LifeState,
    analysis: EngineAnalysis
  ): LifeState {
    const updated = JSON.parse(JSON.stringify(lifeState));

    // 1. 应用决策结果
    updated.currentMode = analysis.finalDecision.personaMode;

    // 2. 更新人格状态
    if (
      analysis.personaShift.predicted &&
      analysis.personaShift.predicted !== lifeState.persona
    ) {
      updated.persona = {
        ...updated.persona,
        ...analysis.personaShift.predicted,
      };
    }

    // 3. 更新关系状态
    if (
      analysis.relationshipForecast.nextState &&
      analysis.relationshipForecast.nextState !== lifeState.relationship
    ) {
      updated.relationship = {
        ...updated.relationship,
        ...analysis.relationshipForecast.nextState,
      };
    }

    // 4. 标记风险因素
    if (analysis.relationshipForecast.riskFactors.length > 0) {
      updated.riskIndicators = analysis.relationshipForecast.riskFactors;
    }

    // 5. 记录机会
    if (analysis.relationshipForecast.opportunities.length > 0) {
      updated.opportunities = analysis.relationshipForecast.opportunities;
    }

    updated.lastAnalysisTime = Date.now();
    return updated;
  }

  /**
   * 获取决策解释（用于调试和理解）
   */
  getDecisionExplanation(analysis: EngineAnalysis): string {
    const lines: string[] = [];

    lines.push("=== 集成分析决策解释 ===\n");

    // 事件分析
    lines.push(
      `📊 事件分析: ${analysis.eventAnalysis.intent || "未识别"}`
    );
    lines.push(
      `   关键词: ${analysis.eventAnalysis.keywords?.join(", ") || "无"}\n`
    );

    // 决策对比
    if (analysis.neuralDecision && analysis.traditionaDecision) {
      lines.push("🤖 神经决策 vs 📋 传统决策:");
      lines.push(
        `   神经: ${analysis.neuralDecision.personaMode}`
      );
      lines.push(
        `   传统: ${analysis.traditionaDecision.personaMode}`
      );
      lines.push(
        `   最终: ${analysis.finalDecision.personaMode}\n`
      );
    }

    // 记忆演化
    if (analysis.memoryInsights.predictions.length > 0) {
      lines.push("🧠 记忆演化预测:");
      analysis.memoryInsights.predictions.forEach((pred) => {
        lines.push(`   • ${pred}`);
      });
      lines.push("");
    }

    // 人格动态
    if (analysis.personaShift.predicted) {
      lines.push("🎭 人格动态:");
      lines.push(
        `   亲和力: ${analysis.personaShift.current.affection} → ${analysis.personaShift.predicted.affection}`
      );
      lines.push(
        `   怨恨度: ${analysis.personaShift.current.resentment} → ${analysis.personaShift.predicted.resentment}\n`
      );
    }

    // 关系预测
    if (analysis.relationshipForecast.riskFactors.length > 0) {
      lines.push("⚠️ 风险因素:");
      analysis.relationshipForecast.riskFactors.forEach((risk) => {
        lines.push(`   • ${risk}`);
      });
      lines.push("");
    }

    if (analysis.relationshipForecast.opportunities.length > 0) {
      lines.push("✨ 机会:");
      analysis.relationshipForecast.opportunities.forEach((opp) => {
        lines.push(`   • ${opp}`);
      });
    }

    return lines.join("\n");
  }

  /**
   * 获取分析历史统计
   */
  getAnalyticsStats(): {
    totalAnalyses: number;
    decisionDistribution: Record<string, number>;
    averageConfidence: number;
    riskTrendAnalysis: { increasing: boolean; level: string };
  } {
    if (this.analysisHistory.length === 0) {
      return {
        totalAnalyses: 0,
        decisionDistribution: {},
        averageConfidence: 0,
        riskTrendAnalysis: { increasing: false, level: "low" },
      };
    }

    // 计算决策模式分布
    const distribution: Record<string, number> = {};
    let totalConfidence = 0;

    this.analysisHistory.forEach((analysis) => {
      const mode = analysis.finalDecision.personaMode;
      distribution[mode] = (distribution[mode] || 0) + 1;
      totalConfidence +=
        ((analysis.neuralDecision as any)?.confidence || 0.5) +
        ((analysis.traditionaDecision as any)?.confidence || 0.5);
    });

    // 分析风险趋势
    const recentRisks = this.analysisHistory
      .slice(-10)
      .reduce((sum, a) => sum + a.relationshipForecast.riskFactors.length, 0);
    const olderRisks = this.analysisHistory
      .slice(0, -10)
      .reduce((sum, a) => sum + a.relationshipForecast.riskFactors.length, 0);

    return {
      totalAnalyses: this.analysisHistory.length,
      decisionDistribution: distribution,
      averageConfidence: totalConfidence / (this.analysisHistory.length * 2),
      riskTrendAnalysis: {
        increasing: recentRisks > olderRisks,
        level: recentRisks > 15 ? "high" : recentRisks > 10 ? "medium" : "low",
      },
    };
  }

  /**
   * 重置集成层状态
   */
  reset(): void {
    this.analysisHistory = [];
    this.lastSyncTime = Date.now();
  }

  /**
   * 获取配置信息
   */
  getConfiguration(): IntegrationConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfiguration(config: Partial<IntegrationConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
