import { defineEventa } from '@moeru/eventa'

export const speechIntentStartEvent = defineEventa<{ intentId: string, turnId?: string }>('proj-airi:pipelines:output:speech:intent-start')
export const speechIntentEndEvent = defineEventa<{ intentId: string, turnId?: string }>('proj-airi:pipelines:output:speech:intent-end')
export const speechIntentCancelEvent = defineEventa<{ intentId: string, turnId?: string, reason?: string }>('proj-airi:pipelines:output:speech:intent-cancel')

const listeners = new Map<string, Set<(evt: { body: unknown }) => void>>()

function ensureListeners(eventName: string) {
  let set = listeners.get(eventName)
  if (!set) {
    set = new Set()
    listeners.set(eventName, set)
  }
  return set
}

export function getSpeechBusContext() {
  return {
    on(event: { name: string }, handler: (evt: { body: unknown }) => void) {
      const set = ensureListeners(event.name)
      set.add(handler)
      return () => set.delete(handler)
    },
  }
}
