import type Redis from 'ioredis'
import type { Database } from '../../../libs/db'
import type { RevenueMetrics } from '../../../otel'
import type { ConfigKVService } from '../../adapters/config-kv'

import { and, eq } from 'drizzle-orm'

import { fluxTransaction } from '../../../schemas/flux-transaction'
import { userFlux } from '../../../schemas/flux'

export interface CreditFluxInput {
  userId: string
  amount: number
  description: string
  requestId?: string
  source?: string
  type?: 'credit' | 'initial' | 'promo' | 'admin_set'
  auditMetadata?: Record<string, unknown>
}

export interface DebitFluxInput {
  userId: string
  amount: number
  description: string
  requestId?: string
  model?: string
  promptTokens?: number
  completionTokens?: number
}

export interface CreditFromCheckoutInput {
  stripeEventId: string
  userId: string
  stripeSessionId: string
  amountTotal: number | null
  currency: string | null
  fluxAmount: number
}

export interface CreditFromInvoiceInput {
  stripeEventId: string
  userId: string
  stripeInvoiceId: string
  stripeSubscriptionId?: string
  amountPaid: number | null
  currency: string | null
  fluxAmount: number
}

export interface ConsumeFluxForLLMInput {
  userId: string
  amount: number
  requestId: string
  description: string
  model?: string
  promptTokens?: number
  completionTokens?: number
}

export interface SetFluxInput {
  userId: string
  balance: number
  description: string
  issuedByUserId: string
}

export interface BillingService {
  creditFlux(input: CreditFluxInput): Promise<{
    balanceBefore: number
    balanceAfter: number
    transactionId: string
  }>
  debitFlux(input: DebitFluxInput): Promise<{
    balanceBefore: number
    balanceAfter: number
    transactionId: string
  }>
  creditFluxFromStripeCheckout(input: CreditFromCheckoutInput): Promise<{
    applied: boolean
    balanceAfter: number
  }>
  creditFluxFromInvoice(input: CreditFromInvoiceInput): Promise<{
    applied: boolean
    balanceAfter: number
  }>
  consumeFluxForLLM(input: ConsumeFluxForLLMInput): Promise<{
    requested: number
    charged: number
  }>
  setFlux(input: SetFluxInput): Promise<{
    balanceBefore: number
    balanceAfter: number
  }>
}

