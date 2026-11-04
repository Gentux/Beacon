<script setup lang="ts">
import { ref, onMounted } from 'vue'

const name = ref('')
const email = ref('')
const isSaved = ref(false)

onMounted(() => {
  name.value = localStorage.getItem('beacon_name') || ''
  email.value = localStorage.getItem('beacon_email') || ''
})

const saveSettings = () => {
  localStorage.setItem('beacon_name', name.value)
  localStorage.setItem('beacon_email', email.value)

  isSaved.value = true
  setTimeout(() => {
    isSaved.value = false
  }, 3000)
}
</script>

<template>
  <div class="flex flex-col flex-1">
    <h2 class="text-amber-300 text-2xl font-bold mb-6 text-center">Settings</h2>

    <form @submit.prevent="saveSettings" class="flex flex-col gap-4">
      <input v-model="name" type="text" placeholder="Your Name" required
        class="w-full px-4 py-3.5 bg-[#0b0f19] border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all text-slate-50 placeholder-slate-500" />

      <input v-model="email" type="email" placeholder="Your Email address" required
        class="w-full px-4 py-3.5 bg-[#0b0f19] border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all text-slate-50 placeholder-slate-500" />

      <button type="submit"
        class="w-full py-4 mt-2 rounded-xl font-bold text-lg text-white bg-gradient-to-br from-amber-500 to-orange-600 shadow-[0_4px_20px_rgba(234,88,12,0.4)] hover:-translate-y-0.5 hover:shadow-[0_6px_25px_rgba(234,88,12,0.6)] transition-all">
        Save Settings
      </button>

      <p v-if="isSaved" class="text-amber-400 font-medium text-center mt-2">
        Settings saved successfully!
      </p>
    </form>
  </div>
</template>
