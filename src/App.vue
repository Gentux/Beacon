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
    <h1 class="header-title">🔥 Beacon 🔥</h1>
    <p class="quote"><i>"Gondor calls for help!"</i></p>

    <div v-if="isLoading" class="loading-state">Lighting the fires...</div>

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
        <button type="submit" class="primary-btn">Light the Beacon!</button>
      </form>

      <div v-if="shareUrl" class="result">
        <div class="qr-container">
          <canvas ref="qrcodeCanvas"></canvas>
        </div>
        <p><a :href="shareUrl" class="glow-link">Direct Link</a></p>
      </div>
    </div>

    <!-- View Mode -->
    <div v-else-if="eventId && !isLoading" class="view-mode">
      <div class="event-card">
        <h2 class="event-title">{{ viewData.what }}</h2>
        <div class="event-details">
          <p><strong>Where:</strong> {{ viewData.where }}</p>
          <p><strong>When:</strong> {{ new Date(viewData.when).toLocaleString() }}</p>
        </div>
      </div>

      <button @click="downloadIcs" class="secondary-btn">Add to Agenda (.ics)</button>

      <div class="attendees-section">
        <h4>Who has answered the call? ({{ attendees.length }})</h4>
        <ul class="attendees-list">
          <li v-for="guest in attendees" :key="guest.id">{{ guest.name }}</li>
        </ul>

        <form @submit.prevent="joinEvent" class="join-form">
          <input v-model="guestName" type="text" placeholder="Your name" required />
          <button type="submit" class="primary-btn">I'm coming!</button>
        </form>
      </div>

      <p class="footer-link"><a href="/" class="glow-link">Create your own Beacon</a></p>
    </div>
  </main>
</template>

<style scoped>
:global(body) {
  background-color: #0b0f19;
  /* Deep night sky */
  color: #f1f5f9;
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.container {
  font-family: system-ui, -apple-system, sans-serif;
  width: 100%;
  max-width: 500px;
  margin: 3rem 1rem;
  padding: 2.5rem 2rem;
  text-align: center;
  background: #111827;
  border-radius: 16px;
  box-shadow: 0 0 60px rgba(245, 158, 11, 0.05);
  /* Subtle ambient glow */
  border: 1px solid #1f2937;
}

.header-title {
  font-size: 2.5rem;
  margin: 0 0 0.5rem 0;
  color: #fbbf24;
  text-transform: uppercase;
  letter-spacing: 4px;
  /* The beacon glow */
  text-shadow: 0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(245, 158, 11, 0.4);
}

.quote {
  color: #64748b;
  margin-bottom: 2.5rem;
  font-size: 1.1rem;
}

.loading-state {
  color: #fbbf24;
  font-weight: 500;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.form-group {
  margin-bottom: 1.2rem;
}

input {
  display: block;
  width: 100%;
  padding: 0.8rem 1rem;
  box-sizing: border-box;
  background: #0b0f19;
  border: 1px solid #374151;
  color: #f8fafc;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.2);
}

button {
  padding: 0.8rem 1.5rem;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  width: 100%;
}

.primary-btn {
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  color: white;
  box-shadow: 0 4px 20px rgba(234, 88, 12, 0.4);
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(234, 88, 12, 0.6);
}

.secondary-btn {
  background: #1f2937;
  color: #f1f5f9;
  border: 1px solid #374151;
}

.secondary-btn:hover {
  background: #374151;
}

.result {
  margin-top: 2.5rem;
}

.qr-container {
  display: inline-block;
  background: white;
  padding: 10px;
  border-radius: 12px;
  margin-bottom: 1rem;
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.1);
}

.event-card {
  background: linear-gradient(145deg, #1e293b, #0f172a);
  padding: 2.5rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  border: 1px solid #ea580c;
  box-shadow: inset 0 0 20px rgba(245, 158, 11, 0.05), 0 0 40px rgba(234, 88, 12, 0.2);
}

.event-title {
  color: #fcd34d;
  font-size: 2rem;
  margin: 0 0 1.5rem 0;
  text-shadow: 0 0 15px rgba(251, 191, 36, 0.3);
}

.event-details p {
  margin: 0.5rem 0;
  font-size: 1.1rem;
  color: #cbd5e1;
}

.event-details strong {
  color: #f8fafc;
}

.attendees-section {
  margin-top: 3rem;
  text-align: left;
  background: #1f2937;
  padding: 1.5rem;
  border-radius: 12px;
}

.attendees-section h4 {
  margin-top: 0;
  color: #94a3b8;
}

.attendees-list {
  list-style: none;
  padding: 0;
  margin-bottom: 1.5rem;
}

.attendees-list li {
  background: #111827;
  margin-bottom: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border-left: 4px solid #f59e0b;
  color: #e2e8f0;
}

.join-form {
  display: flex;
  gap: 0.5rem;
}

.join-form input {
  flex: 1;
}

.join-form button {
  width: auto;
}

a.glow-link {
  color: #fbbf24;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
}

a.glow-link:hover {
  color: #fef3c7;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.6);
}

.footer-link {
  margin-top: 3rem;
}
</style>
