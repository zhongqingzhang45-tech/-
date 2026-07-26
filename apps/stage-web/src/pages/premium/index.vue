<script setup lang="ts">
import { useAuthStore } from '@proj-airi/stage-ui/stores/auth'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const { isLoggedIn } = storeToRefs(authStore)

const selectedPlan = ref<'free' | 'pro' | 'lifetime'>('pro')

const plans = [
  {
    id: 'free' as const,
    name: '免费版',
    price: '¥0',
    period: '',
    description: '基础陪伴体验',
    features: [
      '基础聊天对话',
      '1 个角色',
      '每日 50 条消息',
      '基础 Live2D 模型',
    ],
    highlight: false,
  },
  {
    id: 'pro' as const,
    name: 'Pro 会员',
    price: '¥38',
    period: '/月',
    description: '完整陪伴体验',
    features: [
      '无限聊天对话',
      '无限角色创建',
      '长期记忆系统',
      '全部 Live2D / VRM 模型',
      '语音对话功能',
      '高级 AI 模型',
      '专属动作与表情',
      '优先客服支持',
    ],
    highlight: true,
  },
  {
    id: 'lifetime' as const,
    name: '永久版',
    price: '¥388',
    period: '',
    description: '一次购买，永久陪伴',
    features: [
      'Pro 版全部功能',
      '永久免费更新',
      '限定角色皮肤',
      '专属纪念徽章',
      '未来全部新功能',
    ],
    highlight: false,
  },
]

function handleSubscribe() {
  // TODO: 接入实际支付
  alert('会员功能即将上线，敬请期待 ✨')
}
</script>

<template>
  <div class="h-full w-full overflow-y-auto scrollbar-none">
    <div class="mx-auto max-w-4xl px-6 py-10">
      <!-- Header -->
      <div class="text-center mb-10">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500">
          <div class="i-solar:crown-star-bold-duotone text-3xl text-white" />
        </div>
        <h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          Life 会员
        </h1>
        <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          解锁全部功能，与她开启更深的陪伴
        </p>
      </div>

      <!-- Plans -->
      <div class="grid gap-4 md:grid-cols-3 mb-10">
        <button
          v-for="plan in plans"
          :key="plan.id"
          :class="[
            'relative rounded-3xl p-6 text-left transition-all duration-300',
            'border backdrop-blur-sm',
            selectedPlan === plan.id
              ? plan.highlight
                ? 'border-amber-400 bg-gradient-to-br from-amber-500/10 to-orange-500/10 shadow-xl scale-[1.02]'
                : 'border-purple-400 bg-purple-50/50 dark:border-purple-600 dark:bg-purple-900/20 shadow-lg'
              : 'border-neutral-200 bg-white/50 hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:border-neutral-700',
          ]"
          @click="selectedPlan = plan.id"
        >
          <div
            v-if="plan.highlight"
            class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-medium shadow-lg"
          >
            最受欢迎
          </div>

          <h3 class="text-lg font-bold text-neutral-800 dark:text-neutral-200">
            {{ plan.name }}
          </h3>
          <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {{ plan.description }}
          </p>
          <div class="mt-4 mb-4 flex items-baseline gap-1">
            <span class="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              {{ plan.price }}
            </span>
            <span class="text-sm text-neutral-500 dark:text-neutral-400">
              {{ plan.period }}
            </span>
          </div>

          <ul class="space-y-2">
            <li
              v-for="feature in plan.features"
              :key="feature"
              class="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400"
            >
              <span class="i-solar:check-circle-bold text-emerald-500 mt-0.5 flex-shrink-0" />
              {{ feature }}
            </li>
          </ul>
        </button>
      </div>

      <!-- CTA -->
      <div class="text-center">
        <button
          v-if="selectedPlan !== 'free'"
          class="px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg shadow-amber-500/30 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] transition-all"
          @click="handleSubscribe"
        >
          ✨ 立即开通 {{ plans.find(p => p.id === selectedPlan)?.name }}
        </button>
        <p v-else class="text-sm text-neutral-500 dark:text-neutral-400">
          您当前正在使用免费版
        </p>
      </div>

      <!-- FAQ -->
      <div class="mt-16">
        <h2 class="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-6 text-center">
          常见问题
        </h2>
        <div class="space-y-3">
          <div class="p-4 rounded-2xl border border-neutral-200 bg-white/50 dark:border-neutral-800 dark:bg-neutral-900/40">
            <h3 class="font-medium text-neutral-800 dark:text-neutral-200">
              会员可以随时取消吗？
            </h3>
            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              是的，月度会员可以随时取消，取消后在当前订阅周期内仍可使用全部功能。
            </p>
          </div>
          <div class="p-4 rounded-2xl border border-neutral-200 bg-white/50 dark:border-neutral-800 dark:bg-neutral-900/40">
            <h3 class="font-medium text-neutral-800 dark:text-neutral-200">
              永久版和月版有什么区别？
            </h3>
            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              永久版包含 Pro 版全部功能，一次购买永久使用，还包含限定皮肤和纪念徽章。
            </p>
          </div>
          <div class="p-4 rounded-2xl border border-neutral-200 bg-white/50 dark:border-neutral-800 dark:bg-neutral-900/40">
            <h3 class="font-medium text-neutral-800 dark:text-neutral-200">
              数据会丢失吗？
            </h3>
            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              您的角色、记忆和聊天记录都会安全保存，即使会员到期也不会丢失。
            </p>
          </div>
        </div>
      </div>

      <!-- Back -->
      <div class="mt-10 text-center">
        <button
          class="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          @click="router.back()"
        >
          ← 返回
        </button>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: stage
  title: Life 会员
</route>
