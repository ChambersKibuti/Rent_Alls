# Vercel Deployment Setup

This project uses a **split deployment model**: frontend and backend are separate Vercel projects.

## Frontend Project Setup

**Project Root:** `frontend/`

### Environment Variables (Vercel Dashboard → Settings → Environment Variables)

Set these for the **Production** environment:

```
VITE_API_URL=https://your-backend-project.vercel.app
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

**Important:** Replace `https://your-backend-project.vercel.app` with your actual deployed backend URL.

- **Local dev** (.env file): `VITE_API_URL=""` (empty) — the Vite proxy to localhost:8787 handles routing
- **Production** (Vercel env vars): `VITE_API_URL="https://your-backend.vercel.app"` — the frontend calls the deployed backend directly

### Why the blank page fix was needed

The original `.env` hardcoded `VITE_API_URL="http://localhost:8787"`, which doesn't exist in production:
- Frontend loads the page
- AuthContext tries to call `/api/auth/me` 
- That call fails because `http://localhost:8787` is unreachable from the browser
- App breaks or goes blank

**Fix:** Clear `.env` to use relative paths locally, and set the real backend URL in Vercel env vars for production.

---

## Backend Project Setup

**Project Root:** `backend/`

### Environment Variables (Vercel Dashboard → Settings → Environment Variables)

Set these for the **Production** environment:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rentalls
JWT_SECRET=your-secret-key-at-least-32-chars
APP_URL=https://your-backend-project.vercel.app
CORS_ORIGIN=https://your-frontend-project.vercel.app
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Additional Setup

1. **MongoDB Atlas Network Access:**
   - Go to MongoDB Atlas → Network Access
   - Add the Vercel deployment IP (or use `0.0.0.0/0` temporarily during testing)
   - Ensure your connection string has `retryWrites=true` for reliability

2. **CORS Configuration:**
   - The backend uses the `CORS_ORIGIN` env var to allow requests from the frontend
   - Make sure it's set to your frontend's Vercel URL

---

## Deployment Checklist

- [ ] Create **Backend** Vercel project (root: `backend/`)
- [ ] Set backend env vars in Vercel
- [ ] Deploy backend and verify `/api/health` responds with `{"status":"ok"}`
- [ ] Create **Frontend** Vercel project (root: `frontend/`)
- [ ] Set `VITE_API_URL` to the deployed backend URL in frontend Vercel env vars
- [ ] Deploy frontend
- [ ] Test: open frontend URL and verify pages load without going blank
- [ ] Test: try login/register flows to confirm API communication works

---

## Troubleshooting

**Frontend goes blank after loading:**
- Check Vercel frontend project env vars — `VITE_API_URL` must be set to the deployed backend URL
- Check browser console for CORS errors
- Verify backend is deployed and `/api/health` returns a 200 response

**Auth/API calls fail:**
- Check backend Vercel logs for errors
- Verify MongoDB connection: check `MONGODB_URI` is correct and IP is whitelisted in Atlas
- Check `CORS_ORIGIN` includes the frontend URL

**Build fails:**
- Backend: ensure `backend/api/index.js` exists and `package.json` has a build script
- Frontend: ensure `frontend/package.json` has a build script and `vite.config.js` is correct
