<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import QRCode from 'qrcode'
import { supabase } from './supabase'

// State
const eventId = ref<string | null>(null)
const shareUrl = ref('')
const qrcodeCanvas = ref<HTMLCanvasElement | null>(null)
const isLoading = ref(false)

// Form data (Creation Mode)
const formWhat = ref('')
const formWhere = ref('')
const formWhen = ref('')
const formTime = ref('')
const formNotes = ref('')

// View data (View Mode)
const viewData = ref({ what: '', where: '', when: '', notes: '' })
const attendees = ref<{ id: string, name: string }[]>([])
const guestName = ref('')

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('id')

  if (id) {
    eventId.value = id
    await fetchEvent(id)
    await fetchAttendees(id)
  }
})

const fetchEvent = async (id: string) => {
  isLoading.value = true
  const { data, error } = await supabase.from('events').select('*').eq('id', id).single()
  if (data) {
    viewData.value = { what: data.what, where: data.where, when: data.when, notes: data.notes }
  } else if (error) {
    console.error(error)
  }
  isLoading.value = false
}

const fetchAttendees = async (id: string) => {
  const { data, error } = await supabase.from('attendees').select('*').eq('event_id', id).order('created_at', { ascending: true })
  if (data) attendees.value = data
  if (error) console.error(error)
}

const lightBeacon = async () => {
  isLoading.value = true

  const dateTimeString = formTime.value ? `${formWhen.value}T${formTime.value}` : `${formWhen.value}T00:00`

  const { data, error } = await supabase.from('events').insert({
    what: formWhat.value,
    "where": formWhere.value,
    "when": new Date(dateTimeString).toISOString(),
    notes: formNotes.value
  }).select().single()

  isLoading.value = false

  if (error) {
    console.error(error)
    return
  }

  shareUrl.value = `${window.location.origin}${window.location.pathname}?id=${data.id}`

  await nextTick()
  if (qrcodeCanvas.value) {
    QRCode.toCanvas(qrcodeCanvas.value, shareUrl.value, { width: 250 })
  }
}

const joinEvent = async () => {
  if (!guestName.value || !eventId.value) return

  const { error } = await supabase.from('attendees').insert({
    event_id: eventId.value,
    name: guestName.value
  })

  if (!error) {
    guestName.value = ''
    await fetchAttendees(eventId.value)
  } else {
    console.error(error)
  }
}

const downloadIcs = () => {
  const startDate = new Date(viewData.value.when)
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000)
  const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const eventUrl = window.location.href
  const notesDesc = viewData.value.notes ? `${viewData.value.notes}\\n\\n` : ''
  const description = `${notesDesc}Link: ${eventUrl}`

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${viewData.value.what}`,
    `LOCATION:${viewData.value.where}`,
    `DESCRIPTION:${description}`,
    `URL:${eventUrl}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n")

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'beacon.ics'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <main
    class="w-full max-w-md mx-auto bg-[#111827] sm:rounded-[2rem] sm:border sm:border-slate-800 sm:shadow-[0_0_60px_rgba(245,158,11,0.05)] min-h-screen sm:min-h-[auto] flex flex-col relative overflow-hidden">
    <div class="p-6 sm:p-8 flex-1 flex flex-col">
      <h1
        class="text-4xl font-black text-center text-amber-400 uppercase tracking-[0.25em] drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] mb-2 mt-4">
        🔥 Beacon 🔥</h1>
      <p class="text-slate-400 text-center italic mb-8">"Gondor calls for help!"</p>

      <div v-if="isLoading"
        class="text-amber-400 font-medium animate-pulse text-center flex-1 flex items-center justify-center">
        Lighting the fires...
      </div>

      <!-- Creation Mode -->
      <div v-if="!eventId && !isLoading" class="flex flex-col flex-1">
        <form @submit.prevent="lightBeacon" class="flex flex-col gap-4">
          <input v-model="formWhat" type="text" placeholder="What? (e.g., Drinks)" required
            class="w-full px-4 py-3.5 bg-[#0b0f19] border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all text-slate-50 placeholder-slate-500" />

          <input v-model="formWhere" type="text" placeholder="Where? (e.g., The Prancing Pony)" required
            class="w-full px-4 py-3.5 bg-[#0b0f19] border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all text-slate-50 placeholder-slate-500" />

          <div class="flex gap-3">
            <input v-model="formWhen" type="date" required
              class="w-full px-4 py-3.5 bg-[#0b0f19] border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all text-slate-50" />
            <input v-model="formTime" type="time"
              class="w-full px-4 py-3.5 bg-[#0b0f19] border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all text-slate-50" />
          </div>

          <textarea v-model="formNotes" placeholder="Notes (optional)" rows="2"
            class="w-full px-4 py-3.5 bg-[#0b0f19] border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all text-slate-50 placeholder-slate-500 resize-y"></textarea>

          <button type="submit"
            class="w-full py-4 mt-2 rounded-xl font-bold text-lg text-white bg-gradient-to-br from-amber-500 to-orange-600 shadow-[0_4px_20px_rgba(234,88,12,0.4)] hover:-translate-y-0.5 hover:shadow-[0_6px_25px_rgba(234,88,12,0.6)] transition-all">
            Light the Beacon!
          </button>
        </form>

        <div v-if="shareUrl" class="mt-10 text-center flex flex-col items-center">
          <div class="bg-white p-3 rounded-2xl inline-block mb-4 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            <canvas ref="qrcodeCanvas"></canvas>
          </div>
          <p>
            <a :href="shareUrl"
              class="text-amber-400 font-medium hover:text-amber-200 hover:drop-shadow-[0_0_10px_rgba(251,191,36,0.6)] transition-all">
              Direct Link
            </a>
          </p>
        </div>
      </div>

      <!-- View Mode -->
      <div v-else-if="eventId && !isLoading" class="flex flex-col flex-1">
        <div
          class="bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 rounded-2xl mb-6 border border-orange-600 shadow-[inset_0_0_20px_rgba(245,158,11,0.05),0_0_40px_rgba(234,88,12,0.2)]">
          <h2 class="text-amber-300 text-3xl font-bold mb-6 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">{{
            viewData.what }}</h2>
          <div class="space-y-3 text-lg text-slate-300">
            <p><strong class="text-slate-50">Where:</strong> {{ viewData.where }}</p>
            <p><strong class="text-slate-50">When:</strong> {{ new Date(viewData.when).toLocaleString() }}</p>
            <p v-if="viewData.notes"><strong class="text-slate-50">Notes:</strong> {{ viewData.notes }}</p>
          </div>
        </div>

        <button @click="downloadIcs"
          class="w-full py-4 rounded-xl font-bold text-lg text-slate-100 bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all mb-8">
          Add to Agenda (.ics)
        </button>

        <div class="mt-2 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
          <h4 class="text-slate-400 font-medium mb-4">Who has answered the call? ({{ attendees.length }})</h4>
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
              I'm coming!
            </button>
          </form>
        </div>

        <p class="mt-12 text-center">
          <a href="/"
            class="text-amber-400 font-medium hover:text-amber-200 hover:drop-shadow-[0_0_10px_rgba(251,191,36,0.6)] transition-all">
            Create your own Beacon
          </a>
        </p>
      </div>
    </div>
  </main>
</template>
