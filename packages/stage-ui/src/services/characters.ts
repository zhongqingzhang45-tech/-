import type { StageApiClient } from '../composables/api'
import type { Character, CreateCharacterPayload, UpdateCharacterPayload } from '../types/character'

import { nanoid } from 'nanoid'

import { authedFetch } from '../libs/auth-fetch'
import { SERVER_URL } from '../libs/server'

/**
 * Client used to reach the `/api/v1/characters` REST surface.
 *
 * Mirrors {@link InferenceServiceProvidersRemoteClient}: the Hono RPC client
 * type stays loose because `AppType` from `apps/server` may not be inferrable
 * when the server build is absent. Services always issue plain `fetch`
 * requests against `SERVER_URL` so runtime behavior is decoupled from the
 * inferred client shape.
 */
export type CharactersRemoteClient = StageApiClient

/**
 * Read/query options accepted by remote character operations.
 */
export interface RemoteCharacterOptions {
  /** When `true`, list all characters regardless of ownership. */
  all?: boolean
  /** Cancels the operation before the request is dispatched. */
  abortSignal?: AbortSignal
}

/**
 * Boundary between the characters store and the `/api/v1/characters` REST
 * surface. Local-first optimistic UI is supported via `buildLocal`; remote
 * mutations are translated into HTTP verbs against the character routes.
 */
export interface CharactersService {
  buildLocal: (userId: string, payload: CreateCharacterPayload) => Character
  fetchRemote: (client: CharactersRemoteClient, options: RemoteCharacterOptions, request: RemoteCharacterOptions) => Promise<Character[]>
  fetchRemoteById: (client: CharactersRemoteClient, characterId: string) => Promise<Character>
  createRemote: (client: CharactersRemoteClient, payload: CreateCharacterPayload) => Promise<Character>
  updateRemote: (client: CharactersRemoteClient, characterId: string, payload: UpdateCharacterPayload) => Promise<Character>
  removeRemote: (client: CharactersRemoteClient, characterId: string) => Promise<void>
  likeRemote: (client: CharactersRemoteClient, characterId: string) => Promise<Character>
  bookmarkRemote: (client: CharactersRemoteClient, characterId: string) => Promise<Character>
}

function charactersEndpoint(): string {
  return `${SERVER_URL}/api/v1/characters`
}

function characterEndpoint(characterId: string): string {
  return `${charactersEndpoint()}/${encodeURIComponent(characterId)}`
}

function characterActionEndpoint(characterId: string, action: 'like' | 'bookmark'): string {
  return `${characterEndpoint(characterId)}/${action}`
}

async function readJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    throw new Error(`Character API request failed: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

/**
 * Coerces an unknown server payload into the local `Character` shape.
 *
 * The server returns dates as ISO strings; the valibot schema in
 * `types/character` already transforms them via `pipe(transform(...))`, but
 * direct fetch responses bypass that pipeline, so we normalize here.
 */
function toCharacter(row: Record<string, unknown>): Character {
  return row as unknown as Character
}

export const charactersService: CharactersService = {
  buildLocal(userId, payload) {
    const now = new Date()
    const characterId = payload.character.characterId
    return {
      id: nanoid(),
      version: payload.character.version,
      coverUrl: payload.character.coverUrl,
      avatarUrl: undefined,
      characterAvatarUrl: undefined,
      coverBackgroundUrl: undefined,
      creatorRole: undefined,
      priceCredit: '0',
      likesCount: 0,
      bookmarksCount: 0,
      interactionsCount: 0,
      forksCount: 0,
      creatorId: userId,
      ownerId: userId,
      characterId,
      createdAt: now,
      updatedAt: now,
      deletedAt: undefined,
      // Life: payload 里的 capabilities/avatarModels/i18n/prompts 是 Create* 形状
      // （无 id/characterId），转成 Character 关系形状时补上 id 和 characterId
      capabilities: payload.capabilities?.map(c => ({ ...c, id: nanoid(), characterId })),
      avatarModels: payload.avatarModels?.map(m => ({ ...m, id: nanoid(), characterId, createdAt: now, updatedAt: now })),
      i18n: payload.i18n?.map(i => ({ ...i, id: nanoid(), characterId, createdAt: now, updatedAt: now })),
      prompts: payload.prompts?.map(p => ({ ...p, id: nanoid(), characterId })),
      likes: [],
      bookmarks: [],
    }
  },

  async fetchRemote(_client, options, request) {
    // NOTICE: The store calls fetchRemote with the second argument carrying
    // `{ all }` and the third carrying `{ abortSignal }`. We accept both
    // shapes so callers can pass either form without breaking.
    const all = options?.all ?? request?.all ?? false
    const abortSignal = request?.abortSignal ?? options?.abortSignal
    abortSignal?.throwIfAborted()

    const url = new URL(charactersEndpoint())
    if (all)
      url.searchParams.set('all', 'true')

    const response = await authedFetch(url.toString(), { signal: abortSignal })
    const payload = await readJson(response) as Character[] | Record<string, unknown>[]
    abortSignal?.throwIfAborted()

    return Array.isArray(payload)
      ? payload.map(row => toCharacter(row as Record<string, unknown>))
      : []
  },

  async fetchRemoteById(_client, characterId) {
    const response = await authedFetch(characterEndpoint(characterId))
    const payload = await readJson(response) as Record<string, unknown>
    return toCharacter(payload)
  },

  async createRemote(_client, payload) {
    const response = await authedFetch(charactersEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const created = await readJson(response) as Record<string, unknown>
    return toCharacter(created)
  },

  async updateRemote(_client, characterId, payload) {
    const response = await authedFetch(characterEndpoint(characterId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const updated = await readJson(response) as Record<string, unknown>
    return toCharacter(updated)
  },

  async removeRemote(_client, characterId) {
    const response = await authedFetch(characterEndpoint(characterId), { method: 'DELETE' })
    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to delete character ${characterId}: ${response.status} ${response.statusText}`)
    }
  },

  async likeRemote(_client, characterId) {
    const response = await authedFetch(characterActionEndpoint(characterId, 'like'), { method: 'POST' })
    const payload = await readJson(response) as Record<string, unknown>
    return toCharacter(payload)
  },

  async bookmarkRemote(_client, characterId) {
    const response = await authedFetch(characterActionEndpoint(characterId, 'bookmark'), { method: 'POST' })
    const payload = await readJson(response) as Record<string, unknown>
    return toCharacter(payload)
  },
}
