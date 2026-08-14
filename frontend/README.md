# RentAlls — Frontend

Vite + React app. Talks to the `backend/` project over HTTP through the
`base44`-compatible client shim in `src/api/`.

## Setup

```bash
npm install
cp .env.example .env
# leave VITE_API_URL blank for local dev (uses the Vite proxy below);
# set it to your deployed backend's URL for production builds
```

## Run locally

Start the backend first (in the sibling `backend/` project):

```bash
cd ../backend && npm run dev   # http://localhost:8787
```

Then, in this folder:

```bash
npm run dev   # http://localhost:5173
```

`vite.config.js` proxies `/api/*` requests to `http://localhost:8787`
automatically, so the frontend doesn't need `VITE_API_URL` set locally.

## Build

```bash
npm run build     # outputs to dist/
npm run preview   # serve the production build locally
```

## Deploying

### Vercel (recommended)

1. Push this `frontend/` folder as its own repo (or point Vercel's "Root
   Directory" setting at it in a monorepo).
2. Import into Vercel — it auto-detects the Vite framework.
3. Set `VITE_API_URL` in the project's environment variables to your
   deployed backend's URL, e.g. `https://rentalls-api.vercel.app`.
4. Deploy. `vercel.json` rewrites all routes to `index.html` so
   React Router's client-side routing works on refresh/deep links.

### Any static host

`npm run build` produces a plain static `dist/` folder — deployable to
Netlify, Cloudflare Pages, S3+CloudFront, GitHub Pages, etc. Just make
sure your host rewrites unknown paths to `index.html` (SPA fallback) and
that `VITE_API_URL` was set at build time.

## Structure

```
frontend/
├── public/
├── src/
│   ├── api/               # base44-compatible client shim -> backend HTTP API
│   │   ├── base44Client.js
│   │   └── httpClient.js
│   ├── components/
│   │   ├── admin/
│   │   ├── showroom/
│   │   └── ui/              # shadcn/ui-style primitives
│   ├── hooks/
│   ├── lib/                  # AuthContext, utils, constants
│   ├── pages/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
├── vercel.json
└── .env.example
```

See the top-level `README.md` for the full picture (both projects
together) and known limitations.
