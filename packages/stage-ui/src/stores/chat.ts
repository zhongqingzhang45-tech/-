import type { ChatOrchestratorRuntimeState, ChatOrchestratorSendOptions, StreamEvent, StreamOptions } from '@proj-airi/core-agent'
import type { ChatProvider } from '@xsai-ext/providers/utils'
import type { Message } from '@xsai/shared-chat'

import type { ChatHistoryItem } from '../types/chat'

import { createChatOrchestratorRuntime } from '@proj-airi/core-agent'
import { IOAttributes, IOEvents, IOSpanNames, IOSubsystems } from '@proj-airi/stage-shared'
import { nanoid } from 'nanoid'
import { defineStore, storeToRefs } from 'pinia'
import { ref, toRaw, watch } from 'vue'

import { getConversationAnalyticsSurface, useAnalytics } from '../composables'
import { activeTurnSpan, startSpan } from '../composables/use-io-tracer'
import {
  AIRI_CHAT_APP_SURFACE_HEADER,
  AIRI_CHAT_ROUND_ID_HEADER,
  AIRI_CHAT_SESSION_ID_HEADER,
} from '../libs/analytics-headers'
import { extractMessageText, isCloudSyncableMessage } from '../libs/chat-sync'
import { useCompanionStore } from './companion'
import { useMemoryStore } from './companion/memory'
import { useSubscriptionStore } from './companion/subscription'
import { createMinecraftContext } from './chat/context-providers'
import { useChatContextStore } from './chat/context-store'
import { useChatSessionStore } from './chat/session-store'
import { useChatStreamStore } from './chat/stream-store'
import { useContextObservabilityStore } from './devtools/context-observability'
import { useLLM } from './llm'
import { useLlmToolsetPromptsStore } from './llm-toolset-prompts'
import { useAiriCardStore } from './modules/airi-card'
import { useAutonomousArtistryStore } from './modules/artistry-autonomous'
import { useConsciousnessStore } from './modules/consciousness'
import { useWebSearchStore } from './modules/web-search'

interface ForkOptions {
  fromSessionId?: string
  atIndex?: number
  reason?: string
  hidden?: boolean
}

type ProviderHistoryMessage = Exclude<ChatHistoryItem, { role: 'error' }>

function toProviderHistory(messages: ChatHistoryItem[]): Message[] {
  return messages.filter((message): message is ProviderHistoryMessage => message.role !== 'error')
}

function isTextDelta(event: StreamEvent): event is Extract<StreamEvent, { type: 'text-delta' }> {
  return event.type === 'text-delta'
}

export type { QueuedSendSnapshot, ChatOrchestratorSendOptions as SendOptions } from '@proj-airi/core-agent'

/**
 * Lightweight pattern-based memory extractor.
 * Scans user messages for self-disclosures (name, preferences, facts) and
 * persists them so getSystemPromptSupplement can retrieve them on the next turn.
 *
 * This is intentionally simple — no NLP, no embeddings. It covers the three
 * validation scenarios (name, preference, emotional state) without adding
 * dependencies or latency. Upgrades to LLM-based extraction can slot in later
 * by replacing this function.
 */
function extractMemoriesFromMessage(text: string, memoryStore: ReturnType<typeof useMemoryStore>): void {
  // Name: "我叫小雨" / "我的名字是小雨" / "我是小雨"
  const nameMatch = text.match(/(?:我叫|我的名字是|我是)([^\s,，。.!！?？]{1,10})/)
  if (nameMatch?.[1]) {
    memoryStore.setUserName(nameMatch[1])
    memoryStore.addMemory(`用户的名字是「${nameMatch[1]}」`, 'important', 9)
  }

  // Preferences: "我喜欢猫" / "我爱吃寿司" / "我偏好XX"
  const prefMatch = text.match(/(?:我喜欢|我爱|我偏好|我比较喜欢)([^\s,，。.!！?？]{1,20})/)
  if (prefMatch?.[1]) {
    memoryStore.setUserPreference(prefMatch[1], 'liked')
    // Deduplicate: only add if no existing memory has the same content
    const exists = memoryStore.memories.some(
      m => m.content.includes(prefMatch[1]) && m.type === 'preference',
    )
    if (!exists) {
      memoryStore.addMemory(`用户喜欢${prefMatch[1]}`, 'preference', 7)
    }
  }

  // Emotional state / events: "今天很累" / "我很难过" / "今天发生了XX"
  const eventMatch = text.match(/(?:今天|昨天|刚刚|刚才)([^\s,，。.!！?？]{2,30})/)
  if (eventMatch?.[1]) {
    const exists = memoryStore.memories.some(
      m => m.content.includes(eventMatch[1]) && m.type === 'event',
    )
    if (!exists) {
      memoryStore.addMemory(`用户提到：${eventMatch[0]}`, 'event', 5)
    }
  }
}

