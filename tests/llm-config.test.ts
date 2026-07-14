/**
 * LLM 配置 API 测试
 *
 * 运行：npx tsx --test tests/llm-config.test.ts
 *
 * 测试 LLM 配置的脱敏、默认值回退、provider 校验逻辑。
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

// ====== 镜像 LLM Config API 中的纯函数 ======

const SUPPORTED_PROVIDERS = ["openai", "anthropic", "deepseek", "qwen", "glm", "mock"];

interface LLMConfigRecord {
  provider: string;
  apiKey: string | null;
  model: string | null;
  baseUrl: string | null;
}

/**
 * 脱敏 API Key：只保留前 4 位和后 4 位，中间用 **** 代替
 */
function maskApiKey(key: string | null): string | null {
  if (!key) return null;
  if (key.length <= 8) return "****";
  return `${key.slice(0, 4)}****${key.slice(-4)}`;
}

/**
 * 当用户无配置时，从环境变量生成默认值
 */
function getDefaultConfig(env: Record<string, string | undefined>): LLMConfigRecord {
  if (env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL || "gpt-4o-mini",
      baseUrl: env.OPENAI_BASE_URL || null,
    };
  }
  if (env.ANTHROPIC_API_KEY) {
    return {
      provider: "anthropic",
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      baseUrl: env.ANTHROPIC_BASE_URL || null,
    };
  }
  if (env.DEEPSEEK_API_KEY) {
    return {
      provider: "deepseek",
      apiKey: env.DEEPSEEK_API_KEY,
      model: env.DEEPSEEK_MODEL || "deepseek-chat",
      baseUrl: env.DEEPSEEK_BASE_URL || null,
    };
  }
  return {
    provider: "mock",
    apiKey: null,
    model: "mock-model",
    baseUrl: null,
  };
}

/**
 * 序列化配置返回给客户端：脱敏 apiKey
 */
function serializeConfig(config: LLMConfigRecord, source: "user" | "env") {
  return {
    provider: config.provider,
    apiKey: maskApiKey(config.apiKey),
    model: config.model,
    baseUrl: config.baseUrl,
    source,
  };
}

function isValidProvider(provider: string): boolean {
  return SUPPORTED_PROVIDERS.includes(provider);
}

// ====== 测试用例 ======

describe("LLM Config - Provider 校验", () => {
  test("支持的 provider 列表应包含 6 种", () => {
    assert.equal(SUPPORTED_PROVIDERS.length, 6);
  });

  test("合法 provider 应通过校验", () => {
    for (const p of SUPPORTED_PROVIDERS) {
      assert.equal(isValidProvider(p), true);
    }
  });

  test("非法 provider 应被拒绝", () => {
    assert.equal(isValidProvider("claude"), false);
    assert.equal(isValidProvider("gpt"), false);
    assert.equal(isValidProvider(""), false);
    assert.equal(isValidProvider("openai-2"), false);
  });
});

describe("LLM Config - API Key 脱敏", () => {
  test("空 key 应返回 null", () => {
    assert.equal(maskApiKey(null), null);
    assert.equal(maskApiKey(""), null);
  });

  test("短 key（<=8 位）应返回 ****", () => {
    assert.equal(maskApiKey("abcd"), "****");
    assert.equal(maskApiKey("12345678"), "****");
  });

  test("长 key 应保留前 4 位和后 4 位", () => {
    assert.equal(maskApiKey("sk-1234567890abcdef"), "sk-1****cdef");
    assert.equal(maskApiKey("sk-ant-api03-xxxxxxxxxxxx"), "sk-a****xxxx");
  });

  test("脱敏后不应暴露完整 key", () => {
    const key = "sk-1234567890abcdef";
    const masked = maskApiKey(key);
    assert.ok(masked);
    assert.ok(!masked.includes("234567890a"), "脱敏后不应包含中间部分");
  });
});

describe("LLM Config - 默认值回退", () => {
  test("设置 OPENAI_API_KEY 时应回退到 OpenAI", () => {
    const config = getDefaultConfig({ OPENAI_API_KEY: "sk-test" });
    assert.equal(config.provider, "openai");
    assert.equal(config.apiKey, "sk-test");
    assert.equal(config.model, "gpt-4o-mini");
  });

  test("设置 ANTHROPIC_API_KEY 时应回退到 Anthropic", () => {
    const config = getDefaultConfig({ ANTHROPIC_API_KEY: "sk-ant-test" });
    assert.equal(config.provider, "anthropic");
    assert.equal(config.apiKey, "sk-ant-test");
    assert.equal(config.model, "claude-3-5-sonnet-20241022");
  });

  test("设置 DEEPSEEK_API_KEY 时应回退到 DeepSeek", () => {
    const config = getDefaultConfig({ DEEPSEEK_API_KEY: "sk-ds-test" });
    assert.equal(config.provider, "deepseek");
    assert.equal(config.apiKey, "sk-ds-test");
    assert.equal(config.model, "deepseek-chat");
  });

  test("无任何环境变量时应回退到 mock", () => {
    const config = getDefaultConfig({});
    assert.equal(config.provider, "mock");
    assert.equal(config.apiKey, null);
    assert.equal(config.model, "mock-model");
  });

  test("OPENAI_API_KEY 应优先于 ANTHROPIC_API_KEY", () => {
    const config = getDefaultConfig({
      OPENAI_API_KEY: "sk-openai",
      ANTHROPIC_API_KEY: "sk-ant",
    });
    assert.equal(config.provider, "openai");
  });
});

describe("LLM Config - 序列化输出", () => {
  test("用户配置应标注 source=user 并脱敏", () => {
    const config: LLMConfigRecord = {
      provider: "openai",
      apiKey: "sk-1234567890abcdef",
      model: "gpt-4o",
      baseUrl: "https://api.openai.com/v1",
    };
    const serialized = serializeConfig(config, "user");
    assert.equal(serialized.source, "user");
    assert.equal(serialized.apiKey, "sk-1****cdef");
    assert.equal(serialized.provider, "openai");
    assert.equal(serialized.model, "gpt-4o");
  });

  test("环境变量配置应标注 source=env", () => {
    const config = getDefaultConfig({ OPENAI_API_KEY: "sk-env" });
    const serialized = serializeConfig(config, "env");
    assert.equal(serialized.source, "env");
    assert.equal(serialized.apiKey, "****"); // sk-env 只有 6 位
  });
});
