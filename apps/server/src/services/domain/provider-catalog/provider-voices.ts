import type { ProviderCatalogTtsVoice } from '../../../schemas/provider-catalog'

export interface CatalogVoiceResponse {
  id: string
  name: string
  description: string | null
  labels: Record<string, string>
  tags: string[]
  languages: Array<{ code: string; title?: string }>
  previewAudioUrl?: string | null
}

export function catalogVoiceResponse(voice: ProviderCatalogTtsVoice): CatalogVoiceResponse {
  let languages: Array<{ code: string; title?: string }> = []
  try {
    if (voice.languages && typeof voice.languages === 'object' && Array.isArray(voice.languages)) {
      languages = voice.languages as Array<{ code: string; title?: string }>
    }
  }
  catch {
    // ignore parse errors
  }

  let labels: Record<string, string> = {}
  try {
    if (voice.labels && typeof voice.labels === 'object') {
      labels = voice.labels as Record<string, string>
    }
  }
  catch {
    // ignore parse errors
  }

  return {
    id: voice.providerVoiceId,
    name: voice.displayName,
    description: voice.description ?? null,
    labels,
    tags: [],
    languages,
    previewAudioUrl: voice.previewAudioUrl ?? null,
  }
}

export function normalizeProviderVoiceForCatalog(voice: any): ProviderCatalogTtsVoice | null {
  if (!voice || !voice.id) return null

  return {
    id: '',
    ttsModelId: '',
    providerVoiceId: voice.id,
    displayName: voice.name ?? voice.id,
    description: voice.description ?? null,
    enabled: true,
    displayOrder: 0,
    languages: voice.languages ?? [],
    labels: voice.labels ?? {},
    previewAudioUrl: voice.previewAudioUrl ?? null,
    source: 'provider-sync',
    lastSyncedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as ProviderCatalogTtsVoice
}
