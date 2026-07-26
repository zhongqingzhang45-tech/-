<script setup lang="ts">
import { WidgetStage } from '@proj-airi/stage-ui/components/scenes'
import { ErrorBoundary } from '@proj-airi/ui'
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
  }, 150)
})
</script>

<template>
  <div class="relative h-full w-full overflow-hidden bg-white">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-br from-pink-100/60 to-purple-100/40 rounded-full blur-3xl" />
      <div class="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-tr from-blue-50/50 to-pink-100/30 rounded-full blur-3xl" />
    </div>

    <ErrorBoundary :retryable="false" class="absolute inset-0 z-0">
      <template #fallback>
        <div class="absolute inset-0 flex items-center justify-end pr-8 md:pr-20">
          <img
            src="/open-graph.png"
            alt="Character"
            class="w-[300px] h-[380px] md:w-[420px] md:h-[520px] object-contain opacity-90"
          />
        </div>
      </template>
      <WidgetStage class="h-full w-full" />
    </ErrorBoundary>

    <div
      :class="[
        'absolute inset-0 z-10 flex items-center px-8 md:px-16 lg:px-24',
        'transition-all duration-700 ease-out',
        loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
      ]"
    >
      <div class="max-w-md">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 text-pink-500 text-xs font-medium mb-6">
          <span class="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
          你的 AI 伴侣已就绪
        </div>

        <h1 class="font-cuteen text-5xl md:text-6xl font-bold mb-4 leading-tight">
          <span class="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Life
          </span>
        </h1>

        <p class="font-cuteen text-xl text-neutral-600 mb-2">
          二次元 AI 虚拟伴侣
        </p>
        <p class="text-sm text-neutral-400 mb-10 leading-relaxed">
          与你的专属 AI 伴侣开启全新旅程<br />
          聊天、陪伴、共同生活
        </p>

        <div class="flex flex-col sm:flex-row gap-3">
          <button
            class="px-8 py-3.5 text-sm font-medium rounded-2xl bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-lg shadow-neutral-200/60"
            @click="handleStart"
          >
            开始使用
          </button>
          <button
            class="px-8 py-3.5 text-sm font-medium rounded-2xl bg-white text-neutral-700 hover:bg-neutral-50 active:scale-[0.98] transition-all border border-neutral-200"
            @click="() => router.push('/chat').catch(() => window.location.href = '/chat')"
          >
            免费体验
          </button>
        </div>

        <div class="flex items-center gap-6 mt-12 text-xs text-neutral-400">
          <span class="flex items-center gap-1.5">
            <span class="w-1 h-1 rounded-full bg-neutral-300" />
            实时语音
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-1 h-1 rounded-full bg-neutral-300" />
            情感陪伴
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-1 h-1 rounded-full bg-neutral-300" />
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
