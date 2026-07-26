<script setup lang="ts">
import { RouterView } from 'vue-router'

import AppSidebar from '../components/Layouts/AppSidebar.vue'
</script>

<template>
  <div class="flex h-full w-full font-cute">
    <div class="hidden md:flex">
      <AppSidebar />
    </div>
    <main class="min-w-0 flex-1 overflow-hidden">
      <RouterView />
    </main>
  </div>
</template>
