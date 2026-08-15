// @ts-nocheck
// Thin fetch wrapper: adds the base URL, JSON headers, and the bearer token.
// VITE_API_URL lets you point the frontend at a separately-hosted API;
// leave it unset when the API is deployed on the same Vercel project
// (requests then go to the relative "/api/..." path).
const API_BASE = import.meta.env.VITE_API_URL || '';

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

export async function request(path, { method = 'GET', body, headers = {}, isFormData = false } = {}) {
  const token = getToken();
  const finalHeaders = { ...headers };
  if (!isFormData) finalHeaders['Content-Type'] = 'application/json';
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`;

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
}

export { ApiError };
