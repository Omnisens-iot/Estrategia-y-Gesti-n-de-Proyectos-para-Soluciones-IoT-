<template>
  <div class="space-y-6 max-w-4xl">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-white">Suscripción y Perfil Comercial</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Plan Actual -->
      <div class="bg-dark border border-slate-700 rounded-xl p-6 relative overflow-hidden">
        <div class="absolute top-0 right-0 p-4">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Suscripción Activa
          </span>
        </div>
        
        <h3 class="text-lg font-medium text-slate-400 mb-2">Plan Contratado</h3>
        <p class="text-3xl font-bold text-white mb-6">OmniSens Empresa</p>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between py-3 border-b border-slate-700/50">
            <span class="text-slate-400">Tarifa Mensual Fija</span>
            <span class="text-white font-medium">$299 USD</span>
          </div>
          <div class="flex items-center justify-between py-3 border-b border-slate-700/50">
            <span class="text-slate-400">Límite de Dispositivos</span>
            <span class="text-white font-medium">10 Unidades</span>
          </div>
          <div class="flex items-center justify-between py-3 border-b border-slate-700/50">
            <span class="text-slate-400">Próximo Vencimiento</span>
            <span class="text-white font-medium">15 de Junio, 2026</span>
          </div>
        </div>

        <button class="mt-8 w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-lg transition-colors font-medium">
          Actualizar Método de Pago
        </button>
      </div>

      <!-- Métricas de Uso -->
      <div class="bg-dark border border-slate-700 rounded-xl p-6">
        <h3 class="text-lg font-medium text-slate-400 mb-6">Métricas de Uso</h3>
        
        <div class="space-y-6">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-white">Dispositivos Activos</span>
              <span class="text-sm text-slate-400">2 / 10</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-2.5 border border-slate-700">
              <div class="bg-primary h-2.5 rounded-full" style="width: 20%"></div>
            </div>
          </div>

          <div class="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-200 leading-relaxed">
            <p class="flex gap-2">
              <Info class="w-5 h-5 shrink-0" />
              <span>Tu plan OmniSens Empresa incluye tráfico de telemetría ilimitado, retención de datos históricos por 5 años y actualizaciones OTA gratuitas para todos los equipos registrados.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Info } from 'lucide-vue-next'
</script>
