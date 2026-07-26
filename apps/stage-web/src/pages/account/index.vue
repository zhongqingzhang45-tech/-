<script setup lang="ts">
import { signOut } from '@proj-airi/stage-ui/libs/auth'
import { useAuthStore } from '@proj-airi/stage-ui/stores/auth'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const displayName = computed(() => {
  return user.value?.name || user.value?.email || '用户'
})

const avatarInitial = computed(() => {
  const name = displayName.value
  return name.charAt(0).toUpperCase()
})

const subscriptionPlan = computed(() => {
  return '免费版'
})

const fluxBalance = computed(() => {
  return 0
})

async function handleLogout() {
  await signOut()
  router.push('/')
}

function handleLogin() {
  authStore.needsLogin = true
}

function handleUpgrade() {
  router.push('/store')
}
</script>

<template>
  <div class="h-full w-full overflow-y-auto scrollbar-none">
    <div class="mx-auto max-w-3xl px-6 py-10">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          账户
        </h1>
        <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          管理你的账户信息和订阅
        </p>
      </div>

      <!-- Profile Card -->
      <div
        :class="[
          'mb-8 rounded-3xl p-8',
          'bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10',
          'border border-purple-200/50 dark:border-purple-800/30',
        ]"
      >
        <div class="flex items-center gap-6">
          <div
            :class="[
              'flex h-20 w-20 items-center justify-center rounded-3xl',
              'bg-gradient-to-br from-pink-400 to-purple-500',
              'text-white text-3xl font-bold',
            ]"
          >
            {{ avatarInitial }}
          </div>
          <div class="flex-1">
            <h2 class="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {{ displayName }}
            </h2>
            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {{ user?.email || '未登录' }}
            </p>
            <div class="mt-3 flex items-center gap-2">
              <span
                :class="[
                  'rounded-full px-3 py-1 text-xs font-medium',
                  'bg-purple-500/20 text-purple-600 dark:text-purple-400',
                ]"
              >
                {{ subscriptionPlan }}
              </span>
            </div>
          </div>
          <button
            v-if="authStore.isAuthenticated"
            class="rounded-xl px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200/50 dark:text-neutral-400 dark:hover:bg-neutral-800/50 transition-colors"
            @click="handleLogout"
          >
            退出登录
          </button>
          <button
            v-else
            class="rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/30 transition hover:from-pink-600 hover:to-purple-600 active:scale-[0.98]"
            @click="handleLogin"
          >
            登录
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="mb-8 grid grid-cols-2 gap-4">
        <div
          :class="[
            'rounded-2xl p-6',
            'bg-white/80 backdrop-blur-sm dark:bg-neutral-900/60',
            'border border-neutral-200/60 dark:border-neutral-800/60',
          ]"
        >
          <div class="flex items-center gap-3 mb-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
              <div class="i-solar:flash-bold text-white text-lg" />
            </div>
            <span class="text-sm text-neutral-500 dark:text-neutral-400">Flux 余额</span>
          </div>
          <div class="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            {{ fluxBalance }}
          </div>
          <button
            class="mt-3 text-xs font-medium text-purple-500 hover:text-purple-600 dark:text-purple-400"
            @click="handleUpgrade"
          >
            充值 Flux →
          </button>
        </div>
        <div
          :class="[
            'rounded-2xl p-6',
            'bg-white/80 backdrop-blur-sm dark:bg-neutral-900/60',
            'border border-neutral-200/60 dark:border-neutral-800/60',
          ]"
        >
          <div class="flex items-center gap-3 mb-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
              <div class="i-solar:crown-bold text-white text-lg" />
            </div>
            <span class="text-sm text-neutral-500 dark:text-neutral-400">当前订阅</span>
          </div>
          <div class="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            {{ subscriptionPlan }}
          </div>
          <button
            class="mt-3 text-xs font-medium text-purple-500 hover:text-purple-600 dark:text-purple-400"
            @click="handleUpgrade"
          >
            升级订阅 →
          </button>
        </div>
      </div>

      <!-- Settings Links -->
      <div class="space-y-3">
        <h3 class="mb-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          账户设置
        </h3>

        <button
          :class="[
            'flex w-full items-center justify-between rounded-2xl p-5 transition-all',
            'bg-white/80 backdrop-blur-sm dark:bg-neutral-900/60',
            'border border-neutral-200/60 dark:border-neutral-800/60',
            'hover:shadow-md hover:-translate-y-0.5',
          ]"
          @click="router.push('/settings')"
        >
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
              <div class="i-solar:settings-bold-duotone text-neutral-600 dark:text-neutral-400 text-lg" />
            </div>
            <div class="text-left">
              <h4 class="font-medium text-neutral-800 dark:text-neutral-200">
                系统设置
              </h4>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                AI 配置、高级设置、开发者选项
              </p>
            </div>
          </div>
          <div class="i-solar:arrow-right-linear text-neutral-400 text-lg" />
        </button>

        <button
          :class="[
            'flex w-full items-center justify-between rounded-2xl p-5 transition-all',
            'bg-white/80 backdrop-blur-sm dark:bg-neutral-900/60',
            'border border-neutral-200/60 dark:border-neutral-800/60',
            'hover:shadow-md hover:-translate-y-0.5',
          ]"
          @click="router.push('/settings/characters')"
        >
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10">
              <div class="i-solar:users-group-rounded-linear text-pink-500 text-lg" />
            </div>
            <div class="text-left">
              <h4 class="font-medium text-neutral-800 dark:text-neutral-200">
                伙伴管理
              </h4>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                管理所有 AI 角色配置
              </p>
            </div>
          </div>
          <div class="i-solar:arrow-right-linear text-neutral-400 text-lg" />
        </button>

        <button
          :class="[
            'flex w-full items-center justify-between rounded-2xl p-5 transition-all',
            'bg-white/80 backdrop-blur-sm dark:bg-neutral-900/60',
            'border border-neutral-200/60 dark:border-neutral-800/60',
            'hover:shadow-md hover:-translate-y-0.5',
          ]"
          @click="router.push('/settings/memory')"
        >
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
              <div class="i-solar:bookmark-linear text-purple-500 text-lg" />
            </div>
            <div class="text-left">
              <h4 class="font-medium text-neutral-800 dark:text-neutral-200">
                记忆设置
              </h4>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                记忆管理、数据导出
              </p>
            </div>
          </div>
          <div class="i-solar:arrow-right-linear text-neutral-400 text-lg" />
        </button>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: stage
  title: 账户
</route>
