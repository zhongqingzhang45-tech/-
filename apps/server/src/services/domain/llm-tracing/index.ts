export interface ChatGenerationTrace {
  id: string
  model: string
  startedAt: number
  stream: boolean
  inputTokens?: number
  outputTokens?: number
  endedAt?: number
  status?: string
  provider?: string
  fail(reason: string): void
  succeed(opts: {
    output?: unknown
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }): void
  appendStreamChunk(chunk: string): void
}

export interface TtsGenerationTrace {
  id: string
  model: string
  voice: string
  startedAt: number
  inputChars?: number
  outputDurationMs?: number
  endedAt?: number
  status?: string
  provider?: string
  fail?(reason: string): void
  succeed?(opts: {
    inputChars?: number
    outputDurationMs?: number
  }): void
}

export interface StartChatGenerationInput {
  input?: unknown
  model: string
  stream: boolean
  userId?: string
  sessionId?: string
}

export interface StartTtsGenerationInput {
  model: string
  voice: string
  input?: string
  userId?: string
  sessionId?: string
}

let traceCounter = 0

function nextTraceId(): string {
  traceCounter += 1
  return `trace_${Date.now()}_${traceCounter}`
}

export function startChatGeneration(input: StartChatGenerationInput): ChatGenerationTrace {
  const trace: ChatGenerationTrace = {
    id: nextTraceId(),
    model: input.model,
    startedAt: Date.now(),
    stream: input.stream,
    fail(_reason: string) {
      trace.endedAt = Date.now()
      trace.status = 'failed'
    },
    succeed(opts) {
      trace.endedAt = Date.now()
      trace.status = 'succeeded'
      trace.inputTokens = opts.promptTokens
      trace.outputTokens = opts.completionTokens
    },
    appendStreamChunk(_chunk: string) {
    },
  }
  return trace
}

export function startTtsGeneration(input: StartTtsGenerationInput): TtsGenerationTrace {
  return {
    id: nextTraceId(),
    model: input.model,
    voice: input.voice,
    startedAt: Date.now(),
  }
}
