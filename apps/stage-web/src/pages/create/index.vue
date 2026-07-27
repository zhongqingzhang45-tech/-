<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useCompanionStore } from '@proj-airi/stage-ui/stores/companion'

const router = useRouter()
const companionStore = useCompanionStore()

const currentStep = ref(1)
const totalSteps = 5

const characterName = ref('')
const selectedPersonality = ref('')
const selectedVoice = ref('')
const selectedModel = ref('')

const personalities = [
  { id: 'gentle', name: '温柔体贴', desc: '善解人意，总是关心你的感受', icon: 'i-solar:heart-linear' },
  { id: 'tsundere', name: '傲娇可爱', desc: '嘴硬心软，偷偷在意你', icon: 'i-solar:star-linear' },
  { id: 'cheerful', name: '活泼开朗', desc: '元气满满，笑容治愈', icon: 'i-solar:smile-circle-linear' },
  { id: 'mature', name: '成熟知性', desc: '温柔可靠，给你建议', icon: 'i-solar:medal-star-linear' },
]

const voices = [
  { id: 'voice1', name: '小樱', desc: '清甜软萌', preview: true },
  { id: 'voice2', name: '泠鸢', desc: '温柔治愈', preview: true },
  { id: 'voice3', name: '星瞳', desc: '元气活泼', preview: true },
  { id: 'voice4', name: '晚晚', desc: '傲娇可爱', preview: true },
]

const models = [
  { id: 'deepseek', name: 'DeepSeek V3', desc: '智能对话，响应快速' },
  { id: 'gpt4o', name: 'GPT-4o', desc: '强大理解能力' },
  { id: 'claude', name: 'Claude 3.5', desc: '长文本优秀' },
  { id: 'local', name: '本地模型', desc: '完全离线，隐私保护' },
]

function nextStep() {
  if (currentStep.value < totalSteps)
    currentStep.value++
}

function prevStep() {
  if (currentStep.value > 1)
    currentStep.value--
}

async function handleCreate() {
  companionStore.recordChat()
  await router.push('/')
}
</script>

