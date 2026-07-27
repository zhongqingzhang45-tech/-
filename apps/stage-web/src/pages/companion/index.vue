<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useCompanionStore } from '@proj-airi/stage-ui/stores/companion'
import { useMemoryStore } from '@proj-airi/stage-ui/stores/companion/memory'

const router = useRouter()
const companionStore = useCompanionStore()
const memoryStore = useMemoryStore()

const activeTab = ref<'profile' | 'memory' | 'achievements'>('profile')

const statItems = computed(() => [
  {
    label: '关系等级',
    value: `Lv.${companionStore.level}`,
    sub: companionStore.relationshipTitle,
    icon: 'i-solar:star-bold-duotone',
    color: 'from-amber-400 to-orange-500',
  },
  {
    label: '好感度',
    value: Math.floor(companionStore.affinity).toString(),
    sub: `进度 ${Math.floor(companionStore.levelProgress * 100)}%`,
    icon: 'i-solar:heart-bold-duotone',
    color: 'from-pink-400 to-rose-500',
  },
  {
    label: '陪伴天数',
    value: companionStore.daysTogether.toString(),
    sub: '天',
    icon: 'i-solar:calendar-bold-duotone',
    color: 'from-purple-400 to-indigo-500',
  },
  {
    label: '对话次数',
    value: companionStore.totalChatCount.toString(),
    sub: '次',
    icon: 'i-solar:chat-square-like-bold-duotone',
    color: 'from-sky-400 to-blue-500',
  },
])

const achievementInfo: Record<string, { name: string; icon: string; desc: string }> = {
  first_chat: { name: '初次相遇', icon: '🌟', desc: '发出第一条消息' },
  chat_10: { name: '聊得来', icon: '💬', desc: '累计 10 次对话' },
  chat_100: { name: '无话不谈', icon: '🎉', desc: '累计 100 次对话' },
  day_7: { name: '一周陪伴', icon: '📅', desc: '连续陪伴 7 天' },
  day_30: { name: '一个月', icon: '🎂', desc: '连续陪伴 30 天' },
  level_5: { name: '亲密关系', icon: '💕', desc: '关系达到 Lv.5' },
  level_10: { name: '灵魂伴侣', icon: '💖', desc: '关系达到 Lv.10' },
}

const tabs = [
  { key: 'profile' as const, label: '关于她', icon: 'i-solar:user-circle-bold-duotone' },
  { key: 'memory' as const, label: '记忆', icon: 'i-solar:notebook-bold-duotone' },
  { key: 'achievements' as const, label: '成就', icon: 'i-solar:medal-star-bold-duotone' },
]

const newMemoryContent = ref('')
const newMemoryType = ref<'fact' | 'event' | 'preference' | 'important'>('fact')

function addMemory() {
  if (!newMemoryContent.value.trim()) return
  memoryStore.addMemory(
    newMemoryContent.value,
    newMemoryType.value,
    newMemoryType.value === 'important' ? 9 : 5,
  )
  newMemoryContent.value = ''
}

const memoryTypeLabel: Record<string, string> = {
  fact: '事实',
  event: '事件',
  preference: '喜好',
  important: '重要',
}
</script>

