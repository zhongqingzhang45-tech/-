<script setup lang="ts">
import { ref } from 'vue'

const tabs = ref('short-term')

const shortTermMemories = ref([
  { id: 1, content: '用户喜欢喝咖啡，每天早上一杯', time: '今天 09:30', type: 'preference' },
  { id: 2, content: '用户提到最近在学习编程', time: '今天 14:20', type: 'fact' },
  { id: 3, content: '用户说最近心情不太好', time: '昨天 20:15', type: 'emotion' },
  { id: 4, content: '用户喜欢听音乐，特别是轻音乐', time: '昨天 16:00', type: 'preference' },
  { id: 5, content: '用户养了一只猫叫小白', time: '3天前', type: 'fact' },
  { id: 6, content: '用户生日是 6 月 15 日', time: '1周前', type: 'important' },
])

const longTermMemories = ref([
  { id: 1, title: '关于我', count: 12, icon: 'i-solar:user-circle-linear', color: 'from-blue-500 to-cyan-500' },
  { id: 2, title: '我的喜好', count: 28, icon: 'i-solar:heart-linear', color: 'from-pink-500 to-rose-500' },
  { id: 3, title: '重要事件', count: 8, icon: 'i-solar:star-linear', color: 'from-amber-500 to-orange-500' },
  { id: 4, title: '我们的故事', count: 15, icon: 'i-solar:book-2-linear', color: 'from-purple-500 to-violet-500' },
])

const memoryCategories = [
  { id: 'all', name: '全部', count: 256 },
  { id: 'preference', name: '喜好', count: 48 },
  { id: 'fact', name: '事实', count: 89 },
  { id: 'emotion', name: '情绪', count: 34 },
  { id: 'important', name: '重要', count: 12 },
]

const activeCategory = ref('all')

function getTypeIcon(type: string): string {
  const map: Record<string, string> = {
    preference: 'i-solar:heart-linear',
    fact: 'i-solar:info-circle-linear',
    emotion: 'i-solar:emoji-funny-circle-linear',
    important: 'i-solar:star-linear',
  }
  return map[type] || 'i-solar:document-text-linear'
}

function getTypeColor(type: string): string {
  const map: Record<string, string> = {
    preference: 'text-pink-500 bg-pink-500/10',
    fact: 'text-blue-500 bg-blue-500/10',
    emotion: 'text-amber-500 bg-amber-500/10',
    important: 'text-purple-500 bg-purple-500/10',
  }
  return map[type] || 'text-neutral-500 bg-neutral-500/10'
}
</script>

