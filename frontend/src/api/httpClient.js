// @ts-nocheck
// Thin fetch wrapper: adds the base URL, JSON headers, and the bearer token.
// VITE_API_URL lets you point the frontend at a separately-hosted API;
// leave it unset when the API is deployed on the same Vercel project
// (requests then go to the relative "/api/..." path).
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '').replace(/\/api$/, '');

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

  if (!API_BASE && !isLocalDev) {
    return 'The API backend is not configured for this deployment. Set VITE_API_URL to your backend URL in the app environment.';
  }

  if (isLocalDev) {
    return 'The backend is unavailable. Start the API server and make sure it is running on localhost:8787 or the configured VITE_API_URL.';
  }

  return 'Unable to reach the backend API. Check the server status and verify the configured API URL.';
}

export async function request(path, { method = 'GET', body, headers = {}, isFormData = false } = {}) {
  const token = getToken();
  const finalHeaders = { ...headers };
  if (!isFormData) finalHeaders['Content-Type'] = 'application/json';
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalDev = !currentHost || currentHost === 'localhost' || currentHost === '127.0.0.1';
  if (!API_BASE && !isLocalDev) {
    throw new ApiError(describeNetworkFailure(), 0, { cause: 'missing_api_url' });
  }

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
