import type { FluxService } from '../flux'

export interface FluxBalanceService {
  getBalance(userId: string): Promise<{ flux: number; stripeCustomerId: string | null }>
}

export function createFluxBalanceService(fluxService: FluxService): FluxBalanceService {
  async function getBalance(userId: string) {
    return fluxService.getFlux(userId)
  }

  return { getBalance }
}

export function fluxBalanceBucket(balance: { flux: number }): string {
  const flux = balance.flux
  if (flux <= 0) return 'zero'
  if (flux < 100) return 'very_low'
  if (flux < 1000) return 'low'
  if (flux < 10000) return 'medium'
  if (flux < 100000) return 'high'
  return 'very_high'
}
