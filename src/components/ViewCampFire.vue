<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'

const props = defineProps<{ eventId: string }>()

const viewData = ref({ what: '', where: '', when: '', notes: '' })
const attendees = ref<{ id: string, name: string }[]>([])
const guestName = ref('')
const isLoading = ref(true)

onMounted(async () => {
  guestName.value = localStorage.getItem('beacon_name') || ''
  await fetchEvent(props.eventId)
  await fetchAttendees(props.eventId)
  isLoading.value = false
})

const fetchEvent = async (id: string) => {
  const { data, error } = await supabase.from('events').select('*').eq('id', id).single()
  if (data) {
    viewData.value = { what: data.what, where: data.where, when: data.when, notes: data.notes }
  } else if (error) {
    console.error(error)
  }
}

const fetchAttendees = async (id: string) => {
  const { data, error } = await supabase.from('attendees').select('*').eq('event_id', id).order('created_at', { ascending: true })
  if (data) attendees.value = data
  if (error) console.error(error)
}

const joinEvent = async () => {
  if (!guestName.value || !props.eventId) return

  const { error } = await supabase.from('attendees').insert({
    event_id: props.eventId,
    name: guestName.value
  })

  if (!error) {
    if (!localStorage.getItem('beacon_name')) {
      guestName.value = ''
    }

    const attended = JSON.parse(localStorage.getItem('beacon_attended_events') || '[]')
    if (!attended.includes(props.eventId)) {
      attended.push(props.eventId)
      localStorage.setItem('beacon_attended_events', JSON.stringify(attended))
    }

    await fetchAttendees(props.eventId)
  } else {
    console.error(error)
  }
}

const subscribeWebcal = () => {
  const attended = JSON.parse(localStorage.getItem('beacon_attended_events') || '[]')

  if (!attended.includes(props.eventId)) {
    attended.push(props.eventId)
    localStorage.setItem('beacon_attended_events', JSON.stringify(attended))
  }

  const ids = attended.join(',')

  // Fetch your Supabase URL from environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  // Remove protocol (http:// or https://) for webcal formatting
  const baseUrl = supabaseUrl.replace(/^https?:\/\//, '')

  const webcalUrl = `webcal://${baseUrl}/functions/v1/calendar?ids=${ids}`
  window.location.href = webcalUrl
}
</script>

<template>
  <div class="flex flex-col flex-1">
    <div v-if="isLoading"
      class="text-amber-400 font-medium animate-pulse text-center flex-1 flex items-center justify-center py-10">
      Finding the beacon...
    </div>

    <div v-else>
      <div
        class="bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 rounded-2xl mb-6 border border-orange-600 shadow-[inset_0_0_20px_rgba(245,158,11,0.05),0_0_40px_rgba(234,88,12,0.2)]">
        <h2 class="text-amber-300 text-3xl font-bold mb-6 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
          {{ viewData.what }}
        </h2>
        <div class="space-y-3 text-lg text-slate-300">
          <p><strong class="text-slate-50">Where:</strong> {{ viewData.where }}</p>
          <p><strong class="text-slate-50">When:</strong> {{ new Date(viewData.when).toLocaleString() }}</p>
          <p v-if="viewData.notes"><strong class="text-slate-50">Notes:</strong> {{ viewData.notes }}</p>
        </div>
      </div>

      <button @click="subscribeWebcal"
        class="w-full py-4 rounded-xl font-bold text-lg text-slate-100 bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all mb-8">
        Subscribe to Updates (.ics)
      </button>

      <div class="mt-2 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
        <h4 class="text-slate-400 font-medium mb-4">Who{{ attendees.length < 2 ? "'s" : " are" }} sitting around ? ({{
          attendees.length }})</h4>
            <ul class="space-y-2 mb-6">
              <li v-for="guest in attendees" :key="guest.id"
                class="bg-[#111827] px-4 py-3 rounded-lg border-l-4 border-amber-500 text-slate-200">
                {{ guest.name }}
              </li>
            </ul>

            <form @submit.prevent="joinEvent" class="flex gap-2">
              <input v-model="guestName" type="text" placeholder="Your name" required
                class="flex-1 px-4 py-3 bg-[#0b0f19] border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all text-slate-50 placeholder-slate-500" />
              <button type="submit"
                class="px-6 rounded-xl font-bold text-white bg-gradient-to-br from-amber-500 to-orange-600 shadow-[0_4px_20px_rgba(234,88,12,0.4)] hover:-translate-y-0.5 hover:shadow-[0_6px_25px_rgba(234,88,12,0.6)] transition-all">
                Join the circle
              </button>
            </form>
      </div>

      <p class="mt-12 text-center">
        <a href="/"
          class="text-amber-400 font-medium hover:text-amber-200 hover:drop-shadow-[0_0_10px_rgba(251,191,36,0.6)] transition-all">
          Create your own campfire
        </a>
      </p>
    </div>
  </div>
</template>
