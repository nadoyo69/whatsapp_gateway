<template>
  <div class="space-y-6 animate-fadeIn">
    <!-- Header with Action -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-white">WhatsApp Devices / Sessions</h2>
        <p class="text-xs text-slate-400">Manage multi-device connections, QR authentication, and session settings</p>
      </div>
      <button 
        @click="showCreateModal = true"
        class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New Device Session
      </button>
    </div>

    <!-- Sessions Table / Card List -->
    <div class="glass-panel rounded-2xl border border-[#2a3942] overflow-hidden">
      <div v-if="sessions.length === 0" class="p-12 text-center space-y-3">
        <p class="text-slate-400 text-sm">No WhatsApp device sessions found.</p>
        <button @click="showCreateModal = true" class="text-xs font-semibold text-emerald-400 hover:underline">
          + Create your first session
        </button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-[#202c33]/70 text-slate-400 uppercase font-semibold border-b border-[#2a3942]">
            <tr>
              <th class="px-6 py-4">Device / Session Name</th>
              <th class="px-6 py-4">Session ID</th>
              <th class="px-6 py-4">Phone Number</th>
              <th class="px-6 py-4">Owner / API Key</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Webhook Target</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#2a3942]/60">
            <tr v-for="s in sessions" :key="s.session_id" class="hover:bg-[#202c33]/40 transition">
              <td class="px-6 py-4 font-semibold text-white">
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    WA
                  </div>
                  {{ s.name }}
                </div>
              </td>
              <td class="px-6 py-4 font-mono text-emerald-400">{{ s.session_id }}</td>
              <td class="px-6 py-4 font-mono text-slate-300">{{ s.phone_number || '-' }}</td>
              <td class="px-6 py-4">
                <span v-if="s.token_name" class="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] font-mono font-semibold inline-flex items-center gap-1.5" :title="'Linked to API Key: ' + s.token_name">
                  <span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  {{ s.token_name }}
                </span>
                <span v-else class="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-[#2a3942] text-[11px] font-semibold">
                  Global / Shared
                </span>
              </td>
              <td class="px-6 py-4">
                <StatusBadge :status="s.status" :is-live="s.is_live_active" />
              </td>
              <td class="px-6 py-4 text-slate-400 max-w-xs truncate">
                {{ s.webhook_url || 'Not configured' }}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="inline-flex items-center gap-1.5">
                  <!-- QR Button -->
                  <button 
                    v-if="!s.is_live_active && s.status !== 'connected'"
                    @click="openQr(s.session_id)"
                    title="Scan QR Code"
                    class="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition text-xs font-semibold flex items-center gap-1"
                  >
                    Scan QR
                  </button>

                  <!-- Pairing Code Button -->
                  <button 
                    v-if="!s.is_live_active && s.status !== 'connected'"
                    @click="openPairing(s.session_id)"
                    title="Pairing Code"
                    class="px-2.5 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition text-xs font-semibold"
                  >
                    Pair Code
                  </button>

                  <!-- Restart -->
                  <button 
                    @click="handleRestart(s.session_id)"
                    title="Restart Session"
                    class="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>

                  <!-- Settings -->
                  <button 
                    @click="openSettings(s)"
                    title="Device Settings"
                    class="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>

                  <!-- Logout -->
                  <button 
                    v-if="s.is_live_active || s.status === 'connected'"
                    @click="handleLogout(s.session_id)"
                    title="Logout WhatsApp"
                    class="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white transition"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>

                  <!-- Delete -->
                  <button 
                    @click="handleDelete(s.session_id)"
                    title="Delete Session"
                    class="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Session Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div class="w-full max-w-md bg-[#111b21] border border-[#2a3942] rounded-3xl p-6 shadow-2xl space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-[#2a3942]">
          <h3 class="text-base font-bold text-white">Create New Device Session</h3>
          <button @click="showCreateModal = false" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleCreateSession" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Session ID (Unique Identifier)</label>
            <input 
              v-model="newSession.sessionId" 
              type="text" 
              required 
              placeholder="e.g. session_sales_01" 
              class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-white placeholder-slate-500 text-xs font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Device / Display Name</label>
            <input 
              v-model="newSession.name" 
              type="text" 
              required 
              placeholder="e.g. CS Sales Office" 
              class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-white placeholder-slate-500 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Webhook URL (Optional)</label>
            <input 
              v-model="newSession.webhookUrl" 
              type="url" 
              placeholder="https://your-app.com/api/wa-webhook" 
              class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-white placeholder-slate-500 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Webhook Secret (Optional)</label>
            <input 
              v-model="newSession.webhookSecret" 
              type="text" 
              placeholder="secret-signature-key" 
              class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-white placeholder-slate-500 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Assign to API Key (Optional)</label>
            <select 
              v-model="newSession.apiTokenId" 
              class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Global / Shared (Accessible to all authorized keys)</option>
              <option v-for="k in apiKeys" :key="k.id" :value="k.id">
                {{ k.name }} (Token: {{ k.token.slice(0, 6) }}...)
              </option>
            </select>
            <p class="text-[10px] text-slate-500 mt-1">If assigned, only this specific API Key can use and control this session.</p>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <input 
              v-model="newSession.autoRead" 
              type="checkbox" 
              id="autoRead"
              class="w-4 h-4 rounded text-emerald-500 bg-[#202c33] border-[#2a3942] focus:ring-emerald-500"
            />
            <label for="autoRead" class="text-xs text-slate-300 cursor-pointer">Auto read incoming WhatsApp messages (Blue ticks)</label>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-[#2a3942]">
            <button type="button" @click="showCreateModal = false" class="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition">
              Cancel
            </button>
            <button type="submit" :disabled="creating" class="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50 flex items-center gap-2">
              <span v-if="creating" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Create & Generate QR
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Settings Modal -->
    <div v-if="showSettingsModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div class="w-full max-w-md bg-[#111b21] border border-[#2a3942] rounded-3xl p-6 shadow-2xl space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-[#2a3942]">
          <h3 class="text-base font-bold text-white">Device Settings ({{ selectedDevice?.session_id }})</h3>
          <button @click="showSettingsModal = false" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSaveSettings" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
            <input 
              v-model="editSettings.name" 
              type="text" 
              required 
              class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Webhook URL</label>
            <input 
              v-model="editSettings.webhookUrl" 
              type="url" 
              placeholder="https://your-app.com/api/wa-webhook" 
              class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Webhook Secret</label>
            <input 
              v-model="editSettings.webhookSecret" 
              type="text" 
              placeholder="secret" 
              class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Owner / Assigned API Key</label>
            <select 
              v-model="editSettings.apiTokenId" 
              class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Global / Shared (Accessible to all authorized keys)</option>
              <option v-for="k in apiKeys" :key="k.id" :value="k.id">
                {{ k.name }} (Token: {{ k.token.slice(0, 6) }}...)
              </option>
            </select>
            <p class="text-[10px] text-slate-500 mt-1">Reassign this device to a specific client API Key or leave Global.</p>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <input 
              v-model="editSettings.autoRead" 
              type="checkbox" 
              id="editAutoRead"
              class="w-4 h-4 rounded text-emerald-500 bg-[#202c33] border-[#2a3942] focus:ring-emerald-500"
            />
            <label for="editAutoRead" class="text-xs text-slate-300 cursor-pointer">Auto read incoming WhatsApp messages</label>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-[#2a3942]">
            <button type="button" @click="showSettingsModal = false" class="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition">
              Cancel
            </button>
            <button type="submit" class="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- QR Modal -->
    <QrModal 
      :show="showQrModal" 
      :session-id="targetSessionId" 
      @close="showQrModal = false"
      @connected="handleQrConnected"
    />

    <!-- Pairing Code Modal -->
    <PairingModal 
      :show="showPairingModal" 
      :session-id="targetSessionId" 
      @close="showPairingModal = false"
      @connected="handleQrConnected"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSessionsStore } from '../stores/sessions';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge.vue';
import QrModal from '../components/QrModal.vue';
import PairingModal from '../components/PairingModal.vue';
import { showSuccess, showError, confirmDialog, toastSuccess } from '../utils/alert';

const sessionsStore = useSessionsStore();
const sessions = computed(() => sessionsStore.sessions);
const apiKeys = ref([]);

const showCreateModal = ref(false);
const showSettingsModal = ref(false);
const showQrModal = ref(false);
const showPairingModal = ref(false);
const targetSessionId = ref('');
const selectedDevice = ref(null);

const creating = ref(false);
const newSession = ref({
  sessionId: '',
  name: '',
  webhookUrl: '',
  webhookSecret: '',
  autoRead: false,
  apiTokenId: ''
});

const editSettings = ref({
  name: '',
  webhookUrl: '',
  webhookSecret: '',
  autoRead: false,
  apiTokenId: ''
});

const fetchApiKeys = async () => {
  try {
    const res = await api.get('/api-keys');
    if (res.data.success) {
      apiKeys.value = res.data.data;
    }
  } catch (err) {}
};

const openQr = (sessionId) => {
  targetSessionId.value = sessionId;
  showQrModal.value = true;
};

const openPairing = (sessionId) => {
  targetSessionId.value = sessionId;
  showPairingModal.value = true;
};

const openSettings = (device) => {
  selectedDevice.value = device;
  editSettings.value = {
    name: device.name,
    webhookUrl: device.webhook_url || '',
    webhookSecret: device.webhook_secret || '',
    autoRead: !!device.auto_read,
    apiTokenId: device.api_token_id || ''
  };
  showSettingsModal.value = true;
};

const handleCreateSession = async () => {
  creating.value = true;
  try {
    await sessionsStore.createSession(newSession.value);
    const sId = newSession.value.sessionId;
    showCreateModal.value = false;
    newSession.value = { sessionId: '', name: '', webhookUrl: '', webhookSecret: '', autoRead: false, apiTokenId: '' };
    toastSuccess(`Session "${sId}" created successfully.`);
    openQr(sId);
  } catch (err) {
    showError('Create Session Failed', err.response?.data?.message || 'Failed to create session.');
  } finally {
    creating.value = false;
  }
};

const handleSaveSettings = async () => {
  if (!selectedDevice.value) return;
  try {
    await sessionsStore.updateSettings(selectedDevice.value.session_id, editSettings.value);
    showSettingsModal.value = false;
    toastSuccess('Device settings saved.');
  } catch (err) {
    showError('Save Failed', 'Failed to save device settings.');
  }
};

const handleRestart = async (sessionId) => {
  try {
    await sessionsStore.restartSession(sessionId);
    toastSuccess(`Session "${sessionId}" restarted.`);
  } catch (err) {
    showError('Restart Failed', 'Failed to restart session.');
  }
};

const handleLogout = async (sessionId) => {
  const confirmed = await confirmDialog(
    'Logout WhatsApp Session?',
    `Are you sure you want to log out session "${sessionId}"? You will need to scan QR code again.`,
    'Yes, Logout',
    true
  );

  if (confirmed) {
    try {
      await sessionsStore.logoutSession(sessionId);
      toastSuccess(`Session "${sessionId}" logged out.`);
    } catch (err) {
      showError('Logout Failed', 'Failed to logout session.');
    }
  }
};

const handleDelete = async (sessionId) => {
  const confirmed = await confirmDialog(
    'Delete Session Permanently?',
    `Are you sure you want to delete session "${sessionId}" and wipe all stored credentials? This action cannot be undone.`,
    'Yes, Delete',
    true
  );

  if (confirmed) {
    try {
      await sessionsStore.deleteSession(sessionId);
      toastSuccess(`Session "${sessionId}" deleted.`);
    } catch (err) {
      showError('Delete Failed', 'Failed to delete session.');
    }
  }
};

const handleQrConnected = () => {
  sessionsStore.fetchSessions();
};

onMounted(() => {
  sessionsStore.fetchSessions();
  fetchApiKeys();
});
</script>
