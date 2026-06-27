<template>
  <div class="space-y-6 max-w-5xl">
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
          <select v-model="selectedDeviceId" @change="loadSavedRules" class="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-semibold transition-all">
            <option v-for="dev in devices" :key="dev.device_id" :value="dev.device_id">
              {{ dev.device_name || dev.device_id }}
            </option>
          </select>
        </div>
      </div>

      <!-- Lista de Reglas -->
      <div v-if="rules.length === 0" class="text-center py-8 text-slate-500 text-sm italic">
        No hay reglas configuradas para este dispositivo. Presiona "Añadir Regla" para comenzar.
      </div>

      <div v-for="(rule, index) in rules" :key="index" class="relative bg-slate-900/50 border border-slate-800 rounded-lg p-5 space-y-4">
        <div class="absolute top-2 left-2 bg-slate-800 text-slate-400 text-xs font-bold px-2 py-1 rounded">
          Prioridad {{ index + 1 }}
        </div>
        
        <div class="absolute top-3 right-3 flex gap-2">
          <button @click="moveRuleUp(index)" :disabled="index === 0" class="text-slate-500 hover:text-white disabled:opacity-30 transition-colors p-1" title="Subir Prioridad">
            <ArrowUp class="w-4 h-4" />
          </button>
          <button @click="moveRuleDown(index)" :disabled="index === rules.length - 1" class="text-slate-500 hover:text-white disabled:opacity-30 transition-colors p-1" title="Bajar Prioridad">
            <ArrowDown class="w-4 h-4" />
          </button>
          <button @click="removeRule(index)" class="text-red-500/70 hover:text-red-400 transition-colors p-1 ml-2" title="Eliminar Regla">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <!-- Métrica -->
          <div class="space-y-1">
            <label class="block text-xs font-medium text-slate-400">Si la Métrica...</label>
            <select v-model="rule.metric" class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-sm">
              <option value="temp">Temperatura</option>
              <option value="hum">Humedad</option>
              <option value="co2">Calidad Aire / CO2</option>
              <option value="pm10">Partículas / PM10</option>
            </select>
          </div>

          <!-- Operador y Límite Alto -->
          <div class="space-y-1">
            <label class="block text-xs font-medium text-slate-400">Es mayor a...</label>
            <div class="relative">
              <input type="number" v-model.number="rule.threshold" class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-sm">
              <span class="absolute right-3 top-2 text-slate-500 font-semibold text-xs">{{ getUnit(rule.metric) }}</span>
            </div>
          </div>
          
          <!-- Histéresis / Límite de Apagado -->
          <div class="space-y-1">
            <label class="block text-xs font-medium text-slate-400">Y apagar al bajar de...</label>
            <div class="relative">
              <input type="number" v-model.number="rule.hysteresis" class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-sm">
              <span class="absolute right-3 top-2 text-slate-500 font-semibold text-xs">{{ getUnit(rule.metric) }}</span>
            </div>
          </div>

          <!-- Acción -->
          <div class="space-y-1">
            <label class="block text-xs font-medium text-slate-400">Entonces Activar...</label>
            <select v-model="rule.action" class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-sm">
              <option value="r1">Relé 1 (Extractor)</option>
              <option value="r2">Relé 2 (Calefactor)</option>
              <option value="pwm_100">PWM Motor (100%)</option>
              <option value="pwm_50">PWM Motor (50%)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Footer de acciones -->
      <div class="flex items-center justify-between pt-4 border-t border-slate-800">
        <button @click="addRule" class="px-4 py-2 text-sm text-primary hover:text-white border border-primary/30 hover:border-primary hover:bg-primary/10 rounded-lg font-semibold transition-all flex items-center gap-2">
          <Plus class="w-4 h-4" /> Añadir Regla
        </button>
        
        <div class="flex gap-3">
          <button @click="loadSavedRules" class="px-4 py-2 text-sm text-slate-400 hover:text-white font-semibold transition-colors">
            Descartar Cambios
          </button>
          <button @click="saveRules" :disabled="sending || rules.some(r => r.threshold <= r.hysteresis)" class="px-5 py-2 bg-primary hover:bg-accent disabled:opacity-50 text-white font-bold text-sm rounded-lg transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
            <span v-if="sending" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {{ sending ? 'Enviando...' : 'Aplicar y Guardar Reglas' }}
          </button>
        </div>
      </div>
      
      <div v-if="rules.some(r => r.threshold <= r.hysteresis)" class="text-red-400 text-xs text-right mt-1">
        El límite de encendido debe ser mayor al límite de apagado en todas las reglas.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Settings, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-vue-next'
import api from '../services/api'

interface Device {
  device_id: string;
  device_name: string | null;
}

interface Rule {
  metric: string;
  threshold: number;
  hysteresis: number;
  action: string;
}

const devices = ref<Device[]>([])
const selectedDeviceId = ref('')
const sending = ref(false)
const statusMessage = ref('')
const statusType = ref('success')

const rules = ref<Rule[]>([])

const getUnit = (metric: string) => {
  if (metric === 'temp') return '°C'
  if (metric === 'hum') return '%'
  if (metric === 'co2') return 'ppm'
  if (metric === 'pm10') return 'µg/m³'
  return ''
}

const addRule = () => {
  rules.value.push({
    metric: 'co2',
    threshold: 1000,
    hysteresis: 800,
    action: 'r1'
  })
}

const removeRule = (index: number) => {
  rules.value.splice(index, 1)
}

const moveRuleUp = (index: number) => {
  if (index > 0) {
    const temp = rules.value[index]
    rules.value[index] = rules.value[index - 1]
    rules.value[index - 1] = temp
  }
}

const moveRuleDown = (index: number) => {
  if (index < rules.value.length - 1) {
    const temp = rules.value[index]
    rules.value[index] = rules.value[index + 1]
    rules.value[index + 1] = temp
  }
}

// Carga inicial de nodos
const loadDevices = async () => {
  try {
    const res = await api.get('/devices')
    devices.value = res.data
    if (devices.value.length > 0) {
      selectedDeviceId.value = devices.value[0].device_id
      loadSavedRules()
    }
  } catch (err) {
    console.error('Error al cargar dispositivos:', err)
  }
}

// Cargar las reglas desde la BD para el dispositivo seleccionado
const loadSavedRules = async () => {
  if (!selectedDeviceId.value) return
  statusMessage.value = ''
  
  try {
    const res = await api.get(`/devices/${selectedDeviceId.value}/rules`)
    if (res.data && Array.isArray(res.data)) {
      rules.value = res.data.map((r: any) => ({
        metric: r.metric,
        threshold: r.threshold,
        hysteresis: r.hysteresis,
        action: r.action
      }))
    } else {
      rules.value = []
    }
  } catch (err) {
    console.error('Error al cargar reglas:', err)
    statusType.value = 'error'
    statusMessage.value = 'Error al cargar las reglas desde el servidor.'
  }
}

// Guardar en BD y enviar comando config al broker MQTT
const saveRules = async () => {
  sending.value = true
  statusMessage.value = ''
  
  try {
    await api.post(`/devices/${selectedDeviceId.value}/rules`, {
      rules: rules.value
    })
    
    statusType.value = 'success'
    statusMessage.value = '✓ Reglas guardadas en la Nube y sincronizadas con el Nodo Edge.'
  } catch (err) {
    console.error('Error al enviar reglas al backend:', err)
    statusType.value = 'error'
    statusMessage.value = 'Error al sincronizar las reglas con el servidor.'
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
