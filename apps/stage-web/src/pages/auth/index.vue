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
    console.error('Navigation to /chat failed:', err)
    window.location.href = '/chat'
  }
}

async function handleLogin() {
  loading.value = true
  try {
    await triggerSignIn()
    // If triggerSignIn succeeds without redirecting, go to chat
    await goToChat()
  }
  catch (err) {
    console.error('Login failed, entering as guest:', err)
    // Login service may be unavailable in Life build; go to chat anyway
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
  <div class="relative min-h-screen bg-white text-neutral-900 flex items-center justify-center px-6 overflow-hidden">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-pink-100/50 to-purple-100/30 rounded-full blur-3xl" />
      <div class="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-gradient-to-tr from-blue-50/50 to-pink-100/30 rounded-full blur-3xl" />
    </div>

    <div
      :class="[
        'relative z-10 w-full max-w-md transition-all duration-700',
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
      ]"
    >
      <div class="text-center mb-10">
        <div class="relative w-16 h-16 mx-auto mb-4">
          <img src="/favicon.svg" alt="Life" class="w-full h-full rounded-2xl" />
        </div>
        <h1 class="font-cuteen text-3xl font-bold mb-2">
          <span class="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Life
          </span>
        </h1>
        <p class="text-sm text-neutral-500">与你的 AI 伴侣再次相遇</p>
      </div>

      <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-neutral-100 shadow-xl shadow-neutral-200/40">
        <h2 class="font-cuteen text-lg font-semibold mb-1.5 text-center">欢迎回来</h2>
        <p class="text-sm text-neutral-500 mb-8 text-center">登录后继续与你的 AI 伴侣相伴</p>

        <button
          :disabled="loading"
          class="w-full py-3.5 rounded-xl bg-neutral-900 text-white font-medium text-sm hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-neutral-200/60"
          @click="handleLogin"
        >
          {{ loading ? '正在跳转...' : '立即登录' }}
        </button>

        <div class="flex items-center gap-3 my-6">
          <div class="flex-1 h-px bg-neutral-200" />
          <span class="text-xs text-neutral-400">或</span>
          <div class="flex-1 h-px bg-neutral-200" />
        </div>

        <button
          class="w-full py-3.5 rounded-xl bg-white text-neutral-700 font-medium text-sm hover:bg-neutral-50 active:scale-[0.98] transition-all border border-neutral-200"
          @click="handleGuest"
        >
          以游客身份体验
        </button>
      </div>

      <div class="text-center mt-8">
        <button
          class="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
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