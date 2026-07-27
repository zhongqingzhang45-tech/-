import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'life-subscription-state'

export type PlanTier = 'free' | 'pro' | 'premium'

export interface PlanInfo {
  id: PlanTier
  name: string
  price: number
  priceLabel: string
  period: string
  tagline: string
  features: { text: string; included: boolean }[]
  highlight?: boolean
  accent: string
}

interface SubscriptionState {
  tier: PlanTier
  trialUsed: boolean
  trialEndDate: string | null
  dailyChatLimit: number
  dailyChatUsed: number
  lastChatDate: string | null
  customVoices: string[]
  premiumModels: boolean
  memoryUnlocked: boolean
  relationshipInsights: boolean
}

const defaultState: SubscriptionState = {
  tier: 'free',
  trialUsed: false,
  trialEndDate: null,
  dailyChatLimit: 30,
  dailyChatUsed: 0,
  lastChatDate: null,
  customVoices: [],
  premiumModels: false,
  memoryUnlocked: false,
  relationshipInsights: false,
}

export const PLANS: PlanInfo[] = [
  {
    id: 'free',
    name: '免费版',
    price: 0,
    priceLabel: '¥0',
    period: '永久',
    tagline: '开始你的陪伴之旅',
    accent: 'from-neutral-400 to-neutral-500',
    features: [
      { text: '每日 30 条消息', included: true },
      { text: '基础 AI 对话', included: true },
      { text: 'Live2D 角色互动', included: true },
      { text: '基础表情和动作', included: true },
      { text: '记忆系统', included: false },
      { text: '自定义声音', included: false },
      { text: '高级 AI 模型', included: false },
      { text: '关系深度分析', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro 会员',
    price: 29,
    priceLabel: '¥29',
    period: '月',
    tagline: '深度陪伴，无限畅聊',
    highlight: true,
    accent: 'from-pink-500 to-purple-600',
    features: [
      { text: '无限消息', included: true },
      { text: '高级 AI 对话', included: true },
      { text: 'Live2D 角色互动', included: true },
      { text: '全部表情和动作', included: true },
      { text: '记忆系统', included: true },
      { text: '自定义声音', included: true },
      { text: '高级 AI 模型', included: true },
      { text: '关系深度分析', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 59,
    priceLabel: '¥59',
    period: '月',
    tagline: '极致体验，灵魂伴侣',
    accent: 'from-amber-400 to-orange-500',
    features: [
      { text: '无限消息', included: true },
      { text: '最强 AI 模型', included: true },
      { text: 'Live2D 角色互动', included: true },
      { text: '全部表情和动作', included: true },
      { text: '记忆系统', included: true },
      { text: '自定义声音', included: true },
      { text: '高级 AI 模型', included: true },
      { text: '关系深度分析', included: true },
    ],
  },
]

function loadState(): SubscriptionState {
  if (typeof localStorage === 'undefined') return { ...defaultState }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultState }
    const parsed = JSON.parse(raw)
    return { ...defaultState, ...parsed }
  }
  catch {
    return { ...defaultState }
  }
}

function saveState(state: SubscriptionState) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }
  catch {
    // ignore
  }
}

export const useSubscriptionStore = defineStore('subscription', () => {
  const state = ref<SubscriptionState>(loadState())

  watch(state, (newState) => saveState(newState), { deep: true })

  const tier = computed(() => state.value.tier)
  const isFree = computed(() => state.value.tier === 'free')
  const isPro = computed(() => state.value.tier === 'pro' || state.value.tier === 'premium')
  const isPremium = computed(() => state.value.tier === 'premium')
  const currentPlan = computed(() => PLANS.find(p => p.id === state.value.tier) ?? PLANS[0])

  const dailyChatUsed = computed(() => state.value.dailyChatUsed)
  const dailyChatLimit = computed(() => state.value.dailyChatLimit)
  const dailyChatRemaining = computed(() => Math.max(0, state.value.dailyChatLimit - state.value.dailyChatUsed))
  const chatLimitReached = computed(() => isFree.value && state.value.dailyChatUsed >= state.value.dailyChatLimit)
  const chatUsagePercent = computed(() => {
    if (state.value.dailyChatLimit === 0) return 0
    return Math.min(100, (state.value.dailyChatUsed / state.value.dailyChatLimit) * 100)
  })

  const memoryUnlocked = computed(() => state.value.memoryUnlocked || isPro.value)
  const relationshipInsights = computed(() => state.value.relationshipInsights || isPremium.value)
  const premiumModels = computed(() => state.value.premiumModels || isPro.value)

  const tierLabel = computed(() => {
    if (isPremium.value) return 'Premium'
    if (isPro.value) return 'Pro'
    return '免费版'
  })

  const tierBadgeClass = computed(() => {
    if (isPremium.value) return 'from-amber-400 to-orange-500'
    if (isPro.value) return 'from-pink-500 to-purple-600'
    return 'from-neutral-400 to-neutral-500'
  })

  function recordChat() {
    const today = new Date().toISOString().split('T')[0]
    if (state.value.lastChatDate !== today) {
      state.value.dailyChatUsed = 0
      state.value.lastChatDate = today
    }
    if (isFree.value) {
      state.value.dailyChatUsed++
    }
  }

  function canChat(): boolean {
    if (isPro.value) return true
    return state.value.dailyChatUsed < state.value.dailyChatLimit
  }

  function upgrade(tier: PlanTier) {
    state.value.tier = tier
    if (tier === 'pro') {
      state.value.dailyChatLimit = -1
      state.value.memoryUnlocked = true
      state.value.premiumModels = true
    }
    if (tier === 'premium') {
      state.value.dailyChatLimit = -1
      state.value.memoryUnlocked = true
      state.value.premiumModels = true
      state.value.relationshipInsights = true
    }
  }

  function startTrial() {
    if (state.value.trialUsed) return false
    state.value.trialUsed = true
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 7)
    state.value.trialEndDate = endDate.toISOString()
    upgrade('pro')
    return true
  }

  function isTrialActive(): boolean {
    if (!state.value.trialEndDate) return false
    return new Date(state.value.trialEndDate) > new Date()
  }

  function trialDaysLeft(): number {
    if (!state.value.trialEndDate) return 0
    const diff = new Date(state.value.trialEndDate).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  function cancel() {
    state.value.tier = 'free'
    state.value.dailyChatLimit = 30
    state.value.memoryUnlocked = false
    state.value.premiumModels = false
    state.value.relationshipInsights = false
  }

  function reset() {
    state.value = { ...defaultState }
  }

  return {
    tier,
    isFree,
    isPro,
    isPremium,
    currentPlan,
    dailyChatUsed,
    dailyChatLimit,
    dailyChatRemaining,
    chatLimitReached,
    chatUsagePercent,
    memoryUnlocked,
    relationshipInsights,
    premiumModels,
    tierLabel,
    tierBadgeClass,
    recordChat,
    canChat,
    upgrade,
    startTrial,
    isTrialActive,
    trialDaysLeft,
    cancel,
    reset,
  }
})
