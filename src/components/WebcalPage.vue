<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'

const status = ref('Gathering embers...')

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const idsParam = params.get('ids')

  if (!idsParam) {
    status.value = 'No campfires specified.'
    return
  }

  const ids = idsParam.split(',')

  const { data: events, error: eventsError } = await supabase.from('events').select('*').in('id', ids)
  const { data: attendees } = await supabase.from('attendees').select('*').in('event_id', ids)

  if (eventsError || !events) {
    status.value = 'The fire has faded. Failed to load events.'
    return
  }

  const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  let icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rekindle//Beacon//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH"
  ]

  events.forEach(event => {
    const eventAttendees = attendees?.filter(a => a.event_id === event.id).map(a => a.name) || []
    const startDate = new Date(event.when)
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000)

    const eventUrl = `${window.location.origin}/?id=${event.id}`
    const attendeeText = eventAttendees.length ? `\\n\\nAttendees:\\n- ${eventAttendees.join('\\n- ')}` : ''
    const cleanNotes = event.notes ? event.notes.replace(/\n/g, '\\n') + '\\n\\n' : ''

    const description = `${cleanNotes}Original Event: ${eventUrl}${attendeeText}`

    icsContent.push(
      "BEGIN:VEVENT",
      `UID:${event.id}@rekindle`,
      `SUMMARY:${event.what}`,
      `LOCATION:${event.where}`,
      `DESCRIPTION:${description}`,
      `URL:${eventUrl}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      "END:VEVENT"
    )
  })

  icsContent.push("END:VCALENDAR")
  const finalIcs = icsContent.join("\r\n")

  const blob = new Blob([finalIcs], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'rekindle-campfires.ics'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  status.value = 'Calendar downloaded! You can now import it into your preferred app.'
})
</script>

<template>
  <div class="flex flex-col flex-1 items-center justify-center text-center">
    <p class="text-amber-400 text-lg font-medium">{{ status }}</p>
    <a href="/"
      class="mt-8 px-6 py-3 rounded-xl font-bold text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors">
      Return to Camp
    </a>
  </div>
</template>
