<template>
  <div class="min-h-screen bg-[#0b141a] flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Background glowing orbs -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <div class="w-full max-w-md bg-[#111b21] border border-[#2a3942] rounded-3xl p-8 shadow-2xl relative z-10">
      <!-- Brand Header -->
      <div class="text-center mb-8">
        <div class="inline-flex p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-3 ring-8 ring-emerald-500/5 font-black text-2xl">
          NG
        </div>
        <h2 class="text-2xl font-bold text-white tracking-wide">NadoyoGateway</h2>
        <p class="text-xs text-slate-400 mt-1">Multi-Device REST API & Control Center</p>
      </div>

      <!-- Error Alert -->
      <div v-if="error" class="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ error }}</span>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">Username</label>
          <input 
            v-model="username" 
            type="text" 
            required 
            placeholder="admin" 
            class="w-full px-4 py-3 bg-[#202c33] border border-[#2a3942] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm transition"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
          <input 
            v-model="password" 
            type="password" 
            required 
            placeholder="••••••••" 
            class="w-full px-4 py-3 bg-[#202c33] border border-[#2a3942] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm transition"
          />
        </div>

        <button 
          type="submit" 
          :disabled="loading" 
          class="w-full mt-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          {{ loading ? 'Signing In...' : 'Sign In to Gateway' }}
        </button>
      </form>

      <!-- Default Credentials Tip -->
      <div class="mt-6 pt-5 border-t border-[#2a3942]/60 text-center">
        <p class="text-[11px] text-slate-400">Default Admin: <code class="text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">admin</code> / <code class="text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">admin123</code></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('admin');
const password = ref('admin123');
const loading = ref(false);
const error = ref(null);

const handleLogin = async () => {
  loading.value = true;
  error.value = null;
  try {
    const success = await authStore.login(username.value, password.value);
    if (success) {
      router.push('/');
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Login failed. Invalid username or password.';
  } finally {
    loading.value = false;
  }
};
</script>
