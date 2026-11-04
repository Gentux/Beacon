<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CreateBeacon from './components/CreateBeacon.vue'
import ViewBeacon from './components/ViewBeacon.vue'
import SettingsPage from './components/SettingsPage.vue'
import InternalFire from './components/InternalFire.vue'

const currentRoute = ref('create')
const eventId = ref<string | null>(null)

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('id')
  const page = params.get('page')

  if (id) {
    eventId.value = id
    currentRoute.value = 'view'
  } else if (page === 'settings') {
    currentRoute.value = 'settings'
  } else if (page === 'internal-fire') {
    currentRoute.value = 'internal-fire'
  }
})
</script>

<template>
  <main
    class="w-full max-w-md mx-auto bg-[#111827] sm:rounded-[2rem] sm:border sm:border-slate-800 sm:shadow-[0_0_60px_rgba(245,158,11,0.05)] min-h-screen sm:min-h-[auto] flex flex-col relative overflow-hidden">
    <div class="p-6 sm:p-8 flex-1 flex flex-col">
      <h1
        class="text-4xl font-black text-center text-amber-400 uppercase tracking-[0.25em] drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] mb-2 mt-4">
        🔥 Beacon 🔥</h1>
      <p class="text-slate-400 text-center italic mb-6">"Gondor calls for help!"</p>

      <nav class="flex justify-center gap-6 mb-8 text-sm font-medium border-b border-slate-800/60 pb-4">
        <a href="/" class="transition-colors hover:text-amber-400"
          :class="currentRoute === 'create' ? 'text-amber-500' : 'text-slate-500'">Create</a>
        <a href="/?page=settings" class="transition-colors hover:text-amber-400"
          :class="currentRoute === 'settings' ? 'text-amber-500' : 'text-slate-500'">Settings</a>
        <a href="/?page=internal-fire" class="transition-colors hover:text-amber-400"
          :class="currentRoute === 'internal-fire' ? 'text-amber-500' : 'text-slate-500'">Internal Fire</a>
      </nav>

      <ViewBeacon v-if="currentRoute === 'view' && eventId" :eventId="eventId" />
      <SettingsPage v-else-if="currentRoute === 'settings'" />
      <InternalFire v-else-if="currentRoute === 'internal-fire'" />
      <CreateBeacon v-else />

    </div>
  </main>
</template>
