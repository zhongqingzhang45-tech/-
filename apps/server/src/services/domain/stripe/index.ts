import type { Database } from '../../../libs/db'
import type { NewStripeCheckoutSession, NewStripeCustomer, NewStripeInvoice, NewStripeSubscription, StripeCheckoutSession, StripeCustomer, StripeInvoice, StripeSubscription } from '../../../schemas/stripe'

import { and, desc, eq, isNull } from 'drizzle-orm'

import { stripeCheckoutSession, stripeCustomer, stripeInvoice, stripeSubscription } from '../../../schemas/stripe'

export interface UpsertStripeCustomerInput extends Omit<NewStripeCustomer, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}
export interface UpsertCheckoutSessionInput extends Omit<NewStripeCheckoutSession, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}
export interface UpsertSubscriptionInput extends Omit<NewStripeSubscription, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}
export interface UpsertInvoiceInput extends Omit<NewStripeInvoice, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

export interface StripeService {
  upsertCustomer(data: UpsertStripeCustomerInput): Promise<StripeCustomer>
  getCustomerByUserId(userId: string): Promise<StripeCustomer | undefined>
  getCustomerByStripeId(stripeCustomerId: string): Promise<StripeCustomer | undefined>

  upsertCheckoutSession(data: UpsertCheckoutSessionInput): Promise<StripeCheckoutSession>
  getCheckoutSessionsByUserId(userId: string): Promise<StripeCheckoutSession[]>

  upsertSubscription(data: UpsertSubscriptionInput): Promise<StripeSubscription>
  getActiveSubscription(userId: string): Promise<StripeSubscription | undefined>

  upsertInvoice(data: UpsertInvoiceInput): Promise<StripeInvoice>
  getInvoicesByUserId(userId: string): Promise<StripeInvoice[]>

  deleteAllForUser(userId: string): Promise<void>
}

