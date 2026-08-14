# RentAlls

An on-demand asset rental marketplace, rebuilt from the original base44
export into two independent, separately-deployable projects:

- **`frontend/`** — Vite + React app (talks to the backend over HTTP)
- **`backend/`** — Express API + MongoDB Atlas (deployable as Vercel
  serverless functions, or as a standalone Node service anywhere else)

Each folder is a self-contained project with its own `package.json`,
`.env.example`, `vercel.json`, and `README.md` — deploy them as two
separate Vercel projects (or host the backend elsewhere entirely) and
point the frontend's `VITE_API_URL` at wherever the backend lives.

No base44 account, SDK, or plugin is required anywhere in this codebase.

## Quick start

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env        # set MONGODB_URI, JWT_SECRET
npm run seed                # creates first admin user
npm run dev                 # http://localhost:8787

# 2. Frontend (new terminal)
cd frontend
npm install
cp .env.example .env        # leave VITE_API_URL blank for local dev
npm run dev                 # http://localhost:5173
```

Open `http://localhost:5173` — the Vite dev server proxies `/api/*` to
the backend automatically.

## Full tree

```
.
├── README.md                      <- you are here
│
├── backend/
│   ├── README.md                   Backend-specific setup & deploy docs
│   ├── package.json                 express, mongoose, jsonwebtoken, ...
│   ├── vercel.json                   Routes everything to api/index.js
│   ├── .env.example                   MONGODB_URI, JWT_SECRET, CORS_ORIGIN, SMTP_*
│   ├── .gitignore
│   ├── api/
│   │   └── index.js                Vercel serverless entry (wraps src/app.js)
│   └── src/
│       ├── app.js                  Express app: CORS, JSON body, DB middleware, route mounting
│       ├── server.js                Standalone entry point (npm run dev / start)
│       ├── seed.js                   One-off script: first admin user + default PlatformConfig
│       ├── lib/
│       │   ├── auth.js              JWT sign/verify, password hashing, requireAuth middleware
│       │   ├── db.js                 Cached MongoDB Atlas connection (mongoose)
│       │   ├── entityModels.js       Maps entity name -> Mongoose model
│       │   ├── entityRules.js        Simplified per-entity access rules (read/write policy)
│       │   └── mailer.js             SMTP via nodemailer, console-log fallback
│       ├── models/                   One Mongoose schema per base44 entity
│       │   ├── ChatMessage.js
│       │   ├── Client.js
│       │   ├── Concern.js
│       │   ├── Notice.js
│       │   ├── Payment.js
│       │   ├── PlatformConfig.js
│       │   ├── Product.js
│       │   ├── Rating.js
│       │   ├── Seller.js
│       │   ├── Showroom.js
│       │   ├── ShowroomMessage.js
│       │   └── User.js               Extended with auth fields (password_hash, OTP, etc.)
│       └── routes/
│           ├── auth.js               register / verify-otp / login / me / password reset
│           ├── entities.js            Generic CRUD for all entities (list/filter/create/update/delete)
│           ├── upload.js              multipart file upload -> base64 data URL
│           └── email.js                Send email (used by integrations.Core.SendEmail)
│
└── frontend/
    ├── README.md                    Frontend-specific setup & deploy docs
    ├── package.json                  react, react-router-dom, tailwind, radix-ui, ...
    ├── vite.config.js                 @ alias, /api dev proxy -> localhost:8787
    ├── vercel.json                     SPA rewrite (all routes -> index.html)
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── jsconfig.json
    ├── components.json                shadcn/ui config
    ├── eslint.config.js
    ├── .env.example                    VITE_API_URL
    ├── .gitignore
    ├── index.html
    ├── public/
    │   └── vite.svg
    └── src/
        ├── main.jsx                   React root
        ├── App.jsx                     Routes (react-router-dom)
        ├── index.css                    Tailwind base + design tokens
        ├── api/
        │   ├── base44Client.js         base44-SDK-compatible client shim -> backend HTTP API
        │   └── httpClient.js            fetch wrapper: base URL, JSON headers, bearer token
        ├── lib/
        │   ├── AuthContext.jsx          Auth state (user, isAuthenticated, login/logout)
        │   ├── constants.js              CONTACT, MAP_DEFAULTS, PLAN_FEES, LEAFLET_ICON_CONFIG
        │   ├── PageNotFound.jsx
        │   ├── query-client.js           @tanstack/react-query client
        │   ├── subscriptionUtils.js       Seller subscription/rebate calculations
        │   └── utils.js                    cn() className helper
        ├── hooks/
        │   └── use-mobile.jsx
        ├── components/
        │   ├── AuthLayout.jsx, Header.jsx, Footer.jsx, PageLayout.jsx, CommandBar.jsx, ...
        │   ├── ProductCard.jsx, ProductMap.jsx, LocationMap.jsx, RatingModal.jsx, RatingStars.jsx
        │   ├── ChatSidebar.jsx, SellerChat.jsx, NoticeTicker.jsx, ProtectedRoute.jsx, ...
        │   ├── admin/
        │   │   ├── AdminLayout.jsx
        │   │   ├── ProductsTab.jsx
        │   │   ├── SellersTab.jsx
        │   │   ├── PaymentsTab.jsx
        │   │   └── PlatformConfigTab.jsx
        │   ├── showroom/
        │   │   ├── VideoStage.jsx
        │   │   ├── CommentStream.jsx
        │   │   ├── ReactionBar.jsx
        │   │   ├── FloatingReactions.jsx
        │   │   └── SpeakRequestPanel.jsx
        │   └── ui/                        shadcn/ui-style primitives (button, dialog, table, ...)
        └── pages/
            ├── Home.jsx, Products.jsx, ProductDetail.jsx, Profile.jsx
            ├── Login.jsx, Register.jsx, BuyerRegister.jsx, SellerRegister.jsx
            ├── ForgotPassword.jsx, ResetPassword.jsx
            ├── SellerDashboard.jsx, AdminBackend.jsx
            ├── Showroom.jsx, ShowroomRoom.jsx
            └── Privacy.jsx, Terms.jsx
```

