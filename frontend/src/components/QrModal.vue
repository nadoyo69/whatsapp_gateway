<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
    <div class="relative w-full max-w-md bg-wa-card border border-wa-border rounded-2xl p-6 shadow-2xl text-center">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-wa-border/60">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div class="text-left">
            <h3 class="text-lg font-bold text-white">Scan WhatsApp QR</h3>
            <p class="text-xs text-slate-400">Session: <span class="text-emerald-400 font-mono font-medium">{{ sessionId }}</span></p>
          </div>
        </div>
        <button @click="close" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- QR Display / Loading / Success -->
      <div class="py-6 flex flex-col items-center justify-center">
        <div v-if="connected" class="py-8 flex flex-col items-center gap-3">
          <div class="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h4 class="text-xl font-bold text-white">Device Connected!</h4>
          <p class="text-sm text-slate-400">WhatsApp session successfully authenticated.</p>
        </div>

        <div v-else-if="qrImage" class="relative group p-3 bg-white rounded-2xl shadow-xl border-4 border-emerald-500/30">
          <img :src="qrImage" alt="WhatsApp QR Code" class="w-64 h-64 object-contain rounded-lg" />
          <div class="absolute inset-0 rounded-2xl ring-4 ring-emerald-500/20 animate-pulse pointer-events-none"></div>
        </div>

        <div v-else class="w-64 h-64 flex flex-col items-center justify-center bg-wa-panel/50 rounded-2xl border border-dashed border-wa-border">
          <div class="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin"></div>
          <p class="text-xs text-slate-400 mt-3 font-medium">Generating QR Code...</p>
        </div>

        <!-- Instruction -->
        <div v-if="!connected" class="mt-5 text-xs text-slate-400 max-w-xs space-y-1 text-left bg-wa-panel/40 p-3.5 rounded-xl border border-wa-border/60">
          <p class="font-semibold text-slate-200 flex items-center gap-1.5">
            <span class="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 inline-flex items-center justify-center text-[10px]">1</span>
            Open WhatsApp on your phone
          </p>
          <p class="text-slate-400 ml-5">Tap <b>Settings</b> or <b>Menu</b> > <b>Linked Devices</b></p>
          <p class="font-semibold text-slate-200 flex items-center gap-1.5 pt-1">
            <span class="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 inline-flex items-center justify-center text-[10px]">2</span>
            Tap <b>Link a Device</b> and point camera here
          </p>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="flex items-center justify-between pt-4 border-t border-wa-border/60">
        <button @click="refreshQR" :disabled="refreshing || connected" class="text-xs text-slate-300 hover:text-emerald-400 inline-flex items-center gap-1.5 transition disabled:opacity-50">
          <svg :class="{'animate-spin': refreshing}" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reload QR
        </button>
        <button @click="close" class="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition">
          {{ connected ? 'Done' : 'Close' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import api from '../services/api';
import { getSocket, joinSessionRoom, leaveSessionRoom } from '../services/socket';

const props = defineProps({
  show: Boolean,
  sessionId: String
});

const emit = defineEmits(['close', 'connected']);

const qrImage = ref('');
const connected = ref(false);
const refreshing = ref(false);

let socketInstance = null;

const fetchQR = async () => {
  if (!props.sessionId) return;
  refreshing.value = true;
  try {
    const res = await api.get(`/sessions/${props.sessionId}/qr`);
    if (res.data.status === 'connected') {
      connected.value = true;
      emit('connected');
    } else if (res.data.data?.qr) {
      qrImage.value = res.data.data.qr;
    }
  } catch (err) {
    //
  } finally {
    refreshing.value = false;
  }
};

const refreshQR = async () => {
  await api.post(`/sessions/${props.sessionId}/restart`).catch(() => {});
  setTimeout(fetchQR, 1000);
};

const handleQrEvent = (data) => {
  if (data?.qr) {
    qrImage.value = data.qr;
  }
};

const handleConnectionEvent = (data) => {
  if (data?.status === 'connected') {
    connected.value = true;
    setTimeout(() => {
      emit('connected');
      close();
    }, 1500);
  }
};

watch(() => props.show, (newVal) => {
  if (newVal && props.sessionId) {
    connected.value = false;
    qrImage.value = '';
    joinSessionRoom(props.sessionId);
    fetchQR();

    socketInstance = getSocket();
    socketInstance.on('qr', handleQrEvent);
    socketInstance.on('connection.update', handleConnectionEvent);
  } else {
    if (props.sessionId) leaveSessionRoom(props.sessionId);
    if (socketInstance) {
      socketInstance.off('qr', handleQrEvent);
      socketInstance.off('connection.update', handleConnectionEvent);
    }
  }
});

const close = () => {
  emit('close');
};

onUnmounted(() => {
  if (props.sessionId) leaveSessionRoom(props.sessionId);
  if (socketInstance) {
    socketInstance.off('qr', handleQrEvent);
    socketInstance.off('connection.update', handleConnectionEvent);
  }
});
</script>
