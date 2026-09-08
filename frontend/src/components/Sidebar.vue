<template>
  <aside class="w-64 flex-shrink-0 bg-[#111b21] border-r border-[#2a3942] flex flex-col justify-between h-screen sticky top-0 z-30">
    <!-- Brand Logo -->
    <div>
      <div class="h-16 flex items-center gap-3 px-6 border-b border-[#2a3942]">
        <div class="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm shadow-lg shadow-emerald-500/10">
          NG
        </div>
        <div>
          <h1 class="text-sm font-bold text-white tracking-wide">NexforgexGateway</h1>
          <p class="text-[10px] text-emerald-400 font-medium">WhatsApp API Center</p>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="p-4 space-y-1.5">
        <RouterLink 
          v-for="item in navItems" 
          :key="item.path" 
          :to="item.path"
          :class="[
            $route.path === item.path 
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#202c33]/50'
          ]"
          class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group"
        >
          <component :is="item.icon" class="w-4 h-4 transition group-hover:scale-110" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </div>

    <!-- User Profile & Footer Version -->
    <div class="p-4 border-t border-[#2a3942] bg-[#0b141a]/40 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5 overflow-hidden">
          <div class="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs uppercase border border-slate-700">
            {{ user?.username?.charAt(0) || 'A' }}
          </div>
          <div class="truncate">
            <p class="text-xs font-semibold text-white truncate">{{ user?.username || 'Admin' }}</p>
            <p class="text-[10px] text-slate-400 capitalize truncate">{{ user?.role || 'Administrator' }}</p>
          </div>
        </div>
        <button @click="logout" title="Logout" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      <!-- Version Indicator -->
      <div class="pt-2 border-t border-[#2a3942]/50 flex items-center justify-between text-[11px] text-slate-500">
        <span>NexforgexGateway</span>
        <span class="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono font-bold text-[10px]">V1.0.0</span>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { 
  LayoutDashboard, 
  Smartphone, 
  Send, 
  BarChart3, 
  Webhook, 
  Key, 
  Users, 
  BookOpen 
} from 'lucide-vue-next';

const authStore = useAuthStore();
const user = computed(() => authStore.user);

const navItems = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Devices / Sessions', path: '/sessions', icon: Smartphone },
  { label: 'Message Sandbox', path: '/sender', icon: Send },
  { label: 'Usage Reports', path: '/reports', icon: BarChart3 },
  { label: 'Webhooks & Logs', path: '/webhooks', icon: Webhook },
  { label: 'API Keys', path: '/api-keys', icon: Key },
  { label: 'User Management', path: '/users', icon: Users },
  { label: 'API Documentation', path: '/docs', icon: BookOpen }
];

const logout = () => {
  authStore.logout();
};
</script>
