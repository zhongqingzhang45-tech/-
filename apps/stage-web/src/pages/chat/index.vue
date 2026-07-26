<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ChatArea } from '@proj-airi/stage-layouts/components/Widgets/ChatArea.vue'

const isLoaded = ref(false)

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})
</script>

<template>
  <div
    :class="[
      'min-h-screen bg-white text-neutral-900 transition-opacity duration-500',
      isLoaded ? 'opacity-100' : 'opacity-0',
    ]"
  >
    <ChatArea />
  </div>
</template>

<route lang="yaml">
name: ChatPage
meta:
  layout: plain
</route>