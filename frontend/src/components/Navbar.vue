<template>
  <header class="h-16 bg-wa-card/90 backdrop-blur-md border-b border-wa-border px-8 flex items-center justify-between sticky top-0 z-20">
    <div class="flex items-center gap-4">
      <h2 class="text-base font-bold text-white tracking-wide">{{ pageTitle }}</h2>
    </div>

    <!-- Active Device Selector & System Status -->
    <div class="flex items-center gap-4">
      <!-- Session Selector for quick action -->
      <div v-if="sessions.length > 0" class="flex items-center gap-2 bg-wa-panel px-3 py-1.5 rounded-xl border border-wa-border">
        <span class="w-2 h-2 rounded-full" :class="selectedSessionActive ? 'bg-emerald-400' : 'bg-rose-400'"></span>
        <select 
          :value="sessionsStore.currentSessionId" 
          @change="sessionsStore.currentSessionId = $event.target.value"
          class="bg-transparent text-xs font-semibold text-slate-200 focus:outline-hidden cursor-pointer"
        >
          <option v-for="s in sessions" :key="s.session_id" :value="s.session_id" class="bg-wa-card text-slate-200">
            {{ s.name }} ({{ s.session_id }})
          </option>
        </select>
      </div>

      <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span>Gateway Online</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSessionsStore } from '../stores/sessions';

const route = useRoute();
const sessionsStore = useSessionsStore();

const sessions = computed(() => sessionsStore.sessions);
const currentSession = computed(() => sessionsStore.currentSession);
const selectedSessionActive = computed(() => currentSession.value?.status === 'connected' || currentSession.value?.is_live_active);

const pageTitle = computed(() => {
  switch (route.name) {
    case 'dashboard': return 'System Overview';
    case 'sessions': return 'WhatsApp Devices & Sessions';
    case 'sender': return 'Interactive Message Sandbox';
    case 'reports': return 'Gateway Usage & Analytics Reports';
    case 'webhooks': return 'Webhook Dispatcher & Audit Logs';
    case 'api-keys': return 'API Keys & Access Tokens';
    case 'users': return 'System Administrators';
    case 'docs': return 'Developer API Documentation';
    default: return 'WhatsApp Gateway';
  }
});

onMounted(() => {
  sessionsStore.fetchSessions();
});
</script>
