# RentAlls — Backend

Express API backed by MongoDB Atlas. Deployable standalone (Vercel
serverless, Render, Railway, a plain VM — anything that runs Node) and
consumed by the `frontend/` project over HTTP.

## Setup

```bash
npm install
cp .env.example .env
# edit .env: set MONGODB_URI and JWT_SECRET at minimum
```

Create the first admin account and default platform config:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=changeme npm run seed
```

Run locally:

```bash
npm run dev
```

API listens on `http://localhost:8787` by default (`PORT` in `.env`).
Health check: `GET http://localhost:8787/api/health`.

## Deploying

### Option A — Vercel (serverless)

1. Push this `backend/` folder as its own repo (or a subdirectory with
   Vercel's "Root Directory" project setting pointed at it).
2. Import into Vercel. `vercel.json` routes every `/api/*` request to
   `api/index.js`, which wraps the Express app.
3. Set environment variables in the Vercel project (everything in
   `.env.example`), especially `MONGODB_URI`, `JWT_SECRET`, and
   `CORS_ORIGIN` (your deployed frontend's URL).
4. Deploy, then run `npm run seed` once (locally, pointed at the
   production `MONGODB_URI`) to create your first admin.

### Option B — Render / Railway / a VM

Any standard Node host works — the app doesn't require Vercel's
serverless runtime:

```bash
npm install
npm start   # runs src/server.js, an ordinary Express listener
```

Set the same environment variables from `.env.example` in your host's
dashboard.

## Structure

```
backend/
├── api/
│   └── index.js       # Vercel serverless entry point (wraps src/app.js)
├── src/
│   ├── app.js           # Express app: middleware + route mounting
│   ├── server.js        # Standalone entry point (npm run dev / start)
│   ├── seed.js           # Creates first admin user + default PlatformConfig
│   ├── models/            # Mongoose schemas (one per entity)
│   ├── routes/             # auth, entities (generic CRUD), upload, email
│   └── lib/                 # db connection, JWT/auth helpers, access rules
├── package.json
├── vercel.json
└── .env.example
```

## API surface

| Route                              | Notes                                   |
|-------------------------------------|-------------------------------------------|
| `POST /api/auth/register`            | Starts email+OTP verification           |
| `POST /api/auth/verify-otp`          | Verifies OTP, returns a JWT             |
| `POST /api/auth/resend-otp`          |                                          |
| `POST /api/auth/login`               | Returns a JWT                           |
| `GET  /api/auth/me`                  | Requires `Authorization: Bearer <token>`|
| `PUT  /api/auth/me`                  | Update own profile                      |
| `POST /api/auth/reset-password-request` |                                       |
| `POST /api/auth/reset-password`      |                                          |
| `GET  /api/entities/:entity`         | List/filter (`?filter=`, `?sort=`, `?limit=`) |
| `POST /api/entities/:entity`         | Create (auth required)                  |
| `PUT  /api/entities/:entity/:id`     | Update (owner or admin)                 |
| `DELETE /api/entities/:entity/:id`   | Delete (owner or admin)                 |
| `POST /api/upload`                   | multipart file upload -> `{ file_url }` |
| `POST /api/email/send`               | Send an email (SMTP or console fallback)|

`:entity` is one of `ChatMessage, Client, Concern, Notice, Payment,
PlatformConfig, Product, Rating, Seller, Showroom, ShowroomMessage`.

See the top-level `README.md` for known limitations and suggested next
steps (real-time, payments, object storage, Google sign-in).
