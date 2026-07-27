<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import type { ChatProvider } from '@xsai-ext/providers/utils'

import Header from '@proj-airi/stage-layouts/components/Layouts/Header.vue'
import InteractiveArea from '@proj-airi/stage-layouts/components/Layouts/InteractiveArea.vue'
import MobileHeader from '@proj-airi/stage-layouts/components/Layouts/MobileHeader.vue'
import MobileInteractiveArea from '@proj-airi/stage-layouts/components/Layouts/MobileInteractiveArea.vue'
import workletUrl from '@proj-airi/stage-ui/workers/vad/process.worklet?worker&url'

import { BackgroundProvider } from '@proj-airi/stage-layouts/components/Backgrounds'
import { useBackgroundThemeColor } from '@proj-airi/stage-layouts/composables/theme-color'
import { useBackgroundStore } from '@proj-airi/stage-layouts/stores/background'
import { HoloCoupon } from '@proj-airi/stage-ui/components'
import { ViewControlSlider, WidgetStage } from '@proj-airi/stage-ui/components/scenes'
import { useAudioRecorder } from '@proj-airi/stage-ui/composables/audio/audio-recorder'
import { useVAD } from '@proj-airi/stage-ui/stores/ai/models/vad'
import { useChatOrchestratorStore } from '@proj-airi/stage-ui/stores/chat'
import { useCompanionStore } from '@proj-airi/stage-ui/stores/companion'
import { useSubscriptionStore } from '@proj-airi/stage-ui/stores/companion/subscription'
import { useConsciousnessStore } from '@proj-airi/stage-ui/stores/modules/consciousness'
import { useHearingSpeechInputPipeline } from '@proj-airi/stage-ui/stores/modules/hearing'
import { useProvidersStore } from '@proj-airi/stage-ui/stores/providers'
import { useSettings, useSettingsAudioDevice } from '@proj-airi/stage-ui/stores/settings'
import { breakpointsTailwind, useBreakpoints, useMouse } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

const paused = ref(false)

function handleSettingsOpen(open: boolean) {
  paused.value = open
}

const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('md')

const backgroundStore = useBackgroundStore()
const { selectedOption, sampledColor } = storeToRefs(backgroundStore)
const backgroundSurface = useTemplateRef<InstanceType<typeof BackgroundProvider>>('backgroundSurface')
const { stageModelRenderer } = storeToRefs(useSettings())

const { syncBackgroundTheme } = useBackgroundThemeColor({ backgroundSurface, selectedOption, sampledColor })
onMounted(() => syncBackgroundTheme())

const settingsAudioDeviceStore = useSettingsAudioDevice()
const { stream, enabled } = storeToRefs(settingsAudioDeviceStore)
const { startRecord, stopRecord, onStopRecord } = useAudioRecorder(stream)
const hearingPipeline = useHearingSpeechInputPipeline()
const { transcribeForRecording } = hearingPipeline
const { supportsStreamInput } = storeToRefs(hearingPipeline)
const providersStore = useProvidersStore()
const consciousnessStore = useConsciousnessStore()
const { activeProvider: activeChatProvider, activeModel: activeChatModel } = storeToRefs(consciousnessStore)
const chatStore = useChatOrchestratorStore()

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
      }
    })
  }
  catch (e) {
    console.error('Audio interaction init failed:', e)
  }
}

async function handleSpeechStart() {
  if (shouldUseStreamInput.value) {
    return
  }

  startRecord()
}

async function handleSpeechEnd() {
  if (shouldUseStreamInput.value) {
    return
  }

  stopRecord()
}

function stopAudioInteraction() {
  try {
    stopOnStopRecord?.()
    stopOnStopRecord = undefined
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

const { x: mouseX, y: mouseY } = useMouse()
const cursorPosition = computed(() => ({
  x: mouseX.value,
  y: mouseY.value,
}))

const router = useRouter()
const companionStore = useCompanionStore()
const subscriptionStore = useSubscriptionStore()

function goToCompanion() {
  router.push('/companion')
}

function goToSubscription() {
  router.push('/subscription')
}

const showChatLimitBanner = computed(() =>
  subscriptionStore.isFree && subscriptionStore.chatUsagePercent >= 80,
)
</script>

<template>
  <BackgroundProvider
    ref="backgroundSurface"
    class="widgets top-widgets"
    :background="selectedOption"
    :top-color="sampledColor"
  >
    <div relative flex="~ col" z-2 h-100dvh w-100vw of-hidden>
      <div class="px-0 py-1 md:px-3 md:py-3 relative" w-full gap-2>
        <Header class="hidden md:flex" />
        <MobileHeader class="flex md:hidden" />
        <button
          class="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-sm hover:shadow-md transition-all hover:-translate-y-[calc(50%+1px)] z-20"
          @click="goToCompanion"
        >
          <span class="text-base">{{ companionStore.moodEmoji }}</span>
          <span class="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Lv.{{ companionStore.level }}
          </span>
          <span class="i-solar:chevron-right-linear text-xs text-neutral-400" />
        </button>

        <button
          v-if="!subscriptionStore.isFree"
          class="hidden md:flex absolute right-32 top-1/2 -translate-y-1/2 items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-sm z-20"
          :class="['bg-gradient-to-r', subscriptionStore.tierBadgeClass]"
          @click="goToSubscription"
        >
          <span class="i-solar:crown-bold text-xs" />
          {{ subscriptionStore.tierLabel }}
        </button>
      </div>
      <div relative flex="~ 1 row gap-y-0 gap-x-2 <md:col">
        <div relative flex-1 min-w="1/2">
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
            :cursor-position="cursorPosition"
            :enable-orbit-controls="!isMobile"
            :paused="paused"
          />
        </div>
        <InteractiveArea v-if="!isMobile" h="85dvh" absolute right-4 flex flex-1 flex-col max-w="500px" min-w="30%" />
        <MobileInteractiveArea v-if="isMobile" @settings-open="handleSettingsOpen" />
      </div>

      <Transition name="slide-up">
        <div
          v-if="showChatLimitBanner"
          class="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-lg max-w-md"
        >
          <span class="i-solar:danger-triangle-bold-duotone text-amber-500 shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="text-xs text-neutral-600 dark:text-neutral-400">
              今日剩余 {{ subscriptionStore.dailyChatRemaining }} 条消息
            </div>
            <div class="mt-1 h-1 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-amber-400 to-pink-500 transition-all"
                :style="{ width: `${subscriptionStore.chatUsagePercent}%` }"
              />
            </div>
          </div>
          <button
            class="shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-purple-500/20 hover:shadow-lg transition"
            @click="goToSubscription"
          >
            升级
          </button>
        </div>
      </Transition>
      <HoloCoupon />
    </div>
  </BackgroundProvider>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
