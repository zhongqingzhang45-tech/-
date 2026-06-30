/**
 * DigitalLifeAgent 集成指南
 * 
 * 本文件展示如何在 DigitalLifeAgent 中整合四大新引擎
 * 包含完整的集成代码示例和最佳实践
 */

import { DigitalLifeAgent } from "./agent";
import { EngineAdapter, createEngineAdapter } from "./engine-adapter";
import { IntegrationConfig } from "./integration-layer";

/**
 * 示例 1: 基础集成
 * 为现有 DigitalLifeAgent 添加集成层
 */
export function integrateWithAgent(agent: DigitalLifeAgent): EngineAdapter {
  // 从 agent 内部获取系统组件
  // 注：实际实现中需要在 DigitalLifeAgent 中暴露这些组件的 getter 方法
  const adapter = createEngineAdapter(
    agent,
    {
      eventUnderstanding: (agent as any).eventUnderstanding,
      emotionSystem: (agent as any).emotionSystem,
      decisionEngine: (agent as any).decisionEngine,
      personaMatrix: (agent as any).personaMatrix,
    },
    {
      useNeuralDecisions: true,
      enableMemoryEvolution: true,
      enableDynamicPersona: true,
      enableRelationshipSimulation: true,
      blendingWeights: {
        neural: 0.6,
        traditional: 0.4,
      },
    }
  );

  return adapter;
}

/**
 * 示例 2: 增强的 respond 方法
 * 将适配器集成到 agent 的主响应流程中
 */
export async function enhancedRespond(
  agent: DigitalLifeAgent,
  adapter: EngineAdapter,
  userInput: string,
  imageUrl?: string
): Promise<any> {
  const lifeState = agent.getLifeState();
  const recentMessages = agent.getRecentMessages();

  // 1. 前处理：预热分析
  await adapter.preProcessHook(userInput, lifeState, recentMessages);

  // 2. 执行集成分析
  const { analysis, updatedLifeState, explanation } =
    await adapter.processWithIntegration(
      userInput,
      lifeState,
      recentMessages,
      imageUrl
    );

  console.log("=== 集成分析结果 ===");
  console.log(explanation);

  // 3. 调用原始 respond 方法
  const response = await agent.respond(userInput, imageUrl);

  // 4. 后处理：增强响应
  const enhancedResponse = adapter.postProcessHook(response, analysis);

  // 5. 应用更新的生命状态（可选）
  // agent.lifeState = updatedLifeState;

  return enhancedResponse;
}

/**
 * 示例 3: 监控和分析
 * 实时监控集成系统的性能和决策质量
 */
export function setupMonitoring(
  adapter: EngineAdapter,
  logInterval: number = 5000
): void {
  setInterval(() => {
    const snapshot = adapter.getAnalyticsSnapshot();

    console.log("\n=== 集成层性能监控 ===");
    console.log(`状态: ${snapshot.enabled ? "启用" : "禁用"}`);
    console.log(`总分析次数: ${snapshot.stats.totalAnalyses}`);
    console.log(`平均置信度: ${(snapshot.stats.averageConfidence * 100).toFixed(2)}%`);
    console.log(
      `风险趋势: ${snapshot.stats.riskTrendAnalysis.increasing ? "上升" : "下降"} (${snapshot.stats.riskTrendAnalysis.level})`
    );

    // 决策分布
    console.log("决策模式分布:");
    Object.entries(snapshot.stats.decisionDistribution).forEach(
      ([mode, count]) => {
        console.log(`  ${mode}: ${count}`);
      }
    );
  }, logInterval);
}

/**
 * 示例 4: 动态配置调整
 * 根据运行时条件调整集成配置
 */
export function setupDynamicConfiguration(adapter: EngineAdapter): void {
  // 定期检查系统状态并调整配置
  setInterval(() => {
    const snapshot = adapter.getAnalyticsSnapshot();
    const riskLevel = snapshot.stats.riskTrendAnalysis.level;

    // 根据风险级别调整权重
    if (riskLevel === "high") {
      console.log("⚠️ 检测到高风险，增加传统决策权重");
      adapter.updateConfiguration({
        blendingWeights: {
          neural: 0.4,
          traditional: 0.6, // 高风险时更保守
        },
      });
    } else if (riskLevel === "low") {
      console.log("✨ 风险低，恢复正常权重分配");
      adapter.updateConfiguration({
        blendingWeights: {
          neural: 0.6,
          traditional: 0.4,
        },
      });
    }

    // 根据置信度调整启用状态
    if (snapshot.stats.averageConfidence < 0.5) {
      console.log("📊 置信度过低，禁用神经决策");
      adapter.updateConfiguration({
        useNeuralDecisions: false,
      });
    } else if (snapshot.stats.averageConfidence > 0.75) {
      console.log("🧠 置信度高，启用所有新引擎");
      adapter.updateConfiguration({
        useNeuralDecisions: true,
        enableMemoryEvolution: true,
        enableDynamicPersona: true,
        enableRelationshipSimulation: true,
      });
    }
  }, 10000); // 每 10 秒检查一次
}

