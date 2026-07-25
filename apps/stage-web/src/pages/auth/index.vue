<script setup lang="ts">
import { triggerSignIn } from '@proj-airi/stage-ui/libs/auth'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    await triggerSignIn()
  }
  catch (err) {
    console.error('Login failed:', err)
    loading.value = false
  }
}

function handleGuest() {
  router.push('/chat')
}
</script>

<template>
  <div class="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6 relative overflow-hidden">
    <!-- 背景光效 -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-pink-500/15 blur-[120px]" />
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/15 blur-[120px]" />
    </div>

    <div class="relative z-10 w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 mb-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <span class="text-lg font-bold">L</span>
          </div>
          <span class="text-xl font-semibold tracking-tight">Life</span>
        </div>
        <p class="text-sm text-neutral-500">二次元 AI 虚拟伴侣</p>
      </div>

      <!-- 登录卡片 -->
      <div class="bg-white/[0.03] border border-white/5 rounded-2xl p-8 backdrop-blur-xl">
        <h2 class="text-xl font-semibold mb-2 text-center">欢迎回来</h2>
        <p class="text-sm text-neutral-400 mb-6 text-center">登录后即可与你的 AI 伴侣继续相伴</p>

        <!-- 登录按钮 -->
        <button
          :disabled="loading"
          class="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 transition-all text-white font-medium text-sm shadow-lg shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleLogin"
        >
          {{ loading ? '正在跳转...' : '立即登录' }}
        </button>

        <!-- 分隔线 -->
        <div class="flex items-center gap-3 my-6">
          <div class="flex-1 h-px bg-white/5" />
          <span class="text-xs text-neutral-600">或</span>
          <div class="flex-1 h-px bg-white/5" />
        </div>

        <!-- 游客模式 -->
        <button
          class="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white font-medium text-sm"
          @click="handleGuest"
        >
          以游客身份体验
        </button>
      </div>

      <!-- 返回首页 -->
      <div class="text-center mt-6">
        <button
          class="text-sm text-neutral-500 hover:text-white transition-colors"
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
