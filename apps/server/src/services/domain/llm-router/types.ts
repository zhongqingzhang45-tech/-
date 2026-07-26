export interface RouterUpstream {
  baseURL?: string
  keyEntryId?: string
  region?: string
}

export interface RouterModel {
  provider: string
  upstreamModel?: string
  upstreams: RouterUpstream[]
}

export interface RouterModelGroup {
  models: Record<string, RouterModel>
}

export interface RouterDefaults {
  perAttemptTimeoutMs: number
  fullChainTimeoutMs: number
  fallbackHttpCodes: number[]
}

export interface RouterConfig {
  llm: RouterModelGroup
  tts: RouterModelGroup
  asr?: RouterModelGroup
  defaults: RouterDefaults
}

export interface LlmRouteContext {
  provider: string
  upstreamModel?: string
  triedUpstreams: number
  triedKeys: number
  lastStatus: number | null
}

export interface RouteInput {
  modelName: string
  body: Record<string, unknown>
  headers: Record<string, string>
  abortSignal?: AbortSignal
  stream?: boolean
}

export interface RouteTtsInput {
  modelName: string
  input: {
    text: string
    voice: string
    response_format?: string
    speed?: number
  }
  abortSignal?: AbortSignal
}

export interface TtsVoice {
  id: string
  name: string
  language?: string
  gender?: string
}
