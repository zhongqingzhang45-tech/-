export function createSpeechPipelineRuntime() {
  return {
    openIntent: () => ({
      on: () => () => {},
      send: () => {},
      end: () => {},
      cancel: () => {},
    }),
    registerHost: async () => {},
    isHost: () => false,
    dispose: async () => {},
  }
}