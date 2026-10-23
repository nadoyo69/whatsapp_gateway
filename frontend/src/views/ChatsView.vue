<template>
  <div class="h-[calc(100vh-8rem)] flex flex-col space-y-4 animate-fadeIn">
    <!-- Header & Session Picker -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-white">Live Chat History</h2>
        <p class="text-xs text-slate-400">Real-time incoming and outgoing WhatsApp conversation archive</p>
      </div>

      <div class="flex items-center gap-2">
        <label class="text-xs text-slate-400 font-semibold">Select Session:</label>
        <select 
          v-model="selectedSessionId" 
          @change="fetchChats"
          class="px-3 py-1.5 bg-wa-panel border border-wa-border rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500 font-mono"
        >
          <option v-for="s in sessions" :key="s.session_id" :value="s.session_id">
            {{ s.name }} ({{ s.session_id }})
          </option>
        </select>
      </div>
    </div>

    <!-- Chat Container: Thread list (Left) & Messages box (Right) -->
    <div class="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-4">
      <!-- Left Column: Chats list -->
      <div class="md:col-span-4 glass-panel rounded-2xl border border-wa-border flex flex-col overflow-hidden">
        <!-- Search bar -->
        <div class="p-3 border-b border-wa-border">
          <input 
            v-model="searchQuery" 
            @input="handleSearch"
            type="text" 
            placeholder="Search contact or phone..." 
            class="w-full px-3 py-2 bg-wa-panel border border-wa-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <!-- Chat List Items -->
        <div class="flex-1 overflow-y-auto divide-y divide-wa-border/40">
          <div v-if="loadingChats" class="p-8 text-center text-xs text-slate-400">
            Loading conversations...
          </div>
          <div v-else-if="chats.length === 0" class="p-8 text-center text-xs text-slate-400">
            No chats found for this session.
          </div>
          <button 
            v-for="chat in chats" 
            :key="chat._id"
            @click="selectChat(chat)"
            :class="[
              activeChat?.jid === chat.jid 
                ? 'bg-wa-panel border-l-4 border-l-emerald-500' 
                : 'hover:bg-wa-panel/40'
            ]"
            class="w-full text-left p-3.5 flex items-center gap-3 transition"
          >
            <div class="w-10 h-10 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 border border-wa-border">
              {{ chat.name?.charAt(0) || 'U' }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <p class="text-xs font-bold text-white truncate">{{ chat.name || chat.phone }}</p>
                <span class="text-[10px] text-slate-500">{{ formatTime(chat.updated_at) }}</span>
              </div>
              <p class="text-[11px] text-slate-400 truncate mt-0.5">{{ chat.last_message?.text || 'No messages' }}</p>
            </div>
            <span v-if="chat.unread_count > 0" class="px-1.5 py-0.5 bg-emerald-500 text-slate-950 font-black rounded-full text-[10px]">
              {{ chat.unread_count }}
            </span>
          </button>
        </div>
      </div>

      <!-- Right Column: Messages Thread -->
      <div class="md:col-span-8 glass-panel rounded-2xl border border-wa-border flex flex-col overflow-hidden">
        <div v-if="!activeChat" class="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
          <div class="w-12 h-12 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p class="text-sm font-semibold text-slate-300">Select a chat to view messages</p>
        </div>

        <div v-else class="flex-1 flex flex-col h-full">
          <!-- Chat header -->
          <div class="p-3.5 bg-wa-panel/60 border-b border-wa-border flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                {{ activeChat.name?.charAt(0) || 'U' }}
              </div>
              <div>
                <h4 class="text-xs font-bold text-white">{{ activeChat.name || activeChat.phone }}</h4>
                <p class="text-[10px] text-slate-400 font-mono">{{ activeChat.jid }}</p>
              </div>
            </div>
            <button @click="fetchMessages" title="Refresh messages" class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <!-- Messages scroll area -->
          <div class="flex-1 p-4 overflow-y-auto space-y-3 bg-wa-dark/60">
            <div 
              v-for="m in messages" 
              :key="m._id"
              :class="m.from_me ? 'justify-end' : 'justify-start'"
              class="flex"
            >
              <div 
                :class="[
                  m.from_me 
                    ? 'bg-[#005c4b] text-white rounded-br-none' 
                    : 'bg-wa-panel text-slate-100 rounded-bl-none'
                ]"
                class="max-w-[75%] rounded-2xl p-3 shadow-sm text-xs space-y-1"
              >
                <p v-if="!m.from_me && m.sender_name" class="text-[10px] font-bold text-emerald-400">{{ m.sender_name }}</p>
                <p class="whitespace-pre-wrap leading-relaxed">{{ m.text }}</p>
                <div class="flex items-center justify-end gap-1 text-[9px] text-slate-400 pt-0.5">
                  <span>{{ formatTime(m.timestamp) }}</span>
                  <span v-if="m.from_me">
                    <span v-if="m.status === 'read'" class="text-blue-400 font-bold">✓✓</span>
                    <span v-else-if="m.status === 'delivered'">✓✓</span>
                    <span v-else-if="m.status === 'sent'">✓</span>
                    <span v-else class="text-slate-500">⏱</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick reply form -->
          <div class="p-3 bg-wa-panel/70 border-t border-wa-border flex items-center gap-2">
            <input 
              v-model="replyText" 
              @keyup.enter="sendQuickReply"
              type="text" 
              placeholder="Type a message to send..." 
              class="flex-1 px-4 py-2.5 bg-wa-card border border-wa-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
            <button 
              @click="sendQuickReply" 
              :disabled="!replyText || sendingReply"
              class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useSessionsStore } from '../stores/sessions';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { showError, toastSuccess } from '../utils/alert';

