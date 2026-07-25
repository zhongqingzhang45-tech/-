<script setup lang="ts">
import { useDark } from '@vueuse/core'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isDark = useDark()
isDark.value = true

const features = ref([
  { icon: 'i-solar:chat-round-dots-bold-duotone', title: '智能对话', desc: '基于大语言模型的深度对话，懂你所想，答你所问' },
  { icon: 'i-solar:microwave-bold-duotone', title: '语音交互', desc: '实时语音对话，自然的情感表达，像真人一样陪伴你' },
  { icon: 'i-solar:users-group-rounded-bold-duotone', title: '角色定制', desc: '打造专属 AI 伴侣，外观、性格、声音由你定义' },
  { icon: 'i-solar:leaf-bold-duotone', title: '记忆系统', desc: 'TA 会记住你们的每一次对话，感情在日常中积累' },
  { icon: 'i-solar:gallery-bold-duotone', title: 'Live2D 形象', desc: '精美的二次元虚拟形象，生动的表情与动作' },
  { icon: 'i-solar:rocket-bold-duotone', title: '多场景能力', desc: '游戏陪伴、情感倾听、知识问答，多面 TA' },
])

const plans = ref([
  { name: '体验版', price: '0', period: '永久免费', desc: '开始你的 AI 伴侣之旅', features: ['每日 50 条对话', '基础角色形象', '文字聊天', '社区支持'], cta: '免费开始', highlight: false },
  { name: '会员版', price: '29', period: '/月', desc: '解锁完整体验', features: ['无限对话次数', '全部角色形象', '语音交互', '长期记忆', '优先客服'], cta: '开通会员', highlight: true },
  { name: '尊享版', price: '99', period: '/月', desc: '极致体验', features: ['会员版全部权益', '专属定制角色', '高级语音合成', '独家场景', 'VIP 专属客服'], cta: '升级尊享', highlight: false },
])

function handleStart() {
  router.push('/auth')
}

function handleExperience() {
  router.push('/chat')
}

