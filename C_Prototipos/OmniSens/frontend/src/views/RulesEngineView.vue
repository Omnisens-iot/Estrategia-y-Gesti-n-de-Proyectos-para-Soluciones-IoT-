<template>
  <div class="space-y-6 max-w-4xl">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-white">Motor de Automatización Edge</h2>
      <button class="px-4 py-2 bg-primary hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors">
        Nueva Regla
      </button>
    </div>

    <!-- Rule Card Mockup -->
    <div class="bg-dark border border-slate-700 rounded-xl p-6 space-y-6">
      <div class="flex items-center gap-4 border-b border-slate-700 pb-4">
        <h3 class="text-lg font-medium text-white">Control Automático Ventilación</h3>
        <span class="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-sm border border-slate-700">AQC_001</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Condición -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-400">Si la Métrica...</label>
          <select class="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary">
            <option>Temperatura</option>
            <option selected>CO2</option>
            <option>Humedad</option>
            <option>PM 2.5</option>
          </select>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-400">Es Mayor a...</label>
          <div class="relative">
            <input type="number" value="1000" class="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary">
            <span class="absolute right-4 top-2.5 text-slate-500">ppm</span>
          </div>
        </div>

        <!-- Acción -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-400">Entonces Activar...</label>
          <select class="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary">
            <option selected>Relé 1 (Extractor)</option>
            <option>Relé 2</option>
            <option>PWM al 100%</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <!-- Histéresis -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-slate-400">Y Apagar cuando baje de...</label>
          <div class="relative">
            <input type="number" value="800" class="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary">
            <span class="absolute right-4 top-2.5 text-slate-500">ppm</span>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-6 border-t border-slate-700">
        <button class="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancelar</button>
        <button class="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-medium rounded-lg transition-colors" @click="saveRule">
          Guardar Regla
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const saveRule = () => {
  console.log("Payload para PUT /api/devices/:id/rules generado")
  alert("Simulación de guardado de regla completada.")
}
</script>
