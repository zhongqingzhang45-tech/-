<script setup lang="ts">
import type { Character } from '@proj-airi/stage-ui/types/character'

import { useAnalytics } from '@proj-airi/stage-ui/composables'
import { useCharacterStore } from '@proj-airi/stage-ui/stores/characters'
import { useCompanionStore } from '@proj-airi/stage-ui/stores/companion'
import { Button, FieldInput } from '@proj-airi/ui'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import CharacterDialog from '../settings/characters/components/CharacterDialog.vue'
import CharacterItem from '../settings/characters/components/CharacterItem.vue'

const router = useRouter()
const { trackCharacterDeleted } = useAnalytics()
const characterStore = useCharacterStore()
const companionStore = useCompanionStore()
const { characters } = storeToRefs(characterStore)

onMounted(() => {
  characterStore.fetchList().catch(console.error)
})

const searchQuery = ref('')
const filteredCharacters = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return Array.from(characters.value.values()).filter((char) => {
    const i18n = char.i18n?.find(i => i.language === 'en') || char.i18n?.[0]
    return i18n?.name.toLowerCase().includes(query) || i18n?.description.toLowerCase().includes(query)
  })
})

const isDialogOpen = ref(false)
const selectedCharacter = ref<Character | undefined>(undefined)

function handleCreate() {
  selectedCharacter.value = undefined
  isDialogOpen.value = true
}

function handleEdit(char: Character) {
  selectedCharacter.value = char
  isDialogOpen.value = true
}

function handleDelete(id: string) {
  if (confirm('确定要删除这个伙伴吗？')) {
    characterStore.remove(id)
      .then(() => trackCharacterDeleted({ character_id: id }))
      .catch(console.error)
  }
}

function handleActivate(char: Character) {
  router.push('/chat')
}
</script>

<template>
  <div class="h-full w-full overflow-y-auto scrollbar-none">
    <div class="mx-auto max-w-6xl px-6 py-10">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          我的 Life
        </h1>
        <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          每一个她，都是独一无二的陪伴
        </p>
      </div>

      <!-- Stats -->
      <div class="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div
          :class="[
            'rounded-2xl p-5',
            'bg-gradient-to-br from-pink-500/10 to-purple-500/10',
            'border border-pink-200/50 dark:border-pink-800/30',
          ]"
        >
          <div class="text-3xl font-bold text-pink-600 dark:text-pink-400">
            {{ characters.size }}
          </div>
          <div class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            我的 Life
          </div>
        </div>
        <div
          :class="[
            'rounded-2xl p-5',
            'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
            'border border-blue-200/50 dark:border-blue-800/30',
          ]"
        >
          <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {{ companionStore.daysTogether }}
          </div>
          <div class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            陪伴天数
          </div>
        </div>
        <div
          :class="[
            'rounded-2xl p-5',
            'bg-gradient-to-br from-amber-500/10 to-orange-500/10',
            'border border-amber-200/50 dark:border-amber-800/30',
          ]"
        >
          <div class="text-3xl font-bold text-amber-600 dark:text-amber-400">
            {{ companionStore.totalChatCount }}
          </div>
          <div class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            对话次数
          </div>
        </div>
        <div
          :class="[
            'rounded-2xl p-5',
            'bg-gradient-to-br from-emerald-500/10 to-teal-500/10',
            'border border-emerald-200/50 dark:border-emerald-800/30',
          ]"
        >
          <div class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            Lv.{{ companionStore.level }}
          </div>
          <div class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {{ companionStore.relationshipTitle }}
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="mb-6 flex items-center justify-between gap-4">
        <FieldInput
          v-model="searchQuery"
          placeholder="搜索伙伴..."
          class="w-64"
        />
        <Button @click="handleCreate">
          <div class="i-solar:add-circle-bold mr-2" />
          创造新的她
        </Button>
      </div>

      <!-- Content -->
      <div v-if="characters.size === 0" class="flex items-center justify-center py-20">
        <div class="i-svg-spinners:90-ring-with-bg text-4xl text-primary-500" />
      </div>

      <div
        v-else
        class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 md:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]"
      >
        <!-- Create Card -->
        <button
          class="group relative min-h-120px flex flex-col cursor-pointer items-center justify-center gap-3 overflow-hidden border-2 border-neutral-200 rounded-2xl border-dashed bg-neutral-50/50 p-6 transition-all duration-300 dark:border-neutral-800 hover:border-purple-400 dark:bg-neutral-900/20 hover:bg-purple-50/30 dark:hover:border-purple-600 dark:hover:bg-purple-900/10"
          @click="handleCreate"
        >
          <div class="i-solar:add-circle-linear text-5xl text-neutral-300 transition-colors dark:text-neutral-700 group-hover:text-purple-400 dark:group-hover:text-purple-500" />
          <span class="text-neutral-500 font-medium transition-colors dark:text-neutral-500 group-hover:text-purple-600 dark:group-hover:text-purple-400">
            创造新的她
          </span>
        </button>

        <!-- Character Items -->
        <CharacterItem
          v-for="char in filteredCharacters"
          :key="char.id"
          :character="char"
          :is-active="false"
          :is-selected="selectedCharacter?.id === char.id"
          @select="handleEdit(char)"
          @activate="handleActivate(char)"
          @delete="handleDelete(char.id)"
        />
      </div>
    </div>

    <CharacterDialog
      v-model="isDialogOpen"
      :character="selectedCharacter"
      @submit="characterStore.fetchList()"
    />
  </div>
</template>

<route lang="yaml">
meta:
  layout: stage
  title: 我的 Life
</route>
