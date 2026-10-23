<template>
  <div class="space-y-8 animate-fadeIn">
    <!-- Welcome Header & Quick Actions -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-linear-to-r from-wa-card via-[#15242c] to-wa-card p-6 rounded-3xl border border-wa-border shadow-xl">
      <div>
        <h2 class="text-xl font-bold text-white flex items-center gap-2.5">
          Welcome back, {{ user?.username }}!
          <span class="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">System Ready</span>
        </h2>
        <p class="text-xs text-slate-400 mt-1">NexforgexGateway WhatsApp REST & Webhook Control Platform</p>
      </div>
      <div class="flex items-center gap-3">
        <RouterLink to="/sessions" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add New Device
        </RouterLink>
        <RouterLink to="/sender" class="px-4 py-2.5 rounded-xl bg-wa-panel hover:bg-slate-700 text-slate-200 border border-wa-border text-xs font-semibold transition flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          Message Sandbox
        </RouterLink>
      </div>
    </div>

    <!-- Metric Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <!-- Active Sessions -->
      <div class="glass-panel p-5 rounded-2xl border border-wa-border flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-400">Active Devices</p>
          <h3 class="text-2xl font-black text-white mt-1">
            {{ stats?.devices?.active || 0 }} <span class="text-xs font-normal text-slate-400">/ {{ stats?.devices?.total || 0 }}</span>
          </h3>
          <span class="text-[11px] text-emerald-400 flex items-center gap-1 mt-2">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Live Connection
          </span>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      <!-- Total Messages -->
      <div class="glass-panel p-5 rounded-2xl border border-wa-border flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-400">Total Chat Records</p>
          <h3 class="text-2xl font-black text-white mt-1">{{ stats?.messages?.total || 0 }}</h3>
          <span class="text-[11px] text-blue-400 flex items-center gap-1 mt-2">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Message Archive
          </span>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
      </div>

      <!-- Messages Sent vs Received -->
      <div class="glass-panel p-5 rounded-2xl border border-wa-border flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-400">Sent / Received (24h)</p>
          <h3 class="text-xl font-bold text-white mt-1">
            <span class="text-emerald-400">{{ stats?.messages?.sent || 0 }}</span>
            <span class="text-slate-500 mx-1.5">/</span>
            <span class="text-cyan-400">{{ stats?.messages?.received || 0 }}</span>
          </h3>
          <span class="text-[11px] text-slate-400 mt-2 block">{{ stats?.messages?.last24h || 0 }} today</span>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16l-4-4m0 0l4-4m-4 4h18m-7 8l4-4m0 0l-4-4m4 4H3" />
          </svg>
        </div>
      </div>

      <!-- Webhook Success Rate -->
      <div class="glass-panel p-5 rounded-2xl border border-wa-border flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-400">Webhook Deliveries</p>
          <h3 class="text-2xl font-black text-white mt-1">{{ stats?.webhooks?.successRate || '100%' }}</h3>
          <span class="text-[11px] text-emerald-400 mt-2 block">{{ stats?.webhooks?.successful || 0 }} / {{ stats?.webhooks?.total || 0 }} delivered</span>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Active Sessions Grid & Quick Connect -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-white tracking-wide">Registered WhatsApp Devices</h3>
        <RouterLink to="/sessions" class="text-xs text-emerald-400 hover:underline">View All Devices &rarr;</RouterLink>
      </div>

      <div v-if="sessions.length === 0" class="glass-panel p-10 rounded-3xl border border-dashed border-wa-border text-center space-y-3">
        <div class="w-12 h-12 mx-auto rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h4 class="text-sm font-bold text-white">No WhatsApp Devices Added Yet</h4>
        <p class="text-xs text-slate-400 max-w-sm mx-auto">Create your first WhatsApp session to generate a QR code and connect your WhatsApp account.</p>
        <RouterLink to="/sessions" class="inline-flex px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition">
          Create WhatsApp Session
        </RouterLink>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div 
          v-for="s in sessions" 
          :key="s.session_id" 
          class="glass-panel p-5 rounded-2xl border border-wa-border hover:border-emerald-500/40 transition space-y-4 group"
        >
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <h4 class="text-sm font-bold text-white group-hover:text-emerald-400 transition">{{ s.name }}</h4>
              <p class="text-xs font-mono text-slate-400">{{ s.session_id }}</p>
            </div>
            <StatusBadge :status="s.status" :is-live="s.is_live_active" />
          </div>

          <div class="bg-wa-panel/50 p-3 rounded-xl border border-wa-border/60 text-xs space-y-1">
            <div class="flex items-center justify-between text-slate-400">
              <span>Connected Phone:</span>
              <span class="font-mono text-white">{{ s.phone_number || '-' }}</span>
            </div>
            <div class="flex items-center justify-between text-slate-400">
              <span>Webhook:</span>
              <span class="truncate max-w-[150px] text-slate-300">{{ s.webhook_url ? 'Configured' : 'None' }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <button 
              v-if="!s.is_live_active && s.status !== 'connected'"
              @click="openQr(s.session_id)"
              class="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Scan QR
            </button>
            <RouterLink 
              v-else 
              :to="{ path: '/sender', query: { session: s.session_id } }"
              class="flex-1 py-2 rounded-xl bg-wa-panel hover:bg-slate-700 text-emerald-400 text-xs font-semibold transition text-center border border-wa-border"
            >
              Send Message
            </RouterLink>
            <RouterLink :to="{ path: '/sessions' }" class="p-2 rounded-xl bg-wa-panel hover:bg-slate-700 text-slate-300 border border-wa-border transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>

    <!-- QR Modal -->
    <QrModal 
      :show="showQrModal" 
      :session-id="targetQrSession" 
      @close="showQrModal = false"
      @connected="handleQrConnected"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useSessionsStore } from '../stores/sessions';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge.vue';
import QrModal from '../components/QrModal.vue';

const authStore = useAuthStore();
const sessionsStore = useSessionsStore();

const user = computed(() => authStore.user);
const sessions = computed(() => sessionsStore.sessions);
const stats = ref(null);

const showQrModal = ref(false);
const targetQrSession = ref('');

const fetchStats = async () => {
  try {
    const res = await api.get('/chats/stats/dashboard');
    if (res.data.success) {
      stats.value = res.data.data;
    }
  } catch (err) {
    //
  }
};

const openQr = (sessionId) => {
  targetQrSession.value = sessionId;
  showQrModal.value = true;
};

const handleQrConnected = () => {
  sessionsStore.fetchSessions();
  fetchStats();
};

onMounted(() => {
  sessionsStore.fetchSessions();
  fetchStats();
});
</script>
