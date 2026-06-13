<template>
  <div class="space-y-6">
    <!-- Fila Superior: Título y Selector de Dispositivo -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-3xl font-extrabold text-white tracking-tight">Panel de Control</h2>
        <p class="text-sm text-slate-400 mt-1">Supervisión en tiempo real y comando manual de nodos Edge.</p>
      </div>
      
      <div class="flex items-center gap-4">
        <!-- Selector de Nodo -->
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-slate-300">Nodo:</span>
          <select v-model="selectedDeviceId" @change="handleDeviceChange" class="bg-dark border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-semibold transition-all">
            <option v-for="dev in devices" :key="dev.device_id" :value="dev.device_id">
              {{ dev.device_name || dev.device_id }}
            </option>
          </select>
        </div>

        <!-- Estado de Conexión -->
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark border border-slate-700 shadow-md">
          <div :class="isOnline ? 'bg-primary shadow-[0_0_8px_#00A5CF]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'" class="w-2.5 h-2.5 rounded-full animate-pulse"></div>
          <span class="text-sm font-medium text-slate-300">{{ isOnline ? 'Online' : 'Offline' }}</span>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-if="error" class="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
      <span>⚠️ {{ error }}</span>
    </div>

    <!-- SECCIÓN DE ALERTAS ACTIVAS -->
    <div v-if="activeAlerts.length > 0" class="space-y-3">
      <h4 class="text-sm font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
        Alertas del Sistema Activas ({{ activeAlerts.length }})
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="alert in activeAlerts" :key="alert.id" :class="alert.bgColor" class="p-4 rounded-xl border flex items-start gap-3 shadow-md transition-all">
          <component :is="alert.icon" :class="alert.iconColor" class="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <h5 :class="alert.titleColor" class="font-bold text-sm">{{ alert.title }}</h5>
            <p :class="alert.textColor" class="text-xs mt-1 leading-relaxed">{{ alert.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Secciones Principales -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Lado Izquierdo/Centro: Grid de Telemetrías de Sensores (2 Columnas en lg) -->
      <div class="lg:col-span-2 space-y-6">
        <h3 class="text-lg font-bold text-slate-300 border-b border-slate-800 pb-2">Variables Ambientales</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Temperatura -->
          <div class="bg-dark p-6 rounded-xl border border-slate-800 relative overflow-hidden group hover:border-primary/20 transition-colors shadow-lg">
            <div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="relative z-10 flex justify-between items-start">
              <div>
                <p class="text-sm font-medium text-slate-400">Temperatura</p>
                <h3 class="text-4xl font-bold text-white mt-2">
                  {{ telemetry.temp !== null ? telemetry.temp.toFixed(1) : 'N/A' }}
                  <span class="text-lg text-slate-500 ml-0.5">°C</span>
                </h3>
              </div>
              <div class="p-3 bg-slate-900 rounded-lg text-primary border border-slate-800">
                <Thermometer class="w-6 h-6" />
              </div>
            </div>
          </div>

          <!-- Humedad -->
          <div class="bg-dark p-6 rounded-xl border border-slate-800 relative overflow-hidden group hover:border-blue-500/20 transition-colors shadow-lg">
            <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="relative z-10 flex justify-between items-start">
              <div>
                <p class="text-sm font-medium text-slate-400">Humedad</p>
                <h3 class="text-4xl font-bold text-white mt-2">
                  {{ telemetry.hum !== null ? telemetry.hum.toFixed(1) : 'N/A' }}
                  <span class="text-lg text-slate-500 ml-0.5">%</span>
                </h3>
              </div>
              <div class="p-3 bg-slate-900 rounded-lg text-blue-400 border border-slate-800">
                <Droplets class="w-6 h-6" />
              </div>
            </div>
          </div>

          <!-- Presión Atmosférica (Ocultable dinámicamente) -->
          <div v-if="hasPres" class="bg-dark p-6 rounded-xl border border-slate-800 relative overflow-hidden group hover:border-indigo-500/20 transition-colors shadow-lg">
            <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="relative z-10 flex justify-between items-start">
              <div>
                <p class="text-sm font-medium text-slate-400">Presión Atmosférica</p>
                <h3 class="text-4xl font-bold text-white mt-2">
                  {{ telemetry.pres !== null ? telemetry.pres.toFixed(1) : 'N/A' }}
                  <span class="text-lg text-slate-500 ml-0.5">hPa</span>
                </h3>
              </div>
              <div class="p-3 bg-slate-900 rounded-lg text-indigo-400 border border-slate-800">
                <Gauge class="w-6 h-6" />
              </div>
            </div>
          </div>

          <!-- CO2 Equivalente (Ocultable dinámicamente) -->
          <div v-if="hasCo2" class="bg-dark p-6 rounded-xl border border-slate-800 relative overflow-hidden group hover:border-orange-500/20 transition-colors shadow-lg">
            <div class="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="relative z-10 flex justify-between items-start">
              <div>
                <p class="text-sm font-medium text-slate-400">Gases (CO2 Eq.)</p>
                <h3 class="text-4xl font-bold text-white mt-2">
                  {{ telemetry.co2 !== null ? Math.round(telemetry.co2) : 'N/A' }}
                  <span class="text-lg text-slate-500 ml-0.5">ppm</span>
                </h3>
              </div>
              <div class="p-3 bg-slate-900 rounded-lg text-orange-400 border border-slate-800">
                <Activity class="w-6 h-6" />
              </div>
            </div>
          </div>

          <!-- Polvo Sharp PM10 (Ocultable dinámicamente) -->
          <div v-if="hasPm10" class="bg-dark p-6 rounded-xl border border-slate-800 relative overflow-hidden group hover:border-purple-500/20 transition-colors shadow-lg">
            <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="relative z-10 flex justify-between items-start">
              <div>
                <p class="text-sm font-medium text-slate-400">Polvo en Suspensión (PM10)</p>
                <h3 class="text-4xl font-bold text-white mt-2">
                  {{ telemetry.pm10 !== null ? telemetry.pm10.toFixed(1) : 'N/A' }}
                  <span class="text-lg text-slate-500 ml-0.5">µg/m³</span>
                </h3>
              </div>
              <div class="p-3 bg-slate-900 rounded-lg text-purple-400 border border-slate-800">
                <Wind class="w-6 h-6" />
              </div>
            </div>
          </div>

          <!-- Nivel de Luz Inteligente (Ocultable dinámicamente) -->
          <div v-if="hasLight" class="bg-dark p-6 rounded-xl border border-slate-800 relative overflow-hidden group hover:border-yellow-500/20 transition-colors shadow-lg">
            <div class="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="relative z-10 flex flex-col h-full justify-between">
              <div class="flex justify-between items-start w-full">
                <div>
                  <p class="text-sm font-medium text-slate-400">Nivel de Iluminación</p>
                  <h3 class="text-3xl font-bold text-white mt-2">
                    {{ displayLightValue }}
                  </h3>
                </div>
                <div class="p-3 bg-slate-900 rounded-lg text-yellow-400 border border-slate-800">
                  <Sun class="w-6 h-6" />
                </div>
              </div>
              
              <!-- Detalles de redundancia y desviaciones -->
              <div class="mt-4 pt-3 border-t border-slate-800/80 text-xs space-y-1.5">
                <div class="flex justify-between text-slate-400">
                  <span v-if="telemetry.lux !== null && telemetry.lux !== -1">BH1750 (Digital): {{ telemetry.lux.toFixed(1) }} lx (Primario)</span>
                  <span v-else class="text-slate-500">BH1750 (Digital): Ausente</span>
                </div>
                <div class="flex justify-between text-slate-400">
                  <span v-if="telemetry.l !== null && telemetry.l !== -1">LDR (Analógico): {{ telemetry.l }} / 4095 (Respaldo)</span>
                  <span v-else class="text-slate-500">LDR (Analógico): Ausente</span>
                </div>

                <!-- Alerta de desviación crítica de calibración -->
                <div v-if="lightDeviationAlert" class="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2 py-1 rounded mt-2 flex items-center gap-1.5 font-medium animate-pulse">
                  <span>⚠️ Desvío de calibración detectado entre sensores de luz.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Lado Derecho: Controles de Actuadores (1 Columna en lg) -->
      <div class="space-y-6">
        <h3 class="text-lg font-bold text-slate-300 border-b border-slate-800 pb-2">Comandos de Actuadores</h3>

        <div class="bg-dark p-6 rounded-xl border border-slate-800 shadow-xl space-y-8 relative overflow-hidden">
          <div class="absolute top-0 right-0 p-3 text-slate-500">
            <Settings class="w-5 h-5 animate-spin-slow" />
          </div>

          <!-- Relé 1 -->
          <div class="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <div class="flex items-center gap-3">
              <div :class="r1 ? 'bg-primary/10 text-primary' : 'bg-slate-800 text-slate-500'" class="p-2.5 rounded-lg border border-slate-800 transition-colors">
                <ToggleLeft v-if="!r1" class="w-5 h-5" />
                <ToggleRight v-else class="w-5 h-5" />
              </div>
              <div>
                <h4 class="font-bold text-white text-sm">Extractor / Relé 1</h4>
                <p class="text-xs text-slate-400">{{ r1 ? 'Encendido' : 'Apagado' }}</p>
              </div>
            </div>
            
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="r1" @change="handleActuatorChange" class="sr-only peer">
              <div class="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-slate-700/50"></div>
            </label>
          </div>

          <!-- Relé 2 -->
          <div class="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <div class="flex items-center gap-3">
              <div :class="r2 ? 'bg-primary/10 text-primary' : 'bg-slate-800 text-slate-500'" class="p-2.5 rounded-lg border border-slate-800 transition-colors">
                <ToggleLeft v-if="!r2" class="w-5 h-5" />
                <ToggleRight v-else class="w-5 h-5" />
              </div>
              <div>
                <h4 class="font-bold text-white text-sm">Calefactor / Relé 2</h4>
                <p class="text-xs text-slate-400">{{ r2 ? 'Encendido' : 'Apagado' }}</p>
              </div>
            </div>
            
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="r2" @change="handleActuatorChange" class="sr-only peer">
              <div class="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-slate-700/50"></div>
            </label>
          </div>

          <!-- Control de Velocidad PWM (Motor) -->
          <div class="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-4">
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2">
                <Sliders class="w-4 h-4 text-primary" />
                <h4 class="font-bold text-white text-sm">Intensidad PWM (Motor)</h4>
              </div>
              <span class="text-xs font-bold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/20">
                {{ pwm }} / 255
              </span>
            </div>
            
            <input type="range" v-model.number="pwm" @input="handleActuatorSlide" @change="handleActuatorChange" min="0" max="255" class="w-full accent-primary h-1.5 bg-slate-800 rounded-lg cursor-pointer">
            <div class="flex justify-between text-[10px] text-slate-500 font-semibold px-0.5">
              <span>Mínimo</span>
              <span>Medio (128)</span>
              <span>Máximo</span>
            </div>
          </div>

          <div v-if="userLock" class="bg-primary/5 border border-primary/10 text-[11px] text-primary text-center py-2 rounded-lg font-medium flex items-center justify-center gap-1.5">
            <div class="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></div>
            <span>Comando enviado. Esperando respuesta del hardware...</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Thermometer, Droplets, Wind, Activity, Gauge, Sun, Sliders, ToggleLeft, ToggleRight, Settings, AlertTriangle, Battery, WifiOff, AlertOctagon } from 'lucide-vue-next'
import api from '../services/api'

// Nodos y selector
interface Device {
  device_id: string;
  device_name: string | null;
  status: string;
}

const devices = ref<Device[]>([])
const selectedDeviceId = ref('')
const isOnline = ref(false)
const error = ref('')

// Telemetría
const telemetry = ref({
  temp: null as number | null,
  hum: null as number | null,
  pres: null as number | null,
  co2: null as number | null,
  pm10: null as number | null,
  l: null as number | null,
  lux: null as number | null,
  battery: null as number | null,
  r1: 0,
  r2: 0,
  pwm: 0,
  time: null as string | null
})

// Controladores locales de actuadores
const r1 = ref(false)
const r2 = ref(false)
const pwm = ref(0)
const userLock = ref(false)

let lockTimeout: any
let pollingInterval: any

// Computados para visibilidad de sensores
const hasPres = computed(() => telemetry.value.pres !== null && telemetry.value.pres !== -1.0)
const hasCo2 = computed(() => telemetry.value.co2 !== null && telemetry.value.co2 !== -1.0)
const hasPm10 = computed(() => telemetry.value.pm10 !== null && telemetry.value.pm10 !== -1.0)
const hasLight = computed(() => (telemetry.value.lux !== null && telemetry.value.lux !== -1.0) || (telemetry.value.l !== null && telemetry.value.l !== -1.0))

// Lógica de visualización de luz
const displayLightValue = computed(() => {
  const luxVal = telemetry.value.lux
  const ldrVal = telemetry.value.l

  // BH1750 presente y LDR presente
  if (luxVal !== null && luxVal !== -1.0 && ldrVal !== null && ldrVal !== -1.0) {
    return `${luxVal.toFixed(0)} lx`
  }
  // Sólo BH1750
  if (luxVal !== null && luxVal !== -1.0) {
    return `${luxVal.toFixed(0)} lx`
  }
  // Sólo LDR (convertir lectura analógica invertida a porcentaje de brillo estimado)
  if (ldrVal !== null && ldrVal !== -1.0) {
    const brightnessPct = Math.max(0, Math.min(100, Math.round(100 - (ldrVal / 4095) * 100)))
    return `${brightnessPct}%`
  }
  return 'N/A'
})

// Alerta de desviación de luz
const lightDeviationAlert = computed(() => {
  const luxVal = telemetry.value.lux
  const ldrVal = telemetry.value.l

  if (luxVal !== null && luxVal !== -1.0 && ldrVal !== null && ldrVal !== -1.0) {
    // Si la lectura analógica LDR indica completa oscuridad (> 3800) pero el sensor digital lux reporta iluminación (> 80 lx)
    // O si LDR reporta iluminación plena (< 800) pero lux reporta oscuridad (0 lx)
    if ((ldrVal > 3800 && luxVal > 80) || (ldrVal < 800 && luxVal === 0)) {
      return true
    }
  }
  return false
})

// Alertas dinámicas y agregadas para visualización del sistema
const activeAlerts = computed(() => {
  const list = []
  
  // 1. Conexión caída
  if (!isOnline.value) {
    list.push({
      id: 'offline',
      title: 'Dispositivo Fuera de Línea',
      description: 'El dispositivo seleccionado no ha enviado reportes en el último minuto. Verifique la alimentación o el estado de la conexión de red del nodo.',
      icon: WifiOff,
      bgColor: 'bg-red-500/10 border-red-500/30',
      iconColor: 'text-red-400',
      titleColor: 'text-red-300',
      textColor: 'text-red-400/80'
    })
  }

  // 2. Desviación de luz
  if (lightDeviationAlert.value) {
    list.push({
      id: 'light_deviation',
      title: 'Desvío de Calibración de Luz',
      description: 'Existe una desviación de lectura crítica entre el sensor digital (BH1750) y el analógico (LDR). Esto podría indicar suciedad, bloqueo físico o falla de hardware.',
      icon: AlertTriangle,
      bgColor: 'bg-yellow-500/10 border-yellow-500/30',
      iconColor: 'text-yellow-400',
      titleColor: 'text-yellow-300',
      textColor: 'text-yellow-400/80'
    })
  }

  // 3. Calidad del Aire (CO2 alto)
  if (telemetry.value.co2 !== null && telemetry.value.co2 > 1000) {
    list.push({
      id: 'high_co2',
      title: 'Calidad de Aire Degradada (CO2)',
      description: `Los niveles de gases equivalentes de CO2 se encuentran elevados (${Math.round(telemetry.value.co2)} ppm). Se recomienda ventilar el espacio de trabajo.`,
      icon: AlertOctagon,
      bgColor: 'bg-orange-500/10 border-orange-500/30',
      iconColor: 'text-orange-400',
      titleColor: 'text-orange-300',
      textColor: 'text-orange-400/80'
    })
  }

  // 4. Batería Baja
  if (telemetry.value.battery !== null && telemetry.value.battery > 0 && telemetry.value.battery <= 3.65) {
    list.push({
      id: 'low_battery',
      title: 'Tensión de Batería Crítica',
      description: `El nodo reporta una tensión de batería baja (${telemetry.value.battery.toFixed(2)} V). Conecte el dispositivo a una fuente de carga externa.`,
      icon: Battery,
      bgColor: 'bg-red-500/10 border-red-500/30',
      iconColor: 'text-red-400',
      titleColor: 'text-red-300',
      textColor: 'text-red-400/80'
    })
  }

  return list
})

// Carga inicial de dispositivos
const loadDevices = async () => {
  try {
    const res = await api.get('/devices')
    devices.value = res.data
    if (devices.value.length > 0) {
      selectedDeviceId.value = devices.value[0].device_id
      await fetchTelemetry()
    }
  } catch (err: any) {
    console.error('Error cargando dispositivos:', err)
    error.value = 'No se pudo conectar a la base de datos o cargar la lista de dispositivos.'
    
    // Fallback de desarrollo para demostración visual
    devices.value = [
      { device_id: 'AQC_001', device_name: 'Nodo Central Oficina', status: 'active' },
      { device_id: 'AQC_002', device_name: 'Nodo Exterior Patio', status: 'active' }
    ]
    selectedDeviceId.value = 'AQC_001'
    loadMockTelemetry()
  }
}

// Obtener Telemetría en tiempo real
const fetchTelemetry = async () => {
  if (!selectedDeviceId.value) return
  
  try {
    const res = await api.get(`/telemetry/now/${selectedDeviceId.value}`)
    telemetry.value = res.data
    error.value = ''
    
    // Determinar si el dispositivo está en línea (último reporte hace menos de 1 minuto)
    if (res.data.time) {
      const delta = new Date().getTime() - new Date(res.data.time).getTime()
      isOnline.value = delta < 60000
    } else {
      isOnline.value = false
    }

    // Sincronizar controles con la base de datos si no hay bloqueo de usuario
    if (!userLock.value) {
      r1.value = telemetry.value.r1 === 1
      r2.value = telemetry.value.r2 === 1
      pwm.value = telemetry.value.pwm || 0
    }
  } catch (err: any) {
    console.warn('Error al traer telemetría real. Utilizando fallback local.');
    // Si la API falla, mantenemos simulación local en lugar de romper la interfaz
    loadMockTelemetry()
  }
}

// Cargar Simulación Local
const loadMockTelemetry = () => {
  isOnline.value = true
  if (selectedDeviceId.value === 'AQC_001') {
    telemetry.value = {
      temp: 24.5 + (Math.random() - 0.5),
      hum: 45.2 + (Math.random() - 0.5) * 2,
      pres: 1013.2 + (Math.random() - 0.5),
      co2: 410 + Math.round((Math.random() - 0.5) * 10),
      pm10: 12.4 + (Math.random() - 0.5),
      lux: 350.0 + (Math.random() - 0.5) * 20,
      l: 2048 + Math.round((Math.random() - 0.5) * 100),
      battery: 3.85 + (Math.random() - 0.5) * 0.05,
      r1: r1.value ? 1 : 0,
      r2: r2.value ? 1 : 0,
      pwm: pwm.value,
      time: new Date().toISOString()
    }
  } else {
    // Nodo Exterior: No tiene CO2 (MQ135 ausente) ni LDR
    telemetry.value = {
      temp: 18.2 + (Math.random() - 0.5),
      hum: 62.1 + (Math.random() - 0.5) * 2,
      pres: 1009.1 + (Math.random() - 0.5),
      co2: -1.0, // MQ135 Ausente
      pm10: 28.5 + (Math.random() - 0.5) * 3,
      lux: 40.0 + (Math.random() - 0.5) * 5,
      l: -1, // LDR Ausente
      battery: 3.78 + (Math.random() - 0.5) * 0.05,
      r1: r1.value ? 1 : 0,
      r2: r2.value ? 1 : 0,
      pwm: pwm.value,
      time: new Date().toISOString()
    }
  }
}

// Manejo de cambio de dispositivo
const handleDeviceChange = async () => {
  userLock.value = false
  clearTimeout(lockTimeout)
  await fetchTelemetry()
}

// Envío de Comandos de Actuadores
const handleActuatorChange = async () => {
  userLock.value = true
  clearTimeout(lockTimeout)
  
  const payload = {
    r1: r1.value,
    r2: r2.value,
    pwm: pwm.value
  }
  
  try {
    await api.post(`/devices/${selectedDeviceId.value}/actuators`, payload)
  } catch (err) {
    console.error('Error enviando actuadores:', err)
  }
  
  // Mantener bloqueo durante 3 segundos para darle tiempo al ESP32 de reportar su nuevo estado vía telemetría
  lockTimeout = setTimeout(() => {
    userLock.value = false
  }, 3000)
}

const handleActuatorSlide = () => {
  // Sólo actualizar en memoria mientras arrastra, envía al soltar o cada trigger change
}

onMounted(() => {
  loadDevices()
  pollingInterval = setInterval(fetchTelemetry, 5000)
})

onUnmounted(() => {
  clearInterval(pollingInterval)
  clearTimeout(lockTimeout)
})
</script>

<style scoped>
/* Transición de colores y sombras suaves */
.bg-dark {
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}
.animate-spin-slow {
  animation: spin 10s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