/**
 * 示例 5: 完整集成示例
 * 展示如何在应用中完整集成所有功能
 */
export async function completeIntegrationExample() {
  // 创建 agent
  const agent = new DigitalLifeAgent({
    id: "example",
    name: "示例角色",
    userNickname: "用户",
    gender: "female",
    personality: [],
    catchphrases: [],
  } as any);

  // 初始化 agent
  await agent.initialize();

  // 1. 创建适配器
  const adapter = integrateWithAgent(agent);
  console.log("✅ 适配器创建完成");

  // 2. 启用监控
  setupMonitoring(adapter, 5000);
  console.log("✅ 监控启用");

  // 3. 启用动态配置
  setupDynamicConfiguration(adapter);
  console.log("✅ 动态配置启用");

  // 4. 处理用户输入
  const userInput = "我今天很累，想和你聊天";
  const response = await enhancedRespond(agent, adapter, userInput);

  console.log("\n最终响应:", response);

  // 5. 获取性能快照
  const snapshot = adapter.getAnalyticsSnapshot();
  console.log("\n最终统计:", {
    分析次数: snapshot.stats.totalAnalyses,
    置信度: `${(snapshot.stats.averageConfidence * 100).toFixed(2)}%`,
    风险等级: snapshot.stats.riskTrendAnalysis.level,
  });

  return { agent, adapter };
}

/**
 * 示例 6: 配置预设
 * 不同场景下的推荐配置
 */
export const configurationPresets: Record<string, IntegrationConfig> = {
  // 高精度模式：用于重要决策
  highPrecision: {
    useNeuralDecisions: true,
    enableMemoryEvolution: true,
    enableDynamicPersona: true,
    enableRelationshipSimulation: true,
    blendingWeights: {
      neural: 0.7,
      traditional: 0.3,
    },
  },

  // 保守模式：用于敏感情况
  conservative: {
    useNeuralDecisions: false,
    enableMemoryEvolution: true,
    enableDynamicPersona: true,
    enableRelationshipSimulation: false,
    blendingWeights: {
      neural: 0.3,
      traditional: 0.7,
    },
  },

  // 平衡模式：日常使用
  balanced: {
    useNeuralDecisions: true,
    enableMemoryEvolution: true,
    enableDynamicPersona: true,
    enableRelationshipSimulation: true,
    blendingWeights: {
      neural: 0.6,
      traditional: 0.4,
    },
  },

  // 快速模式：最小化计算开销
  fast: {
    useNeuralDecisions: false,
    enableMemoryEvolution: false,
    enableDynamicPersona: false,
    enableRelationshipSimulation: false,
    blendingWeights: {
      neural: 0.0,
      traditional: 1.0,
    },
  },

  // 学习模式：最大化新引擎权重
  learning: {
    useNeuralDecisions: true,
    enableMemoryEvolution: true,
    enableDynamicPersona: true,
    enableRelationshipSimulation: true,
    blendingWeights: {
      neural: 0.8,
      traditional: 0.2,
    },
  },
};

/**
 * 示例 7: 应用预设配置
 */
export function applyConfigurationPreset(
  adapter: EngineAdapter,
  presetName: keyof typeof configurationPresets
): void {
  const preset = configurationPresets[presetName];
  if (preset) {
    adapter.updateConfiguration(preset);
    console.log(`✅ 应用配置预设: ${presetName}`);
  } else {
    console.warn(`⚠️ 未找到预设: ${presetName}`);
  }
}

/**
 * 示例 8: 故障恢复
 * 当集成层遇到问题时的降级方案
 */
export function setupFallback(adapter: EngineAdapter): void {
  // 禁用集成层，使用传统决策
  adapter.setEnabled(false);
  console.log("🔄 已切换到传统决策模式");
}

/**
 * 使用说明：
 * 
 * 1. 基础集成：
 *    const adapter = integrateWithAgent(agent);
 * 
 * 2. 增强响应：
 *    const response = await enhancedRespond(agent, adapter, userInput);
 * 
 * 3. 监控系统：
 *    setupMonitoring(adapter);
 * 
 * 4. 应用预设：
 *    applyConfigurationPreset(adapter, 'balanced');
 * 
 * 5. 故障恢复：
 *    setupFallback(adapter);
 */
