<script setup lang="ts">
import type { ChatProvider } from '@xsai-ext/providers/utils'

import Header from '@proj-airi/stage-layouts/components/Layouts/Header.vue'
import InteractiveArea from '@proj-airi/stage-layouts/components/Layouts/InteractiveArea.vue'
import MobileHeader from '@proj-airi/stage-layouts/components/Layouts/MobileHeader.vue'
import MobileInteractiveArea from '@proj-airi/stage-layouts/components/Layouts/MobileInteractiveArea.vue'
import workletUrl from '@proj-airi/stage-ui/workers/vad/process.worklet?worker&url'

import { BackgroundProvider } from '@proj-airi/stage-layouts/components/Backgrounds'
import { useBackgroundThemeColor } from '@proj-airi/stage-layouts/composables/theme-color'
import { useBackgroundStore } from '@proj-airi/stage-layouts/stores/background'
import { IS_DEV } from '@proj-airi/stage-shared'
import { ViewControlSlider, WidgetStage } from '@proj-airi/stage-ui/components/scenes'
import { useAudioRecorder } from '@proj-airi/stage-ui/composables/audio/audio-recorder'
import { useVAD } from '@proj-airi/stage-ui/stores/ai/models/vad'
import type { ErrorMessage } from '@proj-airi/core-agent'
import { useChatOrchestratorStore } from '@proj-airi/stage-ui/stores/chat'
import { useChatSessionStore } from '@proj-airi/stage-ui/stores/chat/session-store'
import { useSubscriptionStore } from '@proj-airi/stage-ui/stores/companion/subscription'
import { useConsciousnessStore } from '@proj-airi/stage-ui/stores/modules/consciousness'
import { useHearingSpeechInputPipeline } from '@proj-airi/stage-ui/stores/modules/hearing'
import { useProvidersStore } from '@proj-airi/stage-ui/stores/providers'
import { useSettings, useSettingsAudioDevice } from '@proj-airi/stage-ui/stores/settings'
import { breakpointsTailwind, useBreakpoints, useMouse } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useCompanionStore } from '@proj-airi/stage-ui/stores/companion'

import WebSocketStatusButton from '../components/websocket-status-button.vue'

const router = useRouter()
const companionStore = useCompanionStore()

const paused = ref(false)
const showLanding = ref(false)

const hasCompanion = computed(() => !!companionStore.firstMeetDate)

function getWelcomeMessage(personality: string | null, name: string): string {
  const n = name || '我'
  switch (personality) {
    case 'gentle':
      return `你好呀，终于见到你了～${n}会一直陪着你的。`
    case 'tsundere':
      return `哼，既然你来了…${n}就勉为其难陪你聊一会儿吧。`
    case 'cheerful':
      return `耶！你终于来啦！${n}等了好久呢，快来跟我聊天吧！`
    case 'mature':
      return `你好，很高兴认识你。${n}会在这里，做你温柔的港湾。`
    default:
      return `你好呀，我是${n}。以后就让我来陪伴你吧～`
  }
}

function injectWelcomeMessage() {
  const sessionId = chatSessionStore.activeSessionId
  if (!sessionId)
    return
  const messages = chatSessionStore.getSessionMessages(sessionId)
  // Only inject if there are no assistant messages yet
  const hasAssistant = messages.some(m => m.role === 'assistant')
  if (hasAssistant)
    return

  const welcomeText = getWelcomeMessage(companionStore.personality.value, companionStore.displayName.value)
  const welcomeMessage = {
    role: 'assistant' as const,
    content: welcomeText,
    slices: [{ type: 'text' as const, text: welcomeText }],
    tool_results: [] as { id: string; isError?: boolean; result?: string }[],
    id: `welcome-${Date.now()}`,
    createdAt: Date.now(),
  }
  chatSessionStore.setSessionMessages(sessionId, [
    ...messages,
    welcomeMessage,
  ])
}

function handleSettingsOpen(open: boolean) {
  paused.value = open
}

const positionCursor = useMouse()
const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('md')

const backgroundStore = useBackgroundStore()
const { selectedOption, sampledColor } = storeToRefs(backgroundStore)
const backgroundSurface = useTemplateRef<InstanceType<typeof BackgroundProvider>>('backgroundSurface')
const { stageModelRenderer } = storeToRefs(useSettings())

const { syncBackgroundTheme } = useBackgroundThemeColor({ backgroundSurface, selectedOption, sampledColor })
onMounted(() => {
  syncBackgroundTheme()
  showLanding.value = !hasCompanion.value
  if (hasCompanion.value) {
    // Defer welcome injection to allow session initialization to settle
    setTimeout(() => injectWelcomeMessage(), 800)
  }
})

