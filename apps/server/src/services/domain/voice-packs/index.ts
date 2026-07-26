import type { Database } from '../../../libs/db'
import type { VoicePack } from '../../../schemas/voice-packs'

import { and, desc, eq } from 'drizzle-orm'
import { boolean, number, object, optional, pipe, string } from 'valibot'

import { voicePacks } from '../../../schemas/voice-packs'

export const CreateVoicePackInputSchema = object({
  name: pipe(string()),
  description: optional(string()),
  provider: pipe(string()),
  model: pipe(string()),
  voiceId: pipe(string()),
  upstreamVoiceId: pipe(string()),
  ttsModelId: pipe(string()),
  params: optional(object({
    pitch: optional(number()),
    volume: optional(number()),
    rate: optional(number()),
  })),
  costMultiplier: optional(number()),
  enabled: optional(boolean()),
})

export const UpdateVoicePackInputSchema = object({
  name: optional(string()),
  description: optional(string()),
  provider: optional(string()),
  model: optional(string()),
  voiceId: optional(string()),
  upstreamVoiceId: optional(string()),
  ttsModelId: optional(string()),
  params: optional(object({
    pitch: optional(number()),
    volume: optional(number()),
    rate: optional(number()),
  })),
  costMultiplier: optional(number()),
  enabled: optional(boolean()),
})

export type CreateVoicePackInput = typeof voicePacks.$inferInsert
export type UpdateVoicePackInput = Partial<VoicePack>

export interface VoicePackService {
  list(): Promise<VoicePack[]>
  listEnabled(): Promise<VoicePack[]>
  listAll(): Promise<VoicePack[]>
  findById(id: string): Promise<VoicePack | null>
  findEnabledByVoiceId(voiceId: string): Promise<VoicePack | null>
  create(input: CreateVoicePackInput): Promise<VoicePack>
  update(id: string, data: UpdateVoicePackInput): Promise<VoicePack | null>
  disable(id: string): Promise<VoicePack | null>
  delete(id: string): Promise<void>
}

export function createVoicePackService(db: Database): VoicePackService {
  async function list(): Promise<VoicePack[]> {
    return db
      .select()
      .from(voicePacks)
      .orderBy(desc(voicePacks.createdAt))
  }

  async function listEnabled(): Promise<VoicePack[]> {
    return db
      .select()
      .from(voicePacks)
      .where(eq(voicePacks.enabled, true))
      .orderBy(desc(voicePacks.createdAt))
  }

  async function listAll(): Promise<VoicePack[]> {
    return list()
  }

  async function findById(id: string): Promise<VoicePack | null> {
    const rows = await db
      .select()
      .from(voicePacks)
      .where(eq(voicePacks.id, id))
      .limit(1)
    return rows[0] ?? null
  }

  async function findEnabledByVoiceId(voiceId: string): Promise<VoicePack | null> {
    const rows = await db
      .select()
      .from(voicePacks)
      .where(and(eq(voicePacks.voiceId, voiceId), eq(voicePacks.enabled, true)))
      .limit(1)
    return rows[0] ?? null
  }

  async function create(input: CreateVoicePackInput): Promise<VoicePack> {
    const [row] = await db.insert(voicePacks).values(input).returning()
    return row
  }

  async function update(id: string, data: UpdateVoicePackInput): Promise<VoicePack | null> {
    const rows = await db
      .update(voicePacks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(voicePacks.id, id))
      .returning()
    return rows[0] ?? null
  }

  async function disable(id: string): Promise<VoicePack | null> {
    const existing = await findById(id)
    if (!existing || !existing.enabled) return null

    const rows = await db
      .update(voicePacks)
      .set({ enabled: false, updatedAt: new Date() })
      .where(eq(voicePacks.id, id))
      .returning()
    return rows[0] ?? null
  }

  async function deleteVoicePack(id: string): Promise<void> {
    await db.delete(voicePacks).where(eq(voicePacks.id, id))
  }

  return {
    list,
    listEnabled,
    listAll,
    findById,
    findEnabledByVoiceId,
    create,
    update,
    disable,
    delete: deleteVoicePack,
  }
}
