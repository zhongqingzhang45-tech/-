import type { Database } from '../../../libs/db'
import type {
  CapabilityAlias,
  CapabilityAliasRoute,
  ProviderCatalogTtsModel,
  ProviderCatalogTtsVoice,
} from '../../../schemas/provider-catalog'

import { and, asc, eq } from 'drizzle-orm'

import {
  capabilityAliases,
  capabilityAliasRoutes,
  providerCatalogTtsModels,
  providerCatalogTtsVoices,
} from '../../../schemas/provider-catalog'

export interface ResolvedAliasRoute {
  id: string
  aliasId: string
  routerModelId: string
  pool: 'primary' | 'fallback'
  enabled: boolean
  weight: number
  displayOrder: number
}

export interface ResolvedAlias {
  id: string
  surface: 'llm' | 'asr' | 'tts'
  aliasId: string
  displayName: string
  enabled: boolean
  displayOrder: number
  fallbackEnabled: boolean
  loadBalancingEnabled: boolean
  routes: ResolvedAliasRoute[]
}

export interface TtsVoiceWithModel {
  voice: ProviderCatalogTtsVoice
  model: ProviderCatalogTtsModel
}

export interface SyncTtsModelsResult {
  models: Array<{ routerModelId: string; provider: string; displayName: string }>
}

export interface SyncTtsVoicesResult {
  voices: ProviderCatalogTtsVoice[]
  syncedCount: number
}

export interface ProviderCatalogService {
  resolveEnabledAlias(surface: 'llm' | 'asr', aliasId: string): Promise<ResolvedAlias>
  syncAliasesFromRouterConfig(config: any): Promise<void>
  syncTtsModelsFromRouterConfig(input: { models: Record<string, any> }): Promise<SyncTtsModelsResult>
  syncTtsVoices(input: { routerModelId: string; voices: any[] }): Promise<SyncTtsVoicesResult>
  listEnabledTtsModels(): Promise<ProviderCatalogTtsModel[]>
  listEnabledTtsVoices(routerModelId: string): Promise<ProviderCatalogTtsVoice[]>
  assertTtsVoiceEnabled(routerModelId: string, voiceId: string): Promise<void>
  assertTtsModelEnabled(routerModelId: string): Promise<void>
  getTtsVoiceWithModel(voiceId: string): Promise<TtsVoiceWithModel | null>
  listAliases(surface: 'llm' | 'asr' | 'tts'): Promise<CapabilityAlias[]>
  listAliasRoutes(aliasId: string): Promise<CapabilityAliasRoute[]>
  createAlias(input: typeof capabilityAliases.$inferInsert): Promise<CapabilityAlias>
  updateAlias(id: string, data: Partial<CapabilityAlias>): Promise<CapabilityAlias>
  deleteAlias(id: string): Promise<void>
  createAliasRoute(input: typeof capabilityAliasRoutes.$inferInsert): Promise<CapabilityAliasRoute>
  updateAliasRoute(id: string, data: Partial<CapabilityAliasRoute>): Promise<CapabilityAliasRoute>
  deleteAliasRoute(id: string): Promise<void>
  listTtsModels(): Promise<ProviderCatalogTtsModel[]>
  createTtsModel(input: typeof providerCatalogTtsModels.$inferInsert): Promise<ProviderCatalogTtsModel>
  updateTtsModel(id: string, data: Partial<ProviderCatalogTtsModel>): Promise<ProviderCatalogTtsModel>
  deleteTtsModel(id: string): Promise<void>
  listTtsVoices(ttsModelId: string): Promise<ProviderCatalogTtsVoice[]>
  createTtsVoice(input: typeof providerCatalogTtsVoices.$inferInsert): Promise<ProviderCatalogTtsVoice>
  updateTtsVoice(id: string, data: Partial<ProviderCatalogTtsVoice>): Promise<ProviderCatalogTtsVoice>
  deleteTtsVoice(id: string): Promise<void>
}

