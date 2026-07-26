<script setup lang="ts">
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
  }, 100)
})
</script>

<template>
  <div class="relative h-full w-full overflow-hidden bg-white">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-pink-200/40 to-purple-200/40 rounded-full blur-3xl" />
      <div class="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-blue-200/30 to-pink-200/30 rounded-full blur-3xl" />
    </div>

    <div
      :class="[
        'absolute inset-0 z-10 flex flex-col items-center justify-center px-6 transition-all duration-700 ease-out',
        loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
      ]"
    >
      <div class="relative w-[260px] h-[320px] md:w-[340px] md:h-[420px] mb-8">
        <img
          src="/open-graph.png"
          alt="Life"
          class="w-full h-full object-contain select-none"
          draggable="false"
        />
      </div>

      <div class="text-center">
        <h1 class="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
          <span class="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Life
          </span>
        </h1>
        <p class="text-base text-neutral-500 mb-10">
          二次元 AI 虚拟伴侣
        </p>
        <button
          class="px-10 py-3.5 text-base font-medium rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-200/50"
          @click="handleStart"
        >
          开始使用
        </button>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
name: IndexPage
meta:
  layout: stage
</route>
