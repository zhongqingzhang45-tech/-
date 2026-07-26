import type { Database } from '../../../libs/db'
import type * as schema from '../../../schemas/characters'

import { and, desc, eq, isNull } from 'drizzle-orm'

import { character } from '../../../schemas/characters'

export type Character = typeof schema.character.$inferSelect

export interface CreateCharacterInput {
  character: typeof schema.character.$inferInsert
}

export interface CharacterService {
  findAll(): Promise<Character[]>
  findByOwnerId(ownerId: string): Promise<Character[]>
  findById(id: string): Promise<Character | null>
  create(input: CreateCharacterInput): Promise<Character>
  update(id: string, data: Partial<Character>): Promise<Character>
  delete(id: string): Promise<void>
  like(userId: string, id: string): Promise<{ liked: boolean }>
  bookmark(userId: string, id: string): Promise<{ bookmarked: boolean }>
  deleteAllForUser(userId: string): Promise<void>
}

export function createCharacterService(db: Database, _engagementMetrics?: any): CharacterService {
  async function findAll(): Promise<Character[]> {
    return db
      .select()
      .from(character)
      .where(isNull(character.deletedAt))
      .orderBy(desc(character.createdAt))
  }

  async function findByOwnerId(ownerId: string): Promise<Character[]> {
    return db
      .select()
      .from(character)
      .where(and(eq(character.ownerId, ownerId), isNull(character.deletedAt)))
      .orderBy(desc(character.createdAt))
  }

  async function findById(id: string): Promise<Character | null> {
    const rows = await db
      .select()
      .from(character)
      .where(and(eq(character.id, id), isNull(character.deletedAt)))
      .limit(1)
    return rows[0] ?? null
  }

  async function create(input: CreateCharacterInput): Promise<Character> {
    const [row] = await db.insert(character).values(input.character).returning()
    return row
  }

  async function update(id: string, data: Partial<Character>): Promise<Character> {
    const [row] = await db
      .update(character)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(character.id, id))
      .returning()
    return row
  }

  async function deleteCharacter(id: string): Promise<void> {
    await db
      .update(character)
      .set({ deletedAt: new Date() })
      .where(eq(character.id, id))
  }

  async function like(_userId: string, _id: string): Promise<{ liked: boolean }> {
    return { liked: false }
  }

  async function bookmark(_userId: string, _id: string): Promise<{ bookmarked: boolean }> {
    return { bookmarked: false }
  }

  async function deleteAllForUser(userId: string): Promise<void> {
    await db
      .update(character)
      .set({ deletedAt: new Date() })
      .where(and(eq(character.ownerId, userId), isNull(character.deletedAt)))
  }

  return {
    findAll,
    findByOwnerId,
    findById,
    create,
    update,
    delete: deleteCharacter,
    like,
    bookmark,
    deleteAllForUser,
  }
}
