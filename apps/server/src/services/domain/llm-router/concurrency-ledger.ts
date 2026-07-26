import type Redis from 'ioredis'

export interface ConcurrencyLedger {
  acquire(userId: string, maxConcurrency: number): Promise<boolean>
  release(userId: string): Promise<void>
  current(userId: string): Promise<number>
  snapshot(): Promise<Array<{ poolId: string; inflight: number }>>
}

export function createConcurrencyLedger(redis: Redis): ConcurrencyLedger {
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

  async function snapshot(): Promise<Array<{ poolId: string; inflight: number }>> {
    const result: Array<{ poolId: string; inflight: number }> = []
    let cursor = '0'
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${keyPrefix}*`, 'COUNT', 100)
      cursor = nextCursor
      for (const key of keys) {
        const val = await redis.get(key)
        const inflight = val ? Number(val) : 0
        if (inflight > 0) {
          const poolId = key.slice(keyPrefix.length)
          result.push({ poolId, inflight })
        }
      }
    } while (cursor !== '0')
    return result
  }

  return { acquire, release, current, snapshot }
}
