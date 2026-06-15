<template>
  <div class="min-h-screen bg-darker flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
      <!-- Logo Corporativo -->
      <img :src="logoUrl" alt="OmniSens Logo" class="h-28 w-auto mb-6 rounded-2xl shadow-2xl border border-primary/20 bg-dark p-2">
      
      <h2 class="text-center text-3xl font-extrabold text-white">
        OmniSens <span class="text-primary">Industrial Suite</span>
      </h2>
      <p class="mt-2 text-center text-sm text-slate-400">
        Monitoreo y Control Ambiental Distribuidos
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-dark py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border border-slate-800">
        <form class="space-y-6" @submit.prevent="handleLogin">
          <div>
            <label for="email" class="block text-sm font-medium text-slate-300">
              Correo Electrónico
            </label>
            <div class="mt-1">
              <input id="email" v-model="email" name="email" type="email" autocomplete="email" required class="appearance-none block w-full px-3 py-2.5 border border-slate-700 rounded-lg shadow-sm placeholder-slate-500 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all" />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-300">
              Contraseña
            </label>
            <div class="mt-1">
              <input id="password" v-model="password" name="password" type="password" autocomplete="current-password" required class="appearance-none block w-full px-3 py-2.5 border border-slate-700 rounded-lg shadow-sm placeholder-slate-500 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all" />
            </div>
          </div>

          <div v-if="error" class="text-red-400 text-sm font-medium">
            ⚠️ {{ error }}
          </div>

          <div>
            <button type="submit" :disabled="loading" class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors">
              {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
            </button>
          </div>
          <div class="text-center mt-4">
            <span class="text-slate-400 text-sm">¿No tienes cuenta? </span>
            <router-link to="/register" class="text-primary hover:text-accent text-sm font-medium">Registrarse</router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'
import logoUrl from '../assets/logo.jpg'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const res = await api.post('/users/login', { email: email.value, password: password.value })
    authStore.setToken(res.data.token)
    router.push('/')
  } catch (err: any) {
    // Bypass de desarrollo si no está levantado el backend o para pruebas rápidas
    if (err.code === 'ERR_NETWORK' || err.response?.status === 404) {
      console.warn('Backend API no disponible. Usando bypass de desarrollo.');
      if (email.value === 'admin@omnisens.com') {
        authStore.setToken('mock_jwt_token_12345')
        router.push('/')
      } else {
        error.value = 'Credenciales inválidas en modo desarrollo (Usa admin@omnisens.com)'
      }
    } else {
      error.value = err.response?.data?.error || 'Error al iniciar sesión. Verifica tus credenciales.'
    }
  } finally {
    loading.value = false
  }
}
</script>
