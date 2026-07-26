import type { Database } from '../../../libs/db'

import { desc, eq } from 'drizzle-orm'

import { fluxTransaction } from '../../../schemas/flux-transaction'

export interface FluxTransactionService {
  getStats(userId: string): Promise<{
    totalCredited: number
    totalDebited: number
    currentBalance: number
  }>
  getHistory(userId: string, limit: number, offset: number): Promise<{
    records: Array<typeof fluxTransaction.$inferSelect>
    hasMore: boolean
  }>
}

export function createFluxTransactionService(db: Database): FluxTransactionService {
  async function getStats(userId: string) {
    const rows = await db
      .select({ type: fluxTransaction.type, amount: fluxTransaction.amount })
      .from(fluxTransaction)
      .where(eq(fluxTransaction.userId, userId))

    let totalCredited = 0
    let totalDebited = 0
    let currentBalance = 0

    for (const row of rows) {
      const amt = Number(row.amount)
      if (row.type === 'credit' || row.type === 'initial' || row.type === 'promo' || row.type === 'admin_set') {
        totalCredited += amt
      }
      if (row.type === 'debit') {
        totalDebited += amt
      }
    }

    const lastRow = await db
      .select({ balanceAfter: fluxTransaction.balanceAfter })
      .from(fluxTransaction)
      .where(eq(fluxTransaction.userId, userId))
      .orderBy(desc(fluxTransaction.createdAt))
      .limit(1)

    if (lastRow.length > 0) {
      currentBalance = Number(lastRow[0].balanceAfter)
    }

    return { totalCredited, totalDebited, currentBalance }
  }

  async function getHistory(userId: string, limit: number, offset: number) {
    const clampedLimit = Math.min(Math.max(limit, 1), 100)

    const records = await db
      .select()
      .from(fluxTransaction)
      .where(eq(fluxTransaction.userId, userId))
      .orderBy(desc(fluxTransaction.createdAt))
      .limit(clampedLimit + 1)
      .offset(offset)

    const hasMore = records.length > clampedLimit
    const trimmed = records.slice(0, clampedLimit) as Array<typeof fluxTransaction.$inferSelect>

    return { records: trimmed, hasMore }
  }

  return {
    getStats,
    getHistory,
  }
}
