<template>
  <div class="min-h-screen bg-darker flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
      <img :src="logoUrl" alt="OmniSens Logo" class="h-28 w-auto mb-6 rounded-2xl shadow-2xl border border-primary/20 bg-dark p-2">
      <h2 class="text-center text-3xl font-extrabold text-white">
        Registro en <span class="text-primary">OmniSens</span>
      </h2>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-dark py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border border-slate-800">
        <form class="space-y-6" @submit.prevent="handleRegister">
          <div>
            <label for="full_name" class="block text-sm font-medium text-slate-300">Nombre Completo</label>
            <div class="mt-1">
              <input id="full_name" v-model="fullName" type="text" required class="appearance-none block w-full px-3 py-2.5 border border-slate-700 rounded-lg shadow-sm placeholder-slate-500 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm" />
            </div>
          </div>

          <div>
            <label for="client_name" class="block text-sm font-medium text-slate-300">Nombre de la Empresa o Cliente</label>
            <div class="mt-1">
              <input id="client_name" v-model="clientName" type="text" required class="appearance-none block w-full px-3 py-2.5 border border-slate-700 rounded-lg shadow-sm placeholder-slate-500 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm" />
            </div>
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-slate-300">Correo Electrónico</label>
            <div class="mt-1">
              <input id="email" v-model="email" type="email" required class="appearance-none block w-full px-3 py-2.5 border border-slate-700 rounded-lg shadow-sm placeholder-slate-500 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm" />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-300">Contraseña</label>
            <div class="mt-1">
              <input id="password" v-model="password" type="password" required class="appearance-none block w-full px-3 py-2.5 border border-slate-700 rounded-lg shadow-sm placeholder-slate-500 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm" />
            </div>
          </div>

          <div v-if="error" class="text-red-400 text-sm font-medium">⚠️ {{ error }}</div>
          <div v-if="success" class="text-green-400 text-sm font-medium">✅ {{ success }}</div>

          <div>
            <button type="submit" :disabled="loading" class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50">
              {{ loading ? 'Registrando...' : 'Registrarse' }}
            </button>
          </div>
          <div class="text-center mt-4">
            <span class="text-slate-400 text-sm">¿Ya tienes cuenta? </span>
            <router-link to="/login" class="text-primary hover:text-accent text-sm font-medium">Iniciar Sesión</router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import logoUrl from '../assets/logo.jpg'

const router = useRouter()

const fullName = ref('')
const clientName = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

const handleRegister = async () => {
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    await api.post('/users/register', { 
      email: email.value, 
      password: password.value,
      full_name: fullName.value,
      client_name: clientName.value
    })
    success.value = 'Registro exitoso. Redirigiendo...'
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Error al registrar el usuario.'
  } finally {
    loading.value = false
  }
}
</script>
