import { http } from './api.js';

export const authService = {
  async login(email, password) {
    const res = await http.post('/v1/auth/login', { email, password });
    return res.data || res;
  },

  async getMe() {
    const res = await http.get('/v1/auth/me');
    return res.data || res;
  },

  async logout() {
    try {
      const res = await http.post('/v1/auth/logout');
      return res.data || res;
    } catch {
      return { success: true };
    }
  },
};
