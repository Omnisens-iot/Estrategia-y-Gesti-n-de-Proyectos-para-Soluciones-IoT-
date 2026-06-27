<template>
  <div class="space-y-6 h-full flex flex-col">
    <!-- Fila de Control y Títulos -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 class="text-3xl font-extrabold text-white tracking-tight">Analíticas Históricas</h2>
        <p class="text-sm text-slate-400 mt-1">Análisis temporal y control de desviaciones de variables ambientales.</p>
      </div>

      <!-- Selectores de Filtro -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Dispositivo -->
        <select v-model="selectedDeviceId" class="bg-dark border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-semibold transition-all">
          <option v-for="dev in devices" :key="dev.device_id" :value="dev.device_id">
            {{ dev.device_name || dev.device_id }}
          </option>
        </select>

        <!-- Métrica -->
        <select v-model="selectedMetric" class="bg-dark border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-semibold transition-all">
          <option v-for="metric in metrics" :key="metric.value" :value="metric.value">
            {{ metric.label }}
          </option>
        </select>

        <!-- Rango -->
        <div class="flex bg-dark border border-slate-800 rounded-lg p-1">
          <button v-for="range in ranges" :key="range.value" 
                  @click="selectedRange = range.value"
                  :class="['px-3 py-1.5 rounded-md text-xs font-semibold transition-all', 
                           selectedRange === range.value ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white']">
            {{ range.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Contenedor del Gráfico -->
    <div class="flex-1 bg-dark border border-slate-850 rounded-xl p-6 shadow-2xl relative flex flex-col justify-between min-h-[400px]">
      <div v-if="loading" class="absolute inset-0 bg-dark/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
        <div class="flex flex-col items-center gap-3">
          <div class="w-10 h-10 border-4 border-slate-700 border-t-primary rounded-full animate-spin"></div>
          <span class="text-sm font-bold text-slate-300">Cargando datos históricos...</span>
        </div>
      </div>
      
      <div ref="chartRef" class="w-full h-full min-h-[380px]"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import api from '../services/api'

interface Device {
  device_id: string;
  device_name: string | null;
}

const devices = ref<Device[]>([])
const selectedDeviceId = ref('')
const selectedMetric = ref('temp')
const selectedRange = ref('1') // En días
const loading = ref(false)

const ranges = [
  { label: '24 Horas', value: '1' },
  { label: '7 Días', value: '7' },
  { label: '30 Días', value: '30' }
]

const metrics = [
  { label: 'Temperatura (°C)', value: 'temp', column: 'avg_temp', color: '#00A5CF' },
  { label: 'Humedad (%)', value: 'hum', column: 'avg_hum', color: '#60a5fa' },
  { label: 'Presión Atmosférica (hPa)', value: 'pres', column: 'avg_pres', color: '#818cf8' },
  { label: 'Calidad Aire (CO2 Eq.)', value: 'co2', column: 'avg_co2', color: '#fb923c' },
  { label: 'Partículas Susp. (PM10)', value: 'pm10', column: 'avg_pm10', color: '#c084fc' },
  { label: 'Luz (Digital)', value: 'lux', column: 'avg_lux', color: '#facc15' }
]

const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

// Cargar dispositivos
const loadDevices = async () => {
  try {
    const res = await api.get('/devices')
    devices.value = res.data
    if (devices.value.length > 0) {
      selectedDeviceId.value = devices.value[0].device_id
      await drawHistory()
    }
  } catch (err) {
    console.error('Error al cargar dispositivos en analíticas:', err)
    devices.value = [
      { device_id: 'AQC_001', device_name: 'Nodo Central Oficina' },
      { device_id: 'AQC_002', device_name: 'Nodo Exterior Patio' }
    ]
    selectedDeviceId.value = 'AQC_001'
    await drawHistory()
  }
}

// Obtener datos históricos de la API o generar mock elegante
const drawHistory = async () => {
  if (!selectedDeviceId.value) return
  loading.value = true
  
  const metricObj = metrics.find(m => m.value === selectedMetric.value)!
  const data: [number, number][] = []
  
  try {
    const res = await api.get(`/telemetry/history/${selectedDeviceId.value}`, {
      params: { days: selectedRange.value }
    })
    
    res.data.forEach((row: any) => {
      const val = row[metricObj.column]
      if (val !== null && val !== undefined && val !== -1.0) {
        data.push([
          new Date(row.bucket).getTime(),
          +parseFloat(val).toFixed(2)
        ])
      }
    })
    
    // Si no hay datos, limpiamos el gráfico
    if (data.length === 0) {
      if (chart) {
        chart.clear()
      }
      // Opcional: Podríamos mostrar un mensaje "Sin datos" aquí
    }
  } catch (err) {
    console.warn('Fallo al obtener historial de la API.')
  } finally {
    loading.value = false
    nextTick(() => {
      renderChart(data, metricObj)
    })
  }
}

// Eliminado generateMockData por requerimiento de producción

// Renderizar el gráfico con ECharts
const renderChart = (data: [number, number][], metricObj: typeof metrics[0]) => {
  if (!chartRef.value) return
  
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(11, 19, 41, 0.95)',
      borderColor: '#1e293b',
      borderWidth: 1,
      textStyle: { color: '#f8fafc' },
      formatter: (params: any) => {
        const item = params[0]
        const date = new Date(item.value[0]).toLocaleString()
        return `<div class="p-1 font-semibold text-xs text-slate-400">${date}</div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="w-2 h-2 rounded-full" style="background-color: ${metricObj.color}"></span>
                  <span class="text-sm font-bold text-white">${item.value[1]}</span>
                </div>`
      }
    },
    grid: {
      left: '4%',
      right: '4%',
      bottom: '5%',
      top: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      splitLine: { show: false },
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      nameTextStyle: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 }
    },
    series: [
      {
        name: metricObj.label,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        lineStyle: {
          color: metricObj.color,
          width: 3.5
        },
        itemStyle: {
          color: metricObj.color
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `${metricObj.color}45` }, // 27% opacidad
            { offset: 1, color: `${metricObj.color}00` }  // 0% opacidad
          ])
        },
        data: data
      }
    ]
  }

  chart.setOption(option, true)
}

// Escuchar cambios
watch([selectedDeviceId, selectedMetric, selectedRange], () => {
  drawHistory()
})

onMounted(() => {
  loadDevices()
  window.addEventListener('resize', () => chart?.resize())
})
</script>

<style scoped>
.bg-dark {
  background-color: #0b1329;
}
.border-slate-850 {
  border-color: #16223f;
}
</style>
