import { DigitalLifeAgent } from "./agent";
import {
  EngineIntegrationLayer,
  IntegrationConfig,
  EngineAnalysis,
} from "./integration-layer";

import {
  EventUnderstandingLayer,
  EmotionSystem,
  DecisionEngine,
  PersonaMatrixSystem,
  MemorySystem,
} from "./systems";

/**
 * 引擎适配器：将集成层无缝集成到 DigitalLifeAgent
 * 
 * 职责：
 * 1. 拦截 agent 的决策流程
 * 2. 注入集成层分析
 * 3. 提供兼容的决策接口
 * 4. 维护系统一致性
 */
export class EngineAdapter {
  private integrationLayer: EngineIntegrationLayer;
  private agent: DigitalLifeAgent;
  private isEnabled: boolean = true;
  private analysisCache: Map<string, EngineAnalysis> = new Map();
  private maxCacheSize: number = 100;

  constructor(
    agent: DigitalLifeAgent,
    eventUnderstanding: EventUnderstandingLayer,
    emotionSystem: EmotionSystem,
    decisionEngine: DecisionEngine,
    personaMatrix: PersonaMatrixSystem,
    config?: IntegrationConfig
  ) {
    this.agent = agent;
    this.integrationLayer = new EngineIntegrationLayer(
      eventUnderstanding,
      emotionSystem,
      decisionEngine,
      personaMatrix,
      config
    );
  }

  /**
   * 增强的响应方法
   * 在原有逻辑基础上注入集成层分析
   */
  async processWithIntegration(
    userInput: string,
    lifeState: any,
    recentMessages: any[],
    imageUrl?: string
  ): Promise<{
    analysis: EngineAnalysis;
    updatedLifeState: any;
    explanation: string;
  }> {
    if (!this.isEnabled) {
      return {
        analysis: {} as EngineAnalysis,
        updatedLifeState: lifeState,
        explanation: "Integration layer disabled",
      };
    }

    // 检查缓存
    const cacheKey = this.generateCacheKey(userInput, lifeState);
    if (this.analysisCache.has(cacheKey)) {
      return {
        analysis: this.analysisCache.get(cacheKey)!,
        updatedLifeState: lifeState,
        explanation: "Cached analysis",
      };
    }

    try {
      // 执行集成分析
      const analysis = await this.integrationLayer.processIntegratedAnalysis(
        userInput,
        lifeState,
        recentMessages,
        imageUrl
      );

      // 应用分析结果到生命状态
      const updatedLifeState =
        this.integrationLayer.applyAnalysisToLifeState(lifeState, analysis);

      // 获取决策解释
      const explanation = this.integrationLayer.getDecisionExplanation(analysis);

      // 缓存结果
      this.cacheAnalysis(cacheKey, analysis);

      return {
        analysis,
        updatedLifeState,
        explanation,
      };
    } catch (error) {
      console.error("Integration layer error:", error);
      return {
        analysis: {} as EngineAnalysis,
        updatedLifeState: lifeState,
        explanation: `Error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * 在 agent 的 respond 方法前插入的钩子
   */
  async preProcessHook(
    userInput: string,
    lifeState: any,
    recentMessages: any[]
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // 预热分析 - 不等待结果，后续步骤可以使用缓存
      this.integrationLayer.processIntegratedAnalysis(
        userInput,
        lifeState,
        recentMessages
      );
    } catch (error) {
      console.warn("Pre-processing failed, continuing without integration:", error);
    }
  }

  /**
   * 在 agent 的 respond 方法后插入的钩子
   */
  postProcessHook(
    response: any,
    analysis: EngineAnalysis | null
  ): any {
    if (!analysis) return response;

    // 增强响应信息
    return {
      ...response,
      _metadata: {
        integratedAnalysis: {
          personaMode: analysis.finalDecision.personaMode,
          riskFactors: analysis.relationshipForecast.riskFactors,
          opportunities: analysis.relationshipForecast.opportunities,
          memoryPredictions: analysis.memoryInsights.predictions,
        },
      },
    };
  }

  /**
   * 获取实时分析统计
   */
  getAnalyticsSnapshot(): {
    enabled: boolean;
    stats: any;
    recentAnalyses: EngineAnalysis[];
    configuration: IntegrationConfig;
  } {
    return {
      enabled: this.isEnabled,
      stats: this.integrationLayer.getAnalyticsStats(),
      recentAnalyses: Array.from(this.analysisCache.values()),
      configuration: this.integrationLayer.getConfiguration(),
    };
  }

  /**
   * 启用/禁用集成层
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clearCache();
    }
  }

  /**
   * 获取启用状态
   */
  isIntegrationEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * 更新配置
   */
  updateConfiguration(config: Partial<IntegrationConfig>): void {
    this.integrationLayer.updateConfiguration(config);
    this.clearCache();
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(userInput: string, lifeState: any): string {
    return `${userInput.substring(0, 50)}_${lifeState.relationship?.relationshipLevel || 0}`;
  }

  /**
   * 缓存分析结果
   */
  private cacheAnalysis(key: string, analysis: EngineAnalysis): void {
    if (this.analysisCache.size >= this.maxCacheSize) {
      // 移除最旧的缓存
      const firstKey = this.analysisCache.keys().next().value;
      this.analysisCache.delete(firstKey);
    }
    this.analysisCache.set(key, analysis);
  }

  /**
   * 清空缓存
   */
  private clearCache(): void {
    this.analysisCache.clear();
  }

  /**
   * 重置适配器状态
   */
  reset(): void {
    this.integrationLayer.reset();
    this.clearCache();
  }
}

/**
 * 适配器工厂函数
 * 用于轻松为现有 agent 附加适配器
 */
export function createEngineAdapter(
  agent: DigitalLifeAgent,
  systems: {
    eventUnderstanding: EventUnderstandingLayer;
    emotionSystem: EmotionSystem;
    decisionEngine: DecisionEngine;
    personaMatrix: PersonaMatrixSystem;
  },
  config?: IntegrationConfig
): EngineAdapter {
  return new EngineAdapter(
    agent,
    systems.eventUnderstanding,
    systems.emotionSystem,
    systems.decisionEngine,
    systems.personaMatrix,
    config
  );
}
