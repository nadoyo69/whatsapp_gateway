import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('wa_user') || 'null'),
    token: localStorage.getItem('wa_token') || null,
    loading: false,
    error: null
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin'
  },
  actions: {
    async login(username, password) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.post('/auth/login', { username, password });
        if (response.data.success) {
          const { token, user } = response.data.data;
          this.token = token;
          this.user = user;
          localStorage.setItem('wa_token', token);
          localStorage.setItem('wa_user', JSON.stringify(user));
          return true;
        }
        return false;
      } catch (err) {
        this.error = err.response?.data?.message || 'Login failed. Please check your credentials.';
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async fetchProfile() {
      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          this.user = response.data.data;
          localStorage.setItem('wa_user', JSON.stringify(this.user));
        }
      } catch (err) {
        // failed to fetch profile
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('wa_token');
      localStorage.removeItem('wa_user');
      window.location.href = '/login';
    }
  }
});
