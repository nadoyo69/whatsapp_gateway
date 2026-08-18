<template>
  <div class="space-y-6 animate-fadeIn">
    <div>
      <h2 class="text-xl font-bold text-white">Interactive Message Sandbox</h2>
      <p class="text-xs text-slate-400">Test sending all types of WhatsApp messages directly from the dashboard</p>
    </div>

    <!-- Main Grid: Sandbox Form (Left) & JSON Response Viewer (Right) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left: Form -->
      <div class="lg:col-span-7 space-y-5">
        <!-- Message Type Tabs -->
        <div class="flex items-center gap-1.5 p-1.5 bg-[#111b21] border border-[#2a3942] rounded-2xl overflow-x-auto">
          <button 
            v-for="t in tabs" 
            :key="t.id"
            @click="activeTab = t.id"
            :class="[
              activeTab === t.id 
                ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#202c33]'
            ]"
            class="px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition"
          >
            {{ t.label }}
          </button>
        </div>

        <!-- Form Card -->
        <div class="glass-panel p-6 rounded-2xl border border-[#2a3942] space-y-5">
          <!-- Session & Target Phone -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Active Session</label>
              <select 
                v-model="form.sessionId" 
                class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option v-for="s in sessions" :key="s.session_id" :value="s.session_id">
                  {{ s.name }} ({{ s.session_id }})
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Destination Phone / Group JID</label>
              <input 
                v-model="form.to" 
                type="text" 
                placeholder="628123456789 or 08123..." 
                class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <!-- TAB 1: Text Message -->
          <div v-if="activeTab === 'text'" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Message Content</label>
              <textarea 
                v-model="form.message" 
                rows="4" 
                placeholder="Hello from WhatsApp Gateway! *Bold text*, _Italic_, ~Strike~ supported."
                class="w-full px-4 py-3 bg-[#202c33] border border-[#2a3942] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              ></textarea>
            </div>
          </div>

          <!-- TAB 2: Image -->
          <div v-if="activeTab === 'image'" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Upload Image File</label>
              <input 
                type="file" 
                accept="image/*" 
                @change="handleFileUpload($event, 'image')"
                class="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Or Image Remote URL</label>
              <input 
                v-model="form.imageUrl" 
                type="url" 
                placeholder="https://example.com/photo.jpg" 
                class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Caption (Optional)</label>
              <input 
                v-model="form.caption" 
                type="text" 
                placeholder="Image caption here..." 
                class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <!-- TAB 3: Document -->
          <div v-if="activeTab === 'document'" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Upload Document (PDF, ZIP, DOCX, XLSX)</label>
              <input 
                type="file" 
                @change="handleFileUpload($event, 'document')"
                class="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Or Document URL</label>
              <input 
                v-model="form.documentUrl" 
                type="url" 
                placeholder="https://example.com/invoice.pdf" 
                class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">File Name</label>
                <input 
                  v-model="form.filename" 
                  type="text" 
                  placeholder="invoice-2026.pdf" 
                  class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Caption (Optional)</label>
                <input 
                  v-model="form.caption" 
                  type="text" 
                  placeholder="Monthly Report..." 
                  class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <!-- TAB 4: Audio / VN -->
          <div v-if="activeTab === 'audio'" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Upload Audio File (MP3, OGG, WAV)</label>
              <input 
                type="file" 
                accept="audio/*" 
                @change="handleFileUpload($event, 'audio')"
                class="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
              />
            </div>
            <div class="flex items-center gap-2">
              <input 
                v-model="form.isPtt" 
                type="checkbox" 
                id="isPtt"
                class="w-4 h-4 rounded text-emerald-500 bg-[#202c33] border-[#2a3942] focus:ring-emerald-500"
              />
              <label for="isPtt" class="text-xs text-slate-300 cursor-pointer">Send as Voice Note / PTT (Mic waveform)</label>
            </div>
          </div>

          <!-- TAB 5: Video -->
          <div v-if="activeTab === 'video'" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Upload Video (MP4)</label>
              <input 
                type="file" 
                accept="video/*" 
                @change="handleFileUpload($event, 'video')"
                class="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Caption (Optional)</label>
              <input 
                v-model="form.caption" 
                type="text" 
                placeholder="Video caption..." 
                class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <!-- TAB 6: Location -->
          <div v-if="activeTab === 'location'" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Latitude</label>
                <input 
                  v-model="form.latitude" 
                  type="text" 
                  placeholder="-6.2088" 
                  class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Longitude</label>
                <input 
                  v-model="form.longitude" 
                  type="text" 
                  placeholder="106.8456" 
                  class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Location Name & Address</label>
              <input 
                v-model="form.locationName" 
                type="text" 
                placeholder="Monas National Monument" 
                class="w-full px-4 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <!-- TAB 7: Check Number -->
          <div v-if="activeTab === 'check'" class="space-y-4">
            <p class="text-xs text-slate-400">Verifies if the specified phone number is registered on WhatsApp and retrieves its valid WhatsApp JID.</p>
          </div>

          <!-- Send Action Button -->
          <button 
            @click="handleSubmit" 
            :disabled="sending || !form.sessionId || !form.to"
            class="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span v-if="sending" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ sending ? 'Sending Message...' : (activeTab === 'check' ? 'Verify WhatsApp Number' : 'Send WhatsApp Message') }}
          </button>
        </div>
      </div>

      <!-- Right: Response & API Preview -->
      <div class="lg:col-span-5 space-y-4">
        <div class="glass-panel p-5 rounded-2xl border border-[#2a3942] space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-white uppercase tracking-wider">REST API Response</h3>
            <span v-if="lastResponseStatus" :class="lastResponseStatus >= 200 && lastResponseStatus < 300 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'" class="px-2 py-0.5 rounded text-[11px] font-mono font-bold">
              HTTP {{ lastResponseStatus }}
            </span>
          </div>
          <pre class="bg-[#0b141a] p-4 rounded-xl text-slate-300 font-mono text-[11px] overflow-x-auto max-h-80 border border-[#2a3942]">{{ formattedResponse || '// API JSON response will appear here' }}</pre>
        </div>

        <div class="glass-panel p-5 rounded-2xl border border-[#2a3942] space-y-3">
          <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Target Endpoint</h3>
          <div class="bg-[#202c33] p-3 rounded-xl border border-[#2a3942] font-mono text-xs text-emerald-400 break-all">
            {{ endpointPreview }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSessionsStore } from '../stores/sessions';
