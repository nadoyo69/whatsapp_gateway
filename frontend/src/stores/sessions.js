import { defineStore } from 'pinia';
import api from '../services/api';

export const useSessionsStore = defineStore('sessions', {
  state: () => ({
    sessions: [],
    loading: false,
    error: null,
    currentSessionId: null
  }),
  getters: {
    activeSessionsCount: (state) => state.sessions.filter(s => s.status === 'connected' || s.is_live_active).length,
    totalSessionsCount: (state) => state.sessions.length,
    currentSession: (state) => state.sessions.find(s => s.session_id === state.currentSessionId) || state.sessions[0] || null
  },
  actions: {
    async fetchSessions() {
      this.loading = true;
      try {
        const response = await api.get('/sessions');
        if (response.data.success) {
          this.sessions = response.data.data;
          if (!this.currentSessionId && this.sessions.length > 0) {
            this.currentSessionId = this.sessions[0].session_id;
          }
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch sessions.';
      } finally {
        this.loading = false;
      }
    },
    async createSession(payload) {
      try {
        const response = await api.post('/sessions/create', payload);
        await this.fetchSessions();
        return response.data;
      } catch (err) {
        throw err;
      }
    },
    async restartSession(sessionId) {
      try {
        const response = await api.post(`/sessions/${sessionId}/restart`);
        await this.fetchSessions();
        return response.data;
      } catch (err) {
        throw err;
      }
    },
    async logoutSession(sessionId) {
      try {
        const response = await api.post(`/sessions/${sessionId}/logout`);
        await this.fetchSessions();
        return response.data;
      } catch (err) {
        throw err;
      }
    },
    async deleteSession(sessionId) {
      try {
        const response = await api.delete(`/sessions/${sessionId}`);
        await this.fetchSessions();
        if (this.currentSessionId === sessionId) {
          this.currentSessionId = this.sessions[0]?.session_id || null;
        }
        return response.data;
      } catch (err) {
        throw err;
      }
    },
    async updateSettings(sessionId, payload) {
      try {
        const response = await api.put(`/sessions/${sessionId}/settings`, payload);
        await this.fetchSessions();
        return response.data;
      } catch (err) {
        throw err;
      }
    },
    updateSessionLiveStatus(sessionId, status, phone) {
      const idx = this.sessions.findIndex(s => s.session_id === sessionId);
      if (idx !== -1) {
        this.sessions[idx].status = status;
        if (status === 'connected') {
          this.sessions[idx].is_live_active = true;
          if (phone) this.sessions[idx].phone_number = phone;
        } else if (status === 'disconnected' || status === 'logged_out') {
          this.sessions[idx].is_live_active = false;
        }
      }
    }
  }
});
