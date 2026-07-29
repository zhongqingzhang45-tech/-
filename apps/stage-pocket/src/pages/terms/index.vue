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
          用户协议
        </h1>
      </div>
    </div>

    <div class="mx-auto max-w-2xl px-5 py-6 pb-safe text-neutral-800 dark:text-neutral-200">
      <div class="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 class="text-base font-semibold mb-2">一、服务说明</h2>
          <p class="text-neutral-600 dark:text-neutral-400">
            Life 是一款基于人工智能技术的虚拟伴侣应用（以下简称"本服务"），由 Moeru AI 团队（以下简称"我们"）开发与运营。本服务通过 AI 对话、Live2D/VRM 虚拟形象等技术，为用户提供陪伴与互动体验。
          </p>
        </section>

        <section>
          <h2 class="text-base font-semibold mb-2">二、用户注册与账户</h2>
          <ul class="list-disc pl-5 text-neutral-600 dark:text-neutral-400 space-y-1">
            <li>用户在使用本服务前需创建角色信息，包括但不限于角色昵称、性格偏好等</li>
            <li>用户应确保提供的信息真实、合法，不得冒充他人</li>
            <li>用户账户的安全性由用户自行负责，因账户信息泄露造成的损失由用户承担</li>
          </ul>
        </section>

        <section>
          <h2 class="text-base font-semibold mb-2">三、使用规范</h2>
          <p class="text-neutral-600 dark:text-neutral-400 mb-2">用户在使用本服务时，不得进行以下行为：</p>
          <ul class="list-disc pl-5 text-neutral-600 dark:text-neutral-400 space-y-1">
            <li>利用本服务从事违法犯罪活动</li>
            <li>发送或存储违反法律法规的内容</li>
            <li>对 AI 角色进行恶意诱导、骚扰或滥用</li>
            <li>逆向工程、破解或干扰本服务的正常运行</li>
            <li>未经授权将本服务用于商业用途</li>
          </ul>
        </section>

        <section>
          <h2 class="text-base font-semibold mb-2">四、会员服务</h2>
          <ul class="list-disc pl-5 text-neutral-600 dark:text-neutral-400 space-y-1">
            <li>本服务提供免费版与付费会员版（Pro / Premium）</li>
            <li>免费版每日有消息数量限制，会员版享受更多功能与权益</li>
            <li>会员费用按公示价格收取，支付后不可退款（法律法规另有规定的除外）</li>
            <li>我们有权调整会员权益与价格，调整前已购买的会员不受影响</li>
          </ul>
        </section>

        <section>
          <h2 class="text-base font-semibold mb-2">五、知识产权</h2>
          <p class="text-neutral-600 dark:text-neutral-400">
            本服务的软件代码、UI 设计、图标、动画等知识产权归我们所有。用户在使用过程中创建的角色对话内容归用户所有。本服务基于开源项目（github.com/moeru-ai/airi）开发，开源部分遵循其对应的开源协议。
          </p>
        </section>

        <section>
          <h2 class="text-base font-semibold mb-2">六、免责声明</h2>
          <ul class="list-disc pl-5 text-neutral-600 dark:text-neutral-400 space-y-1">
            <li>AI 生成的内容仅供参考，不构成专业建议（医疗、法律、财务等）</li>
            <li>因网络故障、设备问题导致的服务中断，我们不承担赔偿责任</li>
            <li>用户与 AI 角色的互动为模拟社交体验，不代表真实人际关系</li>
          </ul>
        </section>

        <section>
          <h2 class="text-base font-semibold mb-2">七、协议变更</h2>
          <p class="text-neutral-600 dark:text-neutral-400">
            我们有权根据法律法规及业务发展需要修改本协议。修改后的协议将在应用内公布，用户继续使用本服务即视为同意修改后的协议。
          </p>
        </section>

        <section>
          <h2 class="text-base font-semibold mb-2">八、联系我们</h2>
          <p class="text-neutral-600 dark:text-neutral-400">
            如对本协议有任何疑问，请通过应用内反馈渠道与我们联系。
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
name: TermsOfServicePage
meta:
  layout: empty
  title: 用户协议
</route>
</content>
</invoke>
