<template>
  <div class="space-y-6 h-full flex flex-col">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-white">Analíticas Históricas</h2>
      <div class="flex bg-dark border border-slate-700 rounded-lg p-1">
        <button v-for="range in ['24h', '7d', '30d']" :key="range" 
                @click="selectedRange = range"
                :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-colors', 
                         selectedRange === range ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white']">
          {{ range }}
        </button>
      </div>
    </div>

    <div class="flex-1 bg-dark border border-slate-700 rounded-xl p-6">
      <div ref="chartRef" class="w-full h-full min-h-[400px]"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null
const selectedRange = ref('24h')

const initChart = () => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  
  // Generar mock data
  const data = []
  let now = new Date().getTime()
  for (let i = 0; i < 100; i++) {
    data.push([
      now - (100 - i) * 3600000, // Cada hora
      +(20 + Math.random() * 10).toFixed(1)
    ])
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30, 41, 59, 0.9)',
      borderColor: '#334155',
      textStyle: { color: '#f8fafc' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      splitLine: { show: false },
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#94a3b8' }
    },
    yAxis: {
      type: 'value',
      name: 'Temperatura (°C)',
      nameTextStyle: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
      axisLabel: { color: '#94a3b8' }
    },
    series: [
      {
        name: 'Temp',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: '#10b981',
          width: 3
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0)' }
          ])
        },
        data: data
      }
    ]
  }

  chart.setOption(option)
}

watch(selectedRange, () => {
  // Aquí se haría fetch a /api/telemetry/history/:deviceId con los días de rango
  // chart.setOption({ series: [{ data: new_data }] })
})

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => chart?.resize())
})
</script>