## What changed from the base44 export

- `frontend/src/api/base44Client.js` is a lightweight shim with the same
  interface (`base44.auth.*`, `base44.entities.<Entity>.*`,
  `base44.integrations.Core.*`) but talks to the backend's REST API
  instead of base44's hosted backend — kept ~90 components unmodified.
- `frontend/src/lib/AuthContext.jsx` was rewritten to drop the
  base44-SDK-specific axios client.
- Entity schemas (`base44/entities/*.jsonc` in the original export) became
  Mongoose models in `backend/src/models/`.
- Each entity's original row-level-security rules were re-implemented as
  a simplified access layer in `backend/src/lib/entityRules.js` +
  `backend/src/routes/entities.js`.
- Real-time features (`.subscribe()` in chat/showroom) poll every few
  seconds instead of push-based events, since a plain REST API has no
  live channel.
- File uploads return a base64 data URL by default (zero external config
  to get started) — swap in S3/Vercel Blob/Cloudinary for production.
- Removed the `@base44/sdk` and `@base44/vite-plugin` dependencies.
- Renamed the product from **RentAll** to **RentAlls**.
- Added a custom favicon/logo mark (`frontend/public/favicon.svg`) and
  the hero background image is now a locally-served asset instead of
  hotlinked to base44's CDN.
- Added real Google Sign-In: `POST /api/auth/google` on the backend
  (verifies Google ID tokens server-side) plus Google Identity Services
  on the frontend (`frontend/src/lib/googleAuth.js`).
- **Bug fixes found while wiring up Google sign-in** (pre-existing in
  the original export, not introduced by the rebuild):
  - `Login.jsx` called `base44.auth.loginViaEmailPassword(email, password)`,
    a method name/signature the client shim didn't have — fixed by
    renaming the shim method to match.
  - `ResetPassword.jsx` called `resetPassword({ resetToken, newPassword })`
    but the shim expected `{ token, password }` — field names now match.
  - `App.jsx` had a global auth check that redirected the *entire app*
    to `/login` whenever the stored token was stale/expired or missing
    — including the Home page. Removed; each component now handles its
    own auth state (as most already did), so Home reliably works as the
    landing page regardless of token state.
- **Converted the theme from dark to light.** Two layers changed:
  1. `frontend/src/index.css` — the shadcn/ui CSS custom properties
     (`--background`, `--foreground`, `--card`, `--border`, etc.) were
     flipped to light HSL values. This alone re-themes every
     `components/ui/*` primitive (buttons, dialogs, inputs, tables, ...)
     since they're all built on these semantic tokens.
  2. ~32 page/component files hardcoded literal dark colors directly
     (`bg-[#0A0A0B]`, `text-white`, `text-zinc-400`, `border-white/10`,
     etc.) instead of using the semantic tokens — these needed a
     systematic find-and-replace with a brightness-ladder mapping (e.g.
     `text-white`→`text-zinc-900`, `text-zinc-400`↔`text-zinc-600`) to
     flip consistently. Brand accent colors (`#2E5BFF` blue, `#00E676`
     green, `#FF9800` orange, WhatsApp green) were left untouched
     everywhere — those aren't theme-dependent.
  3. **Found and fixed 6 contrast bugs** the mechanical pass introduced
     — cases where `text-white` had two different jobs (primary text on
     the dark page, *and* white text on a solid colored button/badge)
     and the blanket rule only handled the first correctly: solid blue
     buttons, the Live badge and viewer count on `VideoStage.jsx`, and
     the image remove-buttons in `ProductsTab.jsx`/`SellerDashboard.jsx`
     all had their text reverted back to white where it sits on a
     saturated background instead of the page itself.
  - Files changed: `index.css`; `components/{ChatSidebar,CommandBar,
    Footer,Header,LocationMap,NoticeTicker,PageLayout,ProductCard,
    ProductMap,RatingModal,RatingStars,SellerChat}.jsx`;
    `components/admin/{AdminLayout,PaymentsTab,PlatformConfigTab,
    ProductsTab,SellersTab}.jsx`; `components/showroom/{CommentStream,
    ReactionBar,SpeakRequestPanel,VideoStage}.jsx`; `pages/{AdminBackend,
    Home,Privacy,ProductDetail,Products,Profile,SellerDashboard,
    SellerRegister,Showroom,ShowroomRoom,Terms}.jsx`.
  - Left unchanged on purpose: `UserNotRegisteredError.jsx`,
    `PageNotFound.jsx`, and `ProtectedRoute.jsx`'s spinner were already
    light-styled (`slate-*` classes) — they now match the rest of the
    app automatically. Modal/drawer backdrop dimmers and image scrims
    (`bg-black/50`–`/80`) were left as-is; that convention is correct
    in either theme.

