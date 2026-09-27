// @ts-nocheck
// Thin fetch wrapper: adds the base URL, JSON headers, and the bearer token.
// VITE_API_URL lets you point the frontend at a separately-hosted API. The
// A blank base uses the Vite proxy locally and the Vercel rewrite in production.
const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalDev = !currentHost || currentHost === 'localhost' || currentHost === '127.0.0.1';
const configuredApiBase = import.meta.env.VITE_API_URL?.trim() || '';

function normalizeApiBase(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return value.replace(/\/$/, '').replace(/\/api$/, '');
  } catch {
    return '';
  }
}

const API_BASE = normalizeApiBase(configuredApiBase);

const TOKEN_KEY = 'rentalls_access_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore (e.g. private browsing) */
  }
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function describeNetworkFailure() {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalDev = !currentHost || currentHost === 'localhost' || currentHost === '127.0.0.1';

  if (isLocalDev) {
    return 'The backend is unavailable. Start the API server and make sure it is running on localhost:8787 or the configured VITE_API_URL.';
  }

  return 'Unable to reach the backend API. Check the server status and verify the frontend API rewrite or configured VITE_API_URL.';
}

export async function request(path, { method = 'GET', body, headers = {}, isFormData = false } = {}) {
  const token = getToken();
  const finalHeaders = { ...headers };
  if (!isFormData) finalHeaders['Content-Type'] = 'application/json';
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}/api${path}`, {
      method,
      headers: finalHeaders,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });

    let data = null;
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok) {
      const message = (data && data.error) || `Request failed with status ${res.status}`;
      throw new ApiError(message, res.status, data);
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    const message = error && error.message === 'Failed to fetch'
      ? describeNetworkFailure()
      : (error && error.message) || 'Request failed';

    throw new ApiError(message, 0, { cause: 'network' });
  }
}

export { ApiError };
