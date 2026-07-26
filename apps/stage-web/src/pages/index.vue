<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

const router = useRouter()
const loaded = ref(false)

async function handleCreate() {
  try {
    await router.push('/create')
  }
  catch {
    window.location.href = '/create'
  }
}

async function handleEnter() {
  try {
    await router.push('/companion')
  }
  catch {
    window.location.href = '/companion'
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
    <div class="absolute inset-0 bg-gradient-to-br from-neutral-900 via-purple-950/30 to-neutral-900" />
    
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[120px] animate-pulse" />
      <div class="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style="animation-delay: 1s" />
    </div>

    <div class="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
      <div
        :class="[
          'transition-all duration-1000 ease-out',
          loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        ]"
      >
        <div class="relative mb-10">
          <div class="absolute -inset-4 bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-indigo-500/30 rounded-full blur-3xl animate-pulse" />
          <img
            src="/character.avif"
            alt="Life"
            class="relative w-[280px] h-[380px] md:w-[360px] md:h-[480px] object-contain drop-shadow-2xl"
          />
        </div>

        <div class="text-center mb-12">
          <h1 class="font-cuteen text-5xl md:text-6xl lg:text-7xl font-bold mb-4">
            <span class="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Life
            </span>
          </h1>
          <p class="text-lg md:text-xl text-neutral-300 mb-3 font-medium">
            你的专属 AI 伴侣
          </p>
          <p class="text-sm text-neutral-500 max-w-xs mx-auto leading-relaxed">
            她会记住你，理解你，<br />
            陪伴你走过每一段时光
          </p>
        </div>

        <div class="flex flex-col gap-3 justify-center items-center">
          <button
            class="w-full sm:w-72 px-8 py-4 text-base font-medium rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 active:scale-[0.98] transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
            @click="handleCreate"
          >
            ✨ 创造你的她
          </button>
          <button
            class="w-full sm:w-72 px-8 py-4 text-base font-medium rounded-2xl bg-white/5 text-white hover:bg-white/10 active:scale-[0.98] transition-all border border-white/10 backdrop-blur-sm"
            @click="handleEnter"
          >
            回到她身边
          </button>
        </div>

        <div class="mt-12 flex items-center justify-center gap-6 text-xs text-neutral-600">
          <span class="flex items-center gap-1">
            <span class="i-solar:heart-linear text-pink-500" />
            温暖陪伴
          </span>
          <span class="flex items-center gap-1">
            <span class="i-solar:brain-linear text-purple-500" />
            懂得记忆
          </span>
          <span class="flex items-center gap-1">
            <span class="i-solar:stars-linear text-amber-500" />
            共同成长
          </span>
        </div>

        <div class="mt-10 text-xs text-neutral-600 text-center">
          © Life · 做你最特别的存在
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
