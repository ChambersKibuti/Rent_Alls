// Thin wrapper around Google Identity Services (loaded via the <script>
// tag in index.html). Keeps the rest of the app from needing to know
// anything about Google's global `window.google` API.
let initialized = false;
let pendingResolve = null;
let pendingReject = null;

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function isGoogleSignInConfigured() {
  return Boolean(CLIENT_ID);
}

function ensureInitialized() {
  if (initialized) return;
  window.google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (response) => {
      if (pendingResolve) pendingResolve(response.credential);
      pendingResolve = null;
      pendingReject = null;
    },
  });
  initialized = true;
}

// Opens the Google account picker and resolves with the ID token
// ("credential") once the user picks an account -- or rejects if it's
// not configured, hasn't loaded yet, or the user dismisses it.
export function promptGoogleSignIn() {
  return new Promise((resolve, reject) => {
    if (!CLIENT_ID) {
      reject(new Error('Google sign-in is not set up yet (missing VITE_GOOGLE_CLIENT_ID).'));
      return;
    }
    if (!window.google?.accounts?.id) {
      reject(new Error('Google sign-in is still loading -- please try again in a moment.'));
      return;
    }

    ensureInitialized();
    pendingResolve = resolve;
    pendingReject = reject;

    window.google.accounts.id.prompt((notification) => {
      const dismissed =
        notification.isNotDisplayed?.() || notification.isSkippedMoment?.();
      if (dismissed && pendingReject) {
        pendingReject(new Error('Google sign-in was cancelled.'));
        pendingResolve = null;
        pendingReject = null;
      }
    });
  });
}
