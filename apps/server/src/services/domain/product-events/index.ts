import type { PosthogSink } from '../../adapters/posthog'

export interface TrackEventInput {
  userId: string
  feature: string
  action: string
  status: string
  source?: string
  model?: string
  provider?: string
  reason?: string
  metadata?: Record<string, unknown>
}

export type ProductAction = string

export interface GenerationEventInput {
  userId: string
  traceId?: string
  generationId: string
  model: string
  provider: string
  providerType: string
  usageSource: string
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  costUsdSource: string
  conversationId?: string
  conversationIdSource?: string
  roundId?: string
  appSurface?: string
  captureSurface: string
  latencySeconds: number
  stream: boolean
}

export interface ProductEventService {
  track(input: TrackEventInput): void
  trackGeneration(input: GenerationEventInput): void
  countDistinctUsersByFeature(feature: string): Promise<number>
}

export type AiGenerationAppSurface = 'server' | 'stage' | 'pocket' | 'unknown'

export function createProductEventService(
  _db: any,
  _productMetrics: any,
  posthog: PosthogSink | null,
): ProductEventService {
  function track(input: TrackEventInput) {
    posthog?.capture({
      distinctId: input.userId,
      event: `${input.feature}_${input.action}_${input.status}`,
      properties: {
        feature: input.feature,
        action: input.action,
        status: input.status,
        source: input.source,
        model: input.model,
        ...input.metadata,
      },
    })
  }

  function trackGeneration(input: GenerationEventInput) {
    posthog?.capture({
      distinctId: input.userId,
      event: 'ai_generation',
      properties: {
        trace_id: input.traceId,
        generation_id: input.generationId,
        model: input.model,
        provider: input.provider,
        provider_type: input.providerType,
        usage_source: input.usageSource,
        input_tokens: input.inputTokens,
        output_tokens: input.outputTokens,
        total_tokens: input.totalTokens,
        cost_usd_source: input.costUsdSource,
        conversation_id: input.conversationId,
        conversation_id_source: input.conversationIdSource,
        round_id: input.roundId,
        app_surface: input.appSurface,
        capture_surface: input.captureSurface,
        latency_seconds: input.latencySeconds,
        stream: input.stream,
      },
    })
  }

  async function countDistinctUsersByFeature(_feature: string): Promise<number> {
    return 0
  }

  return { track, trackGeneration, countDistinctUsersByFeature }
}