// Audio + transcription pipeline (mirrors stage-tamagotchi)
const settingsAudioDeviceStore = useSettingsAudioDevice()
const { stream, enabled } = storeToRefs(settingsAudioDeviceStore)
const { startRecord, stopRecord, onStopRecord } = useAudioRecorder(stream)
const hearingPipeline = useHearingSpeechInputPipeline()
const { transcribeForRecording, transcribeForMediaStream, stopStreamingTranscription } = hearingPipeline
const { supportsStreamInput } = storeToRefs(hearingPipeline)
const providersStore = useProvidersStore()
const consciousnessStore = useConsciousnessStore()
const { activeProvider: activeChatProvider, activeModel: activeChatModel } = storeToRefs(consciousnessStore)
const chatStore = useChatOrchestratorStore()
const chatSessionStore = useChatSessionStore()
const subscriptionStore = useSubscriptionStore()

function injectVoiceQuotaMessage(): void {
  const message: ErrorMessage = {
    role: 'error',
    content: `今日免费对话次数已用完（${subscriptionStore.dailyChatLimit.value} 条/天），升级会员后可无限畅聊～`,
    meta: { type: 'quota-exceeded', limit: subscriptionStore.dailyChatLimit.value },
  }
  const sessionId = chatSessionStore.activeSessionId
  chatSessionStore.setSessionMessages(sessionId, [
    ...chatSessionStore.getSessionMessages(sessionId),
    message,
  ])
}

const shouldUseStreamInput = computed(() => supportsStreamInput.value && !!stream.value)

const {
  init: initVAD,
  dispose: disposeVAD,
  start: startVAD,
  loaded: vadLoaded,
} = useVAD(workletUrl, {
  threshold: ref(0.6),
  onSpeechStart: () => handleSpeechStart(),
  onSpeechEnd: () => handleSpeechEnd(),
})

let stopOnStopRecord: (() => void) | undefined

async function startAudioInteraction() {
  try {
    await initVAD()
    if (stream.value)
      await startVAD(stream.value)

    // Hook once
    stopOnStopRecord = onStopRecord(async (recording) => {
      const text = await transcribeForRecording(recording)
      if (!text || !text.trim())
        return

      try {
        const provider = await providersStore.getProviderInstance(activeChatProvider.value)
        if (!provider || !activeChatModel.value)
          return

        await chatStore.ingest(text, { model: activeChatModel.value, chatProvider: provider as ChatProvider })
      }
      catch (err) {
        console.error('Failed to send chat from voice:', err)
        if (err instanceof Error && err.name === 'ChatQuotaExceededError')
          injectVoiceQuotaMessage()
      }
    })
  }
  catch (e) {
    console.error('Audio interaction init failed:', e)
  }
}

async function handleSpeechStart() {
  if (shouldUseStreamInput.value && stream.value) {
    // Use both callbacks to support incremental updates and final transcript replacement.
    // ChatArea uses only onSentenceEnd to avoid re-adding deleted text.
    await transcribeForMediaStream(stream.value, {
      onSentenceEnd: (delta) => {
        const finalText = delta
        if (!finalText || !finalText.trim()) {
          return
        }

        void (async () => {
          try {
            const provider = await providersStore.getProviderInstance(activeChatProvider.value)
            if (!provider || !activeChatModel.value)
              return

            await chatStore.ingest(finalText, { model: activeChatModel.value, chatProvider: provider as ChatProvider })
          }
          catch (err) {
            console.error('Failed to send chat from voice:', err)
            if (err instanceof Error && err.name === 'ChatQuotaExceededError')
              injectVoiceQuotaMessage()
          }
        })()
      },
    })
    return
  }

  startRecord()
}

async function handleSpeechEnd() {
  if (shouldUseStreamInput.value) {
    // Keep streaming session alive; idle timer in pipeline will handle teardown.
    return
  }

  stopRecord()
}

function stopAudioInteraction() {
  try {
    stopOnStopRecord?.()
    stopOnStopRecord = undefined
    // Stop any active streaming transcription sessions to prevent session leakage
    void stopStreamingTranscription(true)
    disposeVAD()
  }
  catch {}
}

watch(enabled, async (val) => {
  if (val) {
    await startAudioInteraction()
  }
  else {
    stopAudioInteraction()
  }
}, { immediate: true })

onUnmounted(() => {
  stopAudioInteraction()
})

watch([stream, () => vadLoaded.value], async ([s, loaded]) => {
  if (enabled.value && loaded && s) {
    try {
      await startVAD(s)
    }
    catch (e) {
      console.error('Failed to start VAD with stream:', e)
    }
  }
})
</script>

