<template>
  <div class="flex h-screen overflow-hidden bg-darker">
    <!-- Sidebar -->
    <aside class="w-64 bg-dark border-r border-slate-800 flex flex-col">
      <div class="h-24 flex flex-col items-center justify-center border-b border-slate-800 bg-darker/40 p-4 gap-2">
        <img :src="logoUrl" alt="OmniSens Logo" class="h-14 w-auto object-contain">
        <span class="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Módulos de Sistema</span>
      </div>
      
      <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <router-link to="/dashboard" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-secondary/30 hover:text-white transition-all duration-200" active-class="bg-primary/10 text-primary font-semibold border-l-4 border-primary">
          <LayoutDashboard class="w-5 h-5" />
          <span>Dashboard</span>
        </router-link>
        
        <router-link to="/analytics" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-secondary/30 hover:text-white transition-all duration-200" active-class="bg-primary/10 text-primary font-semibold border-l-4 border-primary">
          <LineChart class="w-5 h-5" />
          <span>Analíticas</span>
        </router-link>
 
        <router-link to="/devices" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-secondary/30 hover:text-white transition-all duration-200" active-class="bg-primary/10 text-primary font-semibold border-l-4 border-primary">
          <Cpu class="w-5 h-5" />
          <span>Dispositivos</span>
        </router-link>
 
        <router-link to="/rules" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-secondary/30 hover:text-white transition-all duration-200" active-class="bg-primary/10 text-primary font-semibold border-l-4 border-primary">
          <Workflow class="w-5 h-5" />
          <span>Reglas</span>
        </router-link>
      </nav>
 
      <div class="p-4 border-t border-slate-800">
        <router-link to="/billing" class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-secondary/30 hover:text-white transition-colors mb-2" active-class="bg-primary/10 text-primary font-semibold">
          <CreditCard class="w-5 h-5" />
          <span>Suscripción</span>
        </router-link>
        <button @click="handleLogout" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut class="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
 
    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="h-24 flex items-center px-6 bg-dark border-b border-slate-800 justify-between">
        <div class="w-8"></div> <!-- Spacer to balance layout -->
        
        <div class="flex items-center justify-center">
          <img :src="tituloUrl" alt="OmniSens Industrial Suite" class="h-18 w-auto object-contain">
        </div>
 
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            <User class="w-5 h-5 text-slate-300" />
          </div>
        </div>
      </header>
      
      <!-- Page Content -->
      <div class="flex-1 overflow-auto p-6 bg-darker">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { LayoutDashboard, LineChart, Cpu, Workflow, CreditCard, LogOut, User } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import logoUrl from '../assets/logo_omni.png'
import tituloUrl from '../assets/titulo_omni.png'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
