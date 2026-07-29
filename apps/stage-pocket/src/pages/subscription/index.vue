<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { PLANS, useSubscriptionStore } from '@proj-airi/stage-ui/stores/companion/subscription'

const router = useRouter()
const subscriptionStore = useSubscriptionStore()

const showPaywall = ref(false)
const selectedPlan = ref<typeof PLANS[number] | null>(null)

function selectPlan(plan: typeof PLANS[number]) {
  selectedPlan.value = plan
  showPaywall.value = true
}

function confirmUpgrade() {
  if (!selectedPlan.value) return
  if (selectedPlan.value.id === 'free') {
    subscriptionStore.cancel()
  }
  else {
    subscriptionStore.upgrade(selectedPlan.value.id)
  }
  showPaywall.value = false
  router.push('/')
}

function startTrial() {
  subscriptionStore.startTrial()
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen w-full bg-gradient-to-b from-pink-50/50 via-purple-50/50 to-white dark:from-neutral-950 dark:via-purple-950/10 dark:to-neutral-950 pb-safe">
    <!-- Header -->
    <div class="sticky top-0 z-10 backdrop-blur-md bg-white/70 dark:bg-neutral-950/70 border-b border-black/5 dark:border-white/5">
      <div class="flex items-center gap-3 px-4 py-3">
        <button
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 transition active:scale-95"
          @click="router.push('/')"
        >
          <span class="i-solar:arrow-left-linear text-neutral-700 dark:text-neutral-300" />
        </button>
        <h1 class="text-lg font-semibold text-neutral-900 dark:text-white">
          升级会员
        </h1>
        <div
          v-if="!subscriptionStore.isFree"
          class="ml-auto flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-white"
          :class="['bg-gradient-to-r', subscriptionStore.tierBadgeClass]"
        >
          <span class="i-solar:crown-bold text-xs" />
          {{ subscriptionStore.tierLabel }}
        </div>
      </div>
    </div>

    <div class="px-4 py-6">
      <!-- Title -->
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-neutral-900 dark:text-white">
          选择适合你的
          <span class="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">陪伴方式</span>
        </h2>
        <p class="mt-2 text-sm text-neutral-500">
          升级后解锁无限对话、记忆系统、高级模型等更多功能
        </p>
      </div>

      <!-- Trial Banner -->
      <div
        v-if="subscriptionStore.isFree && !subscriptionStore.isTrialActive"
        class="mb-6 rounded-2xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-200/50 dark:border-pink-500/20 p-4 flex items-center justify-between gap-4"
      >
        <div>
          <div class="text-sm font-medium text-neutral-900 dark:text-white">
            7 天免费试用 Pro
          </div>
          <div class="text-xs text-neutral-500 mt-0.5">
            试用期结束自动恢复免费版，不自动扣费
          </div>
        </div>
        <button
          class="shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-purple-500/20 hover:shadow-lg transition active:scale-95"
          @click="startTrial"
        >
          开始试用
        </button>
      </div>

      <!-- Trial Active Banner -->
      <div
        v-if="subscriptionStore.isTrialActive"
        class="mb-6 rounded-2xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-200/50 dark:border-pink-500/20 p-4"
      >
        <div class="flex items-center gap-2">
          <span class="i-solar:confetti-bold-duotone text-pink-500 text-lg" />
          <div class="text-sm font-medium text-neutral-900 dark:text-white">
            Pro 试用中
          </div>
          <div class="ml-auto text-xs text-pink-600 dark:text-pink-400 font-medium">
            剩余 {{ subscriptionStore.trialDaysLeft() }} 天
          </div>
        </div>
      </div>

      <!-- Usage Progress (Free Only) -->
      <div
        v-if="subscriptionStore.isFree && !subscriptionStore.isTrialActive"
        class="mb-6 rounded-2xl bg-white/60 dark:bg-neutral-900/40 border border-black/5 dark:border-white/5 p-4"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-neutral-700 dark:text-neutral-300">今日消息用量</span>
          <span class="text-sm font-medium text-neutral-900 dark:text-white">
            {{ subscriptionStore.dailyChatUsed }} / {{ subscriptionStore.dailyChatLimit }}
          </span>
        </div>
        <div class="h-2 rounded-full bg-neutral-100 dark:bg-white/5 overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
            :style="{ width: `${subscriptionStore.chatUsagePercent}%` }"
          />
        </div>
        <p class="mt-1.5 text-xs text-neutral-500">
          免费版每日 {{ subscriptionStore.dailyChatLimit }} 条消息，升级后无限畅聊
        </p>
      </div>

      <!-- Plan Cards -->
      <div class="space-y-4">
        <div
          v-for="plan in PLANS"
          :key="plan.id"
          :class="[
            'relative rounded-3xl p-5 border-2 transition-all active:scale-[0.98]',
            plan.highlight
              ? 'border-pink-400 dark:border-pink-500/50 bg-gradient-to-b from-pink-50/80 to-purple-50/80 dark:from-pink-950/30 dark:to-purple-950/20 shadow-lg shadow-purple-500/10'
              : 'border-black/5 dark:border-white/5 bg-white/70 dark:bg-neutral-900/40',
            subscriptionStore.tier === plan.id ? 'ring-2 ring-pink-400 ring-offset-2 dark:ring-offset-neutral-950' : '',
          ]"
          @click="selectPlan(plan)"
        >
          <div
            v-if="plan.highlight"
            class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 shadow-md"
          >
            最受欢迎
          </div>
          <div
            v-if="subscriptionStore.tier === plan.id"
            class="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white text-xs"
          >
            <span class="i-solar:check-circle-bold-duotone" />
          </div>

          <div class="flex items-center gap-3">
            <div :class="['inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', plan.accent]">
              <span class="i-solar:crown-bold-duotone text-xl" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-neutral-900 dark:text-white">
                {{ plan.name }}
              </h3>
              <p class="text-xs text-neutral-500">
                {{ plan.tagline }}
              </p>
            </div>
            <div class="ml-auto text-right">
              <div class="text-2xl font-bold text-neutral-900 dark:text-white">{{ plan.priceLabel }}</div>
              <div class="text-xs text-neutral-500">/ {{ plan.period }}</div>
            </div>
          </div>

          <div class="mt-4 space-y-2">
            <div
              v-for="feature in plan.features"
              :key="feature.text"
              class="flex items-center gap-2 text-sm"
            >
              <span
                :class="feature.included
                  ? 'i-solar:check-circle-bold-duotone text-green-500'
                  : 'i-solar:close-circle-bold-duotone text-neutral-300 dark:text-neutral-600'"
                class="shrink-0 text-sm"
              />
              <span :class="feature.included ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400 dark:text-neutral-600'">
                {{ feature.text }}
              </span>
            </div>
          </div>

          <button
            :class="[
              'mt-5 w-full py-3 rounded-xl text-sm font-medium transition active:scale-95',
              plan.highlight
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-purple-500/20'
                : subscriptionStore.tier === plan.id
                  ? 'bg-neutral-100 dark:bg-white/5 text-neutral-500 cursor-default'
                  : 'bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300',
            ]"
            @click.stop="selectPlan(plan)"
          >
            <template v-if="subscriptionStore.tier === plan.id">当前方案</template>
            <template v-else-if="plan.id === 'free'">恢复免费</template>
            <template v-else>选择 {{ plan.name }}</template>
          </button>
        </div>
      </div>

      <!-- Trust Badges -->
      <div class="mt-8 grid grid-cols-3 gap-3">
        <div class="rounded-2xl bg-white/60 dark:bg-neutral-900/40 p-3 text-center">
          <div class="text-xl mb-1">🔒</div>
          <div class="text-xs font-medium text-neutral-700 dark:text-neutral-300">隐私安全</div>
          <div class="text-[10px] text-neutral-500 mt-0.5">对话加密存储</div>
        </div>
        <div class="rounded-2xl bg-white/60 dark:bg-neutral-900/40 p-3 text-center">
          <div class="text-xl mb-1">⚡</div>
          <div class="text-xs font-medium text-neutral-700 dark:text-neutral-300">随时取消</div>
          <div class="text-[10px] text-neutral-500 mt-0.5">不自动续费</div>
        </div>
        <div class="rounded-2xl bg-white/60 dark:bg-neutral-900/40 p-3 text-center">
          <div class="text-xl mb-1">💬</div>
          <div class="text-xs font-medium text-neutral-700 dark:text-neutral-300">7x24 陪伴</div>
          <div class="text-[10px] text-neutral-500 mt-0.5">随时在她身边</div>
        </div>
      </div>
    </div>

    <!-- Paywall Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showPaywall && selectedPlan"
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showPaywall = false" />
          <div class="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-neutral-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              class="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
              @click="showPaywall = false"
            >
              <span class="i-solar:close-square-linear" />
            </button>

            <div :class="['inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', selectedPlan.accent]">
              <span class="i-solar:crown-bold-duotone text-2xl" />
            </div>

            <h3 class="mt-4 text-xl font-bold text-neutral-900 dark:text-white">
              确认升级到 {{ selectedPlan.name }}
            </h3>
            <p class="text-sm text-neutral-500 mt-1">
              {{ selectedPlan.tagline }}
            </p>

            <div class="mt-4 rounded-2xl bg-neutral-50 dark:bg-white/5 p-4">
              <div class="flex items-baseline justify-between">
                <span class="text-sm text-neutral-500">方案费用</span>
                <span class="text-2xl font-bold text-neutral-900 dark:text-white">
                  {{ selectedPlan.priceLabel }}
                  <span class="text-sm font-normal text-neutral-500">/ {{ selectedPlan.period }}</span>
                </span>
              </div>
              <div class="mt-2 text-xs text-neutral-500">
                这是演示版本，不会产生真实扣费
              </div>
            </div>

            <div class="mt-4 space-y-2">
              <div
                v-for="feature in selectedPlan.features.filter(f => f.included)"
                :key="feature.text"
                class="flex items-center gap-2 text-sm"
              >
                <span class="i-solar:check-circle-bold-duotone text-green-500 shrink-0" />
                <span class="text-neutral-700 dark:text-neutral-300">{{ feature.text }}</span>
              </div>
            </div>

            <button
              class="mt-6 w-full py-3.5 rounded-2xl text-sm font-semibold text-white shadow-lg transition active:scale-95"
              :class="['bg-gradient-to-r', selectedPlan.accent, 'shadow-purple-500/20']"
              @click="confirmUpgrade"
            >
              确认升级
            </button>
            <button
              class="mt-2 w-full py-2.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition"
              @click="showPaywall = false"
            >
              再想想
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<route lang="yaml">
name: SubscriptionPage
meta:
  layout: empty
</route>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
