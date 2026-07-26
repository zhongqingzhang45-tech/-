<script setup lang="ts">
import { IconItem, RippleGrid } from '@proj-airi/stage-ui/components'
import { useRippleGridState } from '@proj-airi/stage-ui/composables/use-ripple-grid-state'
import { useSettings } from '@proj-airi/stage-ui/stores/settings'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const router = useRouter()
const resolveAnimation = ref<() => void>()
const { t } = useI18n()
const { lastClickedIndex, setLastClickedIndex } = useRippleGridState()

const settingsStore = useSettings()

const showAdvanced = ref(false)

const removeBeforeEach = router.beforeEach(async (_, __, next) => {
  if (!settingsStore.usePageSpecificTransitions || settingsStore.disableTransitions) {
    next()
    return
  }

  await new Promise<void>((resolve) => {
    resolveAnimation.value = resolve
  })
  removeBeforeEach()
  next()
})

const basicPaths = ['/settings/card', '/settings/models', '/settings/scene', '/settings/data', '/settings/account']
const advancedPaths = ['/settings/modules', '/settings/providers', '/settings/connection', '/settings/system']

const allSettings = computed(() => {
  return router
    .getRoutes()
    .filter(route => route.meta?.settingsEntry)
    .sort((a, b) => (Number(a.meta?.order ?? 0) - Number(b.meta?.order ?? 0)))
    .map(route => ({
      title: route.meta?.titleKey ? t(route.meta.titleKey as string) : (route.meta?.title as string | undefined),
      description: route.meta?.descriptionKey ? t(route.meta.descriptionKey as string) : (route.meta?.description as string | undefined) || '',
      icon: route.meta?.icon as string | undefined,
      to: route.path,
    }))
})

const basicSettings = computed(() =>
  allSettings.value.filter(s => basicPaths.some(p => s.to.startsWith(p))),
)

const advancedSettings = computed(() =>
  allSettings.value.filter(s => advancedPaths.some(p => s.to.startsWith(p))),
)

function handleBasicItemClick({ globalIndex }: { globalIndex: number }) {
  setLastClickedIndex(globalIndex)
}

function handleAdvancedItemClick({ globalIndex }: { globalIndex: number }) {
  setLastClickedIndex(basicSettings.value.length + globalIndex)
}
</script>

<template>
  <div flex="~ col gap-6" font-normal pb-12>
    <div
      class="relative overflow-hidden rounded-2xl p-5 mb-2 cursor-pointer transition-all hover:shadow-lg active:scale-[0.98]"
      :class="[
        'bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent',
        'border border-amber-300/30 dark:border-amber-700/30',
      ]"
      @click="router.push('/premium')"
    >
      <div class="absolute -right-8 -top-8 w-24 h-24 bg-amber-400/20 rounded-full blur-2xl" />
      <div class="relative flex items-center gap-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
          <span class="i-solar:crown-star-bold-duotone text-2xl text-white" />
        </div>
        <div class="flex-1">
          <h3 class="font-bold text-neutral-800 dark:text-neutral-200">
            Life 会员
          </h3>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">
            解锁长期记忆、语音对话、全部模型等高级功能
          </p>
        </div>
        <div class="i-solar:alt-arrow-right-linear text-amber-500 text-xl" />
      </div>
    </div>

    <div>
      <div class="mb-3 px-1">
        <h2 class="text-sm font-medium text-neutral-500">
          关于她
        </h2>
      </div>
      <RippleGrid
        :items="basicSettings"
        :get-key="item => item.to"
        :columns="1"
        :origin-index="lastClickedIndex"
        @item-click="handleBasicItemClick"
      >
        <template #item="{ item }">
          <IconItem
            :title="item.title || ''"
            :description="item.description"
            :icon="item.icon"
            :to="item.to"
          />
        </template>
      </RippleGrid>
    </div>

    <div>
      <button
        class="w-full flex items-center justify-between px-1 py-2 text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
        @click="showAdvanced = !showAdvanced"
      >
        <span class="font-medium">高级设置</span>
        <span :class="['i-solar:alt-arrow-down-linear transition-transform', showAdvanced ? 'rotate-180' : '']" />
      </button>
      <div
        v-show="showAdvanced"
        class="mt-2"
      >
        <RippleGrid
          :items="advancedSettings"
          :get-key="item => item.to"
          :columns="1"
          :origin-index="lastClickedIndex"
          @item-click="handleAdvancedItemClick"
        >
          <template #item="{ item }">
            <IconItem
              :title="item.title || ''"
              :description="item.description"
              :icon="item.icon"
              :to="item.to"
            />
          </template>
        </RippleGrid>
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
  titleKey: settings.title
  stageTransition:
    name: slide
</route>
