// Drop-in replacement for the old @base44/sdk client.
//
// The rest of the app talks to `base44.auth.*`, `base44.entities.<Name>.*`
// and `base44.integrations.Core.*` exactly as before -- only what happens
// underneath changed: it's now our own Express API on Vercel, backed by
// MongoDB Atlas, instead of base44's hosted backend.
import { request, getToken, setToken } from './httpClient';

const ENTITY_NAMES = [
  'ChatMessage',
  'Client',
  'Concern',
  'Notice',
  'Payment',
  'PlatformConfig',
  'Product',
  'Rating',
  'Seller',
  'Showroom',
  'ShowroomMessage',
];

function buildEntityApi(name) {
  return {
    async list(sort = '-created_date', limit = 200) {
      const qs = new URLSearchParams({ sort, limit: String(limit) });
      return request(`/entities/${name}?${qs.toString()}`);
    },
    async filter(query = {}, sort = '-created_date', limit = 200) {
      const qs = new URLSearchParams({
        sort,
        limit: String(limit),
        filter: JSON.stringify(query),
      });
      return request(`/entities/${name}?${qs.toString()}`);
    },
    async get(id) {
      const results = await request(`/entities/${name}?${new URLSearchParams({
        filter: JSON.stringify({ _id: id }),
        limit: '1',
      })}`);
      return results[0] || null;
    },
    async create(data) {
      return request(`/entities/${name}`, { method: 'POST', body: data });
    },
    async update(id, data) {
      return request(`/entities/${name}/${id}`, { method: 'PUT', body: data });
    },
    async delete(id) {
      return request(`/entities/${name}/${id}`, { method: 'DELETE' });
    },
    // Real-time subscriptions aren't provided by the plain REST API -- this
    // lightweight polling shim keeps existing components (chat, showroom,
    // etc.) working unchanged. Swap for a WebSocket/SSE feed if you need
    // sub-second updates.
    subscribe(callback, { intervalMs = 4000 } = {}) {
      const interval = setInterval(() => {
        callback({ data: {} }); // components re-fetch on any event
      }, intervalMs);
      return () => clearInterval(interval);
    },
  };
}

const entities = ENTITY_NAMES.reduce((acc, name) => {
  acc[name] = buildEntityApi(name);
  return acc;
}, {});

const auth = {
  async me() {
    return request('/auth/me');
  },
  async updateMe(data) {
    return request('/auth/me', { method: 'PUT', body: data });
  },
  async register({ email, password }) {
    return request('/auth/register', { method: 'POST', body: { email, password } });
  },
  async verifyOtp({ email, otpCode }) {
    const result = await request('/auth/verify-otp', { method: 'POST', body: { email, otpCode } });
    if (result?.access_token) setToken(result.access_token);
    return result;
  },
  async resendOtp(email) {
    return request('/auth/resend-otp', { method: 'POST', body: { email } });
  },
  async loginViaEmailPassword(email, password) {
    const result = await request('/auth/login', { method: 'POST', body: { email, password } });
    if (result?.access_token) setToken(result.access_token);
    return result;
  },
  async loginWithGoogle(credential) {
    const result = await request('/auth/google', { method: 'POST', body: { credential } });
    if (result?.access_token) setToken(result.access_token);
    return result;
  },
  async resetPasswordRequest(email) {
    return request('/auth/reset-password-request', { method: 'POST', body: { email } });
  },
  async resetPassword({ resetToken, newPassword }) {
    return request('/auth/reset-password', { method: 'POST', body: { token: resetToken, password: newPassword } });
  },
  setToken(token) {
    setToken(token);
  },
  getToken,
  logout(redirectTo) {
    setToken(null);
    if (redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
  },
  redirectToLogin(redirectTo) {
    if (typeof window !== 'undefined') {
      const back = encodeURIComponent(redirectTo || window.location.href);
      window.location.href = `/login?redirect=${back}`;
    }
  },
};

const integrations = {
  Core: {
    async UploadFile({ file }) {
      const formData = new FormData();
      formData.append('file', file);
      return request('/upload', { method: 'POST', body: formData, isFormData: true });
    },
    async SendEmail({ to, subject, body, html }) {
      return request('/email/send', { method: 'POST', body: { to, subject, body, html } });
    },
  },
};

export const base44 = { auth, entities, integrations };
