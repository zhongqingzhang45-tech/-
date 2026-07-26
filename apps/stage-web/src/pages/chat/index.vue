<script setup lang="ts">
import { ChatSessionsDrawer } from '@proj-airi/stage-ui/components'
import { WidgetStage } from '@proj-airi/stage-ui/components/scenes'
import InteractiveArea from '@proj-airi/stage-layouts/components/Layouts/InteractiveArea.vue'
import { useCompanionStore } from '@proj-airi/stage-ui/stores/companion'
import { computed, ref } from 'vue'

const sessionsDrawerOpen = ref(false)
const companionStore = useCompanionStore()

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
</script>

<template>
  <div class="relative h-full w-full overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
    <WidgetStage class="h-full w-full" />

    <div class="absolute inset-0 z-10 overflow-y-scroll">
      <div class="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div class="flex items-center gap-3 px-4 py-2 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white shadow-lg">
          <span class="text-lg">{{ moodEmoji }}</span>
          <span class="text-sm font-medium">Life</span>
          <span class="w-px h-4 bg-white/20" />
          <span class="text-xs text-white/70 flex items-center gap-1">
            <span class="i-solar:heart-bold text-pink-400" />
            {{ companionStore.relationshipTitle }} · Lv.{{ companionStore.level }}
          </span>
          <span class="w-px h-4 bg-white/20" />
          <span class="text-xs text-white/60 flex items-center gap-1">
            <span class="i-solar:calendar-bold-duotone" />
            {{ companionStore.daysTogether }} 天
          </span>
        </div>

        <div class="mt-2 mx-2 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all duration-500"
            :style="{ width: `${Math.round(companionStore.levelProgress * 100)}%` }"
          />
        </div>
      </div>

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
