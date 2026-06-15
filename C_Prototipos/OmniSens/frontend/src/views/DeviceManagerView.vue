<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-extrabold text-white tracking-tight">Administración de Dispositivos</h2>
        <p class="text-sm text-slate-400 mt-1">Monitoreo de telemetría administrativa, estado de red y baterías.</p>
      </div>
      <button @click="showRegisterModal = true" class="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-accent text-white text-sm font-semibold rounded-lg shadow-md transition-colors">
        <Plus class="w-4 h-4" /> Registrar Nodo
      </button>
    </div>

    <!-- Error state -->
    <div v-if="error" class="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
      ⚠️ {{ error }}
    </div>

    <!-- Lista de Dispositivos -->
    <div class="bg-dark border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-900/80 border-b border-slate-800">
            <tr>
              <th class="px-6 py-4 text-xs font-semibold uppercase text-slate-400 tracking-wider">Dispositivo</th>
              <th class="px-6 py-4 text-xs font-semibold uppercase text-slate-400 tracking-wider">MAC Address</th>
              <th class="px-6 py-4 text-xs font-semibold uppercase text-slate-400 tracking-wider">Estado Red</th>
              <th class="px-6 py-4 text-xs font-semibold uppercase text-slate-400 tracking-wider">Nivel de Batería (Diagnóstico)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-for="device in devices" :key="device.device_id" class="hover:bg-slate-900/20 transition-colors">
              <!-- Info Dispositivo -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-slate-400">
                    <Cpu class="w-5 h-5" />
                  </div>
                  <div>
                    <span class="font-bold text-white block text-sm">{{ device.device_name || 'Nodo Sin Nombre' }}</span>
                    <span class="text-xs text-slate-500 font-mono">{{ device.device_id }}</span>
                  </div>
                </div>
              </td>
              
              <!-- MAC Address -->
              <td class="px-6 py-4 text-sm text-slate-400 font-mono">
                {{ device.mac_address }}
              </td>
              
              <!-- Estado de Red -->
              <td class="px-6 py-4">
                <span :class="device.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border">
                  <span :class="device.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'" class="w-1.5 h-1.5 rounded-full"></span>
                  {{ device.status === 'active' ? 'Activo / En línea' : 'Inactivo' }}
                </span>
              </td>
              
              <!-- Batería -->
              <td class="px-6 py-4">
                <div v-if="device.loadingBattery" class="flex items-center gap-2 text-xs text-slate-500">
                  <div class="w-3.5 h-3.5 border-2 border-slate-600 border-t-primary rounded-full animate-spin"></div>
                  <span>Leyendo...</span>
                </div>
                
                <div v-else-if="device.battery !== null" class="flex items-center gap-3">
                  <!-- Icono de Batería Inteligente -->
                  <div class="flex items-center">
                    <component :is="getBatteryIcon(device.battery)" class="w-5 h-5" />
                  </div>
                  <div>
                    <span class="text-sm font-semibold text-slate-200">
                      {{ getBatteryPercentageStr(device.battery) }}
                    </span>
                    <span class="text-xs text-slate-500 block">
                      Tensión: {{ device.battery.toFixed(2) }} V
                    </span>
                  </div>
                </div>
                
                <div v-else class="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                  <Battery class="w-4 h-4 text-slate-600 opacity-40" />
                  <span>Sin datos (Alimentación externa)</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Registrar Dispositivo -->
    <div v-if="showRegisterModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div class="bg-dark border border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
        <h3 class="text-xl font-bold text-white mb-4">Registrar Nuevo Nodo</h3>
        <form @submit.prevent="handleRegisterDevice" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-400 mb-1">ID del Dispositivo</label>
            <input v-model="newDevice.device_id" required placeholder="Ej: AQC_003" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-400 mb-1">Dirección MAC</label>
            <input v-model="newDevice.mac_address" required placeholder="Ej: c8:f0:9e:11:22:33" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-400 mb-1">Nombre del Nodo</label>
            <input v-model="newDevice.device_name" required placeholder="Ej: Oficina Principal" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
          </div>
          <div v-if="registerError" class="text-red-400 text-sm mt-2">⚠️ {{ registerError }}</div>
          <div class="flex gap-3 justify-end mt-6">
            <button type="button" @click="showRegisterModal = false" class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Cancelar</button>
            <button type="submit" :disabled="registering" class="px-4 py-2 bg-primary hover:bg-accent disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-md transition-colors">
              {{ registering ? 'Guardando...' : 'Registrar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Cpu, BatteryMedium, BatteryLow, Battery, Plus } from 'lucide-vue-next'
import api from '../services/api'

interface Device {
  device_id: string;
  mac_address: string;
  device_name: string | null;
  status: string;
  battery: number | null;
  loadingBattery: boolean;
}

const devices = ref<Device[]>([])
const error = ref('')

const showRegisterModal = ref(false)
const registerError = ref('')
const registering = ref(false)
const newDevice = ref({ device_id: '', mac_address: '', device_name: '' })

const handleRegisterDevice = async () => {
  registering.value = true
  registerError.value = ''
  try {
    await api.post('/devices', newDevice.value)
    showRegisterModal.value = false
    newDevice.value = { device_id: '', mac_address: '', device_name: '' }
    fetchDevices() // Recargar lista
  } catch (err: any) {
    registerError.value = err.response?.data?.error || 'Error al registrar dispositivo.'
  } finally {
    registering.value = false
  }
}

const fetchDevices = async () => {
  try {
    const res = await api.get('/devices')
    devices.value = res.data.map((dev: any) => ({
      ...dev,
      battery: null,
      loadingBattery: true
    }))
    
    // Consultar batería individualmente de forma asíncrona para no bloquear el listado
    devices.value.forEach(async (device) => {
      try {
        const telemetryRes = await api.get(`/telemetry/now/${device.device_id}`)
        device.battery = telemetryRes.data.battery !== undefined ? telemetryRes.data.battery : null
      } catch (err) {
        console.warn(`No se pudo cargar la batería para el dispositivo ${device.device_id}`);
      } finally {
        device.loadingBattery = false
      }
    })
    
  } catch (err: any) {
    console.error('Error al listar dispositivos:', err)
    error.value = 'No se pudo cargar el listado de dispositivos de la base de datos.'
    
    // Mock de desarrollo en caso de error
    devices.value = [
      { device_id: 'AQC_001', mac_address: 'C8:F0:9E:01:02:03', device_name: 'Nodo Central Oficina', status: 'active', battery: 3.82, loadingBattery: false },
      { device_id: 'AQC_002', mac_address: 'C8:F0:9E:04:05:06', device_name: 'Nodo Exterior Patio', status: 'active', battery: 3.71, loadingBattery: false }
    ]
  }
}

// Convertidor de tensión a porcentaje
const getBatteryPercentageStr = (voltage: number): string => {
  // 3.2V es 0% y 4.2V es 100%
  const pct = Math.round(((voltage - 3.2) / (4.2 - 3.2)) * 100)
  const safePct = Math.max(0, Math.min(100, pct))
  return `${safePct}%`
}

// Determinar el icono según el nivel de carga
const getBatteryIcon = (voltage: number) => {
  const pct = ((voltage - 3.2) / (4.2 - 3.2)) * 100
  if (pct >= 75) return Battery
  if (pct >= 25) return BatteryMedium
  return BatteryLow
}

onMounted(() => {
  fetchDevices()
})
</script>
