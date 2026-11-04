<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CreateCampFire from './components/CreateCampFire.vue'
import ViewCampFire from './components/ViewCampFire.vue'
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
    class="w-full max-w-md mx-auto bg-[#111827] sm:rounded-[2rem] sm:border sm:border-slate-800 sm:shadow-[0_0_60px_rgba(245,158,11,0.05)] h-[100dvh] sm:h-auto sm:min-h-[800px] flex flex-col relative overflow-hidden">

    <div class="p-6 sm:p-8 flex-1 flex flex-col overflow-y-auto pb-28">
      <h1
        class="text-4xl font-black text-center text-amber-400 uppercase tracking-[0.25em] drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] mb-2 mt-4">
        Rekindle</h1>
      <p class="text-slate-400 text-center italic mb-6">From quiet embers to shared campfires</p>

      <ViewCampFire v-if="currentRoute === 'view' && eventId" :eventId="eventId" />
      <SettingsPage v-else-if="currentRoute === 'settings'" />
      <InternalFire v-else-if="currentRoute === 'internal-fire'" />
      <CreateCampFire v-else />
    </div>

    <!-- Bottom Navigation -->
    <nav
      class="absolute bottom-0 left-0 w-full bg-[#0b0f19]/95 backdrop-blur-md border-t border-slate-800/80 px-4 py-4 flex justify-around items-center z-20 pb-[max(1rem,env(safe-area-inset-bottom))]">

      <!-- Hearth -->
      <a href="/?page=internal-fire" class="flex flex-col items-center transition-colors group"
        :class="currentRoute === 'internal-fire' ? 'text-amber-500' : 'text-slate-500 hover:text-amber-400'">
        <svg class="w-7 h-7 mb-1 transition-transform group-hover:-translate-y-1" fill="none" stroke="currentColor"
          viewBox="0 0 24 24">
          <!-- Chimney / Mantle -->
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 21V5a2 2 0 012-2h12a2 2 0 012 2v16"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 9h16"></path>
          <!-- Fireplace opening -->
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 21v-6a4 4 0 018 0v6"></path>
          <!-- Flame -->
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 17c-1.5 0-2-1-2-2.5s1-2.5 2-2.5 2 1 2 2.5-1.5 2.5-2 2.5z"></path>
        </svg>
        <span class="text-[0.65rem] font-bold uppercase tracking-wider">Hearth</span>
      </a>

      <!-- Campfire -->
      <a href="/" class="flex flex-col items-center transition-colors group"
        :class="(currentRoute === 'create' || currentRoute === 'view') ? 'text-amber-500' : 'text-slate-500 hover:text-amber-400'">
        <svg class="w-7 h-7 mb-1 transition-transform group-hover:-translate-y-1" fill="none" stroke="currentColor"
          viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20L7 16M7 20l10-4"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 15c-3-3-2-6-2-6s2 1.5 3 1.5 1-2.5 1-2.5 1.5 2 1.5 3.5C15.5 13.5 14 15 12 15z"></path>
        </svg>
        <span class="text-[0.65rem] font-bold uppercase tracking-wider">Campfire</span>
      </a>

      <!-- Settings / Build a Home -->
      <a href="/?page=settings" class="flex flex-col items-center transition-colors group"
        :class="currentRoute === 'settings' ? 'text-amber-500' : 'text-slate-500 hover:text-amber-400'">
        <svg class="w-7 h-7 mb-1 transition-transform group-hover:-translate-y-1" fill="none" stroke="currentColor"
          viewBox="0 0 24 24">
          <!-- House structure -->
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <!-- Wrench Tool inside -->
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17l4-4"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 12a2 2 0 113-3l-1.5 1.5L12 9.5 10.5 11 12 12z"></path>
        </svg>
        <span class="text-[0.65rem] font-bold uppercase tracking-wider">Build</span>
      </a>

    </nav>
  </main>
</template>
