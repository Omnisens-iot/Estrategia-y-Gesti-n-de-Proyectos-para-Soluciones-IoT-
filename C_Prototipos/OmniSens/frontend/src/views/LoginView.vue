<template>
  <div class="min-h-screen bg-darker flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-extrabold text-white">
        OmniSens <span class="text-primary">IoT</span>
      </h2>
      <p class="mt-2 text-center text-sm text-slate-400">
        Plataforma Edge-to-Cloud de Grado Industrial
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-dark py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-700">
        <form class="space-y-6" @submit.prevent="handleLogin">
          <div>
            <label for="email" class="block text-sm font-medium text-slate-300">
              Correo Electrónico
            </label>
            <div class="mt-1">
              <input id="email" v-model="email" name="email" type="email" autocomplete="email" required class="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 bg-slate-800 text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-300">
              Contraseña
            </label>
            <div class="mt-1">
              <input id="password" v-model="password" name="password" type="password" autocomplete="current-password" required class="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 bg-slate-800 text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
            </div>
          </div>

          <div v-if="error" class="text-red-400 text-sm">
            {{ error }}
          </div>

          <div>
            <button type="submit" :disabled="loading" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
              {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
            </button>
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
    // Simulando login temporalmente hasta que se conecte al backend
    // En producción se hará: const res = await api.post('/login', { email: email.value, password: password.value })
    // authStore.setToken(res.data.token)
    
    // Hardcoded mock para avanzar
    if (email.value === 'admin@omnisens.com') {
      authStore.setToken('mock_jwt_token_12345')
      router.push('/')
    } else {
      error.value = 'Credenciales inválidas (Usa admin@omnisens.com)'
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>
