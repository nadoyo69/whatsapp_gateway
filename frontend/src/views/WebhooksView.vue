<template>
  <div class="space-y-6 animate-fadeIn">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-white">Webhook Dispatcher & Audit Logs</h2>
        <p class="text-xs text-slate-400">Monitor outgoing webhook deliveries, HTTP response status codes, and test endpoints</p>
      </div>
      <button 
        @click="showTestModal = true"
        class="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 transition flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Send Test Webhook Ping
      </button>
    </div>

    <!-- Logs Table -->
    <div class="glass-panel rounded-2xl border border-[#2a3942] overflow-hidden">
      <div class="p-4 border-b border-[#2a3942] flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <select 
            v-model="filterEvent" 
            @change="fetchLogs"
            class="px-3 py-1.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="">All Events</option>
            <option value="message.received">message.received</option>
            <option value="message.status">message.status</option>
            <option value="session.status">session.status</option>
            <option value="test.ping">test.ping</option>
          </select>
        </div>
        <button @click="fetchLogs" class="text-xs text-slate-400 hover:text-white flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Logs
        </button>
      </div>

      <div v-if="logs.length === 0" class="p-12 text-center text-xs text-slate-400">
        No webhook logs recorded yet.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-[#202c33]/70 text-slate-400 uppercase font-semibold border-b border-[#2a3942]">
            <tr>
              <th class="px-6 py-4">Timestamp</th>
              <th class="px-6 py-4">Event</th>
              <th class="px-6 py-4">Session</th>
              <th class="px-6 py-4">Target URL</th>
              <th class="px-6 py-4">Status Code</th>
              <th class="px-6 py-4">Latency</th>
              <th class="px-6 py-4 text-right">Payload</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#2a3942]/60">
            <tr v-for="log in logs" :key="log._id" class="hover:bg-[#202c33]/40 transition">
              <td class="px-6 py-4 font-mono text-slate-400 text-[11px]">{{ formatDate(log.created_at) }}</td>
              <td class="px-6 py-4">
                <span class="px-2 py-0.5 rounded font-mono text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {{ log.event }}
                </span>
              </td>
              <td class="px-6 py-4 font-mono text-emerald-400">{{ log.session_id }}</td>
              <td class="px-6 py-4 text-slate-300 font-mono text-[11px] max-w-xs truncate">{{ log.target_url }}</td>
              <td class="px-6 py-4">
                <span :class="log.success ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'" class="px-2 py-0.5 rounded text-[11px] font-bold border">
                  {{ log.response_status || 'ERROR' }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-400 font-mono text-[11px]">{{ log.execution_time_ms }} ms</td>
              <td class="px-6 py-4 text-right">
                <button @click="openPayload(log)" class="text-xs text-emerald-400 hover:underline">View JSON</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Test Webhook Modal -->
    <div v-if="showTestModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div class="w-full max-w-md bg-[#111b21] border border-[#2a3942] rounded-3xl p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[#2a3942]">
          <h3 class="text-base font-bold text-white">Send Webhook Test Ping</h3>
          <button @click="showTestModal = false" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleTestWebhook" class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Target Endpoint URL</label>
            <input 
              v-model="testUrl" 
              type="url" 
              required 
              placeholder="https://webhook.site/..." 
              class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Secret Signature (Optional)</label>
            <input 
              v-model="testSecret" 
              type="text" 
              placeholder="my-secret-key" 
              class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <button type="submit" :disabled="testing" class="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-2">
            <span v-if="testing" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ testing ? 'Sending...' : 'Dispatch Test Webhook' }}
          </button>
        </form>

        <div v-if="testResult" class="p-3 bg-[#0b141a] rounded-xl border border-[#2a3942] text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
          <pre>{{ JSON.stringify(testResult, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <!-- View Payload Modal -->
    <div v-if="selectedPayload" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div class="w-full max-w-xl bg-[#111b21] border border-[#2a3942] rounded-3xl p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[#2a3942]">
          <h3 class="text-base font-bold text-white">Webhook Request Payload</h3>
          <button @click="selectedPayload = null" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <pre class="bg-[#0b141a] p-4 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto max-h-96 border border-[#2a3942]">{{ JSON.stringify(selectedPayload.request_payload, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';
import { toastSuccess, toastError } from '../utils/alert';

const logs = ref([]);
const filterEvent = ref('');
const showTestModal = ref(false);
const testUrl = ref('');
const testSecret = ref('');
const testing = ref(false);
const testResult = ref(null);
const selectedPayload = ref(null);

const fetchLogs = async () => {
  try {
    const res = await api.get('/webhooks/logs', {
      params: { event: filterEvent.value }
    });
    if (res.data.success) {
      logs.value = res.data.data;
    }
  } catch (err) {}
};

const handleTestWebhook = async () => {
  testing.value = true;
  testResult.value = null;
  try {
    const res = await api.post('/webhooks/test', {
      url: testUrl.value,
      secret: testSecret.value
    });
    testResult.value = res.data;
    toastSuccess('Test webhook ping dispatched!');
    fetchLogs();
  } catch (err) {
    testResult.value = err.response?.data || { error: err.message };
    toastError('Test webhook dispatch failed.');
  } finally {
    testing.value = false;
  }
};

const openPayload = (log) => {
  selectedPayload.value = log;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString();
};

onMounted(() => {
  fetchLogs();
});
</script>
