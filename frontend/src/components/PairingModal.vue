<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
    <div class="relative w-full max-w-md bg-[#111b21] border border-[#2a3942] rounded-2xl p-6 shadow-2xl text-center">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-[#2a3942]/60">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="text-left">
            <h3 class="text-lg font-bold text-white">Pairing Code</h3>
            <p class="text-xs text-slate-400">Session: <span class="text-blue-400 font-mono font-medium">{{ sessionId }}</span></p>
          </div>
        </div>
        <button @click="close" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Phone Input & Code Display -->
      <div class="py-6 space-y-4">
        <div v-if="!pairingCode" class="text-left space-y-3">
          <label class="block text-xs font-semibold text-slate-300">WhatsApp Phone Number</label>
          <div class="relative">
            <input 
              v-model="phoneNumber" 
              type="text" 
              placeholder="e.g. 628123456789" 
              class="w-full px-4 py-3 bg-[#202c33] border border-[#2a3942] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
            />
          </div>
          <p class="text-[11px] text-slate-400">Input number with international country code (e.g. 62 for Indonesia).</p>
          <button 
            @click="requestCode" 
            :disabled="loading || !phoneNumber" 
            class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ loading ? 'Requesting Code...' : 'Generate 8-Digit Code' }}
          </button>
        </div>

        <div v-else class="space-y-5">
          <p class="text-xs text-slate-400">Enter this 8-digit code on WhatsApp notification:</p>
          <div class="py-4 px-6 bg-[#202c33] border-2 border-dashed border-blue-500/50 rounded-2xl">
            <span class="font-mono text-3xl font-extrabold text-blue-400 tracking-widest">{{ formattedCode }}</span>
          </div>
          <div class="text-left bg-[#202c33]/40 p-3.5 rounded-xl border border-[#2a3942]/60 text-xs text-slate-400 space-y-1">
            <p class="text-slate-200 font-semibold">Instructions:</p>
            <p>1. Open WhatsApp on phone > Linked Devices > Link with Phone Number.</p>
            <p>2. Type the 8-character pairing code above.</p>
          </div>
        </div>

        <p v-if="error" class="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 text-left">{{ error }}</p>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end pt-4 border-t border-[#2a3942]/60">
        <button @click="close" class="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import api from '../services/api';

const props = defineProps({
  show: Boolean,
  sessionId: String
});

const emit = defineEmits(['close', 'connected']);

const phoneNumber = ref('');
const pairingCode = ref('');
const loading = ref(false);
const error = ref(null);

const formattedCode = computed(() => {
  if (!pairingCode.value) return '';
  const c = pairingCode.value;
  return c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : c;
});

const requestCode = async () => {
  if (!phoneNumber.value || !props.sessionId) return;
  loading.value = true;
  error.value = null;
  try {
    const res = await api.post(`/sessions/${props.sessionId}/pairing-code`, {
      phoneNumber: phoneNumber.value
    });
    if (res.data.success) {
      pairingCode.value = res.data.data.code;
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to request pairing code.';
  } finally {
    loading.value = false;
  }
};

watch(() => props.show, (newVal) => {
  if (!newVal) {
    pairingCode.value = '';
    phoneNumber.value = '';
    error.value = null;
  }
});

const close = () => {
  emit('close');
};
</script>