<template>
  <div class="h-full w-full overflow-y-auto scrollbar-none">
    <div class="mx-auto flex min-h-full max-w-2xl flex-col px-6 py-10">
      <!-- Progress -->
      <div class="mb-10">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-neutral-500 dark:text-neutral-400">
            第 {{ currentStep }} 步，共 {{ totalSteps }} 步
          </span>
          <span class="text-sm font-medium text-purple-500">
            {{ Math.round((currentStep / totalSteps) * 100) }}%
          </span>
        </div>
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            class="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          />
        </div>
      </div>

      <!-- Step 1: Name -->
      <template v-if="currentStep === 1">
        <div class="text-center mb-8">
          <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-500 to-purple-600">
            <div class="i-solar:pen-new-square-linear text-4xl text-white" />
          </div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            给她起个名字吧
          </h1>
          <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            一个独一无二的名字，属于你们的开始
          </p>
        </div>

        <div class="space-y-6">
          <div>
            <label class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              她的名字
            </label>
            <input
              v-model="characterName"
              type="text"
              placeholder="例如：小樱、喵喵、学姐..."
              class="w-full rounded-2xl border border-neutral-200 bg-white/80 px-5 py-4 text-base backdrop-blur-sm transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-100"
            />
          </div>

          <div>
            <p class="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              💡 推荐名字
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="name in ['小樱', '茉莉', '星瞳', '晚晚', '宁宁', '可可']"
                :key="name"
                class="rounded-full border border-neutral-200 bg-white/60 px-4 py-1.5 text-sm text-neutral-600 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400 dark:hover:border-purple-700 dark:hover:bg-purple-900/20 dark:hover:text-purple-400"
                @click="characterName = name"
              >
                {{ name }}
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Step 2: Personality -->
      <template v-else-if="currentStep === 2">
        <div class="text-center mb-8">
          <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-500 to-rose-500">
            <div class="i-solar:heart-angle-linear text-4xl text-white" />
          </div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            选择她的性格
          </h1>
          <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            每一种性格，都是独特的灵魂
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="p in personalities"
            :key="p.id"
            :class="[
              'group rounded-2xl p-5 text-left transition-all duration-200',
              'border backdrop-blur-sm',
              selectedPersonality === p.id
                ? 'border-purple-400 bg-purple-50/80 shadow-lg dark:border-purple-600 dark:bg-purple-900/30'
                : 'border-neutral-200 bg-white/60 hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:border-neutral-700',
            ]"
            @click="selectedPersonality = p.id"
          >
            <div
              :class="[
                'mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
                selectedPersonality === p.id
                  ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white'
                  : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 group-hover:bg-purple-100 group-hover:text-purple-500 dark:group-hover:bg-purple-900/30 dark:group-hover:text-purple-400',
              ]"
            >
              <div :class="p.icon" text-2xl />
            </div>
            <h3
              :class="[
                'font-semibold',
                selectedPersonality === p.id
                  ? 'text-purple-700 dark:text-purple-300'
                  : 'text-neutral-800 dark:text-neutral-200',
              ]"
            >
              {{ p.name }}
            </h3>
            <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {{ p.desc }}
            </p>
          </button>
        </div>
      </template>

      <!-- Step 3: Voice -->
      <template v-else-if="currentStep === 3">
        <div class="text-center mb-8">
          <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500">
            <div class="i-solar:microphone-2-linear text-4xl text-white" />
          </div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            选择她的声音
          </h1>
          <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            让她的声音，成为你的专属治愈
          </p>
        </div>

        <div class="space-y-3">
          <button
            v-for="v in voices"
            :key="v.id"
            :class="[
              'flex w-full items-center gap-4 rounded-2xl p-4 transition-all duration-200',
              'border backdrop-blur-sm',
              selectedVoice === v.id
                ? 'border-purple-400 bg-purple-50/80 shadow-lg dark:border-purple-600 dark:bg-purple-900/30'
                : 'border-neutral-200 bg-white/60 hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:border-neutral-700',
            ]"
            @click="selectedVoice = v.id"
          >
            <div
              :class="[
                'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-colors',
                selectedVoice === v.id
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                  : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
              ]"
            >
              <div class="i-solar:volume-up-linear text-2xl" />
            </div>
            <div class="flex-1 text-left">
              <h3
                :class="[
                  'font-semibold',
                  selectedVoice === v.id
                    ? 'text-purple-700 dark:text-purple-300'
                    : 'text-neutral-800 dark:text-neutral-200',
                ]"
              >
                {{ v.name }}
              </h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                {{ v.desc }}
              </p>
            </div>
            <button
              :class="[
                'flex h-10 w-10 items-center justify-center rounded-full transition-all',
                selectedVoice === v.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700',
              ]"
            >
              <div class="i-solar:play-linear text-lg" />
            </button>
          </button>
        </div>
      </template>

      <!-- Step 4: Model -->
      <template v-else-if="currentStep === 4">
        <div class="text-center mb-8">
          <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500">
            <div class="i-solar:cpu-linear text-4xl text-white" />
          </div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            选择 AI 模型
          </h1>
          <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            不同的模型，带来不同的对话体验
          </p>
        </div>

        <div class="space-y-3">
          <button
            v-for="m in models"
            :key="m.id"
            :class="[
              'flex w-full items-center gap-4 rounded-2xl p-4 transition-all duration-200',
              'border backdrop-blur-sm',
              selectedModel === m.id
                ? 'border-purple-400 bg-purple-50/80 shadow-lg dark:border-purple-600 dark:bg-purple-900/30'
                : 'border-neutral-200 bg-white/60 hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:border-neutral-700',
            ]"
            @click="selectedModel = m.id"
          >
            <div
              :class="[
                'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-colors',
                selectedModel === m.id
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                  : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
              ]"
            >
              <div class="i-solar:cpu-setting-linear text-2xl" />
            </div>
            <div class="flex-1 text-left">
              <h3
                :class="[
                  'font-semibold',
                  selectedModel === m.id
                    ? 'text-purple-700 dark:text-purple-300'
                    : 'text-neutral-800 dark:text-neutral-200',
                ]"
              >
                {{ m.name }}
              </h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                {{ m.desc }}
              </p>
            </div>
            <div
              v-if="selectedModel === m.id"
              class="h-6 w-6 flex-shrink-0 rounded-full bg-purple-500 text-white flex items-center justify-center"
            >
              <div class="i-solar:check-bold text-sm" />
            </div>
          </button>
        </div>
      </template>

      <!-- Step 5: Complete -->
      <template v-else-if="currentStep === 5">
        <div class="text-center mb-8">
          <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500">
            <div class="i-solar:sparkles-linear text-4xl text-white" />
          </div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            她，准备好啦
          </h1>
          <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {{ characterName || '她' }}正在等着你，开启这段特别的陪伴吧
          </p>
        </div>

        <div class="relative mb-8">
          <div class="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 rounded-3xl blur-xl" />
          <div class="relative flex flex-col items-center p-8 rounded-3xl border border-neutral-200/50 bg-white/40 backdrop-blur-sm dark:border-neutral-800/50 dark:bg-neutral-900/40">
            <img
              src="/character.avif"
              alt="character"
              class="w-40 h-56 object-contain mb-4 drop-shadow-2xl"
            />
            <h2 class="text-xl font-bold text-neutral-800 dark:text-neutral-200">
              {{ characterName || '小梦' }}
            </h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {{ personalities.find(p => p.id === selectedPersonality)?.name || '温柔体贴' }}
            </p>
          </div>
        </div>
      </template>

      <!-- Navigation -->
      <div class="mt-10 flex items-center gap-3">
        <button
          v-if="currentStep > 1"
          class="flex-1 rounded-2xl border border-neutral-200 bg-white/60 px-6 py-4 text-base font-medium text-neutral-700 transition hover:bg-white dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300 dark:hover:bg-neutral-900/60"
          @click="prevStep"
        >
          上一步
        </button>
        <button
          v-if="currentStep < totalSteps"
          class="flex-1 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-4 text-base font-medium text-white shadow-lg shadow-purple-500/30 transition hover:from-pink-600 hover:to-purple-600 active:scale-[0.98]"
          @click="nextStep"
        >
          下一步
        </button>
        <button
          v-else
          class="flex-1 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-4 text-base font-medium text-white shadow-lg shadow-purple-500/30 transition hover:from-pink-600 hover:to-purple-600 active:scale-[0.98]"
          @click="handleCreate"
        >
          开始陪伴 ✨
        </button>
      </div>

      <!-- Back to home -->
      <button
        class="mt-6 text-center text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        @click="router.push('/')"
      >
        ← 返回首页
      </button>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: plain
  title: 创造我的 Life
</route>
