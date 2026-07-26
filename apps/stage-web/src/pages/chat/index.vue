<script setup lang="ts">
import { ref, onMounted, nextTick, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
}

const router = useRouter()
const isLoaded = ref(false)
const messages = ref<Message[]>([
  { id: 1, role: 'assistant', content: '你好呀！我是你的 AI 伴侣，有什么想聊的吗？' },
])
const inputText = ref('')
const isSending = ref(false)
const messagesContainer = useTemplateRef<HTMLElement>('messagesContainer')

function handleSend() {
  const text = inputText.value.trim()
  if (!text || isSending.value)
    return

  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: text,
  })
  inputText.value = ''
  isSending.value = true

  // Simulate AI reply
  setTimeout(() => {
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      content: '我听到你了～让我想想怎么回复你呢...',
    })
    isSending.value = false
    scrollToBottom()
  }, 800)

  scrollToBottom()
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value)
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  })
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})
</script>

<template>
  <div
    :class="[
      'min-h-screen bg-white text-neutral-900 flex flex-col transition-opacity duration-500',
      isLoaded ? 'opacity-100' : 'opacity-0',
    ]"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
      <button
        class="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        @click="router.push('/')"
      >
        <span class="i-solar:alt-arrow-left-linear h-4 w-4" />
        返回
      </button>
      <div class="flex items-center gap-2">
        <img src="/favicon.svg" alt="Life" class="w-6 h-6 rounded-md" />
        <span class="font-semibold text-sm">Life</span>
      </div>
      <div class="w-12" />
    </div>

    <!-- Messages -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto px-6 py-6 space-y-4"
    >
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="[
          'flex',
          msg.role === 'user' ? 'justify-end' : 'justify-start',
        ]"
      >
        <div
          :class="[
            'max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
            msg.role === 'user'
              ? 'bg-neutral-900 text-white rounded-br-md'
              : 'bg-neutral-100 text-neutral-900 rounded-bl-md',
          ]"
        >
          {{ msg.content }}
        </div>
      </div>
      <div v-if="isSending" class="flex justify-start">
        <div class="bg-neutral-100 px-4 py-3 rounded-2xl rounded-bl-md">
          <div class="flex gap-1">
            <span class="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style="animation-delay: 0ms" />
            <span class="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style="animation-delay: 150ms" />
            <span class="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style="animation-delay: 300ms" />
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="px-6 py-4 border-t border-neutral-100">
      <div class="flex items-end gap-3 max-w-3xl mx-auto">
        <textarea
          v-model="inputText"
          :disabled="isSending"
          placeholder="输入消息，按 Enter 发送..."
          rows="1"
          class="flex-1 resize-none px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm outline-none focus:border-neutral-400 transition-colors disabled:opacity-50"
          style="max-height: 120px"
          @keydown="handleKeydown"
        />
        <button
          :disabled="!inputText.trim() || isSending"
          class="px-5 py-3 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          @click="handleSend"
        >
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
name: ChatPage
meta:
  layout: plain
</route>