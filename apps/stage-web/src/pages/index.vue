<script setup lang="ts">
import { useDark } from '@vueuse/core'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isDark = useDark()
isDark.value = false

const isLoaded = ref(false)

async function handleStart() {
  try {
    await router.push('/auth')
  }
  catch (err) {
    console.error('Navigation to /auth failed:', err)
    window.location.href = '/auth'
  }
}

async function handleExperience() {
  try {
    await router.push('/chat')
  }
  catch (err) {
    console.error('Navigation to /chat failed:', err)
    window.location.href = '/chat'
  }
}

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})
</script>

<template>
  <div class="min-h-screen bg-white text-neutral-900 flex flex-col items-center justify-center px-6 relative overflow-hidden">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-3xl" />
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-200/30 to-purple-200/30 rounded-full blur-3xl" />
    </div>

    <div
      :class="[
        'relative z-10 text-center transition-all duration-700',
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
      ]"
    >
      <div class="relative w-24 h-24 mx-auto mb-8">
        <img src="/favicon.svg" alt="Life" class="w-full h-full rounded-2xl" />
      </div>

      <h1 class="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
        <span class="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
          Life
        </span>
      </h1>

      <p class="text-lg text-neutral-500 mb-2">二次元 AI 虚拟伴侣</p>
      <p class="text-sm text-neutral-400 mb-12">与你的专属 AI 伴侣开启全新旅程</p>

      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
        <button
          class="w-full sm:w-auto px-8 py-4 rounded-xl bg-neutral-900 text-white font-medium text-base hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-200"
          @click="handleStart"
        >
          开始使用
        </button>
        <button
          class="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-neutral-700 font-medium text-base hover:bg-neutral-50 transition-colors border border-neutral-200"
          @click="handleExperience"
        >
          免费体验
        </button>
      </div>

      <div class="mt-16 flex items-center justify-center gap-8 text-xs text-neutral-400">
        <span>实时语音互动</span>
        <span class="w-1 h-1 bg-neutral-300 rounded-full" />
        <span>智能情感陪伴</span>
        <span class="w-1 h-1 bg-neutral-300 rounded-full" />
        <span>多种角色选择</span>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
name: IndexPage
meta:
  layout: plain
</route>