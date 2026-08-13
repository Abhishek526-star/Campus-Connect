# Campus Connect 🎓

**Connect. Learn. Give Back. Grow Together.**

A production-ready, full-stack MERN alumni–student community platform — a unified digital
community connecting **students, faculty, alumni, and administrators** for networking,
mentorship, scholarships, events (with QR attendance), jobs & internships, study
resources, and real-time communication.

> Built page-by-page from a 52-section specification. See
> `DEVELOPMENT_ROADMAP.md` for the architecture, database schema, and build history,
> and `docs/API.md` for the complete API reference.

---

## ✨ Features

- **Authentication & roles** — JWT access tokens + rotating httpOnly refresh tokens,
  email verification, password reset, admin approval for faculty/alumni registrations,
  granular RBAC enforced on both frontend and backend (spec §3, §21)
- **Profiles & privacy** — detailed role-specific profiles (education, experience,
  achievements, projects, certifications, social links), avatar upload, per-field
  privacy tiers (public / connections / private) enforced server-side (spec §4, §41)
- **People & connections** — searchable directory with filters, full connection
  lifecycle (send/accept/reject/cancel/remove), suggestions (spec §6)
- **Real-time chat** — Socket.IO one-to-one messaging: presence, typing indicators,
  read receipts, attachments, delete-for-self, block/report (spec §7)
- **Meetings** — schedule one-on-one/group meetings with Google Meet/Zoom links,
  invitations with accept/reject, reschedule, reminders (spec §8)
- **Events + QR attendance** — events with registration + capacity/deadline guards;
  rotating expiring QR tokens, camera scanning, duplicate prevention, manual marking,
  CSV/Excel/PDF export (spec §9, §10)
- **Scholarships + donations** — campaigns, student applications with documents,
  full review state machine, transparent funding dashboards, Razorpay test-mode
  payments with HMAC + webhook verification and PDF receipts (spec §11, §12, §13)
- **Jobs & internships** — opportunity board with filters, save/share/apply
  (platform or external), reports, admin moderation (spec §14)
- **Study resources** — GATE / Semester / Placement / Development library with
  ratings, bookmarks, downloads, admin approval (spec §15)
- **Community + announcements** — posts with likes/comments/shares/saves/reports,
  rich composer, audience-targeted announcements with auto-notifications (spec §16, §17)
- **Notifications** — 25 types, in-app real-time + email, mark read/all, badges (spec §18)
- **Global search** — aggregated across 7 entity types with type scoping (spec §19)
- **Mentorship + referrals + certificates** — mentor directory, referral offers,
  QR-verifiable participation certificates (spec §29)
- **Career roadmaps + placement prep** — 9 seeded roadmaps, placement hub (spec §29)
- **Admin suite** — KPI dashboard with 6 charts, user management, content
  moderation, finance view, 9 exportable reports, audit logs, system settings
  (spec §20, §39, §40)
- **Role-scoped analytics** (spec §30) · **40 automated tests** (spec §44)

## 🧱 Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19 · Vite 8 · Tailwind CSS 4 · React Router 8 · Redux Toolkit + RTK Query · React Hook Form + Zod · Recharts · Lucide · Socket.IO client · Sonner · html5-qrcode |
| Backend | Node.js · Express 5 · MongoDB + Mongoose 9 · JWT (access + rotating refresh) · bcryptjs · Socket.IO · Multer + Cloudinary · Razorpay · Nodemailer · Helmet · CORS · express-rate-limit · compression |
| Testing | Vitest + Supertest (40 tests) |
| Deploy | Client → Vercel/Netlify · API → Render/Railway/AWS · DB → MongoDB Atlas · Files → Cloudinary |

## 🏗️ Architecture

```
React SPA (RTK Query + Socket.IO client)
        │ REST /api  ·  WS /socket.io (Vite dev proxy or Vercel rewrites)
        ▼
Express API (routes → validators(Zod) → controllers → services → models)
        │  middleware: auth · rbac · validate · rate-limit · sanitize · upload · errorHandler
        ▼
MongoDB (34 collections) · Cloudinary (files) · Razorpay (payments) · SMTP (email)
```

## 🚀 Getting Started

```bash
# 1. Install all workspace dependencies (client + server)
npm install

# 2. Create the server environment file and fill in values
cp .env.example server/.env

# 3. Run both servers in development
npm run dev
```

- API server → http://localhost:5000 (health check: `/api/health`)
- Web app → http://localhost:5173

### Scripts

| Script | Description |
|---|---|
| `npm run dev` | API server + web app concurrently |
| `npm run dev:server` / `npm run dev:client` | Individually |
| `npm run build` | Production build of the web app |
| `npm run start` | Start the API server (production) |
| `npm run seed` | Seed the database (add `-- --force` to reset) |
| `npm run test` | Run the automated test suite (Vitest) |
| `npm run lint` / `npm run format` | ESLint / Prettier |

## 🔐 Environment Variables

See `.env.example` (server side) — copy to `server/.env`. Key groups:

| Group | Variables |
|---|---|
| App | `PORT`, `CLIENT_URL`, `NODE_ENV` |
| Database | `MONGO_URI` (local or Atlas) |
| Auth | `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` |
| Google | `GOOGLE_CLIENT_ID` (server) + `VITE_GOOGLE_CLIENT_ID` (client) |
| Files | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Payments | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| Email | `SMTP_USER`, `SMTP_PASSWORD` — Gmail auto-configures the rest |

### MongoDB setup
- Local: install MongoDB, then `MONGO_URI=mongodb://127.0.0.1:27017/campus_connect`
- Atlas: create a free cluster → Database Access user → Network Access (allow your IP
  or `0.0.0.0/0` for Render) → connection string as `MONGO_URI`

