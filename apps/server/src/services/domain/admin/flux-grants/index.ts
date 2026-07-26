import type { Database } from '../../../../libs/db'
import type { BillingService } from '../../billing/billing-service'

import { inArray } from 'drizzle-orm'

import { user } from '../../../../schemas/accounts'

export interface GrantPreview {
  totalRecipients: number
  totalFlux: number
  matchedUsers: Array<{ id: string; email: string }>
  unmatchedEmails: string[]
}

export interface GrantResult {
  summary: GrantPreview
  result: {
    granted: number
    failed: number
    errors: Array<{ email: string; error: string }>
  }
}

export interface AdminFluxGrantsService {
  preview(input: { amount: number; emails: string[] }): Promise<GrantPreview>
  grant(input: {
    amount: number
    description: string
    emails: string[]
    createdByUserId: string
    idempotencyKey?: string
  }): Promise<GrantResult>
}

export function createAdminFluxGrantsService(opts: {
  db: Database
  billingService: BillingService
}): AdminFluxGrantsService {
  const { db, billingService } = opts

  async function findUsersByEmails(emails: string[]) {
    const lowerEmails = emails.map(e => e.toLowerCase())
    const rows = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(inArray(user.email, lowerEmails))

    const matched = new Map(rows.map(r => [r.email.toLowerCase(), r]))
    const matchedUsers: Array<{ id: string; email: string }> = []
    const unmatchedEmails: string[] = []

    for (const email of emails) {
      const u = matched.get(email.toLowerCase())
      if (u) matchedUsers.push(u)
      else unmatchedEmails.push(email)
    }

    return { matchedUsers, unmatchedEmails }
  }

  async function preview(input: { amount: number; emails: string[] }): Promise<GrantPreview> {
    const { matchedUsers, unmatchedEmails } = await findUsersByEmails(input.emails)
    return {
      totalRecipients: matchedUsers.length,
      totalFlux: matchedUsers.length * input.amount,
      matchedUsers,
      unmatchedEmails,
    }
  }

  async function grant(input: {
    amount: number
    description: string
    emails: string[]
    createdByUserId: string
    idempotencyKey?: string
  }): Promise<GrantResult> {
    const { matchedUsers, unmatchedEmails } = await findUsersByEmails(input.emails)
    const errors: Array<{ email: string; error: string }> = []
    let granted = 0

    for (const u of matchedUsers) {
      try {
        await billingService.creditFlux({
          userId: u.id,
          amount: input.amount,
          description: input.description,
          requestId: input.idempotencyKey ? `${input.idempotencyKey}:${u.id}` : undefined,
          type: 'promo',
          auditMetadata: {
            source: 'admin.flux_grant',
            issued_by_user_id: input.createdByUserId,
            recipient_email: u.email,
          },
        })
        granted++
      }
      catch (err) {
        errors.push({ email: u.email, error: err instanceof Error ? err.message : String(err) })
      }
    }

    const summary: GrantPreview = {
      totalRecipients: matchedUsers.length,
      totalFlux: granted * input.amount,
      matchedUsers,
      unmatchedEmails,
    }

    return {
      summary,
      result: { granted, failed: errors.length + unmatchedEmails.length, errors },
    }
  }

  return { preview, grant }
}