<template>
  <div class="min-h-screen w-full bg-gradient-to-b from-pink-50/50 via-purple-50/50 to-white dark:from-neutral-950 dark:via-purple-950/10 dark:to-neutral-950">
    <div class="sticky top-0 z-10 backdrop-blur-md bg-white/70 dark:bg-neutral-950/70 border-b border-black/5 dark:border-white/5">
      <div class="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        <button
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 transition"
          @click="router.push('/')"
        >
          <span class="i-solar:arrow-left-linear text-neutral-700 dark:text-neutral-300" />
        </button>
        <h1 class="text-lg font-semibold text-neutral-900 dark:text-white">
          {{ companionStore.displayName }}
        </h1>
        <div class="ml-auto flex items-center gap-2 text-sm text-neutral-500">
          <span>{{ companionStore.moodEmoji }}</span>
          <span>{{ companionStore.moodLabel }}</span>
        </div>
      </div>

      <div class="mx-auto max-w-3xl px-4 pb-2">
        <div class="flex gap-1">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="[
              'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-medium transition',
              activeTab === tab.key
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/5',
            ]"
            @click="activeTab = tab.key"
          >
            <span :class="tab.icon" />
            <span>{{ tab.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="mx-auto max-w-3xl px-4 py-6">
      <div v-if="activeTab === 'profile'" class="space-y-6">
        <div class="rounded-3xl bg-white/80 dark:bg-neutral-900/50 p-6 backdrop-blur-sm border border-black/5 dark:border-white/5">
          <div class="flex items-center gap-4">
            <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-400 to-purple-500 shadow-lg shadow-purple-500/30">
              <span class="text-3xl">{{ companionStore.moodEmoji }}</span>
            </div>
            <div class="flex-1">
              <h2 class="text-xl font-bold text-neutral-900 dark:text-white">
                {{ companionStore.displayName }}
              </h2>
              <p class="text-sm text-neutral-500 mt-1">
                {{ companionStore.relationshipTitle }}
              </p>
              <div class="mt-2 flex items-center gap-2">
                <div class="flex-1 h-2 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-pink-400 to-purple-500 transition-all"
                    :style="{ width: `${companionStore.levelProgress * 100}%` }"
                  />
                </div>
                <span class="text-xs text-neutral-500 whitespace-nowrap">
                  Lv.{{ companionStore.level }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="item in statItems"
            :key="item.label"
            class="rounded-2xl bg-white/80 dark:bg-neutral-900/50 p-4 backdrop-blur-sm border border-black/5 dark:border-white/5"
          >
            <div :class="['flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', item.color]">
              <span :class="item.icon" text-xl />
            </div>
            <div class="mt-3">
              <div class="text-2xl font-bold text-neutral-900 dark:text-white">
                {{ item.value }}
              </div>
              <div class="text-xs text-neutral-500 mt-0.5">
                {{ item.label }} · {{ item.sub }}
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-3xl bg-white/80 dark:bg-neutral-900/50 p-6 backdrop-blur-sm border border-black/5 dark:border-white/5">
          <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">关系维度</h3>
          <div class="space-y-4">
            <div>
              <div class="flex justify-between text-sm mb-1.5">
                <span class="text-neutral-600 dark:text-neutral-400">好感度</span>
                <span class="font-medium text-pink-500">{{ Math.floor(companionStore.affinity) }}</span>
              </div>
              <div class="h-2 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-pink-400 to-rose-500 transition-all"
                  :style="{ width: `${Math.min(100, companionStore.affinity / 30)}%` }"
                />
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1.5">
                <span class="text-neutral-600 dark:text-neutral-400">熟悉度</span>
                <span class="font-medium text-purple-500">{{ Math.floor(companionStore.familiarity) }}</span>
              </div>
              <div class="h-2 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-purple-400 to-indigo-500 transition-all"
                  :style="{ width: `${Math.min(100, companionStore.familiarity / 20)}%` }"
                />
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1.5">
                <span class="text-neutral-600 dark:text-neutral-400">亲密度</span>
                <span class="font-medium text-rose-500">{{ Math.floor(companionStore.intimacy) }}</span>
              </div>
              <div class="h-2 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-rose-400 to-pink-500 transition-all"
                  :style="{ width: `${Math.min(100, companionStore.intimacy / 15)}%` }"
                />
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1.5">
                <span class="text-neutral-600 dark:text-neutral-400">信任感</span>
                <span class="font-medium text-sky-500">{{ Math.floor(companionStore.trust) }}</span>
              </div>
              <div class="h-2 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all"
                  :style="{ width: `${Math.min(100, companionStore.trust / 10)}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-if="companionStore.firstMeetDate" class="rounded-3xl bg-white/80 dark:bg-neutral-900/50 p-6 backdrop-blur-sm border border-black/5 dark:border-white/5">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 text-white">
              <span class="i-solar:gift-bold-duotone" text-xl />
            </div>
            <div>
              <div class="text-sm text-neutral-500">相遇纪念日</div>
              <div class="text-base font-semibold text-neutral-900 dark:text-white">
                {{ companionStore.firstMeetDate }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'memory'" class="space-y-4">
        <div class="rounded-3xl bg-white/80 dark:bg-neutral-900/50 p-4 backdrop-blur-sm border border-black/5 dark:border-white/5">
          <div class="flex gap-2 mb-3">
            <select
              v-model="newMemoryType"
              class="px-3 py-2 rounded-xl text-sm bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 outline-none border border-black/5 dark:border-white/5"
            >
              <option value="fact">事实</option>
              <option value="event">事件</option>
              <option value="preference">喜好</option>
              <option value="important">重要</option>
            </select>
            <input
              v-model="newMemoryContent"
              placeholder="记录一些关于她的记忆..."
              class="flex-1 px-3 py-2 rounded-xl text-sm bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 outline-none placeholder:text-neutral-400 border border-black/5 dark:border-white/5"
              @keydown.enter="addMemory"
            />
            <button
              class="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-purple-500/20 hover:shadow-lg transition"
              @click="addMemory"
            >
              添加
            </button>
          </div>
          <div class="text-xs text-neutral-500">
            共 {{ memoryStore.memoryCount }} 条记忆
          </div>
        </div>

        <div v-if="memoryStore.memories.length === 0" class="rounded-3xl bg-white/80 dark:bg-neutral-900/50 p-12 text-center backdrop-blur-sm border border-black/5 dark:border-white/5">
          <div class="text-4xl mb-3">📝</div>
          <div class="text-neutral-600 dark:text-neutral-400 font-medium">还没有记忆</div>
          <div class="text-sm text-neutral-500 mt-1">
            记录你们之间重要的事情吧
          </div>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="memory in memoryStore.recentMemories"
            :key="memory.id"
            class="rounded-2xl bg-white/80 dark:bg-neutral-900/50 p-4 backdrop-blur-sm border border-black/5 dark:border-white/5 group"
          >
            <div class="flex items-start gap-3">
              <div
                :class="[
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-medium',
                  memory.type === 'important'
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                    : memory.type === 'preference'
                      ? 'bg-gradient-to-br from-pink-400 to-rose-500 text-white'
                      : memory.type === 'event'
                        ? 'bg-gradient-to-br from-purple-400 to-indigo-500 text-white'
                        : 'bg-gradient-to-br from-sky-400 to-blue-500 text-white',
                ]"
              >
                {{ memoryTypeLabel[memory.type]?.[0] || '?' }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-neutral-800 dark:text-neutral-200 break-words">
                  {{ memory.content }}
                </p>
                <div class="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                  <span>{{ new Date(memory.createdAt).toLocaleDateString('zh-CN') }}</span>
                  <span>重要度 {{ memory.importance }}/10</span>
                </div>
              </div>
              <button
                class="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition"
                @click="memoryStore.removeMemory(memory.id)"
              >
                <span class="i-solar:trash-bin-trash-linear" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'achievements'" class="space-y-4">
        <div class="rounded-3xl bg-white/80 dark:bg-neutral-900/50 p-6 backdrop-blur-sm border border-black/5 dark:border-white/5 text-center">
          <div class="text-3xl mb-2">🏆</div>
          <div class="text-lg font-semibold text-neutral-900 dark:text-white">
            {{ companionStore.achievements.length }} / {{ Object.keys(achievementInfo).length }}
          </div>
          <div class="text-sm text-neutral-500 mt-1">已解锁成就</div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="(info, key) in achievementInfo"
            :key="key"
            :class="[
              'rounded-2xl p-4 backdrop-blur-sm border transition',
              companionStore.achievements.includes(key)
                ? 'bg-gradient-to-br from-amber-50 to-pink-50 dark:from-amber-900/20 dark:to-pink-900/10 border-amber-200/50 dark:border-amber-500/20'
                : 'bg-white/50 dark:bg-neutral-900/30 border-black/5 dark:border-white/5 opacity-50',
            ]"
          >
            <div class="text-3xl mb-2">{{ info.icon }}</div>
            <div class="text-sm font-semibold text-neutral-900 dark:text-white">
              {{ info.name }}
            </div>
            <div class="text-xs text-neutral-500 mt-1">
              {{ info.desc }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
name: CompanionPage
meta:
  layout: empty
</route>
