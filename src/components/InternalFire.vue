<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'

const upcomingEvents = ref<any[]>([])
const isLoading = ref(true)

onMounted(async () => {
  const stored = localStorage.getItem('beacon_attended_events')
  let eventIds: string[] = []

  try {
    eventIds = stored ? JSON.parse(stored) : []
  } catch (e) {
    eventIds = []
  }

  if (eventIds.length > 0) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .in('id', eventIds)
      .order('when', { ascending: true })

    if (data) {
      upcomingEvents.value = data
    } else if (error) {
      console.error(error)
    }
  }

  isLoading.value = false
})
</script>

<template>
  <div class="flex flex-col flex-1 pb-10">
    <h2 class="text-amber-300 text-3xl font-bold mb-8 text-center drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
      Your Hearth
    </h2>

    <div v-if="isLoading" class="text-amber-400 font-medium animate-pulse text-center my-10">
      Stoking the fire...
    </div>

    <div v-else-if="upcomingEvents.length === 0" class="text-center my-10 flex flex-col items-center">
      <p class="text-slate-400 italic mb-4">The hearth is cold. You haven't answered any calls yet!</p>
      <a href="/" class="text-amber-500 font-bold hover:text-amber-400 transition-colors">
        Find a Campfire
      </a>
    </div>

    <div v-else class="space-y-4">
      <a v-for="event in upcomingEvents" :key="event.id" :href="`/?id=${event.id}`"
        class="block bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all group">
        <h3 class="text-xl font-bold text-amber-100 group-hover:text-amber-300 transition-colors mb-2">{{ event.what }}
        </h3>
        <div class="text-sm text-slate-300 space-y-1">
          <p>📍 {{ event.where }}</p>
          <p>⏰ {{ new Date(event.when).toLocaleString() }}</p>
        </div>
      </a>
    </div>
  </div>
</template>
