<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-white">Estado en Tiempo Real</h2>
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark border border-slate-700">
        <div :class="isOnline ? 'bg-primary' : 'bg-red-500'" class="w-2.5 h-2.5 rounded-full animate-pulse"></div>
        <span class="text-sm font-medium text-slate-300">{{ isOnline ? 'Online' : 'Offline' }}</span>
      </div>
    </div>

    <!-- Cards de Telemetría -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-dark p-6 rounded-xl border border-slate-700 relative overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="relative z-10 flex justify-between items-start">
          <div>
            <p class="text-sm font-medium text-slate-400">Temp. Ambiente</p>
            <h3 class="text-3xl font-bold text-white mt-2">{{ telemetry.temp }}<span class="text-lg text-slate-500 ml-1">°C</span></h3>
          </div>
          <div class="p-3 bg-slate-800 rounded-lg text-primary">
            <Thermometer class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="bg-dark p-6 rounded-xl border border-slate-700 relative overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="relative z-10 flex justify-between items-start">
          <div>
            <p class="text-sm font-medium text-slate-400">Humedad</p>
            <h3 class="text-3xl font-bold text-white mt-2">{{ telemetry.hum }}<span class="text-lg text-slate-500 ml-1">%</span></h3>
          </div>
          <div class="p-3 bg-slate-800 rounded-lg text-blue-400">
            <Droplets class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="bg-dark p-6 rounded-xl border border-slate-700 relative overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="relative z-10 flex justify-between items-start">
          <div>
            <p class="text-sm font-medium text-slate-400">Calidad Aire (PM2.5)</p>
            <h3 class="text-3xl font-bold text-white mt-2">{{ telemetry.pm25 }}<span class="text-lg text-slate-500 ml-1">µg</span></h3>
          </div>
          <div class="p-3 bg-slate-800 rounded-lg text-purple-400">
            <Wind class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="bg-dark p-6 rounded-xl border border-slate-700 relative overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="relative z-10 flex justify-between items-start">
          <div>
            <p class="text-sm font-medium text-slate-400">CO2 Equivalente</p>
            <h3 class="text-3xl font-bold text-white mt-2">{{ telemetry.co2 }}<span class="text-lg text-slate-500 ml-1">ppm</span></h3>
          </div>
          <div class="p-3 bg-slate-800 rounded-lg text-orange-400">
            <Activity class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Thermometer, Droplets, Wind, Activity } from 'lucide-vue-next'
// import api from '../services/api'

const isOnline = ref(true)
const telemetry = ref({
  temp: 24.5,
  hum: 45.2,
  pm25: 12.4,
  co2: 410,
  lastUpdate: new Date().toISOString()
})

let interval: any

const fetchNow = async () => {
  try {
    // const res = await api.get('/telemetry/now/AQC_001')
    // telemetry.value = res.data
    // const delta = new Date().getTime() - new Date(res.data.lastUpdate).getTime()
    // isOnline.value = delta < 60000 // 1 minuto
    
    // Mock update para simular data en tiempo real
    telemetry.value.temp = +(telemetry.value.temp + (Math.random() - 0.5)).toFixed(1)
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchNow()
  interval = setInterval(fetchNow, 5000)
})

onUnmounted(() => {
  clearInterval(interval)
})
</script>
