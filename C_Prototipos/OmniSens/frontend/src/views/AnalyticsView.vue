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
          <span class="text-sm font-bold text-slate-300">Cargando datos...</span>
        </div>
      </div>
      
      <div ref="chartRef" class="w-full h-full min-h-[380px]"></div>
    </div>

    <!-- Modal para Alerta de Telegram -->
    <div v-if="showTriggerModal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div class="bg-dark border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
        <h3 class="text-xl font-bold text-white mb-2">Configurar Alerta de Telegram</h3>
        <p class="text-sm text-slate-400 mb-4">
          Se enviará un mensaje a Telegram cuando <b>{{ selectedMetricLabel }}</b> cruce el umbral de <b>{{ pendingThreshold }}</b>.
        </p>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-300 mb-1">Chat ID de Telegram</label>
          <input v-model="telegramChatId" type="text" placeholder="Ej: 123456789" class="w-full bg-[#16223f] border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-primary focus:border-primary">
          <p class="text-xs text-slate-500 mt-1">Envía "/start" al bot <b>@OmnisensBot</b> para obtener tu Chat ID.</p>
        </div>

        <div class="mb-5">
          <label class="block text-sm font-medium text-slate-300 mb-1">Condición</label>
          <select v-model="triggerCondition" class="w-full bg-[#16223f] border border-slate-600 text-white rounded-lg px-3 py-2">
            <option value=">">Mayor que (>)</option>
            <option value="<">Menor que (<)</option>
          </select>
        </div>

        <div class="flex justify-end gap-3">
          <button @click="cancelTrigger" class="px-4 py-2 rounded-lg font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700">Cancelar</button>
          <button @click="saveTrigger" class="px-4 py-2 rounded-lg font-semibold text-white bg-primary hover:bg-primary/90">Guardar Alerta</button>
        </div>
      </div>
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

// Estados para Triggers
const showTriggerModal = ref(false)
const telegramChatId = ref('')
const pendingThreshold = ref(0)
const triggerCondition = ref('>')
const selectedMetricLabel = ref('')

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

// ----------------------------------------------------
// Exportación de Datos
// ----------------------------------------------------
const exportData = async (format: 'csv' | 'pdf') => {
  if (!chart || !selectedDeviceId.value) return
  
  // Obtener el rango visible actual del dataZoom
  const option = chart.getOption() as any
  let start = new Date()
  let end = new Date()

  if (option.dataZoom && option.dataZoom.length > 0) {
    const dz = option.dataZoom[0]
    // dz.startValue y dz.endValue son timestamps si el xAxis es tipo time
    start = new Date(dz.startValue)
    end = new Date(dz.endValue)
  } else {
    // Fallback: usar el rango completo seleccionado en los botones
    start.setDate(start.getDate() - parseInt(selectedRange.value))
  }

  try {
    const response = await api.get(`/telemetry/export/${selectedDeviceId.value}`, {
      params: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        format
      },
      responseType: 'blob'
    })
    
    // Crear objeto URL y forzar descarga
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `export_${selectedDeviceId.value}_${new Date().getTime()}.${format}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Error al exportar datos:', err)
    alert('Ocurrió un error al descargar el archivo.')
  }
}

// ----------------------------------------------------
// Gestión de Alertas Gráficas
// ----------------------------------------------------
const addTriggerMode = () => {
  if (!chart) return
  
  const metricObj = metrics.find(m => m.value === selectedMetric.value)!
  const currentOption = chart.getOption() as any
  const series = currentOption.series[0]
  
  const defaultThreshold = 30 // Valor inicial

  series.markLine = {
    animation: false,
    data: [{ yAxis: defaultThreshold }],
    label: { formatter: 'Nueva Alerta', position: 'end' },
    lineStyle: { color: '#ef4444', type: 'solid', width: 2 }
  }

  // Encontrar el último punto X para situar el botón en pantalla
  const lastDataPoint = series.data && series.data.length > 0 ? series.data[series.data.length - 1] : null
  const xValue = lastDataPoint ? lastDataPoint[0] : new Date().getTime()
  const point = chart.convertToPixel({ seriesIndex: 0 }, [xValue, defaultThreshold])

  if (!point) return

  // Habilitar Graphic component para hacerlo arrastrable
  currentOption.graphic = {
    type: 'group',
    id: 'trigger-handle',
    $action: 'replace',
    draggable: true,
    x: point[0] - 50,
    y: point[1] - 15,
    ondrag: function (this: any) {
      // Evitamos arrastrar en el eje X, forzamos mantenerlo centrado al final
      this.x = point[0] - 50
    },
    ondragend: function (this: any) {
      // Capturar la posición Y del drop y convertirla al valor del eje
      const pos = chart!.convertFromPixel({ seriesIndex: 0 }, [this.x + 50, this.y + 15])
      const newThreshold = +pos[1].toFixed(1)
      
      // Actualizar markLine
      const opt = chart!.getOption() as any
      opt.series[0].markLine.data[0].yAxis = newThreshold
      chart!.setOption({ series: opt.series })
      
      // Abrir Modal
      pendingThreshold.value = newThreshold
      selectedMetricLabel.value = metricObj.label
      showTriggerModal.value = true
    },
    children: [
      {
        type: 'rect',
        z: 100,
        shape: { width: 100, height: 30, r: 6 },
        style: { fill: '#ef4444', text: 'Arrástrame', textFill: '#fff', shadowBlur: 4, shadowColor: 'rgba(0,0,0,0.5)' },
        invisible: false
      }
    ]
  }

  // Set option pero con notMerge=false para no destruir el estado actual del dataZoom
  chart.setOption({ series: [series], graphic: currentOption.graphic }, false)
}

const cancelTrigger = () => {
  showTriggerModal.value = false
  drawHistory() // Redibujar para quitar la línea temporal
}

const saveTrigger = async () => {
  if (!telegramChatId.value) return alert('Debes ingresar un Chat ID')
  
  try {
    await api.post('/rules', {
      deviceId: selectedDeviceId.value,
      metric: selectedMetric.value,
      threshold: pendingThreshold.value,
      condition: triggerCondition.value,
      chatId: telegramChatId.value
    })
    alert('Alerta guardada exitosamente')
    showTriggerModal.value = false
  } catch (e) {
    console.error(e)
    alert('Error al guardar alerta')
  }
}

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
      bottom: '12%',
      top: '15%',
      containLabel: true
    },
    toolbox: {
      feature: {
        dataZoom: { yAxisIndex: 'none', title: { zoom: 'Zoom', back: 'Restaurar' } },
        restore: { title: 'Restaurar' },
        myExportCSV: {
          show: true,
          title: 'Descargar CSV',
          icon: 'path://M19,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19M11,7H13V9H11V7M11,11H13V13H11V11M11,15H13V17H11V15M7,7H9V9H7V7M7,11H9V13H7V11M7,15H9V17H7V15M15,7H17V9H15V7M15,11H17V13H15V11M15,15H17V17H15V15Z',
          onclick: () => exportData('csv')
        },
        myExportPDF: {
          show: true,
          title: 'Descargar PDF',
          icon: 'path://M19,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19M9,13H11V15H9V13M9,11H11V9H9V11M9,17H11V15H9V17Z',
          onclick: () => exportData('pdf')
        },
        myAddTrigger: {
          show: true,
          title: 'Crear Alerta Telegram',
          icon: 'path://M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
          onclick: () => addTriggerMode()
        }
      },
      iconStyle: { borderColor: '#94a3b8' }
    },
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        filterMode: 'filter',
        textStyle: { color: '#94a3b8' }
      },
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'empty'
      }
    ],
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
