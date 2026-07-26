import type Redis from 'ioredis'
import type { RevenueMetrics } from '../../../otel'
import type { BillingService } from './billing-service'

import { createPaymentRequiredError } from '../../../utils/error'

export interface FluxMeterOptions {
  name: string
  resolveRuntime: () => Promise<{
    unitsPerFlux: number
    debtTtlSeconds?: number | null
  }>
}

export interface AccumulateInput {
  userId: string
  units: number
  currentBalance: number
  requestId: string
  metadata?: Record<string, unknown>
}

export interface FluxMeter {
  readonly name: string
  assertCanAfford(userId: string, units: number, currentBalance: number): Promise<void>
  accumulate(input: AccumulateInput): Promise<{ fluxDebited: number }>
  peekDebt(userId: string): Promise<number>
  config: { name: string; unitsPerFlux: number; debtTtlSeconds?: number }
}

const DEBT_KEY_PREFIX = 'flux:meter:debt:'

export function createFluxMeter(
  redis: Redis,
  billingService: BillingService,
  options: FluxMeterOptions,
  _metrics?: RevenueMetrics | null,
): FluxMeter {
  const { name, resolveRuntime } = options

  let cachedConfig: { unitsPerFlux: number; debtTtlSeconds?: number } | null = null

  async function getConfig() {
    if (cachedConfig) return cachedConfig
    const result = await resolveRuntime()
    cachedConfig = { unitsPerFlux: result.unitsPerFlux, debtTtlSeconds: result.debtTtlSeconds ?? undefined }
    return cachedConfig
  }

  function debtKey(userId: string) {
    return `${DEBT_KEY_PREFIX}${name}:${userId}`
  }

  async function getDebt(userId: string): Promise<number> {
    const val = await redis.get(debtKey(userId))
    return val ? Number(val) : 0
  }

  async function setDebt(userId: string, debt: number, ttlSeconds?: number) {
    const key = debtKey(userId)
    if (debt <= 0) {
      await redis.del(key)
    }
    else if (ttlSeconds) {
      await redis.set(key, String(debt), 'EX', ttlSeconds)
    }
    else {
      await redis.set(key, String(debt))
    }
  }

  async function assertCanAfford(userId: string, units: number, currentBalance: number) {
    const config = await getConfig()
    const debt = await getDebt(userId)
    const totalUnits = debt + units
    const projectedFlux = Math.floor(totalUnits / config.unitsPerFlux)
    const requiredFlux = Math.max(projectedFlux, currentBalance <= 0 ? 1 : 0)

    if (currentBalance < requiredFlux) {
      throw createPaymentRequiredError('Insufficient flux')
    }
  }

  async function accumulate(input: AccumulateInput) {
    const config = await getConfig()
    const currentDebt = await getDebt(input.userId)
    const newDebt = currentDebt + input.units
    const fluxDebited = Math.floor(newDebt / config.unitsPerFlux)
    const remainingDebt = newDebt - fluxDebited * config.unitsPerFlux

    if (fluxDebited > 0) {
      await billingService.debitFlux({
        userId: input.userId,
        amount: fluxDebited,
        description: `${name}_meter`,
        requestId: input.requestId,
      })
    }

    await setDebt(input.userId, remainingDebt, config.debtTtlSeconds)

    return { fluxDebited }
  }

  async function peekDebt(userId: string) {
    return getDebt(userId)
  }

  return {
    name,
    assertCanAfford,
    accumulate,
    peekDebt,
    get config() {
      if (!cachedConfig) throw new Error('FluxMeter config not loaded yet')
      return { name, ...cachedConfig }
    },
  }
}