## Known limitations / suggested next steps

- **Google Sign-In** is fully wired up (backend verifies real Google ID
  tokens, frontend uses Google Identity Services) but needs your own
  OAuth credentials to activate:
  1. Go to [Google Cloud Console](https://console.cloud.google.com/) →
     APIs & Services → Credentials → **Create Credentials** → OAuth
     client ID → Application type: **Web application**.
  2. Under **Authorized JavaScript origins**, add
     `http://localhost:5173` (local dev) and your production frontend
     URL (e.g. `https://rentalls.vercel.app`).
  3. Copy the generated Client ID into **both**:
     - `backend/.env` → `GOOGLE_CLIENT_ID=...`
     - `frontend/.env` → `VITE_GOOGLE_CLIENT_ID=...` (same value)
  4. Restart both dev servers (or redeploy). The "Continue with Google"
     button on Login and Buyer Registration only renders once
     `VITE_GOOGLE_CLIENT_ID` is set — it's hidden entirely otherwise, so
     nothing breaks if you skip this.
- **Seed data**: `npm run seed` (in `backend/`) also creates a starter
  `Notice` record so the announcement banner isn't empty on first
  deploy — edit or add more from `/admin` → Notices once you're logged
  in as the seeded admin.
- **Real-time chat/showroom** polls (~4s) instead of pushing. For true
  real-time, add Socket.IO/Pusher/Ably.
- **File uploads** are base64-in-Mongo by default — fine to start, but
  move to object storage before accepting large files at scale.
- **Payments**: records are tracked but no live payment gateway is
  integrated — hook one up where `Payment.create()` is called in
  `frontend/src/pages/ProductDetail.jsx`.
- Review `backend/src/lib/entityRules.js` against your actual security
  requirements before handling real user data — it approximates the
  original base44 RLS policies, not a full policy engine.

## Deploy checklist (read this before opening a support ticket)

Two Vercel projects, two `vercel.json` files — mixing them up is the most
common source of deploy errors here. Before deploying either project:

1. **Root Directory is set correctly.** Project → Settings → General →
   Root Directory should be `frontend` for the frontend project and
   `backend` for the backend project — never blank/repo-root, since
   there's no `vercel.json`/`package.json` pair at the repo root.
2. **`vercel.json` has no stray fields.** It should contain *only*
   what's shown in the tree below — nothing copied in from
   `package.json` (`"private"`, `"dependencies"`, etc. don't belong in
   `vercel.json`, and Vercel's schema validator will reject the deploy
   if they're present).
3. **Every env var in `.env.example` is set** in the Vercel dashboard
   for that project (Project → Settings → Environment Variables) — a
   missing `MONGODB_URI` won't fail the *build*, it'll fail every API
   request at runtime instead. Check `GET /api/health` first (works
   even with no DB configured) — if that 200s but everything else
   500s, it's an env var, not a code, problem.
4. **`CORS_ORIGIN` on the backend** matches the frontend's actual
   deployed URL once you're past local dev, or every request will be
   blocked by the browser with a CORS error, not a Vercel error.
5. **`VITE_API_URL` on the frontend** points at the backend's actual
   deployed URL for production builds (blank is only correct for local
   dev, where the Vite proxy handles it).

## Performance notes

- MongoDB connections are cached across warm serverless invocations
  (`backend/src/lib/db.js`).
- List endpoints cap `limit` at 500, default 200.
- Add MongoDB indexes for frequently filtered fields once you have real
  traffic — e.g. `Product.seller_id`, `Payment.created_by_id`,
  `ChatMessage.product_id`, `Seller.created_by_id`.
- Consider `React.lazy()` around heavy routes (Showroom, Admin) if
  frontend bundle size becomes a concern as the app grows.