### Cloudinary setup
1. Create a free account at cloudinary.com → Dashboard shows your Cloud Name, API Key, API Secret.
2. Set the three variables. Without them, uploads fall back to local disk (`server/uploads/`).

### Razorpay setup (test mode)
1. Create an account at razorpay.com → Dashboard → Settings → API Keys → **Test Mode**.
2. Set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
3. Webhooks (production): add `https://your-api.example.com/api/donations/webhook` with
   events `payment.captured`, `payment.failed`, `refund.processed`; copy the webhook
   secret into `RAZORPAY_WEBHOOK_SECRET`.
4. Test card: `4111 1111 1111 1111`, any future expiry, any CVV.

### Google sign-in (Gmail direct login)
1. Google Cloud Console → **APIs & Services → Credentials → Create credentials → OAuth client ID** (type: Web application).
2. **Authorized JavaScript origins**: `http://localhost:5173` (dev) and your production origin. (No redirect URI is needed — the popup flow verifies the ID token server-side.)
3. Put the client ID in **both** `server/.env` (`GOOGLE_CLIENT_ID`) and `client/.env` (`VITE_GOOGLE_CLIENT_ID` — copy `client/.env.example`).
4. Restart both servers. The login page shows **"Continue with Google"**; new Gmail users get a verified, auto-approved student account (Google already verified the email) and receive a welcome email — the role profile is created when they complete their profile.

### Email setup — Gmail only (no Twilio/Brevo/SendGrid)
1. Enable **2-Step Verification** on the Gmail account → Google Account → Security → **App passwords** → generate one (16 chars).
2. Set just two variables in `server/.env` — Gmail SMTP is auto-configured when the user is a `@gmail.com` address:
   ```
   SMTP_USER=yourname@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   ```
3. All transactional mail (verification links, welcome, password reset, receipts) is sent through `smtp.gmail.com:587` from that address. Without credentials, emails are logged to the server console in development (tokens appear as links) so flows remain testable.

## 🌱 Seeding

```bash
npm run seed            # idempotent — skips if data exists
npm run seed -- --force # wipes and re-seeds
```

Seeds: **1 admin · 5 faculty · 15 alumni · 30 students**, 7 events, 2 meetings,
4 scholarship campaigns (+6 paid donations), 5 opportunities, 6 resources,
6 community posts, 4 announcements, 7 connections, 1 demo conversation,
9 career roadmaps.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@campus.edu` | `Admin@123` |
| Faculty | `faculty1@campus.edu` | `Faculty@123` |
| Alumni | `alumni1@campus.edu` | `Alumni@123` |
| Student | `student1@campus.edu` | `Student@123` |

## 📚 API Documentation

Full endpoint catalog with payloads and access levels: **[docs/API.md](docs/API.md)**.

## 🧪 Testing

```bash
npm run test   # 40 tests across 8 suites (needs local MongoDB)
```

Covers: authentication (register/verify/login/refresh rotation/logout/forgot/reset),
authorization matrix (RBAC), event registration + QR check-in lifecycle, scholarship
applications + review state machine, donation signature + webhook verification,
job posting/moderation, chat messaging + blocking, and API validation.

## ☁️ Deployment

### Frontend → Vercel
1. Import the repo; root directory `client`.
2. Build: `npm run build` · Output: `dist`.
3. `vercel.json` (included) rewrites all non-API paths to `index.html`.
4. Client calls are relative (`/api`, `/socket.io`) — configure a rewrite or a
   reverse proxy to the API URL, or set `VITE_API_URL`/`VITE_SOCKET_URL` (the client
   falls back to same-origin when unset).

### Backend → Render (or Railway/AWS)
1. Create a Web Service from the repo (see `render.yaml` blueprint).
2. Build: `npm install --workspace server` · Start: `npm run start`.
3. Set all env vars (Dashboard → Environment) — `MONGO_URI` (Atlas), JWT secrets,
   Cloudinary, Razorpay, SMTP.
4. Health check path: `/api/health`. Set `CLIENT_URL` to your frontend origin.

### Database → MongoDB Atlas
Use the Atlas connection string as `MONGO_URI`; indexes are declared in the models.

## 🛠️ Troubleshooting

| Problem | Fix |
|---|---|
| API won't start ("MONGO_URI is not set") | Create `server/.env` from `.env.example` |
| Login says "pending admin approval" | Faculty/alumni need admin approval (Admin → Users → Pending) |
| Donations show a Razorpay setup error | Add test-mode Razorpay keys to `server/.env` and restart |
| Emails aren't arriving | SMTP unset → emails print to the server console (dev); configure SMTP in production |
| Files store to local disk | Cloudinary keys unset — expected in dev; add keys for production |
| Ports in use | `fuser -k 5173/tcp 5000/tcp` (Linux/macOS) or kill the stale process |
| Tests fail to connect | Ensure local MongoDB is running on 27017 |

## 📦 Project Structure

```text
root/
├── client/           # React SPA (Vite, Tailwind, RTK Query, Socket.IO client)
├── server/           # Express API (REST + Socket.IO, services, models, tests, seed)
├── docs/API.md       # Full API reference
├── DEVELOPMENT_ROADMAP.md
├── vercel.json       # Frontend deploy config
├── render.yaml       # Backend deploy blueprint
└── package.json      # npm workspaces
```

## ✅ Status

- **Phase 1** — scaffolding & tooling ✅
- **Phase 2** — backend foundation: 34 models, middleware, auth, seed ✅
- **Phase 3** — frontend foundation: router, layouts, store, RTK Query, socket, UI kit ✅
- **Phase 4** — every page built & verified (30+ modules, 40+ pages) ✅
- **Phase 5** — hardening: 40 automated tests, compression, deployment configs,
  API docs, final README ✅
#   C a m p u s - C o n n e c t  
 