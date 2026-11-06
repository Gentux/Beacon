import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const idsParam = url.searchParams.get('ids')

    if (!idsParam) {
      return new Response("Missing ids parameter", { status: 400 })
    }

    const ids = idsParam.split(',')

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Fetch events and attendees
    const { data: events, error: eventsError } = await supabaseClient
      .from('events')
      .select('*')
      .in('id', ids)

    const { data: attendees, error: attendeesError } = await supabaseClient
      .from('attendees')
      .select('*')
      .in('event_id', ids)

    if (eventsError || !events) {
      console.log("Supabase query error: ", eventsError)
      return new Response("Failed to fetch events", { status: 500 })
    }

    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    // Build the ICS content
    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Rekindle//Beacon//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Rekindle Campfires",
      "X-PUBLISHED-TTL:PT15M" // Suggests calendar apps to refresh every 15 mins
    ]

    events.forEach(event => {
      const eventAttendees = attendees?.filter(a => a.event_id === event.id).map(a => a.name) || []
      const startDateStr = formatDate(event.when)
      
      const startDate = new Date(event.when)
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000)
      const endDateStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      
      // Use the frontend URL provided via env or fallback to a placeholder
      const frontendUrl = Deno.env.get('FRONTEND_URL') ?? 'https://your-rekindle-domain.com'
      const eventUrl = `${frontendUrl}/?id=${event.id}`
      
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
        `DTSTART:${startDateStr}`,
        `DTEND:${endDateStr}`,
        "END:VEVENT"
      )
    })

    icsContent.push("END:VCALENDAR")
    const finalIcs = icsContent.join("\r\n")

    return new Response(finalIcs, {
      headers: { 
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"rekindle.ics\""
      },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    })
  }
})
