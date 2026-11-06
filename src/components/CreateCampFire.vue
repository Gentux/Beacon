<script setup lang="ts">
import { ref, nextTick } from 'vue'
import QRCode from 'qrcode'
import { supabase } from '../supabase'

const shareUrl = ref('')
const qrcodeCanvas = ref<HTMLCanvasElement | null>(null)
const isLoading = ref(false)

const formWhat = ref('')
const formWhere = ref('')
const formWhen = ref('')
const formTime = ref('')
const formNotes = ref('')

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

  shareUrl.value = `${window.location.origin}/?id=${data.id}`

  await nextTick()
  if (qrcodeCanvas.value) {
    QRCode.toCanvas(qrcodeCanvas.value, shareUrl.value, { width: 250 })
  }
}
</script>

<template>
  <div class="flex flex-col flex-1">
    <div v-if="isLoading"
      class="text-amber-400 font-medium animate-pulse text-center flex-1 flex items-center justify-center py-10">
      Start a campfire
    </div>

    <div v-else>
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
  </div>
</template>
