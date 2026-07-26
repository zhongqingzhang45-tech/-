<script setup lang="ts">
import { WidgetStage } from '@proj-airi/stage-ui/components/scenes'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

const router = useRouter()
const loaded = ref(false)

async function handleStart() {
  try {
    await router.push('/auth')
  }
  catch (err) {
    window.location.href = '/auth'
  }
}

onMounted(() => {
  setTimeout(() => {
    loaded.value = true
  }, 200)
})
</script>

<template>
  <div relative h-full w-full overflow-hidden>
    <WidgetStage
      h-full w-full
      absolute inset-0 z-0
    />
    <div
      absolute inset-0 z-10
      flex="~ col"
      items-center justify-center
      px-6
      pointer-events-none
      :class="loaded ? 'opacity-100' : 'opacity-0'"
      transition="opacity duration-700"
    >
      <div text-center pointer-events-auto>
        <h1
          text="4xl md:5xl"
          font-bold
          mb="4"
          tracking-tight
        >
          <span bg-gradient-to-r="from-pink-500 via-purple-500 to-indigo-500" bg-clip-text text-transparent>
            Life
          </span>
        </h1>
        <p text-lg text-neutral-500 mb-12>
          二次元 AI 虚拟伴侣
        </p>
        <button
          px-10 py-4
          text-base font-medium
          rounded-2xl
          bg-neutral-900 text-white
          hover:bg-neutral-800
          transition-colors
          shadow-lg shadow-neutral-200/50
          @click="handleStart"
        >
          开始使用
        </button>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
name: IndexPage
meta:
  layout: stage
</route>
