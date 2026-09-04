<template>
  <div class="flex min-h-screen bg-[#0b141a]">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <Navbar />
      <main class="flex-1 p-8 overflow-y-auto">
        <RouterView />
      </main>
      <footer class="h-12 border-t border-[#2a3942]/60 px-8 flex items-center justify-between text-xs text-slate-500 bg-[#111b21]/50">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-slate-400">NexforgexGateway (NXG)</span>
          <span>•</span>
          <span>WhatsApp API Platform</span>
        </div>
        <div class="flex items-center gap-2">
          <span>Version</span>
          <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold text-[11px]">V1.0.0</span>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import Sidebar from './Sidebar.vue';
import Navbar from './Navbar.vue';
import { onMounted } from 'vue';
import { getSocket } from '../services/socket';
import { useSessionsStore } from '../stores/sessions';

const sessionsStore = useSessionsStore();

onMounted(() => {
  const socket = getSocket();
  socket.on('global:connection.update', (data) => {
    if (data?.sessionId) {
      sessionsStore.updateSessionLiveStatus(data.sessionId, data.status, data.phone);
    }
  });
});
</script>
