# RentAlls — Frontend

Vite + React app. Talks to the `backend/` project over HTTP through the
`base44`-compatible client shim in `src/api/`.

## Setup

```bash
npm install
cp .env.example .env
# leave VITE_API_URL blank to use the Vite proxy below
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
3. Leave `VITE_API_URL` unset. `vercel.json` forwards `/api/*` to the
   backend using a same-origin rewrite, avoiding browser CORS restrictions.
4. Deploy. `vercel.json` also rewrites app routes to `index.html` so React
   Router's client-side routing works on refresh/deep links.

### Any static host

`npm run build` produces a plain static `dist/` folder — deployable to
Netlify, Cloudflare Pages, S3+CloudFront, GitHub Pages, etc. Make sure your
host rewrites app routes to `index.html` and proxies `/api/*` to the backend,
or set `VITE_API_URL` at build time and configure backend CORS for that host.

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
