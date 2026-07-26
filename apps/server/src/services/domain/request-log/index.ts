import type { Database } from '../../../libs/db'

import { llmRequestLog } from '../../../schemas/llm-request-log'

export interface LogRequestInput {
  userId: string
  model: string
  status: number
  durationMs: number
  fluxConsumed: number
  promptTokens?: number | null
  completionTokens?: number | null
}

export interface RequestLogService {
  logRequest(input: LogRequestInput): Promise<void>
}

export function createRequestLogService(db: Database): RequestLogService {
  async function logRequest(input: LogRequestInput): Promise<void> {
    await db
      .insert(llmRequestLog)
      .values({
        userId: input.userId,
        model: input.model,
        status: input.status,
        durationMs: input.durationMs,
        fluxConsumed: input.fluxConsumed,
        promptTokens: input.promptTokens ?? null,
        completionTokens: input.completionTokens ?? null,
      })
      .catch((err) => {
        console.error('[request-log] failed to log request:', err)
      })
  }

  return { logRequest }
}
