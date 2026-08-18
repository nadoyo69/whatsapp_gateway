<template>
  <div class="space-y-6 animate-fadeIn">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-white">API Keys & Tokens</h2>
        <p class="text-xs text-slate-400">Generate secure API keys to integrate your external systems (Laravel, Express, Python, etc.)</p>
      </div>
      <button 
        @click="showCreateModal = true"
        class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Generate API Key
      </button>
    </div>

    <!-- API Keys List -->
    <div class="glass-panel rounded-2xl border border-[#2a3942] overflow-hidden">
      <div v-if="keys.length === 0" class="p-12 text-center text-xs text-slate-400">
        No API keys generated yet. Click above to generate your first key.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-[#202c33]/70 text-slate-400 uppercase font-semibold border-b border-[#2a3942]">
            <tr>
              <th class="px-6 py-4">Key Name / App</th>
              <th class="px-6 py-4">API Token</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Last Used</th>
              <th class="px-6 py-4">Created At</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#2a3942]/60">
            <tr v-for="k in keys" :key="k.id" class="hover:bg-[#202c33]/40 transition">
              <td class="px-6 py-4 font-bold text-white">{{ k.name }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-emerald-400 bg-slate-900 px-2 py-1 rounded border border-[#2a3942]">
                    {{ visibleKeys[k.id] ? k.token : maskKey(k.token) }}
                  </span>
                  <button @click="toggleKeyVisibility(k.id)" class="text-slate-400 hover:text-white p-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button @click="copyToClipboard(k.token)" title="Copy Key" class="text-slate-400 hover:text-emerald-400 p-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>
              </td>
              <td class="px-6 py-4">
                <span :class="k.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'" class="px-2 py-0.5 rounded text-[11px] font-semibold border">
                  {{ k.is_active ? 'Active' : 'Revoked' }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-400 font-mono text-[11px]">{{ k.last_used_at ? formatDate(k.last_used_at) : 'Never' }}</td>
              <td class="px-6 py-4 text-slate-400 font-mono text-[11px]">{{ formatDate(k.created_at) }}</td>
              <td class="px-6 py-4 text-right space-x-2">
                <button @click="toggleActive(k.id)" class="text-xs text-amber-400 hover:underline">
                  {{ k.is_active ? 'Deactivate' : 'Activate' }}
                </button>
                <button @click="deleteKey(k.id)" class="text-xs text-rose-400 hover:underline">
                  Revoke
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div class="w-full max-w-md bg-[#111b21] border border-[#2a3942] rounded-3xl p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[#2a3942]">
          <h3 class="text-base font-bold text-white">Generate API Key</h3>
          <button @click="showCreateModal = false" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleCreateKey" class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Key Name / Client App Name</label>
            <input 
              v-model="keyName" 
              type="text" 
              required 
              placeholder="e.g. Laravel POS Backend" 
              class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <button type="submit" class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition">
            Generate Key Now
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';
import { showSuccess, showError, confirmDialog, toastSuccess } from '../utils/alert';

const keys = ref([]);
const showCreateModal = ref(false);
const keyName = ref('');
const visibleKeys = ref({});

const fetchKeys = async () => {
  try {
    const res = await api.get('/api-keys');
    if (res.data.success) {
      keys.value = res.data.data;
    }
  } catch (err) {}
};

const handleCreateKey = async () => {
  if (!keyName.value) return;
  try {
    const res = await api.post('/api-keys', { name: keyName.value });
    keyName.value = '';
    showCreateModal.value = false;
    showSuccess('API Key Generated', `Key "${res.data.data.name}" created successfully. You can now use it in external applications.`);
    fetchKeys();
  } catch (err) {
    showError('Create Failed', err.response?.data?.message || 'Failed to create API key.');
  }
};

const toggleActive = async (id) => {
  try {
    await api.patch(`/api-keys/${id}/toggle`);
    toastSuccess('API Key status updated.');
    fetchKeys();
  } catch (err) {
    showError('Update Failed', 'Failed to update key status.');
  }
};

const deleteKey = async (id) => {
  const confirmed = await confirmDialog(
    'Revoke API Key?',
    'Are you sure you want to revoke this API key? External systems using it will immediately lose access.',
    'Yes, Revoke Key',
    true
  );

  if (confirmed) {
    try {
      await api.delete(`/api-keys/${id}`);
      toastSuccess('API Key revoked and removed.');
      fetchKeys();
    } catch (err) {
      showError('Revoke Failed', 'Failed to delete key.');
    }
  }
};

const toggleKeyVisibility = (id) => {
  visibleKeys.value[id] = !visibleKeys.value[id];
};

const maskKey = (token) => {
  if (!token) return '';
  return token.slice(0, 10) + '••••••••••••••••' + token.slice(-4);
};

const copyToClipboard = (token) => {
  navigator.clipboard.writeText(token);
  toastSuccess('API Key copied to clipboard!');
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString();
};

onMounted(() => {
  fetchKeys();
});
</script>
