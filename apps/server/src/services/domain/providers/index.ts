import type { Database } from '../../../libs/db'
import type { ProviderConfigCrypto } from '../../../utils/provider-config-crypto'

import { and, desc, eq, isNull } from 'drizzle-orm'

import { userProviderConfigs } from '../../../schemas/providers'

export type UserProviderConfig = typeof userProviderConfigs.$inferSelect
export type NewUserProviderConfig = typeof userProviderConfigs.$inferInsert

export interface ProviderService {
  findAll(userId: string): Promise<UserProviderConfig[]>
  findById(id: string, userId: string): Promise<UserProviderConfig | null>
  findUserConfigsByOwnerId(ownerId: string): Promise<UserProviderConfig[]>
  findUserConfigById(id: string): Promise<UserProviderConfig | null>
  createUserConfig(input: NewUserProviderConfig): Promise<UserProviderConfig>
  updateUserConfig(id: string, data: Partial<UserProviderConfig>): Promise<UserProviderConfig>
  deleteUserConfig(id: string): Promise<void>
  deleteAllForUser(userId: string): Promise<void>
}

interface CreateProviderServiceOptions {
  db: Database
  configCrypto: ProviderConfigCrypto | null
}

export function createProviderService(options: CreateProviderServiceOptions): ProviderService {
  const { db, configCrypto } = options

  function decryptConfigRow(row: UserProviderConfig): UserProviderConfig {
    if (!configCrypto || !row.config || typeof row.config !== 'object')
      return row

    const decrypted = configCrypto.decryptIfNeeded(
      row.config as Record<string, unknown>,
      row.id,
      row.ownerId,
    )
    return { ...row, config: decrypted as UserProviderConfig['config'] }
  }

  function encryptConfigForCreate(input: NewUserProviderConfig): NewUserProviderConfig {
    if (!configCrypto || !input.config || typeof input.config !== 'object' || !input.id || !input.ownerId)
      return input

    const encrypted = configCrypto.encryptConfig(
      input.config as Record<string, unknown>,
      input.id,
      input.ownerId,
    )
    return { ...input, config: encrypted as NewUserProviderConfig['config'] }
  }

  async function findAll(userId: string): Promise<UserProviderConfig[]> {
    return findUserConfigsByOwnerId(userId)
  }

  async function findById(id: string, userId: string): Promise<UserProviderConfig | null> {
    const rows = await db
      .select()
      .from(userProviderConfigs)
      .where(and(eq(userProviderConfigs.id, id), eq(userProviderConfigs.ownerId, userId), isNull(userProviderConfigs.deletedAt)))
      .limit(1)
    const row = rows[0]
    return row ? decryptConfigRow(row) : null
  }

  async function findUserConfigsByOwnerId(ownerId: string): Promise<UserProviderConfig[]> {
    const rows = await db
      .select()
      .from(userProviderConfigs)
      .where(and(eq(userProviderConfigs.ownerId, ownerId), isNull(userProviderConfigs.deletedAt)))
      .orderBy(desc(userProviderConfigs.createdAt))
    return rows.map(decryptConfigRow)
  }

  async function findUserConfigById(id: string): Promise<UserProviderConfig | null> {
    const rows = await db
      .select()
      .from(userProviderConfigs)
      .where(and(eq(userProviderConfigs.id, id), isNull(userProviderConfigs.deletedAt)))
      .limit(1)
    const row = rows[0]
    return row ? decryptConfigRow(row) : null
  }

  async function createUserConfig(input: NewUserProviderConfig): Promise<UserProviderConfig> {
    const encrypted = encryptConfigForCreate(input)
    const [row] = await db.insert(userProviderConfigs).values(encrypted).returning()
    return decryptConfigRow(row)
  }

  async function updateUserConfig(id: string, data: Partial<UserProviderConfig>): Promise<UserProviderConfig> {
    let updateData = { ...data, updatedAt: new Date() } as Partial<UserProviderConfig>

    if (configCrypto && data.config && typeof data.config === 'object') {
      const existing = await findUserConfigById(id)
      if (existing) {
        const encrypted = configCrypto.encryptConfig(
          data.config as Record<string, unknown>,
          id,
          existing.ownerId,
        )
        updateData = { ...updateData, config: encrypted as UserProviderConfig['config'] }
      }
    }

    const [row] = await db
      .update(userProviderConfigs)
      .set(updateData)
      .where(eq(userProviderConfigs.id, id))
      .returning()
    return decryptConfigRow(row)
  }

  async function deleteUserConfig(id: string): Promise<void> {
    await db
      .update(userProviderConfigs)
      .set({ deletedAt: new Date() })
      .where(eq(userProviderConfigs.id, id))
  }

  async function deleteAllForUser(userId: string): Promise<void> {
    await db
      .update(userProviderConfigs)
      .set({ deletedAt: new Date() })
      .where(and(eq(userProviderConfigs.ownerId, userId), isNull(userProviderConfigs.deletedAt)))
  }

  return {
    findAll,
    findById,
    findUserConfigsByOwnerId,
    findUserConfigById,
    createUserConfig,
    updateUserConfig,
    deleteUserConfig,
    deleteAllForUser,
  }
}
