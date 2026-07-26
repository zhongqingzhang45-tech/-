<script setup lang="ts">
import { ChatSessionsDrawer } from '@proj-airi/stage-ui/components'
import { WidgetStage } from '@proj-airi/stage-ui/components/scenes'
import InteractiveArea from '@proj-airi/stage-layouts/components/Layouts/InteractiveArea.vue'
import { shallowRef } from 'vue'

const sessionsDrawerOpen = shallowRef(false)
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