export function createStripeService(db: Database, _stripeClient: unknown | null): StripeService {
  async function upsertCustomer(data: UpsertStripeCustomerInput): Promise<StripeCustomer> {
    const existing = await db
      .select()
      .from(stripeCustomer)
      .where(eq(stripeCustomer.stripeCustomerId, data.stripeCustomerId))
      .limit(1)

    if (existing.length > 0) {
      const [updated] = await db
        .update(stripeCustomer)
        .set({ email: data.email, name: data.name })
        .where(eq(stripeCustomer.stripeCustomerId, data.stripeCustomerId))
        .returning()
      return updated
    }

    const [inserted] = await db
      .insert(stripeCustomer)
      .values(data)
      .returning()
    return inserted
  }

  async function getCustomerByUserId(userId: string) {
    const rows = await db
      .select()
      .from(stripeCustomer)
      .where(and(eq(stripeCustomer.userId, userId), isNull(stripeCustomer.deletedAt)))
      .limit(1)
    return rows[0]
  }

  async function getCustomerByStripeId(stripeCustomerId: string) {
    const rows = await db
      .select()
      .from(stripeCustomer)
      .where(and(eq(stripeCustomer.stripeCustomerId, stripeCustomerId), isNull(stripeCustomer.deletedAt)))
      .limit(1)
    return rows[0]
  }

  async function upsertCheckoutSession(data: UpsertCheckoutSessionInput): Promise<StripeCheckoutSession> {
    const existing = await db
      .select()
      .from(stripeCheckoutSession)
      .where(eq(stripeCheckoutSession.stripeSessionId, data.stripeSessionId))
      .limit(1)

    if (existing.length > 0) {
      const [updated] = await db
        .update(stripeCheckoutSession)
        .set({
          status: data.status,
          paymentStatus: data.paymentStatus,
          amountTotal: data.amountTotal,
          currency: data.currency,
          stripePaymentIntentId: data.stripePaymentIntentId,
          stripeSubscriptionId: data.stripeSubscriptionId,
          fluxCredited: data.fluxCredited,
          metadata: data.metadata,
        })
        .where(eq(stripeCheckoutSession.stripeSessionId, data.stripeSessionId))
        .returning()
      return updated
    }

    const [inserted] = await db
      .insert(stripeCheckoutSession)
      .values(data)
      .returning()
    return inserted
  }

  async function getCheckoutSessionsByUserId(userId: string) {
    return db
      .select()
      .from(stripeCheckoutSession)
      .where(and(eq(stripeCheckoutSession.userId, userId), isNull(stripeCheckoutSession.deletedAt)))
      .orderBy(desc(stripeCheckoutSession.createdAt))
  }

  async function upsertSubscription(data: UpsertSubscriptionInput): Promise<StripeSubscription> {
    const existing = await db
      .select()
      .from(stripeSubscription)
      .where(eq(stripeSubscription.stripeSubscriptionId, data.stripeSubscriptionId))
      .limit(1)

    if (existing.length > 0) {
      const [updated] = await db
        .update(stripeSubscription)
        .set({
          status: data.status,
          stripePriceId: data.stripePriceId,
          currentPeriodStart: data.currentPeriodStart,
          currentPeriodEnd: data.currentPeriodEnd,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd,
          canceledAt: data.canceledAt,
          endedAt: data.endedAt,
          metadata: data.metadata,
        })
        .where(eq(stripeSubscription.stripeSubscriptionId, data.stripeSubscriptionId))
        .returning()
      return updated
    }

    const [inserted] = await db
      .insert(stripeSubscription)
      .values(data)
      .returning()
    return inserted
  }

  async function getActiveSubscription(userId: string) {
    const rows = await db
      .select()
      .from(stripeSubscription)
      .where(
        and(
          eq(stripeSubscription.userId, userId),
          eq(stripeSubscription.status, 'active'),
          isNull(stripeSubscription.deletedAt),
        ),
      )
      .limit(1)
    return rows[0]
  }

  async function upsertInvoice(data: UpsertInvoiceInput): Promise<StripeInvoice> {
    const existing = await db
      .select()
      .from(stripeInvoice)
      .where(eq(stripeInvoice.stripeInvoiceId, data.stripeInvoiceId))
      .limit(1)

    if (existing.length > 0) {
      const [updated] = await db
        .update(stripeInvoice)
        .set({
          status: data.status,
          amountDue: data.amountDue,
          amountPaid: data.amountPaid,
          currency: data.currency,
          invoiceUrl: data.invoiceUrl,
          invoicePdf: data.invoicePdf,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          paidAt: data.paidAt,
          fluxCredited: data.fluxCredited,
          metadata: data.metadata,
        })
        .where(eq(stripeInvoice.stripeInvoiceId, data.stripeInvoiceId))
        .returning()
      return updated
    }

    const [inserted] = await db
      .insert(stripeInvoice)
      .values(data)
      .returning()
    return inserted
  }

  async function getInvoicesByUserId(userId: string) {
    return db
      .select()
      .from(stripeInvoice)
      .where(and(eq(stripeInvoice.userId, userId), isNull(stripeInvoice.deletedAt)))
      .orderBy(desc(stripeInvoice.createdAt))
  }

  async function deleteAllForUser(userId: string) {
    await db.update(stripeCustomer).set({ deletedAt: new Date() }).where(and(eq(stripeCustomer.userId, userId), isNull(stripeCustomer.deletedAt)))
    await db.update(stripeCheckoutSession).set({ deletedAt: new Date() }).where(and(eq(stripeCheckoutSession.userId, userId), isNull(stripeCheckoutSession.deletedAt)))
    await db.update(stripeSubscription).set({ deletedAt: new Date() }).where(and(eq(stripeSubscription.userId, userId), isNull(stripeSubscription.deletedAt)))
    await db.update(stripeInvoice).set({ deletedAt: new Date() }).where(and(eq(stripeInvoice.userId, userId), isNull(stripeInvoice.deletedAt)))
  }

  return {
    upsertCustomer,
    getCustomerByUserId,
    getCustomerByStripeId,
    upsertCheckoutSession,
    getCheckoutSessionsByUserId,
    upsertSubscription,
    getActiveSubscription,
    upsertInvoice,
    getInvoicesByUserId,
    deleteAllForUser,
  }
}
