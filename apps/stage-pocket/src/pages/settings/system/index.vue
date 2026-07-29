<script setup lang="ts">
import { IconItem, RippleGrid } from '@proj-airi/stage-ui/components'
import { useRippleGridState } from '@proj-airi/stage-ui/composables/use-ripple-grid-state'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const { lastClickedIndex, setLastClickedIndex } = useRippleGridState()

const settings = computed(() => [
  {
    title: t('settings.pages.system.general.title'),
    description: t('settings.pages.system.general.description'),
    icon: 'i-solar:emoji-funny-square-bold-duotone',
    to: '/settings/system/general',
  },
  {
    title: t('settings.pages.system.color-scheme.title'),
    description: t('settings.pages.system.color-scheme.description'),
    icon: 'i-solar:pallete-2-bold-duotone',
    to: '/settings/system/color-scheme',
  },
  {
    title: t('settings.pages.system.developer.title'),
    description: t('settings.pages.system.developer.description'),
    icon: 'i-solar:code-bold-duotone',
    to: '/settings/system/developer',
  },
])

// TODO: Replace with actual ICP filing number once obtained
const icpFilingNumber = '京ICP备XXXXXXXX号-1'
</script>

<template>
  <div flex="~ col gap-4" font-normal>
    <div />
    <div flex="~ col gap-4">
      <RippleGrid
        :items="settings"
        :get-key="item => item.to"
        :columns="1"
        :origin-index="lastClickedIndex"
        @item-click="({ globalIndex }) => setLastClickedIndex(globalIndex)"
      >
        <template #item="{ item }">
          <IconItem
            :title="item.title"
            :description="item.description"
            :icon="item.icon"
            :to="item.to"
          />
        </template>
      </RippleGrid>
    </div>
    <div class="mt-6 space-y-3">
      <button
        class="w-full flex items-center gap-3 rounded-2xl border border-neutral-200/60 bg-white/60 px-4 py-3 text-left transition active:scale-[0.98] dark:border-neutral-800/60 dark:bg-neutral-900/40"
        @click="router.push('/privacy')"
      >
        <div class="i-solar:shield-check-bold-duotone text-lg text-neutral-500 dark:text-neutral-400" />
        <span class="text-sm font-medium text-neutral-800 dark:text-neutral-200">隐私政策</span>
        <div class="ml-auto i-solar:arrow-right-linear text-xs text-neutral-400" />
      </button>

      <div class="text-center text-xs text-neutral-400 dark:text-neutral-600 pt-2">
        <p>备案号：{{ icpFilingNumber }}</p>
        <p class="mt-1">Life · 你的 AI 伴侣</p>
      </div>
    </div>

    <div
      v-motion
      text="neutral-200/50 dark:neutral-600/20" pointer-events-none
      fixed top="[calc(100dvh-12rem)]" bottom-0 right--10 z--1
      :initial="{ scale: 0.9, opacity: 0, rotate: 180 }"
      :enter="{ scale: 1, opacity: 1, rotate: 0 }"
      :duration="500"
      size-60
      flex items-center justify-center
    >
      <div v-motion text="60" i-solar:settings-bold-duotone />
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: settings
  titleKey: settings.pages.system.title
  subtitleKey: settings.title
  descriptionKey: settings.pages.system.description
  icon: i-solar:filters-bold-duotone
  settingsEntry: true
  order: 9
  stageTransition:
    name: slide
    pageSpecificAvailable: true
</route>
