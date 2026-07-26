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
  <div class="min-h-screen bg-white text-neutral-900 flex items-center justify-center px-6">
    <div
      :class="[
        'relative z-10 w-full max-w-md transition-all duration-700',
        isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
      ]"
    >
      <div class="text-center mb-10">
        <div class="relative w-20 h-20 mx-auto mb-4">
          <img src="/favicon.svg" alt="Life" class="w-full h-full rounded-2xl" />
        </div>
        <div class="flex items-center justify-center gap-2 mb-2">
          <span class="text-xl font-semibold tracking-wide">Life</span>
        </div>
        <p class="text-sm text-neutral-500">与你的 AI 伴侣再次相遇</p>
      </div>

      <div class="bg-neutral-50 rounded-2xl p-8">
        <h2 class="text-xl font-semibold mb-2 text-center">欢迎回来</h2>
        <p class="text-sm text-neutral-500 mb-8 text-center">登录后继续与你的 AI 伴侣相伴</p>

        <button
          :disabled="loading"
          class="w-full py-3.5 rounded-xl bg-neutral-900 text-white font-medium text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          class="w-full py-3.5 rounded-xl bg-white text-neutral-700 font-medium text-sm hover:bg-neutral-100 transition-colors border border-neutral-200"
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