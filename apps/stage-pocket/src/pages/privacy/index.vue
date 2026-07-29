<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen w-full bg-white dark:bg-neutral-950">
    <div class="sticky top-0 z-10 backdrop-blur-md bg-white/70 dark:bg-neutral-950/70 border-b border-black/5 dark:border-white/5">
      <div class="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        <button
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 transition"
          @click="router.back()"
        >
          <span class="i-solar:arrow-left-linear text-neutral-700 dark:text-neutral-300" />
        </button>
        <h1 class="text-lg font-semibold text-neutral-900 dark:text-white">
          隐私政策
        </h1>
      </div>
    </div>

    <div class="mx-auto max-w-2xl px-5 py-6 pb-safe text-neutral-800 dark:text-neutral-200">
      <div class="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 class="text-base font-semibold mb-2">引言</h2>
          <p class="text-neutral-600 dark:text-neutral-400">
            Life（"我们"）非常重视用户的隐私和个人信息保护。本隐私政策说明了我们如何收集、使用、存储和保护您的个人信息。
          </p>
        </section>

        <section>
          <h2 class="text-base font-semibold mb-2">我们收集的信息</h2>
          <ul class="list-disc pl-5 text-neutral-600 dark:text-neutral-400 space-y-1">
            <li>账户信息：您创建角色时提供的昵称等基本信息</li>
            <li>对话内容：您与 AI 伴侣的聊天记录，用于提供陪伴服务</li>
            <li>设备信息：设备型号、操作系统版本，用于优化应用性能</li>
            <li>使用数据：功能使用情况，用于改进产品体验</li>
          </ul>
        </section>

        <section>
          <h2 class="text-base font-semibold mb-2">信息的使用</h2>
          <ul class="list-disc pl-5 text-neutral-600 dark:text-neutral-400 space-y-1">
            <li>提供、维护和改进我们的服务</li>
            <li>个性化您的 AI 伴侣体验</li>
            <li>发送服务通知和更新</li>
            <li>保障账户安全和服务稳定性</li>
          </ul>
        </section>

        <section>
          <h2 class="text-base font-semibold mb-2">信息的存储与保护</h2>
          <p class="text-neutral-600 dark:text-neutral-400">
            您的对话数据主要存储在本地设备中。我们不会将您的聊天内容用于训练 AI 模型，也不会未经授权向第三方分享您的个人信息。
          </p>
        </section>

        <section>
          <h2 class="text-base font-semibold mb-2">您的权利</h2>
          <ul class="list-disc pl-5 text-neutral-600 dark:text-neutral-400 space-y-1">
            <li>访问和更正您的个人信息</li>
            <li>删除您的账户和相关数据</li>
            <li>随时撤回同意</li>
          </ul>
        </section>

        <section>
          <h2 class="text-base font-semibold mb-2">联系我们</h2>
          <p class="text-neutral-600 dark:text-neutral-400">
            如果您对本隐私政策有任何疑问，请通过应用内反馈渠道联系我们。
          </p>
        </section>

        <div class="pt-4 text-xs text-neutral-400 dark:text-neutral-600">
          最后更新日期：2026 年 7 月 29 日
        </div>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
name: PrivacyPolicyPage
meta:
  layout: empty
  title: 隐私政策
</route>
