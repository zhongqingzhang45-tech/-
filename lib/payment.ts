// Payment order store (in-memory for demo)
// In production, use a real database

interface PaidOrder {
  planId: string;
  paidAt: number;
}

const orders = new Map<string, PaidOrder>();

export function recordPayment(outTradeNo: string, planId: string) {
  orders.set(outTradeNo, { planId, paidAt: Date.now() });
}

export function getPayment(outTradeNo: string): PaidOrder | undefined {
  return orders.get(outTradeNo);
}

// Re-export for notify route
export const paidOrders = orders;
