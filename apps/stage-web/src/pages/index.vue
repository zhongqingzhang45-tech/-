<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

const router = useRouter()
const loaded = ref(false)

async function handleCreate() {
  try {
    await router.push('/settings/characters')
  }
  catch {
    window.location.href = '/settings/characters'
  }
}

async function handleEnter() {
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
            AI 虚拟生命陪伴
          </p>
          <p class="text-sm text-neutral-500">
            创造属于你的 AI 伴侣，开启一段独特的陪伴之旅
          </p>
        </div>

        <div class="flex flex-col gap-4 justify-center items-center">
          <button
            class="w-full sm:w-64 px-8 py-4 text-base font-medium rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 active:scale-[0.98] transition-all shadow-lg shadow-purple-500/30"
            @click="handleCreate"
          >
            创造她
          </button>
          <button
            class="w-full sm:w-64 px-8 py-4 text-base font-medium rounded-2xl bg-white/10 text-white hover:bg-white/20 active:scale-[0.98] transition-all border border-white/20 backdrop-blur-sm"
            @click="handleEnter"
          >
            进入我的 Life
          </button>
        </div>

        <div class="mt-16 text-xs text-neutral-500 text-center">
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
