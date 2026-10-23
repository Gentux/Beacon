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

// View data (View Mode)
const viewData = ref({ what: '', where: '', when: '' })
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
    viewData.value = { what: data.what, where: data.where, when: data.when }
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
  const { data, error } = await supabase.from('events').insert({
    what: formWhat.value,
    "where": formWhere.value,
    "when": new Date(formWhen.value).toISOString()
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

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${viewData.value.what}`,
    `LOCATION:${viewData.value.where}`,
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
  <main class="container">
    <h3>Beacon 🚨</h3>
    <p><i>"Gondor calls for help!"</i></p>

    <div v-if="isLoading">Loading...</div>

    <!-- Creation Mode -->
    <div v-if="!eventId && !isLoading" class="create-mode">
      <form @submit.prevent="lightBeacon">
        <div class="form-group">
          <input v-model="formWhat" type="text" placeholder="What? (e.g., Drinks)" required />
        </div>
        <div class="form-group">
          <input v-model="formWhere" type="text" placeholder="Where? (e.g., The Prancing Pony)" required />
        </div>
        <div class="form-group">
          <input v-model="formWhen" type="datetime-local" required />
        </div>
        <button type="submit">Light the Beacon!</button>
      </form>

      <div v-if="shareUrl" class="result">
        <canvas ref="qrcodeCanvas"></canvas>
        <p><a :href="shareUrl">Direct Link</a></p>
      </div>
    </div>

    <!-- View Mode -->
    <div v-else-if="eventId && !isLoading" class="view-mode">
      <div class="event-card">
        <h3 style="margin-top: 0;">{{ viewData.what }}</h3>
        <p><strong>Where:</strong> {{ viewData.where }}</p>
        <p><strong>When:</strong> {{ new Date(viewData.when).toLocaleString() }}</p>
      </div>

      <button @click="downloadIcs">Add to Agenda (.ics)</button>

      <div class="attendees-section">
        <h4>Who's coming? ({{ attendees.length }})</h4>
        <ul class="attendees-list">
          <li v-for="guest in attendees" :key="guest.id">{{ guest.name }}</li>
        </ul>

        <form @submit.prevent="joinEvent" class="join-form">
          <input v-model="guestName" type="text" placeholder="Your name" required />
          <button type="submit">I'm coming!</button>
        </form>
      </div>

      <p style="margin-top: 3rem;"><a href="/">Create your own Beacon</a></p>
    </div>
  </main>
</template>

<style scoped>
.container {
  font-family: system-ui, sans-serif;
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
  text-align: center;
}

.form-group,
.join-form {
  margin-bottom: 1rem;
}

.join-form {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

input {
  display: block;
  width: 100%;
  padding: 0.5rem;
  box-sizing: border-box;
}

button {
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1rem;
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 4px;
}

button:hover {
  background-color: #34495e;
}

.result {
  margin-top: 2rem;
}

.event-card {
  background: #f4f4f5;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  color: #333;
}

.attendees-section {
  margin-top: 2.5rem;
  text-align: left;
}

.attendees-list {
  list-style: none;
  padding: 0;
}

.attendees-list li {
  background: #eef2f5;
  margin-bottom: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
}
</style>