import api from '../services/api';
import { toastSuccess, toastError } from '../utils/alert';

const route = useRoute();
const sessionsStore = useSessionsStore();
const sessions = computed(() => sessionsStore.sessions);

const tabs = [
  { id: 'text', label: 'Plain Text' },
  { id: 'image', label: 'Image' },
  { id: 'document', label: 'Document' },
  { id: 'audio', label: 'Audio / Voice Note' },
  { id: 'video', label: 'Video' },
  { id: 'location', label: 'Location' },
  { id: 'check', label: 'Check Number' }
];

const activeTab = ref('text');
const sending = ref(false);
const lastResponse = ref(null);
const lastResponseStatus = ref(null);
const uploadedFile = ref(null);

const form = ref({
  sessionId: '',
  to: '',
  message: 'Hello! This is a test message from WhatsApp Gateway.',
  caption: '',
  imageUrl: '',
  documentUrl: '',
  filename: '',
  isPtt: false,
  latitude: '-6.2088',
  longitude: '106.8456',
  locationName: 'Jakarta Pusat'
});

const formattedResponse = computed(() => {
  if (!lastResponse.value) return null;
  return JSON.stringify(lastResponse.value, null, 2);
});

const endpointPreview = computed(() => {
  switch (activeTab.value) {
    case 'text': return 'POST /api/v1/messages/send-text';
    case 'image': return 'POST /api/v1/messages/send-image';
    case 'document': return 'POST /api/v1/messages/send-document';
    case 'audio': return 'POST /api/v1/messages/send-audio';
    case 'video': return 'POST /api/v1/messages/send-video';
    case 'location': return 'POST /api/v1/messages/send-location';
    case 'check': return `GET /api/v1/tools/check-number/${form.value.sessionId || ':sessionId'}/${form.value.to || ':phone'}`;
    default: return '';
  }
});

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    uploadedFile.value = file;
    if (!form.value.filename) {
      form.value.filename = file.name;
    }
  }
};

const handleSubmit = async () => {
  sending.value = true;
  lastResponse.value = null;
  lastResponseStatus.value = null;

  try {
    let res;
    if (activeTab.value === 'text') {
      res = await api.post('/messages/send-text', {
        sessionId: form.value.sessionId,
        to: form.value.to,
        message: form.value.message
      });
    } else if (activeTab.value === 'check') {
      res = await api.get(`/tools/check-number/${form.value.sessionId}/${form.value.to}`);
    } else {
      // Multipart upload for media
      const formData = new FormData();
      formData.append('sessionId', form.value.sessionId);
      formData.append('to', form.value.to);
      if (form.value.caption) formData.append('caption', form.value.caption);

      if (uploadedFile.value) {
        formData.append('file', uploadedFile.value);
      }

      if (activeTab.value === 'image') {
        if (form.value.imageUrl) formData.append('imageUrl', form.value.imageUrl);
        res = await api.post('/messages/send-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else if (activeTab.value === 'document') {
        if (form.value.documentUrl) formData.append('documentUrl', form.value.documentUrl);
        if (form.value.filename) formData.append('filename', form.value.filename);
        res = await api.post('/messages/send-document', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else if (activeTab.value === 'audio') {
        formData.append('isPtt', form.value.isPtt);
        res = await api.post('/messages/send-audio', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else if (activeTab.value === 'video') {
        res = await api.post('/messages/send-video', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else if (activeTab.value === 'location') {
        res = await api.post('/messages/send-location', {
          sessionId: form.value.sessionId,
          to: form.value.to,
          latitude: form.value.latitude,
          longitude: form.value.longitude,
          name: form.value.locationName
        });
      }
    }

    lastResponse.value = res.data;
    lastResponseStatus.value = res.status;
    if (res.data.success) {
      toastSuccess(activeTab.value === 'check' ? 'Number checked on WhatsApp.' : 'Message sent successfully!');
    }
  } catch (err) {
    lastResponse.value = err.response?.data || { error: err.message };
    lastResponseStatus.value = err.response?.status || 500;
    toastError(err.response?.data?.message || 'Failed to dispatch message.');
  } finally {
    sending.value = false;
  }
};

onMounted(async () => {
  await sessionsStore.fetchSessions();
  if (route.query.session) {
    form.value.sessionId = route.query.session;
  } else if (sessions.value.length > 0) {
    form.value.sessionId = sessions.value[0].session_id;
  }
});
</script>
