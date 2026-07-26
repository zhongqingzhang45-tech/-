<script setup lang="ts">
import { useAuthStore } from '@proj-airi/stage-ui/stores/auth'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

interface NavItem {
  id: string
  label: string
  icon: string
  path: string
  activeMatch?: string
}

const primaryNav: NavItem[] = [
  {
    id: 'life',
    label: 'Life Room',
    icon: 'i-solar:heart-hand-up-linear',
    path: '/chat',
    activeMatch: '/chat',
  },
  {
    id: 'companion',
    label: '我的伙伴',
    icon: 'i-solar:users-group-rounded-linear',
    path: '/companion',
    activeMatch: '/companion',
  },
  {
    id: 'memory',
    label: '记忆中心',
    icon: 'i-solar:bookmark-linear',
    path: '/memory',
    activeMatch: '/memory',
  },
  {
    id: 'store',
    label: 'Life 商店',
    icon: 'i-solar:shop-linear',
    path: '/store',
    activeMatch: '/store',
  },
]

const secondaryNav: NavItem[] = [
  {
    id: 'account',
    label: '账户',
    icon: 'i-solar:user-circle-linear',
    path: '/account',
    activeMatch: '/account',
  },
  {
    id: 'settings',
    label: '设置',
    icon: 'i-solar:settings-bold-duotone',
    path: '/settings',
    activeMatch: '/settings',
  },
]

function isActive(item: NavItem): boolean {
  if (!item.activeMatch)
    return route.path === item.path

  if (item.activeMatch.startsWith('^'))
    return new RegExp(item.activeMatch).test(route.path)

  return route.path.startsWith(item.activeMatch)
}

async function navigate(item: NavItem) {
  try {
    await router.push(item.path)
  }
  catch {
    window.location.href = item.path
  }
}

const displayName = computed(() => {
  return authStore.user?.name || authStore.user?.email || '用户'
})

const avatarInitial = computed(() => {
  const name = displayName.value
  return name.charAt(0).toUpperCase()
})
</script>

<template>
  <aside
    :class="[
      'flex h-full w-64 flex-col',
      'border-r border-neutral-200/60 dark:border-neutral-800/60',
      'bg-white/80 backdrop-blur-xl dark:bg-neutral-950/80',
    ]"
  >
    <!-- Logo -->
    <div
      :class="[
        'flex items-center gap-3 px-5 py-4',
        'border-b border-neutral-200/60 dark:border-neutral-800/60',
      ]"
    >
      <div
        :class="[
          'flex h-9 w-9 items-center justify-center rounded-xl',
          'bg-gradient-to-br from-pink-500 to-purple-600',
          'text-white font-bold',
        ]"
      >
        L
      </div>
      <div class="flex flex-col">
        <span class="text-base font-bold text-neutral-900 dark:text-neutral-100">Life</span>
        <span class="text-xs text-neutral-500 dark:text-neutral-400">AI 虚拟伴侣</span>
      </div>
    </div>

    <!-- Primary Nav -->
    <nav class="flex-1 overflow-y-auto px-3 py-4 scrollbar-none">
      <div class="flex flex-col gap-1">
        <button
          v-for="item in primaryNav"
          :key="item.id"
          :class="[
            'group flex items-center gap-3 rounded-xl px-3 py-2.5',
            'text-sm font-medium transition-all duration-200',
            isActive(item)
              ? 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-200',
          ]"
          @click="navigate(item)"
        >
          <div
            :class="[
              'flex h-5 w-5 items-center justify-center',
              isActive(item) ? 'text-purple-500 dark:text-purple-400' : '',
            ]"
          >
            <div :class="item.icon" text-xl />
          </div>
          <span>{{ item.label }}</span>
          <div
            v-if="isActive(item)"
            class="ml-auto h-1.5 w-1.5 rounded-full bg-purple-500 dark:bg-purple-400"
          />
        </button>
      </div>

      <!-- Divider -->
      <div class="my-4 h-px bg-neutral-200/60 dark:bg-neutral-800/60" />

      <!-- Secondary Nav -->
      <div class="flex flex-col gap-1">
        <button
          v-for="item in secondaryNav"
          :key="item.id"
          :class="[
            'group flex items-center gap-3 rounded-xl px-3 py-2.5',
            'text-sm font-medium transition-all duration-200',
            isActive(item)
              ? 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-200',
          ]"
          @click="navigate(item)"
        >
          <div
            :class="[
              'flex h-5 w-5 items-center justify-center',
              isActive(item) ? 'text-purple-500 dark:text-purple-400' : '',
            ]"
          >
            <div :class="item.icon" text-xl />
          </div>
          <span>{{ item.label }}</span>
          <div
            v-if="isActive(item)"
            class="ml-auto h-1.5 w-1.5 rounded-full bg-purple-500 dark:bg-purple-400"
          />
        </button>
      </div>
    </nav>

    <!-- User -->
    <div
      :class="[
        'border-t border-neutral-200/60 dark:border-neutral-800/60',
        'p-3',
      ]"
    >
      <div
        :class="[
          'flex items-center gap-3 rounded-xl p-2.5',
          'hover:bg-neutral-100 dark:hover:bg-neutral-800/60',
          'cursor-pointer transition-colors',
        ]"
        @click="navigate({ id: 'account', label: '账户', icon: '', path: '/account' })"
      >
        <div
          :class="[
            'flex h-9 w-9 items-center justify-center rounded-full',
            'bg-gradient-to-br from-pink-400 to-purple-500',
            'text-white text-sm font-semibold',
          ]"
        >
          {{ avatarInitial }}
        </div>
        <div class="flex min-w-0 flex-1 flex-col">
          <span class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {{ displayName }}
          </span>
          <span class="truncate text-xs text-neutral-500 dark:text-neutral-400">
            {{ authStore.isAuthenticated ? '已登录' : '未登录' }}
          </span>
        </div>
      </div>
    </div>
  </aside>
</template>
