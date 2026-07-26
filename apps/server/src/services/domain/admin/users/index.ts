import type { Database } from '../../../../libs/db'
import type { BillingService } from '../../billing/billing-service'

import { eq } from 'drizzle-orm'

import { user } from '../../../../schemas/accounts'

export interface SetBalanceInput {
  userId?: string
  email?: string
  balance: number
  description: string
  issuedByUserId: string
}

export interface SetBalanceResult {
  userId: string
  balanceBefore: number
  balanceAfter: number
}

export interface AdminUsersService {
  setBalance(input: SetBalanceInput): Promise<SetBalanceResult>
}

export function createAdminUsersService(opts: {
  db: Database
  billingService: BillingService
}): AdminUsersService {
  const { db, billingService } = opts

  async function resolveUserId(selector: { userId?: string, email?: string }): Promise<string> {
    if (selector.userId) return selector.userId

    if (selector.email) {
      const rows = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, selector.email))
        .limit(1)

      if (rows.length === 0) {
        throw new Error(`User not found: email=${selector.email}`)
      }
      return rows[0].id
    }

    throw new Error('Must provide userId or email')
  }

  async function setBalance(input: SetBalanceInput): Promise<SetBalanceResult> {
    const userId = await resolveUserId({ userId: input.userId, email: input.email })

    const result = await billingService.setFlux({
      userId,
      balance: input.balance,
      description: input.description,
      issuedByUserId: input.issuedByUserId,
    })

    return {
      userId,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
    }
  }

  return { setBalance }
}
