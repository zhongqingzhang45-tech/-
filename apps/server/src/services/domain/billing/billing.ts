export interface UsageInfo {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}

export function extractUsageFromBody(body: any): UsageInfo {
  const usage = body?.usage
  if (!usage) return {}

  return {
    promptTokens: usage.prompt_tokens ?? usage.promptTokens,
    completionTokens: usage.completion_tokens ?? usage.completionTokens,
    totalTokens: usage.total_tokens ?? usage.totalTokens,
  }
}

export function calculateFluxFromUsage(
  usage: UsageInfo,
  fluxPer1kTokens: number,
  fallbackRate: number,
): number {
  if (!usage.totalTokens && !usage.promptTokens && !usage.completionTokens) {
    return fallbackRate
  }

  const totalTokens = usage.totalTokens ?? (usage.promptTokens ?? 0) + (usage.completionTokens ?? 0)

  if (totalTokens <= 0) {
    return fallbackRate
  }

  const flux = Math.ceil((totalTokens / 1000) * fluxPer1kTokens)

  return Math.max(1, flux)
}
