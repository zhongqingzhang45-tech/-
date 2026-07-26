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
  if (!card) return ''
  return card.name || ''
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
