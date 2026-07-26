<script setup lang="ts">
import { ChatSessionsDrawer } from '@proj-airi/stage-ui/components'
import { WidgetStage } from '@proj-airi/stage-ui/components/scenes'
import InteractiveArea from '@proj-airi/stage-layouts/components/Layouts/InteractiveArea.vue'
import { useCompanionStore } from '@proj-airi/stage-ui/stores/companion'
import { useChatSessionStore } from '@proj-airi/stage-ui/stores/chat/session-store'
import { useAiriCardStore } from '@proj-airi/stage-ui/stores/modules'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'

const sessionsDrawerOpen = ref(false)
const companionStore = useCompanionStore()
const chatSessionStore = useChatSessionStore()
const airiCardStore = useAiriCardStore()
const { activeCard } = storeToRefs(airiCardStore)

const characterName = computed(() => {
  const card = activeCard.value
  if (!card) return 'Life'
  return card.name || 'Life'
})

const moodEmoji = computed(() => {
  const mood = companionStore.currentMood
  switch (mood) {
    case 'excited': return '✨'
    case 'happy': return '😊'
    case 'shy': return '😳'
    case 'sad': return '😔'
    default: return '🙂'
  }
})

watch(
  () => chatSessionStore.messages.length,
  (newLen, oldLen) => {
    if (newLen > oldLen && newLen > 0) {
      const lastMsg = chatSessionStore.messages[newLen - 1]
      if (lastMsg?.role === 'user') {
        companionStore.recordChat()
      }
    }
  },
)
</script>

<template>
  <div class="relative h-full w-full overflow-hidden">
    <WidgetStage class="h-full w-full" />

    <div class="absolute top-4 left-4 z-20">
      <div
        :class="[
          'flex items-center gap-3 px-4 py-3 rounded-2xl',
          'bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl',
          'border border-white/50 dark:border-neutral-700/50',
          'shadow-lg shadow-purple-500/5',
        ]"
      >
        <div
          :class="[
            'flex h-10 w-10 items-center justify-center rounded-xl',
            'bg-gradient-to-br from-pink-400 to-purple-500',
            'text-lg shadow-md',
          ]"
        >
          {{ moodEmoji }}
        </div>
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-neutral-800 dark:text-neutral-100">
              {{ characterName }}
            </span>
            <span
              :class="[
                'text-xs px-2 py-0.5 rounded-full font-medium',
                'bg-gradient-to-r from-pink-500/10 to-purple-500/10',
                'text-pink-600 dark:text-pink-400',
              ]"
            >
              {{ companionStore.relationshipTitle }}
            </span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <div class="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
              <span class="i-solar:heart-bold text-pink-400 text-xs" />
              <span>Lv.{{ companionStore.level }}</span>
            </div>
            <div class="w-20 h-1 rounded-full bg-neutral-200/60 dark:bg-neutral-700/60 overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all duration-700"
                :style="{ width: `${Math.round(companionStore.levelProgress * 100)}%` }"
              />
            </div>
            <span class="text-xs text-neutral-400 dark:text-neutral-500">
              {{ companionStore.daysTogether }} 天
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="absolute inset-0 z-10 overflow-y-scroll">
      <InteractiveArea
        v-model:sessions-drawer-open="sessionsDrawerOpen"
        class="interaction-area block"
        h-full w-full p-4
      />
      <ChatSessionsDrawer v-model="sessionsDrawerOpen" />
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: stage
</route>
