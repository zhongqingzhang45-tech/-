<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

async function handleStart() {
  try {
    await router.push('/chat')
  }
  catch (err) {
    window.location.href = '/chat'
  }
}
</script>

<template>
  <div h-full w-full>
    <div
      flex="~ col"
      items-center justify-center
      h-full w-full
      px-6
    >
      <button
        text-xl font-medium
        px-8 py-4
        rounded-xl
        bg-neutral-900 text-white
        hover:bg-neutral-800
        transition-colors
        @click="handleStart"
      >
        开始
      </button>
    </div>
  </div>
</template>

<route lang="yaml">
name: IndexPage
meta:
  layout: stage
</route>
