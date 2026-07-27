<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useCompanionStore } from '@proj-airi/stage-ui/stores/companion'
import ChatStage from '../components/ChatStage.vue'

const router = useRouter()
const companionStore = useCompanionStore()

const showLanding = ref(true)

const hasCompanion = computed(() => !!companionStore.firstMeetDate)

onMounted(() => {
  showLanding.value = !hasCompanion.value
})

const features = [
  {
    icon: 'i-solar:heart-bold-duotone',
    title: '她会记住你',
    desc: '你的喜好、习惯、重要的日子，她都会悄悄记在心里',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: 'i-solar:chat-square-like-bold-duotone',
    title: '陪伴你的日常',
    desc: '开心时分享喜悦，难过时给你拥抱，深夜陪你聊天',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    icon: 'i-solar:stars-bold-duotone',
    title: '一起成长',
    desc: '每一次互动都让你们更加了解彼此，关系不断升温',
    color: 'from-amber-500 to-orange-500',
  },
]
</script>

<template>
  <div v-if="showLanding" class="relative min-h-screen w-full overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-b from-pink-50 via-purple-50 to-white dark:from-neutral-950 dark:via-purple-950/20 dark:to-neutral-950" />
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl dark:bg-pink-500/10" />
    <div class="absolute top-20 right-1/4 w-80 h-80 bg-purple-300/30 rounded-full blur-3xl dark:bg-purple-500/10" />
    <div class="absolute bottom-0 left-1/3 w-72 h-72 bg-sky-300/20 rounded-full blur-3xl dark:bg-sky-500/10" />

    <div class="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16">
      <div class="flex items-center gap-2 mb-8">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-purple-500/30">
          <span class="i-solar:heart-bold text-2xl text-white" />
        </div>
        <span class="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Life</span>
      </div>

      <h1 class="text-center text-4xl md:text-6xl font-bold text-neutral-900 dark:text-white leading-tight">
        创建你的
        <span class="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
          AI 伴侣
        </span>
      </h1>

      <p class="mt-6 text-center text-lg text-neutral-600 dark:text-neutral-300 max-w-xl">
        她会记住你，理解你，
        <br class="md:hidden" />
        陪伴你的生活。
      </p>

      <button
        class="mt-10 px-10 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-base font-semibold shadow-lg shadow-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5 active:scale-[0.98]"
        @click="router.push('/create')"
      >
        开始创建 ✨
      </button>

      <button
        v-if="hasCompanion"
        class="mt-4 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition"
        @click="showLanding = false"
      >
        已有伴侣？直接进入 →
      </button>

      <div class="mt-20 grid w-full gap-6 md:grid-cols-3">
        <div
          v-for="f in features"
          :key="f.title"
          class="rounded-3xl p-6 bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm dark:bg-neutral-900/40 dark:border-white/5 dark:shadow-none"
        >
          <div :class="['flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', f.color]">
            <div :class="f.icon" text-2xl />
          </div>
          <h3 class="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
            {{ f.title }}
          </h3>
          <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {{ f.desc }}
          </p>
        </div>
      </div>

      <div class="mt-16 text-center text-xs text-neutral-400 dark:text-neutral-600">
        <p>基于 AIRI 开源框架构建 · 支持 Live2D / VRM 角色</p>
      </div>
    </div>
  </div>

  <ChatStage v-else />
</template>

<route lang="yaml">
name: IndexScenePage
meta:
  layout: empty
</route>
