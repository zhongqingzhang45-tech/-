import type Redis from 'ioredis'
import type { Database } from '../../../libs/db'
import type { ConfigKVService } from '../../adapters/config-kv'

import { and, eq, isNull } from 'drizzle-orm'

import { userFlux } from '../../../schemas/flux'

export interface FluxService {
  getFlux(userId: string): Promise<{ userId: string, flux: number, stripeCustomerId: string | null }>
  updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void>
  deleteAllForUser(userId: string): Promise<void>
}

const FLUX_CACHE_PREFIX = 'flux:balance:'
const FLUX_CACHE_TTL_SEC = 30

export function createFluxService(
  db: Database,
  redis: Redis,
  _configKV: ConfigKVService,
): FluxService {
  function cacheKey(userId: string) {
    return `${FLUX_CACHE_PREFIX}${userId}`
  }

  async function getFlux(userId: string) {
    const cached = await redis.get(cacheKey(userId))
    if (cached) {
      try {
        return JSON.parse(cached) as { userId: string, flux: number, stripeCustomerId: string | null }
      }
      catch {
        // fall through to DB
      }
    }

    const rows = await db
      .select({ userId: userFlux.userId, flux: userFlux.flux, stripeCustomerId: userFlux.stripeCustomerId })
      .from(userFlux)
      .where(eq(userFlux.userId, userId))
      .limit(1)

    const row = rows[0]
    const result = row
      ? { userId: row.userId, flux: Number(row.flux), stripeCustomerId: row.stripeCustomerId ?? null }
      : { userId, flux: 0, stripeCustomerId: null }

    void redis.set(cacheKey(userId), JSON.stringify(result), 'EX', FLUX_CACHE_TTL_SEC).catch(() => {})

    return result
  }

  async function updateStripeCustomerId(userId: string, stripeCustomerId: string) {
    const existing = await db
      .select()
      .from(userFlux)
      .where(eq(userFlux.userId, userId))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(userFlux).values({ userId, stripeCustomerId })
    }
    else {
      await db.update(userFlux).set({ stripeCustomerId }).where(eq(userFlux.userId, userId))
    }

    void redis.del(cacheKey(userId)).catch(() => {})
  }

  async function deleteAllForUser(userId: string) {
    await db
      .update(userFlux)
      .set({ deletedAt: new Date(), stripeCustomerId: null })
      .where(and(eq(userFlux.userId, userId), isNull(userFlux.deletedAt)))

    void redis.del(cacheKey(userId)).catch(() => {})
  }

  return {
    getFlux,
    updateStripeCustomerId,
    deleteAllForUser,
  }
}
