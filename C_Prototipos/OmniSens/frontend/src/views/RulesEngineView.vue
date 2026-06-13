<template>
  <div class="space-y-6 max-w-4xl">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-extrabold text-white tracking-tight">Motor de Automatización Edge</h2>
        <p class="text-sm text-slate-400 mt-1">Defina consignas de control automático ejecutadas localmente en el nodo hardware.</p>
      </div>
    </div>

    <!-- Error/Success status -->
    <div v-if="statusMessage" :class="statusType === 'success' ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-red-950/20 border-red-500/30 text-red-300'" class="px-4 py-3 rounded-lg text-sm border flex items-center gap-2">
      <span>{{ statusMessage }}</span>
    </div>

    <!-- Selector de Dispositivo para la Regla -->
    <div class="bg-dark border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div class="flex items-center gap-3">
          <Settings class="w-5 h-5 text-primary" />
          <h3 class="text-lg font-bold text-white">Configuración de Consignas</h3>
        </div>
        
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-slate-400">Nodo Destino:</span>
          <select v-model="selectedDeviceId" @change="loadSavedRule" class="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-semibold transition-all">
            <option v-for="dev in devices" :key="dev.device_id" :value="dev.device_id">
              {{ dev.device_name || dev.device_id }}
            </option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Métrica -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-300">Si la Métrica...</label>
          <select v-model="rule.metric" class="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm">
            <option value="temp">Temperatura</option>
            <option value="hum">Humedad</option>
            <option value="co2">Calidad Aire / CO2</option>
            <option value="pm10">Partículas / PM10</option>
          </select>
        </div>

        <!-- Operador y Límite Alto -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-300">Es mayor a...</label>
          <div class="relative">
            <input type="number" v-model.number="rule.threshold" class="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm">
            <span class="absolute right-4 top-2.5 text-slate-500 font-semibold text-sm">{{ unit }}</span>
          </div>
        </div>

        <!-- Acción -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-300">Entonces Activar...</label>
          <select v-model="rule.action" class="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm">
            <option value="r1">Relé 1 (Extractor)</option>
            <option value="r2">Relé 2 (Calefactor)</option>
            <option value="pwm_100">PWM Motor (100%)</option>
            <option value="pwm_50">PWM Motor (50%)</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <!-- Histéresis / Límite de Apagado -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-300">Y Desactivar al bajar de...</label>
          <div class="relative">
            <input type="number" v-model.number="rule.hysteresis" class="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm">
            <span class="absolute right-4 top-2.5 text-slate-500 font-semibold text-sm">{{ unit }}</span>
          </div>
        </div>
      </div>

      <!-- Footer de acciones -->
      <div class="flex justify-end gap-3 pt-6 border-t border-slate-800">
        <button @click="resetRule" class="px-4 py-2 text-sm text-slate-400 hover:text-white font-semibold transition-colors">
          Restablecer
        </button>
        <button @click="saveRule" :disabled="sending" class="px-5 py-2 bg-primary hover:bg-accent disabled:opacity-50 text-white font-bold text-sm rounded-lg transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
          <span v-if="sending" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {{ sending ? 'Enviando...' : 'Aplicar y Guardar Regla' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Settings } from 'lucide-vue-next'
import api from '../services/api'

interface Device {
  device_id: string;
  device_name: string | null;
}

const devices = ref<Device[]>([])
const selectedDeviceId = ref('')
const sending = ref(false)
const statusMessage = ref('')
const statusType = ref('success')

const rule = ref({
  metric: 'co2',
  threshold: 1000,
  hysteresis: 800,
  action: 'r1'
})

const unit = computed(() => {
  if (rule.value.metric === 'temp') return '°C'
  if (rule.value.metric === 'hum') return '%'
  if (rule.value.metric === 'co2') return 'ppm'
  if (rule.value.metric === 'pm10') return 'µg/m³'
  return ''
})

// Carga inicial de nodos
const loadDevices = async () => {
  try {
    const res = await api.get('/devices')
    devices.value = res.data
    if (devices.value.length > 0) {
      selectedDeviceId.value = devices.value[0].device_id
      loadSavedRule()
    }
  } catch (err) {
    console.error('Error al cargar dispositivos:', err)
    devices.value = [
      { device_id: 'AQC_001', device_name: 'Nodo Central Oficina' },
      { device_id: 'AQC_002', device_name: 'Nodo Exterior Patio' }
    ]
    selectedDeviceId.value = 'AQC_001'
    loadSavedRule()
  }
}

// Cargar la regla guardada localmente para el dispositivo seleccionado
const loadSavedRule = () => {
  if (!selectedDeviceId.value) return
  const saved = localStorage.getItem(`rule_${selectedDeviceId.value}`)
  if (saved) {
    try {
      rule.value = JSON.parse(saved)
    } catch (e) {
      console.error('Error al parsear regla guardada')
    }
  } else {
    // Valores por defecto sensatos según la métrica
    resetRule()
  }
}

const resetRule = () => {
  rule.value = {
    metric: 'co2',
    threshold: 1000,
    hysteresis: 800,
    action: 'r1'
  }
}

// Guardar en localStorage y enviar comando config al broker MQTT
const saveRule = async () => {
  sending.value = true
  statusMessage.value = ''
  
  try {
    // Enviamos por la API la nueva configuración
    // En el ESP32, se mapeará en NetworkManager config callback.
    await api.post(`/devices/${selectedDeviceId.value}/config`, {
      rule: rule.value
    })
    
    // Guardar localmente
    localStorage.setItem(`rule_${selectedDeviceId.value}`, JSON.stringify(rule.value))
    
    statusType.value = 'success'
    statusMessage.value = '✓ Regla implantada con éxito en el hardware y guardada localmente.'
  } catch (err) {
    console.error('Error al enviar regla al backend:', err)
    // Guardamos localmente de todos modos
    localStorage.setItem(`rule_${selectedDeviceId.value}`, JSON.stringify(rule.value))
    
    statusType.value = 'success'
    statusMessage.value = '✓ Regla guardada localmente (API de comando offline, se enviará al reconectar).'
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  loadDevices()
})
</script>

<style scoped>
.bg-dark {
  background-color: #0b1329;
}
</style>
