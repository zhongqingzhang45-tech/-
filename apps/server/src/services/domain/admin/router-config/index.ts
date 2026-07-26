import type { ConfigKVService } from '../../../adapters/config-kv'
import type { EnvelopeCrypto } from '../../../../utils/envelope-crypto'

export type SliceKind =
  | 'openrouter'
  | 'bedrock'
  | 'openai-compatible'
  | 'azure'
  | 'dashscope-cosyvoice'
  | 'stepfun'
  | 'aliyun-nls-asr'
  | 'unspeech'

export interface SliceInput {
  kind: SliceKind
  modelName?: string
  overrideModel?: string
  plaintextKey?: string
  baseURL?: string
  keyEntryId?: string
  existingKeyEntryId?: string
  region?: string
  upstreamModel?: string
  defaultVoice?: string
  instruction?: string
  accessKeyId?: string
  appKey?: string
  restBaseURL?: string
  streaming?: {
    upstreamURL?: string
    plaintextKey?: string
    keyEntryId?: string
    existingKeyEntryId?: string
    models?: Array<{ id: string; name?: string; description?: string }>
    defaultModel?: string
  }
}

export interface RouterApplyInput {
  mode: 'merge' | 'reset'
  dryRun: boolean
  slices: SliceInput[]
  defaults?: {
    chatModel?: string
    ttsModel?: string
    ttsVoices?: Record<string, Record<string, string>>
  }
  actorUserId: string
}

export interface RouterApplyResult {
  applied: boolean
  config: any
  changes: string[]
}

export interface AdminRouterConfigService {
  getRouterConfig(): Promise<any>
  updateRouterConfig(config: any): Promise<void>
  seedIfEmpty(): Promise<void>
  current(): Promise<any>
  apply(input: RouterApplyInput): Promise<RouterApplyResult>
}

export function createAdminRouterConfigService(opts: {
  configKV: ConfigKVService
  envelope: EnvelopeCrypto
  redis: any
}): AdminRouterConfigService {
  const { configKV } = opts

  async function getRouterConfig(): Promise<any> {
    return configKV.get('LLM_ROUTER_CONFIG') ?? { models: {}, defaults: {} }
  }

  async function updateRouterConfig(config: any): Promise<void> {
    await configKV.set('LLM_ROUTER_CONFIG', config)
  }

  async function seedIfEmpty(): Promise<void> {
    const existing = await configKV.get('LLM_ROUTER_CONFIG')
    if (!existing) {
      await configKV.set('LLM_ROUTER_CONFIG', { models: {}, defaults: {} })
    }
  }

  async function current(): Promise<any> {
    return getRouterConfig()
  }

  async function apply(input: RouterApplyInput): Promise<RouterApplyResult> {
    const existing = await getRouterConfig()
    const changes: string[] = []

    let nextConfig = input.mode === 'reset' ? { models: {}, defaults: {} } : { ...existing }

    if (input.defaults) {
      nextConfig.defaults = { ...nextConfig.defaults, ...input.defaults }
      changes.push('defaults updated')
    }

    for (const slice of input.slices) {
      if (slice.modelName) {
        changes.push(`model ${slice.modelName} ${input.mode === 'reset' ? 'added' : 'updated'}`)
      }
    }

    if (!input.dryRun) {
      await updateRouterConfig(nextConfig)
    }

    return {
      applied: !input.dryRun,
      config: nextConfig,
      changes,
    }
  }

  return { getRouterConfig, updateRouterConfig, seedIfEmpty, current, apply }
}
