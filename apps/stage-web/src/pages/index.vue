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
  <div class="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-[-5%] right-[-5%] w-[550px] h-[550px] bg-gradient-to-br from-pink-200/40 to-purple-200/30 rounded-full blur-[100px]" />
      <div class="absolute bottom-[-10%] left-[-5%] w-[450px] h-[450px] bg-gradient-to-tr from-blue-100/40 to-pink-100/30 rounded-full blur-[100px]" />
      <div class="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-gradient-to-br from-purple-100/30 to-indigo-100/20 rounded-full blur-[80px]" />
    </div>

    <div class="absolute inset-0 flex items-center justify-center z-0">
      <img
        :class="[
          'transition-all duration-1000 ease-out',
          loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        ]"
        src="/character.avif"
        alt="Life Character"
        class="w-[280px] h-[350px] md:w-[380px] md:h-[475px] object-contain"
      />
    </div>

    <div
      :class="[
        'absolute inset-0 z-10 flex flex-col items-center justify-center px-6',
        'transition-all duration-1000 ease-out',
        loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
      ]"
    >
      <div class="text-center">
        <div
          :class="[
            'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm text-pink-500 text-xs font-medium mb-6',
            'border border-pink-100 shadow-sm',
            'transition-all duration-700 delay-200',
            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-90',
          ]"
        >
          <span class="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
          你的专属 AI 伴侣
        </div>

        <h1 class="font-cuteen text-6xl md:text-7xl lg:text-8xl font-bold mb-3 leading-tight">
          <span class="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Life
          </span>
        </h1>

        <p class="font-cuteen text-xl md:text-2xl text-neutral-600 mb-2">
          二次元 AI 虚拟伴侣
        </p>
        <p class="text-sm text-neutral-400 mb-12">
          聊天 · 陪伴 · 共同生活
        </p>

        <div
          :class="[
            'flex flex-col sm:flex-row gap-4 justify-center',
            'transition-all duration-700 delay-400',
            loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
          ]"
        >
          <button
            class="group px-10 py-4 text-sm font-semibold rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 active:scale-[0.98] transition-all shadow-xl shadow-pink-200/50"
            @click="handleStart"
          >
            <span class="relative z-10">开始使用</span>
            <span class="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            class="px-10 py-4 text-sm font-semibold rounded-2xl bg-white text-neutral-700 hover:bg-neutral-50 active:scale-[0.98] transition-all border border-neutral-200 shadow-lg"
            @click="handleExperience"
          >
            免费体验
          </button>
        </div>

        <div
          :class="[
            'flex items-center justify-center gap-8 mt-16 text-xs text-neutral-400',
            'transition-all duration-700 delay-600',
            loaded ? 'opacity-100' : 'opacity-0',
          ]"
        >
          <span class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
              <span class="w-1.5 h-1.5 rounded-full bg-pink-500" />
            </span>
            实时语音
          </span>
          <span class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-gradient-to-br from-purple-200 to-indigo-200 flex items-center justify-center">
              <span class="w-1.5 h-1.5 rounded-full bg-purple-500" />
            </span>
            情感陪伴
          </span>
          <span class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-200 to-blue-200 flex items-center justify-center">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            </span>
            多角色
          </span>
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
