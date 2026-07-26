import type { InferenceServiceProvider, InferenceServiceProviders, InferenceServiceProviderModelOptions } from '../models/inference-service-providers'
import type { ProviderDefinition } from '../libs/providers/types'
import type { StageApiClient } from '../composables/api'

import { nanoid } from 'nanoid'

import { authedFetch } from '../libs/auth-fetch'
import { getDefinedProvider, listProviders } from '../libs/providers/providers'
import { SERVER_URL } from '../libs/server'

/**
 * Client used to reach the `/api/v1/providers` REST surface.
 *
 * The Hono RPC client shape depends on `AppType` from `apps/server`, which
 * stays optional at type-check time when the server build is unavailable.
 * Services therefore accept the loose client type for store wiring but
 * always issue plain `fetch` calls against `SERVER_URL` so runtime behavior
 * does not rely on the inferred client methods.
 */
export type InferenceServiceProvidersRemoteClient = StageApiClient

/**
 * Options forwarded to `PATCH /api/v1/providers/:id`.
 */
export interface PatchConfigParams {
  /** Whether the patched config should be marked as validated. */
  validated: boolean
  /** Whether validation was intentionally bypassed for this patch. */
  validationBypassed: boolean
}

/**
 * Read/query options accepted by remote provider operations.
 */
export interface RemoteProviderOptions extends InferenceServiceProviderModelOptions {}

/**
 * Boundary between the provider-catalog store and the `/api/v1/providers`
 * REST surface. Local-first behaviour (definitions, buildLocal) is owned
 * here so stores stay agnostic of the wire shape.
 */
export interface InferenceServiceProvidersService {
  getDefinition: (definitionId: string) => ProviderDefinition | undefined
  listDefinitions: () => ProviderDefinition[]
  buildLocal: (definitionId: string, initialConfig: Record<string, unknown>) => InferenceServiceProvider
  fetchRemote: (client: InferenceServiceProvidersRemoteClient, options: RemoteProviderOptions) => Promise<InferenceServiceProviders>
  createRemote: (client: InferenceServiceProvidersRemoteClient, provider: InferenceServiceProvider) => Promise<InferenceServiceProvider>
  deleteRemote: (client: InferenceServiceProvidersRemoteClient, providerId: string) => Promise<void>
  patchConfigRemote: (
    client: InferenceServiceProvidersRemoteClient,
    providerId: string,
    config: Record<string, unknown>,
    options: PatchConfigParams,
  ) => Promise<InferenceServiceProvider>
}

function providersEndpoint(): string {
  return `${SERVER_URL}/api/v1/providers`
}

function providerEndpoint(providerId: string): string {
  return `${providersEndpoint()}/${encodeURIComponent(providerId)}`
}

/**
 * Normalizes a remote provider row into the store-facing shape.
 *
 * The server stores `config` as JSONB; we keep it loosely typed as
 * `Record<string, unknown>` so the UI can render provider-specific fields
 * without reserializing at every boundary.
 */
function toProvider(row: Record<string, unknown>): InferenceServiceProvider {
  return {
    id: String(row.id ?? ''),
    definitionId: String(row.definitionId ?? ''),
    name: String(row.name ?? ''),
    config: (row.config as Record<string, unknown>) ?? {},
    validated: Boolean(row.validated),
    validationBypassed: Boolean(row.validationBypassed),
  }
}

async function readJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    throw new Error(`Provider API request failed: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

export const inferenceServiceProvidersService: InferenceServiceProvidersService = {
  getDefinition: id => getDefinedProvider(id),
  listDefinitions: () => listProviders(),

  buildLocal(definitionId, initialConfig) {
    const definition = getDefinedProvider(definitionId)
    return {
      id: nanoid(),
      definitionId,
      name: definition?.name ?? definitionId,
      config: { ...initialConfig },
      validated: false,
      validationBypassed: false,
    }
  },

  async fetchRemote(_client, options) {
    options?.abortSignal?.throwIfAborted()
    const response = await authedFetch(providersEndpoint(), { signal: options?.abortSignal })
    const payload = await readJson(response) as InferenceServiceProvider[] | Record<string, InferenceServiceProvider>
    options?.abortSignal?.throwIfAborted()

    // NOTICE: The server returns an array of provider rows; we index them by
    // `id` to match the local-first `Record<string, InferenceServiceProvider>`
    // shape consumed by the store. Legacy responses that already return a
    // keyed object are passed through unchanged.
    if (Array.isArray(payload)) {
      const indexed: InferenceServiceProviders = {}
      for (const row of payload) {
        const provider = toProvider(row as unknown as Record<string, unknown>)
        if (provider.id)
          indexed[provider.id] = provider
      }
      return indexed
    }

    return payload
  },

  async createRemote(_client, provider) {
    const response = await authedFetch(providersEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: provider.id,
        definitionId: provider.definitionId,
        name: provider.name,
        config: provider.config,
        validated: provider.validated,
        validationBypassed: provider.validationBypassed,
      }),
    })
    const payload = await readJson(response) as Record<string, unknown>
    return toProvider(payload)
  },

  async deleteRemote(_client, providerId) {
    const response = await authedFetch(providerEndpoint(providerId), { method: 'DELETE' })
    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to delete provider ${providerId}: ${response.status} ${response.statusText}`)
    }
  },

  async patchConfigRemote(_client, providerId, config, options) {
    const response = await authedFetch(providerEndpoint(providerId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config,
        validated: options.validated,
        validationBypassed: options.validationBypassed,
      }),
    })
    const payload = await readJson(response) as Record<string, unknown>
    return toProvider(payload)
  },
}
