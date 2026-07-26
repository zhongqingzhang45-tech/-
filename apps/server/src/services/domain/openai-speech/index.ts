import type { ConfigKVService } from '../../adapters/config-kv'
import type { FluxService } from '../flux'
import type { GenAiMetrics } from '../../../otel'
import type { LlmRouterService } from '../llm-router'
import type { LlmTracingDeps } from '../../../routes/openai/v1/types'
import type { ProductEventService } from '../product-events'
import type { ProviderCatalogService } from '../provider-catalog'
import type { RequestLogService } from '../request-log'
import type { FluxMeter } from '../billing/flux-meter'
import type { VoicePackService } from '../voice-packs'

export interface OpenAiSpeechService {
  handleSpeechRequest(input: any): Promise<Response>
}

export function createOpenAiSpeechService(_deps: {
  configKV: ConfigKVService
  fluxService: FluxService
  genAi?: GenAiMetrics | null
  llmRouter: LlmRouterService
  llmTracing: LlmTracingDeps
  providerCatalogService: ProviderCatalogService
  productEventService: ProductEventService
  requestLogService: RequestLogService
  ttsMeter: FluxMeter
  voicePackService: VoicePackService
}): OpenAiSpeechService {
  async function handleSpeechRequest(_input: any): Promise<Response> {
    return new Response(JSON.stringify({ error: 'Not implemented' }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return { handleSpeechRequest }
}
