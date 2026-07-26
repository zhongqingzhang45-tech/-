<script setup lang="ts">
import { ChatSessionsDrawer } from '@proj-airi/stage-ui/components'
import InteractiveArea from '@proj-airi/stage-layouts/components/Layouts/InteractiveArea.vue'
import { shallowRef } from 'vue'

const sessionsDrawerOpen = shallowRef(false)
</script>

<template>
  <div h-full w-full overflow-y-scroll>
    <InteractiveArea
      v-model:sessions-drawer-open="sessionsDrawerOpen"
      class="interaction-area block"
      h-full w-full p-4
    />
    <ChatSessionsDrawer v-model="sessionsDrawerOpen" />
  </div>
</template>

<route lang="yaml">
meta:
  layout: stage
</route>