const sessionsStore = useSessionsStore();
const sessions = computed(() => sessionsStore.sessions);

const selectedSessionId = ref('');
const chats = ref([]);
const activeChat = ref(null);
const messages = ref([]);
const searchQuery = ref('');
const loadingChats = ref(false);
const replyText = ref('');
const sendingReply = ref(false);

const fetchChats = async () => {
  if (!selectedSessionId.value) return;
  loadingChats.value = true;
  try {
    const res = await api.get(`/chats/${selectedSessionId.value}`, {
      params: { search: searchQuery.value }
    });
    if (res.data.success) {
      chats.value = res.data.data;
    }
  } catch (err) {
    //
  } finally {
    loadingChats.value = false;
  }
};

const handleSearch = () => {
  fetchChats();
};

const selectChat = (chat) => {
  activeChat.value = chat;
  fetchMessages();
};

const fetchMessages = async () => {
  if (!activeChat.value || !selectedSessionId.value) return;
  try {
    const res = await api.get(`/chats/${selectedSessionId.value}/${encodeURIComponent(activeChat.value.jid)}/messages`);
    if (res.data.success) {
      messages.value = res.data.data;
    }
  } catch (err) {
    //
  }
};

const sendQuickReply = async () => {
  if (!replyText.value || !activeChat.value || !selectedSessionId.value) return;
  sendingReply.value = true;
  try {
    await api.post('/messages/send-text', {
      sessionId: selectedSessionId.value,
      to: activeChat.value.jid,
      message: replyText.value
    });
    replyText.value = '';
    toastSuccess('Reply message sent.');
    setTimeout(fetchMessages, 500);
  } catch (err) {
    showError('Send Failed', err.response?.data?.message || 'Failed to send reply message.');
  } finally {
    sendingReply.value = false;
  }
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const handleNewMessage = (data) => {
  if (activeChat.value && data.remoteJid === activeChat.value.jid) {
    messages.value.push({
      _id: data.id,
      from_me: data.fromMe,
      text: data.text,
      sender_name: data.senderName,
      timestamp: data.timestamp,
      status: 'delivered'
    });
  }
  fetchChats();
};

onMounted(async () => {
  await sessionsStore.fetchSessions();
  if (sessions.value.length > 0) {
    selectedSessionId.value = sessions.value[0].session_id;
    fetchChats();
  }

  const socket = getSocket();
  socket.on('message.new', handleNewMessage);
});

onUnmounted(() => {
  const socket = getSocket();
  socket.off('message.new', handleNewMessage);
});
</script>
