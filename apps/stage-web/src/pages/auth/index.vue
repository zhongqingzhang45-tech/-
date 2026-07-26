<script setup lang="ts">
import { triggerSignIn } from '@proj-airi/stage-ui/libs/auth'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const isLoaded = ref(false)

async function goToChat() {
  try {
    await router.push('/chat')
  }
  catch (err) {
    window.location.href = '/chat'
  }
}

async function handleLogin() {
  loading.value = true
  try {
    await triggerSignIn()
    await goToChat()
  }
  catch (err) {
    await goToChat()
  }
}

async function handleGuest() {
  await goToChat()
}

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})
</script>

<template>
  <div class="relative min-h-screen bg-neutral-900 text-white flex items-center justify-center px-6 overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-br from-neutral-900 via-purple-950/20 to-neutral-900" />
    
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]" />
      <div class="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-pink-500/5 rounded-full blur-[100px]" />
    </div>

    <div
      :class="[
        'relative z-10 w-full max-w-md transition-all duration-700',
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
      ]"
    >
      <div class="text-center mb-10">
        <div class="relative w-16 h-16 mx-auto mb-4">
          <div class="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl blur-lg opacity-30" />
          <img src="/favicon.svg" alt="Life" class="relative w-full h-full rounded-2xl" />
        </div>
        <h1 class="font-cuteen text-3xl font-bold mb-2">
          <span class="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Life
          </span>
        </h1>
        <p class="text-sm text-neutral-400">与你的 AI 伴侣再次相遇</p>
      </div>

      <div class="bg-neutral-800/80 backdrop-blur-sm rounded-2xl p-8 border border-neutral-700/50">
        <h2 class="font-cuteen text-lg font-semibold mb-1.5 text-center">欢迎回来</h2>
        <p class="text-sm text-neutral-400 mb-8 text-center">登录后继续与你的 AI 伴侣相伴</p>

        <button
          :disabled="loading"
          class="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium text-sm hover:from-pink-600 hover:to-purple-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30"
          @click="handleLogin"
        >
          {{ loading ? '正在跳转...' : '立即登录' }}
        </button>

        <div class="flex items-center gap-3 my-6">
          <div class="flex-1 h-px bg-neutral-700" />
          <span class="text-xs text-neutral-500">或</span>
          <div class="flex-1 h-px bg-neutral-700" />
        </div>

        <button
          class="w-full py-3.5 rounded-xl bg-neutral-700/50 text-white font-medium text-sm hover:bg-neutral-700 active:scale-[0.98] transition-all border border-neutral-600"
          @click="handleGuest"
        >
          以游客身份体验
        </button>
      </div>

      <div class="text-center mt-8">
        <button
          class="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
          @click="router.push('/')"
        >
          ← 返回首页
        </button>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
name: AuthPage
meta:
  layout: plain
</route>