<template>
  <div class="h-full w-full overflow-y-auto p-4 md:p-6 scrollbar-none">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        记忆中心
      </h1>
      <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        她记住了关于你的一切
      </p>
    </div>

    <!-- Tabs -->
    <div class="mb-6 flex gap-1 rounded-2xl bg-neutral-100/80 p-1 dark:bg-neutral-800/60 w-fit">
      <button
        :class="[
          'rounded-xl px-5 py-2 text-sm font-medium transition-all',
          tabs === 'short-term'
            ? 'bg-white text-purple-600 shadow-sm dark:bg-neutral-900 dark:text-purple-400'
            : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200',
        ]"
        @click="tabs = 'short-term'"
      >
        短期记忆
      </button>
      <button
        :class="[
          'rounded-xl px-5 py-2 text-sm font-medium transition-all',
          tabs === 'long-term'
            ? 'bg-white text-purple-600 shadow-sm dark:bg-neutral-900 dark:text-purple-400'
            : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200',
        ]"
        @click="tabs = 'long-term'"
      >
        长期记忆
      </button>
    </div>

    <!-- Short Term -->
    <div v-if="tabs === 'short-term'" class="flex flex-col gap-6">
      <!-- Stats -->
      <div class="grid grid-cols-3 gap-3">
        <div
          :class="[
            'rounded-2xl p-4 text-center',
            'bg-gradient-to-br from-purple-500/10 to-pink-500/10',
            'border border-purple-200/50 dark:border-purple-800/30',
          ]"
        >
          <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {{ shortTermMemories.length }}
          </div>
          <div class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            近期记忆
          </div>
        </div>
        <div
          :class="[
            'rounded-2xl p-4 text-center',
            'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
            'border border-blue-200/50 dark:border-blue-800/30',
          ]"
        >
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
            24h
          </div>
          <div class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            保留时间
          </div>
        </div>
        <div
          :class="[
            'rounded-2xl p-4 text-center',
            'bg-gradient-to-br from-emerald-500/10 to-teal-500/10',
            'border border-emerald-200/50 dark:border-emerald-800/30',
          ]"
        >
          <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            87%
          </div>
          <div class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            关联度
          </div>
        </div>
      </div>

      <!-- Category Filter -->
      <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          v-for="cat in memoryCategories"
          :key="cat.id"
          :class="[
            'flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all',
            activeCategory === cat.id
              ? 'bg-purple-500 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700',
          ]"
          @click="activeCategory = cat.id"
        >
          {{ cat.name }} · {{ cat.count }}
        </button>
      </div>

      <!-- Memory List -->
      <div class="flex flex-col gap-3">
        <div
          v-for="mem in shortTermMemories"
          :key="mem.id"
          :class="[
            'group rounded-2xl p-4 transition-all duration-200',
            'bg-white/80 backdrop-blur-sm dark:bg-neutral-900/60',
            'border border-neutral-200/60 dark:border-neutral-800/60',
            'hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
          ]"
        >
          <div class="flex items-start gap-3">
            <div
              :class="[
                'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl',
                getTypeColor(mem.type),
              ]"
            >
              <div :class="getTypeIcon(mem.type)" text-lg />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                {{ mem.content }}
              </p>
              <p class="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
                {{ mem.time }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Long Term -->
    <div v-else class="flex flex-col gap-6">
      <!-- Long Term Categories -->
      <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div
          v-for="cat in longTermMemories"
          :key="cat.id"
          :class="[
            'group rounded-2xl p-5 transition-all duration-200 cursor-pointer',
            'bg-white/80 backdrop-blur-sm dark:bg-neutral-900/60',
            'border border-neutral-200/60 dark:border-neutral-800/60',
            'hover:shadow-lg hover:-translate-y-1',
          ]"
        >
          <div
            :class="[
              'mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white',
              cat.color,
            ]"
          >
            <div :class="cat.icon" text-2xl />
          </div>
          <h3 class="font-semibold text-neutral-800 dark:text-neutral-200">
            {{ cat.title }}
          </h3>
          <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {{ cat.count }} 条记忆
          </p>
        </div>
      </div>

      <!-- Timeline Preview -->
      <div>
        <h3 class="mb-4 text-lg font-semibold text-neutral-800 dark:text-neutral-200">
          记忆时间线
        </h3>
        <div class="relative">
          <div class="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/30 via-pink-500/30 to-transparent" />
          
          <div class="flex flex-col gap-4">
            <div
              v-for="(mem, idx) in shortTermMemories.slice(0, 4)"
              :key="mem.id"
              class="relative flex gap-4 pl-10"
            >
              <div
                :class="[
                  'absolute left-3 top-2 h-4 w-4 rounded-full',
                  'bg-gradient-to-br from-purple-500 to-pink-500',
                  'ring-4 ring-white dark:ring-neutral-900',
                ]"
              />
              <div
                :class="[
                  'flex-1 rounded-2xl p-4',
                  'bg-white/60 backdrop-blur-sm dark:bg-neutral-900/40',
                  'border border-neutral-200/60 dark:border-neutral-800/60',
                ]"
              >
                <p class="text-sm text-neutral-700 dark:text-neutral-300">
                  {{ mem.content }}
                </p>
                <p class="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
                  {{ mem.time }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Info -->
      <div
        :class="[
          'rounded-2xl p-6',
          'bg-gradient-to-br from-purple-500/5 to-pink-500/5',
          'border border-purple-200/50 dark:border-purple-800/30',
        ]"
      >
        <div class="flex items-start gap-3">
          <div class="i-solar:info-circle-linear text-2xl text-purple-500 flex-shrink-0" />
          <div>
            <h4 class="font-semibold text-neutral-800 dark:text-neutral-200">
              关于长期记忆
            </h4>
            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              重要的记忆会被自动整理并长期保存。随着你们相处时间增长，她会越来越了解你。
              记忆会被分类整理，形成对你的完整认知。
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: settings
  title: 记忆中心
  subtitle: 她记住了关于你的一切
</route>
