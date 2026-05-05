<template>
  <div class="flex h-screen overflow-hidden bg-darker">
    <!-- Sidebar -->
    <aside class="w-64 bg-dark border-r border-slate-700 flex flex-col">
      <div class="h-16 flex items-center px-6 border-b border-slate-700">
        <h1 class="text-xl font-bold text-primary">OmniSens</h1>
      </div>
      
      <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <router-link to="/dashboard" class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors" active-class="bg-slate-700 text-white">
          <LayoutDashboard class="w-5 h-5" />
          <span>Dashboard</span>
        </router-link>
        
        <router-link to="/analytics" class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors" active-class="bg-slate-700 text-white">
          <LineChart class="w-5 h-5" />
          <span>Analíticas</span>
        </router-link>

        <router-link to="/devices" class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors" active-class="bg-slate-700 text-white">
          <Cpu class="w-5 h-5" />
          <span>Dispositivos</span>
        </router-link>

        <router-link to="/rules" class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors" active-class="bg-slate-700 text-white">
          <Workflow class="w-5 h-5" />
          <span>Reglas</span>
        </router-link>
      </nav>

      <div class="p-4 border-t border-slate-700">
        <router-link to="/billing" class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors mb-2" active-class="bg-slate-700 text-white">
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
      <header class="h-16 flex items-center px-6 bg-dark border-b border-slate-700 justify-end">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
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

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