function scrollToFeatures() {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="min-h-screen bg-neutral-950 text-white overflow-x-hidden">
    <!-- 导航栏 -->
    <nav class="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-xl bg-neutral-950/70 border-b border-white/5">
      <div class="max-w-6xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <span class="text-sm font-bold">L</span>
          </div>
          <span class="text-lg font-semibold tracking-tight">Life</span>
        </div>
        <div class="hidden md:flex items-center gap-8 text-sm text-neutral-400">
          <button class="hover:text-white transition-colors" @click="scrollToFeatures">
            功能
          </button>
          <a href="#pricing" class="hover:text-white transition-colors">会员</a>
          <button class="hover:text-white transition-colors" @click="handleExperience">
            体验
          </button>
        </div>
        <button
          class="px-4 py-1.5 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 transition-colors"
          @click="handleStart"
        >
          登录
        </button>
      </div>
    </nav>

    <!-- Hero -->
    <section class="relative min-h-screen flex items-center justify-center px-6 pt-20">
      <!-- 背景光效 -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-pink-500/20 blur-[120px]" />
        <div class="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/20 blur-[120px]" />
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-rose-500/5 blur-[100px]" />
      </div>

      <div class="relative z-10 max-w-4xl mx-auto text-center">
        <!-- 标签 -->
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300 mb-8">
          <span class="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
          全新升级 · 你的专属 AI 伴侣
        </div>

        <!-- 主标题 -->
        <h1 class="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          遇见你的
          <span class="bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 bg-clip-text text-transparent">
            二次元伴侣
          </span>
        </h1>

        <!-- 副标题 -->
        <p class="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Life 是一款基于 AI 的二次元虚拟伴侣应用，<br class="hidden md:block">
          TA 能听、能说、能记住你们的故事，陪伴你的每一天。
        </p>

        <!-- CTA -->
        <div class="flex items-center justify-center gap-4 mb-16">
          <button
            class="group px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 transition-all text-white font-medium text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:-translate-y-0.5"
            @click="handleStart"
          >
            立即开始
            <span class="inline-block ml-1 transition-transform group-hover:translate-x-1">→</span>
          </button>
          <button
            class="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white font-medium text-base"
            @click="handleExperience"
          >
            免费体验
          </button>
        </div>

        <!-- 数据展示 -->
        <div class="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div>
            <div class="text-3xl font-bold text-white">10K+</div>
            <div class="text-sm text-neutral-500 mt-1">活跃用户</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-white">50+</div>
            <div class="text-sm text-neutral-500 mt-1">角色形象</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-white">99.9%</div>
            <div class="text-sm text-neutral-500 mt-1">满意度</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 功能特性 -->
    <section id="features" class="relative py-32 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-20">
          <h2 class="text-4xl md:text-5xl font-bold mb-4">
            为什么选择 <span class="text-pink-400">Life</span>
          </h2>
          <p class="text-neutral-400 text-lg">六大核心能力，打造你的完美伴侣</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="group p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-pink-500/20 transition-all"
          >
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <div :class="[feature.icon, 'text-2xl text-pink-400']" />
            </div>
            <h3 class="text-lg font-semibold mb-2">{{ feature.title }}</h3>
            <p class="text-sm text-neutral-400 leading-relaxed">{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 会员定价 -->
    <section id="pricing" class="relative py-32 px-6">
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <div class="relative z-10 max-w-5xl mx-auto">
        <div class="text-center mb-20">
          <h2 class="text-4xl md:text-5xl font-bold mb-4">
            选择适合你的 <span class="text-purple-400">方案</span>
          </h2>
          <p class="text-neutral-400 text-lg">从免费开始，随时升级</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="plan in plans"
            :key="plan.name"
            :class="[
              'relative p-8 rounded-2xl border transition-all',
              plan.highlight
                ? 'bg-gradient-to-b from-pink-500/10 to-purple-500/10 border-pink-500/30 scale-105'
                : 'bg-white/[0.03] border-white/5 hover:border-white/10',
            ]"
          >
            <div
              v-if="plan.highlight"
              class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-xs font-medium"
            >
              推荐
            </div>

            <h3 class="text-xl font-semibold mb-1">{{ plan.name }}</h3>
            <p class="text-sm text-neutral-500 mb-4">{{ plan.desc }}</p>

            <div class="flex items-baseline gap-1 mb-6">
              <span class="text-sm text-neutral-400">¥</span>
              <span class="text-4xl font-bold">{{ plan.price }}</span>
              <span class="text-sm text-neutral-500">{{ plan.period }}</span>
            </div>

            <ul class="space-y-3 mb-8">
              <li
                v-for="feat in plan.features"
                :key="feat"
                class="flex items-center gap-2 text-sm text-neutral-300"
              >
                <div class="w-4 h-4 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <div class="w-2 h-2 rounded-full bg-pink-400" />
                </div>
                {{ feat }}
              </li>
            </ul>

            <button
              :class="[
                'w-full py-2.5 rounded-xl text-sm font-medium transition-all',
                plan.highlight
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white shadow-lg shadow-pink-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
              ]"
              @click="handleStart"
            >
              {{ plan.cta }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 最终CTA -->
    <section class="relative py-32 px-6">
      <div class="max-w-3xl mx-auto text-center">
        <div class="relative p-12 rounded-3xl bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-transparent border border-white/5 overflow-hidden">
          <div class="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-pink-500/20 blur-3xl" />
          <div class="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-purple-500/20 blur-3xl" />

          <div class="relative z-10">
            <h2 class="text-3xl md:text-4xl font-bold mb-4">
              准备好遇见 TA 了吗？
            </h2>
            <p class="text-neutral-400 mb-8 text-lg">
              立即创建你的专属 AI 伴侣，开启一段独特的陪伴之旅
            </p>
            <button
              class="px-10 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 transition-all text-white font-medium shadow-lg shadow-pink-500/25 hover:-translate-y-0.5"
              @click="handleStart"
            >
              免费创建伴侣
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="border-t border-white/5 py-12 px-6">
      <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-md bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <span class="text-xs font-bold">L</span>
          </div>
          <span class="text-sm text-neutral-500">Life · 二次元 AI 虚拟伴侣</span>
        </div>
        <div class="flex items-center gap-6 text-sm text-neutral-500">
          <a href="#" class="hover:text-white transition-colors">关于我们</a>
          <a href="#" class="hover:text-white transition-colors">用户协议</a>
          <a href="#" class="hover:text-white transition-colors">隐私政策</a>
        </div>
        <p class="text-xs text-neutral-600">
          © 2024 Life. All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>

<route lang="yaml">
name: LandingPage
meta:
  layout: plain
</route>