export function createProviderCatalogService(db: Database): ProviderCatalogService {
  async function resolveEnabledAlias(surface: 'llm' | 'asr', aliasId: string): Promise<ResolvedAlias> {
    const aliasRows = await db
      .select()
      .from(capabilityAliases)
      .where(and(eq(capabilityAliases.surface, surface), eq(capabilityAliases.aliasId, aliasId), eq(capabilityAliases.enabled, true)))
      .limit(1)

    if (aliasRows.length === 0) {
      throw new Error(`Alias "${aliasId}" not found or disabled for surface "${surface}"`)
    }

    const alias = aliasRows[0]
    const routes = await db
      .select()
      .from(capabilityAliasRoutes)
      .where(and(eq(capabilityAliasRoutes.aliasId, alias.id), eq(capabilityAliasRoutes.enabled, true)))
      .orderBy(asc(capabilityAliasRoutes.displayOrder))

    return {
      id: alias.id,
      surface: alias.surface as 'llm' | 'asr' | 'tts',
      aliasId: alias.aliasId,
      displayName: alias.displayName,
      enabled: alias.enabled,
      displayOrder: alias.displayOrder,
      fallbackEnabled: alias.fallbackEnabled,
      loadBalancingEnabled: alias.loadBalancingEnabled,
      routes: routes.map(r => ({
        id: r.id,
        aliasId: r.aliasId,
        routerModelId: r.routerModelId,
        pool: r.pool as 'primary' | 'fallback',
        enabled: r.enabled,
        weight: r.weight,
        displayOrder: r.displayOrder,
      })),
    }
  }

  async function syncAliasesFromRouterConfig(_config: any): Promise<void> {
  }

  async function syncTtsModelsFromRouterConfig(input: { models: Record<string, any> }): Promise<SyncTtsModelsResult> {
    const result: Array<{ routerModelId: string; provider: string; displayName: string }> = []
    for (const [routerModelId, model] of Object.entries(input.models)) {
      result.push({
        routerModelId,
        provider: model.provider ?? 'unknown',
        displayName: model.displayName ?? routerModelId,
      })
    }
    return { models: result }
  }

  async function syncTtsVoices(input: { routerModelId: string; voices: any[] }): Promise<SyncTtsVoicesResult> {
    const { routerModelId, voices } = input
    return { voices: [], syncedCount: voices.length }
  }

  async function getTtsVoiceWithModel(voiceId: string): Promise<TtsVoiceWithModel | null> {
    const rows = await db
      .select({ voice: providerCatalogTtsVoices, model: providerCatalogTtsModels })
      .from(providerCatalogTtsVoices)
      .innerJoin(providerCatalogTtsModels, eq(providerCatalogTtsVoices.ttsModelId, providerCatalogTtsModels.id))
      .where(eq(providerCatalogTtsVoices.providerVoiceId, voiceId))
      .limit(1)

    return rows[0] ?? null
  }

  async function listEnabledTtsModels(): Promise<ProviderCatalogTtsModel[]> {
    return db
      .select()
      .from(providerCatalogTtsModels)
      .where(eq(providerCatalogTtsModels.enabled, true))
      .orderBy(asc(providerCatalogTtsModels.displayOrder))
  }

  async function listEnabledTtsVoices(routerModelId: string): Promise<ProviderCatalogTtsVoice[]> {
    const modelRows = await db
      .select({ id: providerCatalogTtsModels.id })
      .from(providerCatalogTtsModels)
      .where(eq(providerCatalogTtsModels.routerModelId, routerModelId))
      .limit(1)

    if (modelRows.length === 0) return []

    return db
      .select()
      .from(providerCatalogTtsVoices)
      .where(and(eq(providerCatalogTtsVoices.ttsModelId, modelRows[0].id), eq(providerCatalogTtsVoices.enabled, true)))
      .orderBy(asc(providerCatalogTtsVoices.displayOrder))
  }

  async function assertTtsVoiceEnabled(routerModelId: string, voiceId: string): Promise<void> {
    const voices = await listEnabledTtsVoices(routerModelId)
    const found = voices.find(v => v.providerVoiceId === voiceId)
    if (!found) {
      throw new Error(`Voice "${voiceId}" not found or disabled for model "${routerModelId}"`)
    }
  }

  async function assertTtsModelEnabled(routerModelId: string): Promise<void> {
    const models = await listEnabledTtsModels()
    const found = models.find(m => m.routerModelId === routerModelId)
    if (!found) {
      throw new Error(`TTS model "${routerModelId}" not found or disabled`)
    }
  }

  async function listAliases(surface: 'llm' | 'asr' | 'tts'): Promise<CapabilityAlias[]> {
    return db
      .select()
      .from(capabilityAliases)
      .where(eq(capabilityAliases.surface, surface))
      .orderBy(asc(capabilityAliases.displayOrder))
  }

  async function listAliasRoutes(aliasId: string): Promise<CapabilityAliasRoute[]> {
    return db
      .select()
      .from(capabilityAliasRoutes)
      .where(eq(capabilityAliasRoutes.aliasId, aliasId))
      .orderBy(asc(capabilityAliasRoutes.displayOrder))
  }

  async function createAlias(input: typeof capabilityAliases.$inferInsert): Promise<CapabilityAlias> {
    const [row] = await db.insert(capabilityAliases).values(input).returning()
    return row
  }

  async function updateAlias(id: string, data: Partial<CapabilityAlias>): Promise<CapabilityAlias> {
    const [row] = await db
      .update(capabilityAliases)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(capabilityAliases.id, id))
      .returning()
    return row
  }

  async function deleteAlias(id: string): Promise<void> {
    await db.delete(capabilityAliases).where(eq(capabilityAliases.id, id))
  }

  async function createAliasRoute(input: typeof capabilityAliasRoutes.$inferInsert): Promise<CapabilityAliasRoute> {
    const [row] = await db.insert(capabilityAliasRoutes).values(input).returning()
    return row
  }

  async function updateAliasRoute(id: string, data: Partial<CapabilityAliasRoute>): Promise<CapabilityAliasRoute> {
    const [row] = await db
      .update(capabilityAliasRoutes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(capabilityAliasRoutes.id, id))
      .returning()
    return row
  }

  async function deleteAliasRoute(id: string): Promise<void> {
    await db.delete(capabilityAliasRoutes).where(eq(capabilityAliasRoutes.id, id))
  }

  async function listTtsModels(): Promise<ProviderCatalogTtsModel[]> {
    return db
      .select()
      .from(providerCatalogTtsModels)
      .orderBy(asc(providerCatalogTtsModels.displayOrder))
  }

  async function createTtsModel(input: typeof providerCatalogTtsModels.$inferInsert): Promise<ProviderCatalogTtsModel> {
    const [row] = await db.insert(providerCatalogTtsModels).values(input).returning()
    return row
  }

  async function updateTtsModel(id: string, data: Partial<ProviderCatalogTtsModel>): Promise<ProviderCatalogTtsModel> {
    const [row] = await db
      .update(providerCatalogTtsModels)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(providerCatalogTtsModels.id, id))
      .returning()
    return row
  }

  async function deleteTtsModel(id: string): Promise<void> {
    await db.delete(providerCatalogTtsModels).where(eq(providerCatalogTtsModels.id, id))
  }

  async function listTtsVoices(ttsModelId: string): Promise<ProviderCatalogTtsVoice[]> {
    return db
      .select()
      .from(providerCatalogTtsVoices)
      .where(eq(providerCatalogTtsVoices.ttsModelId, ttsModelId))
      .orderBy(asc(providerCatalogTtsVoices.displayOrder))
  }

  async function createTtsVoice(input: typeof providerCatalogTtsVoices.$inferInsert): Promise<ProviderCatalogTtsVoice> {
    const [row] = await db.insert(providerCatalogTtsVoices).values(input).returning()
    return row
  }

  async function updateTtsVoice(id: string, data: Partial<ProviderCatalogTtsVoice>): Promise<ProviderCatalogTtsVoice> {
    const [row] = await db
      .update(providerCatalogTtsVoices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(providerCatalogTtsVoices.id, id))
      .returning()
    return row
  }

  async function deleteTtsVoice(id: string): Promise<void> {
    await db.delete(providerCatalogTtsVoices).where(eq(providerCatalogTtsVoices.id, id))
  }

  return {
    resolveEnabledAlias,
    syncAliasesFromRouterConfig,
    syncTtsModelsFromRouterConfig,
    syncTtsVoices,
    listEnabledTtsModels,
    listEnabledTtsVoices,
    assertTtsVoiceEnabled,
    assertTtsModelEnabled,
    getTtsVoiceWithModel,
    listAliases,
    listAliasRoutes,
    createAlias,
    updateAlias,
    deleteAlias,
    createAliasRoute,
    updateAliasRoute,
    deleteAliasRoute,
    listTtsModels,
    createTtsModel,
    updateTtsModel,
    deleteTtsModel,
    listTtsVoices,
    createTtsVoice,
    updateTtsVoice,
    deleteTtsVoice,
  }
}