export const useChatOrchestratorStore = defineStore('chat-orchestrator', () => {
  const llmStore = useLLM()
  const llmToolsetPromptsStore = useLlmToolsetPromptsStore()
  // Instantiate the web-search store eagerly so its `configured` watcher registers
  // WEB_SEARCH_TOOLSET_PROMPT before getSystemPromptSupplement is read below. The
  // tool resolver that would otherwise be the first to create this store runs after
  // the system prompt is composed, which would expose web_search on the first turn
  // without its paired prompt-injection defense.
  useWebSearchStore()
  const consciousnessStore = useConsciousnessStore()
  const artistryAutonomousStore = useAutonomousArtistryStore()
  const companionStore = useCompanionStore()
  const memoryStore = useMemoryStore()
  const { activeModel, activeProvider } = storeToRefs(consciousnessStore)

  // Captured from onUserTurnReady so getSystemPromptSupplement can do
  // relevance-based memory retrieval using the current message text.
  let pendingMessageText = ''
  const {
    trackFirstMessage,
    trackMessageSendStarted,
    trackMessageSent,
    trackLlmRequestStarted,
    trackLlmFirstToken,
    trackAssistantResponseRendered,
    trackAiGeneration,
    trackMessageRound,
    trackMessageRoundFailed,
    trackChatActivationStarted,
    trackChatActivationSucceeded,
    trackChatActivationFailed,
    trackSecondTurnStarted,
  } = useAnalytics()

  const chatSession = useChatSessionStore()
  const chatStream = useChatStreamStore()
  const chatContext = useChatContextStore()
  const cardStore = useAiriCardStore()
  const contextObservability = useContextObservabilityStore()
  const { activeSessionId } = storeToRefs(chatSession)
  const { streamingMessage } = storeToRefs(chatStream)

  const sending = ref(false)
  const pendingQueuedSendCount = ref(0)
  let ownedActiveTurnSpan: typeof activeTurnSpan.value

  async function streamWithStageAdapters(
    model: string,
    chatProvider: ChatProvider,
    messages: Message[],
    options?: StreamOptions,
  ) {
    let llmTextLength = 0
    const headers = { ...options?.headers }
    if (providerMode(activeProvider.value) === 'official' && options?.requestCorrelation) {
      headers[AIRI_CHAT_SESSION_ID_HEADER] = options.requestCorrelation.conversationId
      headers[AIRI_CHAT_ROUND_ID_HEADER] = options.requestCorrelation.roundId
      headers[AIRI_CHAT_APP_SURFACE_HEADER] = getConversationAnalyticsSurface()
    }

    const hadExistingTurn = !!activeTurnSpan.value
    if (!hadExistingTurn) {
      const turnSpan = startSpan(IOSpanNames.InteractionTurn)
      activeTurnSpan.value = turnSpan
      ownedActiveTurnSpan = turnSpan
    }

    const llmSpan = startSpan(IOSpanNames.LLMInference, activeTurnSpan.value, {
      [IOAttributes.Subsystem]: IOSubsystems.LLM,
      [IOAttributes.GenAIRequestModel]: model,
    })
    const llmRequestTs = performance.now()
    let llmFirstTokenEmitted = false

    try {
      await llmStore.stream(model, chatProvider, messages, {
        ...options,
        headers,
        onStreamEvent: async (event: StreamEvent) => {
          if (isTextDelta(event)) {
            if (!llmFirstTokenEmitted) {
              llmFirstTokenEmitted = true
              llmSpan.addEvent(IOEvents.LLMFirstToken, {
                [IOAttributes.LLM_TTFT]: performance.now() - llmRequestTs,
              })
            }
            llmTextLength += event.text.length
          }

          await options?.onStreamEvent?.(event)
        },
      })

      llmSpan.setAttribute(IOAttributes.LLMTextLength, llmTextLength)
    }
    finally {
      llmSpan.end()
    }
  }

  function syncRuntimeState(state: ChatOrchestratorRuntimeState) {
    sending.value = state.sending
    pendingQueuedSendCount.value = state.pendingQueuedSendCount
  }

  function settleOwnedActiveTurnSpan() {
    if (!ownedActiveTurnSpan)
      return

    ownedActiveTurnSpan.end()
    if (activeTurnSpan.value === ownedActiveTurnSpan)
      activeTurnSpan.value = undefined
    ownedActiveTurnSpan = undefined
  }

  /**
   * Classifies configured chat providers into low-cardinality product analytics buckets.
   */
  function providerMode(providerId: string | undefined): 'official' | 'custom' | 'unknown' {
    if (!providerId)
      return 'unknown'
    return providerId.startsWith('official-provider') ? 'official' : 'custom'
  }

  let lastSendSource: 'text' | 'voice' = 'text'

  const runtime = createChatOrchestratorRuntime({
    session: {
      ensureSession: sessionId => chatSession.ensureSession(sessionId),
      getSessionMessages: sessionId => chatSession.getSessionMessages(sessionId).map(message => toRaw(message)),
      appendSessionMessage: (sessionId, message) => chatSession.appendSessionMessage(sessionId, message),
      getSessionGeneration: sessionId => chatSession.getSessionGeneration(sessionId),
    },
    context: {
      ingest: envelope => chatContext.ingestContextMessage(envelope),
      snapshot: () => chatContext.getContextsSnapshot(),
    },
    foregroundStream: {
      patch: (message) => {
        streamingMessage.value = message
      },
      reset: () => {
        streamingMessage.value = { role: 'assistant', content: '', slices: [], tool_results: [] }
      },
    },
    llm: {
      stream: streamWithStageAdapters,
    },
    getActiveSessionId: () => activeSessionId.value,
    getActiveProvider: () => activeProvider.value,
    getSystemPromptSupplement: () => {
      const parts: string[] = []

      // Tool guidance (existing)
      const toolPrompt = llmToolsetPromptsStore.activeToolsetPrompt
      if (toolPrompt)
        parts.push(toolPrompt)

      // Companion profile — gives the AI its identity and relationship context
      const companionParts: string[] = []
      if (companionStore.characterName) {
        companionParts.push(`你的名字是「${companionStore.characterName}」。`)
      }
      if (companionStore.personality) {
        const personalityDesc: Record<string, string> = {
          gentle: '你性格温柔体贴，善解人意，总是关心对方的感受。',
          tsundere: '你性格傲娇可爱，嘴硬心软，其实很在意对方。',
          cheerful: '你性格活泼开朗，元气满满，笑容治愈。',
          mature: '你性格成熟知性，温柔可靠，会给出建议。',
        }
        const desc = personalityDesc[companionStore.personality]
        if (desc)
          companionParts.push(desc)
      }
      if (companionStore.level > 1) {
        companionParts.push(`你们的关系等级是 ${companionStore.level}（${companionStore.relationshipTitle}），已认识 ${companionStore.daysTogether} 天。`)
      }
      if (memoryStore.userName) {
        companionParts.push(`用户的名字是「${memoryStore.userName}」。`)
      }
      if (companionParts.length > 0) {
        parts.push(companionParts.join(' '))
      }

      // Memory retrieval — inject relevant memories as context for this turn
      const subscription = useSubscriptionStore()
      if (subscription.memoryUnlocked && pendingMessageText) {
        const memories = memoryStore.getRelevantMemories(pendingMessageText, 5)
        if (memories.length > 0) {
          const memoryLines = memories.map(m => `- ${m.content}`)
          parts.push(`你记得关于用户的以下信息，请在对话中自然地引用：\n${memoryLines.join('\n')}`)
        }
      }

      return parts.length > 0 ? parts.join('\n\n') : undefined
    },
    runtimeContextProviders: [
      createMinecraftContext,
    ],
    createId: nanoid,
    unwrapMessage: message => toRaw(message),
    onStateChange: syncRuntimeState,
    onSendSettled: settleOwnedActiveTurnSpan,
    onTrackFirstMessage: trackFirstMessage,
    onMessageSendStarted: ({ conversationId, roundId, turnIndex, source, model }) => {
      lastSendSource = source
      trackMessageSendStarted({
        conversation_id: conversationId,
        round_id: roundId,
        turn_index: turnIndex,
        source,
        model,
      })
    },
    onLlmRequestStarted: ({ conversationId, roundId, turnIndex, model, provider, hasVoice }) => trackLlmRequestStarted({
      conversation_id: conversationId,
      round_id: roundId,
      turn_index: turnIndex,
      model,
      provider,
      has_voice: hasVoice,
    }),
    onLlmFirstToken: ({ conversationId, roundId, turnIndex, model, ttfbMs }) => trackLlmFirstToken({
      conversation_id: conversationId,
      round_id: roundId,
      turn_index: turnIndex,
      model,
      ttfb_ms: ttfbMs,
    }),
    onAssistantResponseRendered: ({ conversationId, roundId, turnIndex, model, latencyMs }) => {
      trackAssistantResponseRendered({
        conversation_id: conversationId,
        round_id: roundId,
        turn_index: turnIndex,
        model,
        latency_ms: latencyMs,
      })
    },
    onLlmGeneration: ({ conversationId, roundId, model, provider, inputTokens, outputTokens, totalTokens, usageSource }) => {
      const mode = providerMode(provider)
      // The official path is captured server-side from authoritative upstream usage.
      if (mode !== 'custom')
        return

      trackAiGeneration({
        conversation_id: conversationId,
        round_id: roundId,
        provider_type: mode,
        provider_id: provider,
        model_id: model,
        usage_source: usageSource,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: totalTokens,
      })
    },
    onMessageRound: ({ conversationId, roundId, turnIndex, durationMs, hasVoice, model, inputTokens, outputTokens, totalTokens, usageSource }) => trackMessageRound({
      conversation_id: conversationId,
      round_id: roundId,
      turn_index: turnIndex,
      duration_ms: durationMs,
      has_voice: hasVoice,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      usage_source: usageSource,
    }),
    onMessageRoundFailed: ({ conversationId, roundId, turnIndex, model, provider, errorCode, failureStage, source }) => trackMessageRoundFailed({
      conversation_id: conversationId,
      round_id: roundId,
      turn_index: turnIndex,
      provider_id: provider || 'unknown',
      model_id: model || 'unknown',
      source,
      error_code: errorCode,
      failure_stage: failureStage,
    }),
    onChatActivationStarted: ({ conversationId, roundId, turnIndex, model, provider, source }) => {
      const mode = providerMode(provider)
      const providerId = provider || 'unknown'
      const modelId = model || 'unknown'

      trackChatActivationStarted({
        conversation_id: conversationId,
        provider_mode: mode,
        provider_id: providerId,
        model_id: modelId,
        round_id: roundId,
        source,
        turn_index: turnIndex,
      })
    },
    onChatActivationSucceeded: ({ conversationId, roundId, turnIndex, model, provider, durationMs, source }) => trackChatActivationSucceeded({
      conversation_id: conversationId,
      provider_mode: providerMode(provider),
      provider_id: provider || 'unknown',
      model_id: model || 'unknown',
      round_id: roundId,
      time_to_first_message_ms: durationMs,
      source,
      turn_index: turnIndex,
    }),
    onChatActivationFailed: ({ conversationId, roundId, turnIndex, model, provider, errorCode, failureStage, source }) => {
      trackChatActivationFailed({
        conversation_id: conversationId,
        provider_mode: providerMode(provider),
        provider_id: provider || 'unknown',
        model_id: model || 'unknown',
        round_id: roundId,
        error_code: errorCode,
        failure_stage: failureStage,
        source,
        turn_index: turnIndex,
      })
    },
    onLifecycle: record => contextObservability.recordLifecycle(record),
    onPromptProjection: payload => contextObservability.capturePromptProjection(payload),
    onUserMessageAppended: ({ sessionId, message, messageText, source, model, provider, roundId, turnIndex }) => {
      trackMessageSent({
        conversation_id: sessionId,
        provider_type: providerMode(activeProvider.value),
        provider_name: activeProvider.value || 'unknown',
        model: activeModel.value || 'unknown',
        message_id: message.id,
        round_id: roundId,
        turn_index: turnIndex,
        message_index: chatSession.getSessionMessages(sessionId).length,
        message_length: messageText.length,
        has_attachment: false,
        mode: lastSendSource,
      })
      if (turnIndex === 2) {
        trackSecondTurnStarted({
          conversation_id: sessionId,
          provider_mode: providerMode(provider),
          provider_id: provider || 'unknown',
          model_id: model || 'unknown',
          round_id: roundId,
          source,
          turn_index: turnIndex,
        })
      }

      if (isCloudSyncableMessage(message)) {
        void chatSession.pushMessageToCloud(sessionId, {
          id: message.id,
          role: 'user',
          content: messageText,
        })
      }
    },
    onAssistantMessageAppended: ({ sessionId, message }) => {
      if (isCloudSyncableMessage(message) && message.id) {
        void chatSession.pushMessageToCloud(sessionId, {
          id: message.id,
          role: 'assistant',
          content: extractMessageText(message),
        })
      }
    },
    onUserTurnReady: ({ messageText, sessionMessages }) => {
      // Capture for getSystemPromptSupplement's memory retrieval
      pendingMessageText = messageText

      // Extract memories from the user's message using lightweight pattern matching.
      // Only runs for members with memory unlocked; free-tier users get no extraction.
      const subscription = useSubscriptionStore()
      if (subscription.memoryUnlocked) {
        extractMemoriesFromMessage(messageText, memoryStore)
      }

      const autonomousTarget = cardStore.activeCard?.extensions?.airi?.modules?.artistry?.autonomousTarget || 'user'
      if (autonomousTarget === 'user')
        void artistryAutonomousStore.runArtistTask(messageText, toProviderHistory(sessionMessages))
    },
    onAssistantTurnReady: ({ messageText, sessionMessages }) => {
      const artistry = cardStore.activeCard?.extensions?.airi?.modules?.artistry
      if (artistry?.autonomousEnabled && artistry?.autonomousTarget === 'assistant')
        void artistryAutonomousStore.runArtistTask(messageText, toProviderHistory(sessionMessages))

      // NOTICE: Count one daily-chat consumption after the assistant's turn has
      // been fully produced rather than at user-submit time. Transient failures
      // (network blip, 429 from upstream, WebSocket mid-stream drop) that get
      // retried should not silently burn a free-tier user's quota — the user
      // only "gets" one turn they can read, so we only deduct one.
      useSubscriptionStore().recordChat()
    },
  })

  watch(sending, (next) => {
    if (runtime.getSending() !== next)
      runtime.setSending(next)
  })

  async function ingest(
    sendingMessage: string,
    options: ChatOrchestratorSendOptions,
    targetSessionId?: string,
  ) {
    // NOTICE: Enforce free-tier daily quota at the send entry point so no
    // inference work is scheduled for already-over-limit users. Throwing
    // lets the UI layer render the upgrade CTA instead of a generic chat
    // error. We intentionally don't catch here — the caller handles the
    // user-visible surface (toast + banner).
    const subscription = useSubscriptionStore()
    if (!subscription.canChat()) {
      const error = new Error('Daily chat limit reached for free tier')
      error.name = 'ChatQuotaExceededError'
      throw error
    }
    return runtime.ingest(sendingMessage, options, targetSessionId)
  }

  async function ingestOnFork(
    sendingMessage: string,
    options: ChatOrchestratorSendOptions,
    forkOptions?: ForkOptions,
  ) {
    const baseSessionId = forkOptions?.fromSessionId ?? activeSessionId.value
    if (!forkOptions)
      return ingest(sendingMessage, options, baseSessionId)

    const forkSessionId = await chatSession.forkSession({
      fromSessionId: baseSessionId,
      atIndex: forkOptions.atIndex,
      reason: forkOptions.reason,
      hidden: forkOptions.hidden,
    })
    return ingest(sendingMessage, options, forkSessionId || baseSessionId)
  }

  function cancelPendingSends(sessionId?: string) {
    runtime.cancelPendingSends(sessionId)
  }

  function getPendingQueuedSendSnapshot() {
    return runtime.getPendingQueuedSendSnapshot()
  }

  return {
    sending,
    pendingQueuedSendCount,

    ingest,
    ingestOnFork,
    cancelPendingSends,
    getPendingQueuedSendSnapshot,

    clearHooks: runtime.hooks.clearHooks,

    emitBeforeMessageComposedHooks: runtime.hooks.emitBeforeMessageComposedHooks,
    emitAfterMessageComposedHooks: runtime.hooks.emitAfterMessageComposedHooks,
    emitBeforeSendHooks: runtime.hooks.emitBeforeSendHooks,
    emitAfterSendHooks: runtime.hooks.emitAfterSendHooks,
    emitTokenLiteralHooks: runtime.hooks.emitTokenLiteralHooks,
    emitTokenSpecialHooks: runtime.hooks.emitTokenSpecialHooks,
    emitStreamEndHooks: runtime.hooks.emitStreamEndHooks,
    emitAssistantResponseEndHooks: runtime.hooks.emitAssistantResponseEndHooks,
    emitAssistantMessageHooks: runtime.hooks.emitAssistantMessageHooks,
    emitChatTurnCompleteHooks: runtime.hooks.emitChatTurnCompleteHooks,

    onBeforeMessageComposed: runtime.hooks.onBeforeMessageComposed,
    onAfterMessageComposed: runtime.hooks.onAfterMessageComposed,
    onBeforeSend: runtime.hooks.onBeforeSend,
    onAfterSend: runtime.hooks.onAfterSend,
    onTokenLiteral: runtime.hooks.onTokenLiteral,
    onTokenSpecial: runtime.hooks.onTokenSpecial,
    onStreamEnd: runtime.hooks.onStreamEnd,
    onAssistantResponseEnd: runtime.hooks.onAssistantResponseEnd,
    onAssistantMessage: runtime.hooks.onAssistantMessage,
    onChatTurnComplete: runtime.hooks.onChatTurnComplete,
  }
})
