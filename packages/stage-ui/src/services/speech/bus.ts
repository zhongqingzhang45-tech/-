import type { Eventa, InferEventaPayload } from '@moeru/eventa'

import { defineEventa } from '@moeru/eventa'

export const speechIntentStartEvent = defineEventa<{ intentId: string, turnId?: string }>('proj-airi:pipelines:output:speech:intent-start')
export const speechIntentEndEvent = defineEventa<{ intentId: string, turnId?: string }>('proj-airi:pipelines:output:speech:intent-end')
export const speechIntentCancelEvent = defineEventa<{ intentId: string, turnId?: string, reason?: string }>('proj-airi:pipelines:output:speech:intent-cancel')

// Life: 简化的 in-process speech bus。
// 真实实现走 @moeru/eventa 的 BroadcastChannel 跨窗口 bus；MVP 阶段单窗口足够，
// 用 Map<id, Set<handler>> 即可。Removal condition: 接入跨窗口 speech bus 后删除。
const listeners = new Map<string, Set<(evt: { body?: unknown }) => void>>()

function ensureListeners(eventId: string) {
  let set = listeners.get(eventId)
  if (!set) {
    set = new Set()
    listeners.set(eventId, set)
  }
  return set
}

export function getSpeechBusContext() {
  return {
    on<E extends Eventa>(event: E, handler: (evt: { body?: InferEventaPayload<E> }) => void) {
      const set = ensureListeners(event.id)
      set.add(handler as (evt: { body?: unknown }) => void)
      return () => set.delete(handler as (evt: { body?: unknown }) => void)
    },
  }
}