export function createBillingService(
  db: Database,
  _redis: Redis,
  _configKV: ConfigKVService,
  _metrics?: RevenueMetrics | null,
): BillingService {
  async function getCurrentBalance(userId: string): Promise<number> {
    const rows = await db
      .select({ flux: userFlux.flux })
      .from(userFlux)
      .where(eq(userFlux.userId, userId))
      .limit(1)

    return rows[0] ? Number(rows[0].flux) : 0
  }

  async function upsertFlux(userId: string, newBalance: number): Promise<void> {
    const existing = await db
      .select()
      .from(userFlux)
      .where(eq(userFlux.userId, userId))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(userFlux).values({ userId, flux: newBalance })
    }
    else {
      await db.update(userFlux).set({ flux: newBalance }).where(eq(userFlux.userId, userId))
    }
  }

  async function creditFlux(input: CreditFluxInput) {
    const txType = input.type ?? 'credit'

    const balanceBefore = await getCurrentBalance(input.userId)
    const balanceAfter = balanceBefore + input.amount

    await upsertFlux(input.userId, balanceAfter)

    const [tx] = await db
      .insert(fluxTransaction)
      .values({
        userId: input.userId,
        type: txType,
        amount: input.amount,
        balanceBefore,
        balanceAfter,
        requestId: input.requestId,
        description: input.description,
        metadata: input.auditMetadata ?? (input.source ? { source: input.source } : undefined),
      })
      .returning()

    return { balanceBefore, balanceAfter, transactionId: tx.id }
  }

  async function debitFlux(input: DebitFluxInput) {
    const balanceBefore = await getCurrentBalance(input.userId)
    const actualAmount = Math.min(input.amount, balanceBefore)
    const balanceAfter = balanceBefore - actualAmount

    if (actualAmount <= 0) {
      return { balanceBefore, balanceAfter: balanceBefore, transactionId: '' }
    }

    await upsertFlux(input.userId, balanceAfter)

    const [tx] = await db
      .insert(fluxTransaction)
      .values({
        userId: input.userId,
        type: 'debit',
        amount: actualAmount,
        balanceBefore,
        balanceAfter,
        requestId: input.requestId,
        description: input.description,
        metadata: input.model
          ? {
              model: input.model,
              promptTokens: input.promptTokens ?? null,
              completionTokens: input.completionTokens ?? null,
            }
          : undefined,
      })
      .returning()

    return { balanceBefore, balanceAfter, transactionId: tx.id }
  }

  async function creditFluxFromStripeCheckout(input: CreditFromCheckoutInput) {
    const idempotencyKey = `stripe-checkout:${input.stripeEventId}`

    const existing = await db
      .select()
      .from(fluxTransaction)
      .where(and(eq(fluxTransaction.userId, input.userId), eq(fluxTransaction.requestId, idempotencyKey)))
      .limit(1)

    if (existing.length > 0) {
      const balanceAfter = Number(existing[0].balanceAfter)
      return { applied: false, balanceAfter }
    }

    const result = await creditFlux({
      userId: input.userId,
      amount: input.fluxAmount,
      description: 'Stripe one-time purchase',
      requestId: idempotencyKey,
      type: 'credit',
      auditMetadata: {
        source: 'stripe.checkout',
        stripe_session_id: input.stripeSessionId,
        amount_total: input.amountTotal,
        currency: input.currency,
      },
    })

    return { applied: true, balanceAfter: result.balanceAfter }
  }

  async function creditFluxFromInvoice(input: CreditFromInvoiceInput) {
    const idempotencyKey = `stripe-invoice:${input.stripeInvoiceId}`

    const existing = await db
      .select()
      .from(fluxTransaction)
      .where(and(eq(fluxTransaction.userId, input.userId), eq(fluxTransaction.requestId, idempotencyKey)))
      .limit(1)

    if (existing.length > 0) {
      const balanceAfter = Number(existing[0].balanceAfter)
      return { applied: false, balanceAfter }
    }

    const result = await creditFlux({
      userId: input.userId,
      amount: input.fluxAmount,
      description: 'Stripe subscription invoice',
      requestId: idempotencyKey,
      type: 'credit',
      auditMetadata: {
        source: 'stripe.invoice',
        stripe_invoice_id: input.stripeInvoiceId,
        stripe_subscription_id: input.stripeSubscriptionId ?? null,
        amount_paid: input.amountPaid,
        currency: input.currency,
      },
    })

    return { applied: true, balanceAfter: result.balanceAfter }
  }

  async function consumeFluxForLLM(input: ConsumeFluxForLLMInput) {
    const result = await debitFlux({
      userId: input.userId,
      amount: input.amount,
      description: input.description,
      requestId: input.requestId,
      model: input.model,
      promptTokens: input.promptTokens,
      completionTokens: input.completionTokens,
    })

    return {
      requested: input.amount,
      charged: result.balanceBefore - result.balanceAfter,
    }
  }

  async function setFlux(input: SetFluxInput) {
    const balanceBefore = await getCurrentBalance(input.userId)
    const balanceAfter = Math.max(0, input.balance)
    const diff = balanceAfter - balanceBefore

    await upsertFlux(input.userId, balanceAfter)

    const [tx] = await db
      .insert(fluxTransaction)
      .values({
        userId: input.userId,
        type: diff >= 0 ? 'credit' : 'debit',
        amount: Math.abs(diff),
        balanceBefore,
        balanceAfter,
        description: input.description,
        metadata: {
          source: 'admin.set_flux',
          issued_by_user_id: input.issuedByUserId,
        },
      })
      .returning()

    void tx

    return { balanceBefore, balanceAfter }
  }

  return {
    creditFlux,
    debitFlux,
    creditFluxFromStripeCheckout,
    creditFluxFromInvoice,
    consumeFluxForLLM,
    setFlux,
  }
}
