export interface PosthogSink {
  capture(event: {
    distinctId: string
    event: string
    properties?: Record<string, unknown>
    timestamp?: Date
  }): void
  shutdown(): Promise<void>
}

interface PosthogSinkOptions {
  projectKey: string
  host?: string
  flushIntervalMs?: number
  maxQueueSize?: number
}

export function createPosthogSink(options: PosthogSinkOptions): PosthogSink {
  const host = options.host ?? 'https://us.i.posthog.com'
  const batchEndpoint = `${host}/capture/`
  const flushIntervalMs = options.flushIntervalMs ?? 5000
  const maxQueueSize = options.maxQueueSize ?? 50

  const queue: Array<{ event: string, distinct_id: string, properties?: Record<string, unknown>, timestamp: string }> = []
  let flushTimer: ReturnType<typeof setTimeout> | null = null
  let shutdownPromise: Promise<void> | null = null

  function flush() {
    if (queue.length === 0) return

    const batch = queue.splice(0, queue.length)
    const payload = {
      api_key: options.projectKey,
      batch,
    }

    fetch(batchEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.error('[posthog] batch capture failed:', err)
    })
  }

  function scheduleFlush() {
    if (flushTimer) return
    flushTimer = setTimeout(() => {
      flushTimer = null
      flush()
    }, flushIntervalMs)
  }

  return {
    capture({ distinctId, event, properties, timestamp }) {
      if (shutdownPromise) return

      queue.push({
        event,
        distinct_id: distinctId,
        properties,
        timestamp: (timestamp ?? new Date()).toISOString(),
      })

      if (queue.length >= maxQueueSize) {
        flush()
      } else {
        scheduleFlush()
      }
    },

    async shutdown() {
      if (shutdownPromise) return shutdownPromise

      shutdownPromise = (async () => {
        if (flushTimer) {
          clearTimeout(flushTimer)
          flushTimer = null
        }
        flush()
        await new Promise(resolve => setTimeout(resolve, 1000))
      })()

      return shutdownPromise
    },
  }
}
