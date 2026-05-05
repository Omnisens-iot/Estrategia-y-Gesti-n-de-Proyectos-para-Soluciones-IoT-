<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-white">Dispositivos y Actuadores</h2>
    </div>

    <div class="bg-dark border border-slate-700 rounded-xl overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-slate-800/50 border-b border-slate-700">
          <tr>
            <th class="px-6 py-4 text-sm font-medium text-slate-300">ID Dispositivo</th>
            <th class="px-6 py-4 text-sm font-medium text-slate-300">MAC Address</th>
            <th class="px-6 py-4 text-sm font-medium text-slate-300">Estado</th>
            <th class="px-6 py-4 text-sm font-medium text-slate-300 text-right">Controles Manuales</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-700">
          <tr v-for="device in devices" :key="device.id" class="hover:bg-slate-800/30 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-slate-800 rounded-lg">
                  <Cpu class="w-5 h-5 text-slate-400" />
                </div>
                <span class="font-medium text-white">{{ device.id }}</span>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-slate-400 font-mono">{{ device.mac }}</td>
            <td class="px-6 py-4">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Operativo
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center justify-end gap-6">
                <!-- Relé 1 -->
                <label class="flex items-center gap-2 cursor-pointer">
                  <span class="text-sm font-medium text-slate-400">R1</span>
                  <div class="relative">
                    <input type="checkbox" v-model="device.r1" @change="sendActuatorCommand(device)" class="sr-only peer">
                    <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                </label>

                <!-- Relé 2 -->
                <label class="flex items-center gap-2 cursor-pointer">
                  <span class="text-sm font-medium text-slate-400">R2</span>
                  <div class="relative">
                    <input type="checkbox" v-model="device.r2" @change="sendActuatorCommand(device)" class="sr-only peer">
                    <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                </label>

                <!-- PWM -->
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-slate-400">PWM</span>
                  <input type="range" v-model.number="device.pwm" @change="sendActuatorCommand(device)" min="0" max="255" class="w-24 accent-primary">
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Cpu } from 'lucide-vue-next'
// import api from '../services/api'

const devices = ref([
  { id: 'AQC_001', mac: 'C8:F0:9E:XX:XX', r1: false, r2: false, pwm: 0 },
  { id: 'AQC_002', mac: 'C8:F0:9E:YY:YY', r1: true, r2: false, pwm: 128 }
])

const sendActuatorCommand = async (device: any) => {
  try {
    // const payload = { r1: device.r1, r2: device.r2, pwm: device.pwm }
    // await api.post(`/devices/${device.id}/actuators`, payload)
    console.log(`Comando enviado a ${device.id}:`, { r1: device.r1, r2: device.r2, pwm: device.pwm })
  } catch (error) {
    console.error('Error al enviar comando', error)
  }
}
</script>
