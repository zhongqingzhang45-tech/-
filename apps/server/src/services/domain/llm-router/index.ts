import type { ConfigKVService } from '../../adapters/config-kv'
import type { EnvelopeCrypto } from '../../../utils/envelope-crypto'

import { createBadGatewayError } from '../../../utils/error'

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

export interface ConcurrencyLedger {
  acquire(userId: string, maxConcurrency: number): Promise<boolean>
  release(userId: string): Promise<void>
  current(userId: string): Promise<number>
}

export interface LlmRouterService {
  route(input: RouteInput, ctx: LlmRouteContext): Promise<Response>
  routeTts(input: RouteTtsInput, ctx?: LlmRouteContext): Promise<Response>
  listTtsVoices(modelName: string): Promise<TtsVoice[]>
  shutdown(): Promise<void>
}

export interface LlmRouterOptions {
  configKV: ConfigKVService
  envelopeCrypto: EnvelopeCrypto
  gatewayMetrics: any | null
  redis: any
  concurrencyLedger: ConcurrencyLedger
}

export function createLlmRouterService(opts: LlmRouterOptions): LlmRouterService {
  const { configKV, envelopeCrypto } = opts

  async function getUpstreamConfig(modelName: string) {
    const config: any = await configKV.get('LLM_ROUTER_CONFIG')
    if (!config || !config.models || !config.models[modelName]) {
      throw createBadGatewayError(`No upstream config found for model: ${modelName}`)
    }
    return config.models[modelName]
  }

  async function route(input: RouteInput, ctx: LlmRouteContext): Promise<Response> {
    const upstream = await getUpstreamConfig(input.modelName)
    const baseUrl = upstream.baseUrl
    const apiKeyEntry = upstream.keys?.[0]

    if (!baseUrl || !apiKeyEntry) {
      throw createBadGatewayError(`Upstream misconfigured for model: ${input.modelName}`)
    }

    ctx.provider = upstream.provider ?? 'unknown'
    ctx.upstreamModel = upstream.upstreamModel ?? input.modelName
    ctx.triedUpstreams = 1
    ctx.triedKeys = 1

    let apiKey: string
    try {
      apiKey = envelopeCrypto.decryptKey(apiKeyEntry.ciphertext, {
        modelName: input.modelName,
        keyEntryId: apiKeyEntry.id,
      }).toString('utf-8')
    }
    catch {
      apiKey = apiKeyEntry.plaintext ?? ''
    }

    const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`
    const body = {
      ...input.body,
      model: upstream.upstreamModel ?? (input.body.model as string),
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...input.headers,
      },
      body: JSON.stringify(body),
      signal: input.abortSignal,
    })

    ctx.lastStatus = response.status

    if (!response.ok) {
      throw createBadGatewayError(`Upstream error: ${response.status}`)
    }

    return response
  }

  async function routeTts(input: RouteTtsInput, ctx?: LlmRouteContext): Promise<Response> {
    const upstream = await getUpstreamConfig(input.modelName)
    const baseUrl = upstream.baseUrl
    const apiKeyEntry = upstream.keys?.[0]

    if (!baseUrl || !apiKeyEntry) {
      throw createBadGatewayError(`Upstream misconfigured for model: ${input.modelName}`)
    }

    if (ctx) {
      ctx.provider = upstream.provider ?? 'unknown'
      ctx.triedUpstreams = 1
      ctx.triedKeys = 1
    }

    let apiKey: string
    try {
      apiKey = envelopeCrypto.decryptKey(apiKeyEntry.ciphertext, {
        modelName: input.modelName,
        keyEntryId: apiKeyEntry.id,
      }).toString('utf-8')
    }
    catch {
      apiKey = apiKeyEntry.plaintext ?? ''
    }

    const url = `${baseUrl.replace(/\/$/, '')}/audio/speech`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: upstream.upstreamModel ?? input.modelName,
        input: input.input.text,
        voice: input.input.voice,
        response_format: input.input.response_format ?? 'mp3',
        speed: input.input.speed ?? 1,
      }),
      signal: input.abortSignal,
    })

    if (ctx) ctx.lastStatus = response.status

    if (!response.ok) {
      throw createBadGatewayError(`Upstream TTS error: ${response.status}`)
    }

    return response
  }

  async function listTtsVoices(modelName: string): Promise<TtsVoice[]> {
    const upstream = await getUpstreamConfig(modelName)
    const baseUrl = upstream.baseUrl
    const apiKeyEntry = upstream.keys?.[0]

    if (!baseUrl || !apiKeyEntry) {
      return []
    }

    let apiKey: string
    try {
      apiKey = envelopeCrypto.decryptKey(apiKeyEntry.ciphertext, {
        modelName,
        keyEntryId: apiKeyEntry.id,
      }).toString('utf-8')
    }
    catch {
      apiKey = apiKeyEntry.plaintext ?? ''
    }

    const url = `${baseUrl.replace(/\/$/, '')}/audio/voices`

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })

      if (!response.ok) return []

      const data = await response.json() as any
      if (data.voices && Array.isArray(data.voices)) {
        return data.voices.map((v: any) => ({
          id: v.id ?? v.voice_id ?? '',
          name: v.name ?? v.voice_id ?? '',
          language: v.language ?? v.language_code,
          gender: v.gender,
        }))
      }

      return []
    }
    catch {
      return []
    }
  }

  async function shutdown() {
  }

  return { route, routeTts, listTtsVoices, shutdown }
}

export function createConcurrencyLedger(redis: any): ConcurrencyLedger {
  const keyPrefix = 'concurrency:tts:'

  async function acquire(userId: string, maxConcurrency: number): Promise<boolean> {
    const key = `${keyPrefix}${userId}`
    const current = await redis.incr(key)
    if (current === 1) {
      await redis.expire(key, 300)
    }
    if (current > maxConcurrency) {
      await redis.decr(key)
      return false
    }
    return true
  }

  async function release(userId: string): Promise<void> {
    const key = `${keyPrefix}${userId}`
    await redis.decr(key).catch(() => {})
  }

  async function current(userId: string): Promise<number> {
    const key = `${keyPrefix}${userId}`
    const val = await redis.get(key)
    return val ? Number(val) : 0
  }

  return { acquire, release, current }
}

export function createConfigSyncSubscriber(_opts: {
  redis: any
  llmRouter?: any
  gatewayMetrics?: any
  instanceId?: string
  logger?: any
}) {
  return {
    start() {},
    stop() {},
  }
}