<template>
  <!-- Landing page for first-time users -->
  <div
    v-if="showLanding"
    class="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-pink-50 via-purple-50 to-white dark:from-neutral-950 dark:via-purple-950/20 dark:to-neutral-950"
  >
    <div class="absolute top-0 left-1/4 w-72 h-72 bg-pink-300/30 rounded-full blur-3xl dark:bg-pink-500/10" />
    <div class="absolute top-20 right-1/4 w-64 h-64 bg-purple-300/30 rounded-full blur-3xl dark:bg-purple-500/10" />
    <div class="absolute bottom-0 left-1/3 w-56 h-56 bg-sky-300/20 rounded-full blur-3xl dark:bg-sky-500/10" />

    <div class="relative mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-12">
      <div class="flex items-center gap-2 mb-6">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-purple-500/30">
          <span class="i-solar:heart-bold text-2xl text-white" />
        </div>
        <span class="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Life</span>
      </div>

      <h1 class="text-center text-3xl font-bold text-neutral-900 dark:text-white leading-tight">
        创建你的
        <span class="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
          AI 伴侣
        </span>
      </h1>

      <p class="mt-4 text-center text-base text-neutral-600 dark:text-neutral-300 max-w-xs">
        她会记住你，理解你，陪伴你的生活。
      </p>

      <button
        class="mt-8 w-full max-w-xs rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-purple-500/30 transition-all active:scale-[0.97] hover:shadow-xl hover:shadow-purple-500/40"
        @click="router.push('/create')"
      >
        开始创建
      </button>

      <div class="mt-10 grid w-full gap-3">
        <div
          v-for="f in [
            { icon: 'i-solar:heart-bold-duotone', title: '她会记住你', desc: '你的喜好、习惯、重要的日子，她都会悄悄记在心里', color: 'from-pink-500 to-rose-500' },
            { icon: 'i-solar:chat-square-like-bold-duotone', title: '陪伴你的日常', desc: '开心时分享喜悦，难过时给你拥抱，深夜陪你聊天', color: 'from-purple-500 to-indigo-500' },
            { icon: 'i-solar:stars-bold-duotone', title: '一起成长', desc: '每一次互动都让你们更加了解彼此，关系不断升温', color: 'from-amber-500 to-orange-500' },
          ]"
          :key="f.title"
          class="rounded-2xl p-4 bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm dark:bg-neutral-900/40 dark:border-white/5 dark:shadow-none"
        >
          <div :class="['flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg', f.color]">
            <div :class="f.icon" text-xl />
          </div>
          <h3 class="mt-3 text-sm font-semibold text-neutral-900 dark:text-white">
            {{ f.title }}
          </h3>
          <p class="mt-1 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {{ f.desc }}
          </p>
        </div>
      </div>

      <div class="mt-10 text-center text-xs text-neutral-400 dark:text-neutral-600">
        <p>你的 AI 伴侣 · 支持 Live2D / VRM 角色</p>
      </div>
    </div>
  </div>

  <!-- Main chat stage -->
  <BackgroundProvider
    v-else
    ref="backgroundSurface"
    class="widgets top-widgets"
    :background="selectedOption"
    :top-color="sampledColor"
  >
    <div flex="~ col" relative z-2 h-100dvh w-100vw of-hidden py-safe>
      <!-- header -->
      <div class="px-0 py-1 md:px-3 md:py-3" w-full gap-2>
        <Header class="hidden md:flex" />
        <MobileHeader class="flex md:hidden" />
      </div>
      <!-- page -->
      <div relative flex="~ 1 row gap-y-0 gap-x-2 <md:col" min-h-0>
        <div relative min-w="1/2" min-h-0 flex-1>
          <div
            absolute left-0 z-15 px-3
            :class="[
              stageModelRenderer === 'live2d' ? 'top-0 h-full py-[20vh]' : 'top-1/2 -translate-y-1/2',
            ]"
          >
            <ViewControlSlider />
          </div>
          <WidgetStage
            h-full w-full
            :enable-orbit-controls="!isMobile"
            :paused="paused"
            :focus-at="{
              x: positionCursor.x.value,
              y: positionCursor.y.value,
            }"
          />
        </div>
        <InteractiveArea v-if="!isMobile" h="85dvh" absolute right-4 flex flex-1 flex-col max-w="500px" min-w="30%" />
        <MobileInteractiveArea v-if="isMobile" @settings-open="handleSettingsOpen">
          <template v-if="IS_DEV" #status>
            <WebSocketStatusButton />
          </template>
        </MobileInteractiveArea>
      </div>
    </div>
  </BackgroundProvider>
</template>

<route lang="yaml">
name: IndexScenePage
meta:
  layout: stage
  stageTransition:
    name: bubble-wave-out
</route>
