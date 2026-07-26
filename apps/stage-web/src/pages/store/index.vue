<script setup lang="ts">
import { ref } from 'vue'

const categories = ref([
  { id: 'characters', name: '角色', icon: 'i-solar:user-heart-linear', count: 12 },
  { id: 'voices', name: '声音', icon: 'i-solar:microphone-2-linear', count: 28 },
  { id: 'skins', name: '皮肤', icon: 'i-solar:palette-linear', count: 8 },
  { id: 'models', name: '模型', icon: 'i-solar:cpu-linear', count: 15 },
])

const featured = ref([
  { id: 1, name: '小樱', description: '温柔体贴的邻家女孩', price: '¥29', tag: '热门' },
  { id: 2, name: '喵咪酱', description: '傲娇可爱的猫娘', price: '¥39', tag: '新品' },
  { id: 3, name: '学姐', description: '成熟稳重的知性姐姐', price: '¥49', tag: '推荐' },
])
</script>

<template>
  <div class="h-full w-full overflow-y-auto p-6 scrollbar-none">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Life 商店
      </h1>
      <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        发现更多角色、声音和皮肤
      </p>
    </div>

    <!-- Categories -->
    <div class="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
      <div
        v-for="cat in categories"
        :key="cat.id"
        :class="[
          'flex flex-col items-center gap-2 rounded-2xl p-5',
          'bg-white/60 backdrop-blur-md dark:bg-neutral-900/60',
          'border border-neutral-200/60 dark:border-neutral-800/60',
          'transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer',
        ]"
      >
        <div
          :class="[
            'flex h-12 w-12 items-center justify-center rounded-xl',
            'bg-gradient-to-br from-pink-500/10 to-purple-500/10',
          ]"
        >
          <div :class="cat.icon" text-2xl text-purple-500 />
        </div>
        <span class="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {{ cat.name }}
        </span>
        <span class="text-xs text-neutral-500 dark:text-neutral-400">
          {{ cat.count }} 个
        </span>
      </div>
    </div>

    <!-- Featured -->
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
        精选推荐
      </h2>
      <button class="text-sm text-purple-500 hover:text-purple-600">
        查看全部
      </button>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div
        v-for="item in featured"
        :key="item.id"
        :class="[
          'rounded-2xl overflow-hidden',
          'bg-white/80 backdrop-blur-md dark:bg-neutral-900/80',
          'border border-neutral-200/60 dark:border-neutral-800/60',
          'transition-all duration-200 hover:scale-[1.02] hover:shadow-xl cursor-pointer',
        ]"
      >
        <div class="relative h-40 bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 dark:from-pink-900/30 dark:via-purple-900/30 dark:to-blue-900/30">
          <span
            v-if="item.tag"
            class="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-purple-600 dark:bg-neutral-800/90 dark:text-purple-400"
          >
            {{ item.tag }}
          </span>
        </div>
        <div class="p-4">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">
                {{ item.name }}
              </h3>
              <p class="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                {{ item.description }}
              </p>
            </div>
            <span class="font-bold text-purple-600 dark:text-purple-400">
              {{ item.price }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Coming soon -->
    <div
      :class="[
        'mt-10 rounded-2xl p-8 text-center',
        'bg-gradient-to-br from-purple-500/5 to-pink-500/5',
        'border border-purple-200/50 dark:border-purple-800/30',
      ]"
    >
      <div class="i-solar:sparkles-2-linear mx-auto mb-3 text-4xl text-purple-500" />
      <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
        更多内容即将上线
      </h3>
      <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        我们正在努力准备更多精彩内容，敬请期待
      </p>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: stage
  title: Life 商店
</route>
