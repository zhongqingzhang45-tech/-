<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

const router = useRouter()
const loaded = ref(false)

async function handleStart() {
  try {
    await router.push('/auth')
  }
  catch {
    window.location.href = '/auth'
  }
}

async function handleExperience() {
  try {
    await router.push('/chat')
  }
  catch {
    window.location.href = '/chat'
  }
}

onMounted(() => {
  setTimeout(() => {
    loaded.value = true
  }, 150)
})
</script>

<template>
  <div class="relative min-h-screen w-full overflow-hidden bg-neutral-900 text-white">
    <div class="absolute inset-0 bg-gradient-to-br from-neutral-900 via-purple-950/20 to-neutral-900" />
    
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
      <div class="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[100px]" />
    </div>

    <div class="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
      <div
        :class="[
          'transition-all duration-1000 ease-out',
          loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        ]"
      >
        <div class="relative mb-8">
          <div class="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl blur-lg opacity-30 animate-pulse" />
          <img
            src="/character.avif"
            alt="Life Character"
            class="relative w-[300px] h-[400px] md:w-[400px] md:h-[530px] object-contain"
          />
        </div>

        <div class="text-center mb-10">
          <h1 class="font-cuteen text-5xl md:text-6xl lg:text-7xl font-bold mb-4">
            <span class="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Life
            </span>
          </h1>
          <p class="text-lg md:text-xl text-neutral-400 mb-2">
            二次元 AI 虚拟伴侣
          </p>
          <p class="text-sm text-neutral-500">
            一个用来存放人工智能老婆/虚拟角色灵魂的容器，<br class="hidden sm:block" />
            可以将她们带入我们的世界。
          </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            class="px-8 py-3.5 text-sm font-medium rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 active:scale-[0.98] transition-all shadow-lg shadow-purple-500/30"
            @click="handleExperience"
          >
            试玩体验
          </button>
          <button
            class="px-8 py-3.5 text-sm font-medium rounded-xl bg-neutral-800 text-white hover:bg-neutral-700 active:scale-[0.98] transition-all border border-neutral-700"
          >
            下载
          </button>
          <button
            class="px-8 py-3.5 text-sm font-medium rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 active:scale-[0.98] transition-all"
            @click="handleStart"
          >
            开始使用
          </button>
        </div>

        <div class="mt-16 text-xs text-neutral-500">
          2024年起 @Project Life
        </div>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
name: IndexPage
meta:
  layout: plain
</route>
