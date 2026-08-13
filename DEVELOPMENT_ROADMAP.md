# Alumni–Student Community Platform — Requirements Analysis & Development Roadmap

**Source of truth:** `uploads/Build a Full-Stack MERN Alumni–Student Community Platform.md` (52 sections)
**Status:** Analysis complete — awaiting approval to begin Phase 1
**Stack:** MERN (MongoDB, Express, React + Vite, Node.js) — JavaScript/JSX per spec

---

## 1. Executive Summary

A production-ready MERN platform connecting **Students, Faculty, Alumni, and Administrators** of a college/university. The system is a college ecosystem (not just an alumni directory) built around 8 pillars:

**Networking + Mentorship + Scholarships + Events + Attendance + Jobs + Resources + Communication**

Every feature must be fully functional end-to-end (real DB records, real Socket.IO messaging, real Razorpay test-mode payments, real Cloudinary uploads, real QR check-in). No fake buttons, no placeholders, no TODOs.

---

## 2. Requirements Extraction (README Section → Module Map)

| # | README Section | Extracted Requirements | Module |
|---|---|---|---|
| 1 | Tech Stack | React + Vite + Tailwind + Router + Redux Toolkit (+RTK Query) + Recharts + Lucide + RHF + Zod + Socket.IO client + Sonner; Express + Mongoose + JWT + bcrypt + Socket.IO + Multer + Cloudinary + Nodemailer + dotenv + Helmet + CORS + rate limit + error middleware | Foundation |
| 2 | User Roles | 4 roles with distinct capability sets | RBAC |
| 3 | Auth & Authorization | Register (role-specific fields), login, logout, JWT access + refresh, bcrypt hashing, forgot/reset password, email verification, role-based authz, protected routes, session persistence, activation/deactivation, admin approval for selected registrations | Auth |
| 4 | User Profiles | Detailed profile (avatar, education, skills, about, experience, achievements, projects, certifications, company, designation, location, contact, social links) + per-field **privacy controls** (public / connections / private) | Profile |
| 5 | Community Dashboard | Personalized dashboard: welcome, upcoming events/meetings, announcements, jobs/internships, scholarships, resources, recent posts, recommended people, notifications, quick actions | Dashboard |
| 6 | Networking | Search/filter people (dept, batch, grad year, company, industry, skills, location, designation); profile cards with Connect/Message/View; connection request lifecycle (send/accept/reject/cancel/remove) | People |
| 7 | Chat | Real-time 1:1 via Socket.IO: online status, typing, read/unread, timestamps, last-message preview, conversation search, delete message, delivery status, file/image share, notifications, block/report | Chat |
| 8 | Meetings | Schedule, invite, accept/reject, reschedule, cancel, join, meeting link (Google Meet/Zoom as external URL), reminders, statuses (scheduled/pending/accepted/rejected/completed/cancelled), 1:1 & group | Meetings |
| 9 | Events | 11 categories; fields (name, desc, organizer, date, times, venue, online/offline, link, max participants, reg deadline, image, dept, category); register/cancel, reminders, search/filter, upcoming/past, details, participant list, organizer dashboard | Events |
| 10 | Attendance | Auto attendance per event; QR check-in (unique per event, expiry, no duplicates, timestamp, user ID) + manual marking, edit, export, % dashboard; export CSV/Excel/PDF | Attendance |
| 11 | Scholarships | Campaigns by alumni/faculty/admin (name, desc, eligibility, requirements, max applicants, amount, deadline, docs, sponsor, category, status); student applications (income, academics, reason, documents); statuses applied → under review → shortlisted → approved → rejected → funded → completed | Scholarships |
| 12 | Donations | Razorpay: create order, verify, webhook, success/failure/refund, receipt download; no card storage; funding dashboard (target, raised, remaining, donors, students supported) | Donations |
| 13 | Scholarship Student Dashboard | Available scholarships, eligibility, deadline, status, submitted docs, review comments, approved amount, funding status; reviewer tools (verify, shortlist, approve/reject, comment, track funding) | Scholarships |
| 14 | Jobs & Internships | Opportunity board (job/internship/freelance/hackathon/competition/training); full field set; filters; save/share/apply/report; admin moderation | Jobs |
| 15 | Study Resources | Library with categories (GATE, Semester, Placement, Development, Other — admin-extensible); PDF/DOC/PPT/video/external link/notes; search/filter/bookmark/download/rate/report | Resources |
| 16 | Community Feed | Posts (text/images/documents/links/tags, 9 types); like/comment/share/save/report | Feed |
| 17 | Announcements | Authorized publishing (faculty/admin); auto notifications | Announcements |
| 18 | Notifications | 13 notification types; in-app + email; mark read / all read / delete | Notifications |
| 19 | Search | Global search across 9 entity types with filters + sorting | Search |
| 20 | Admin Dashboard | KPI cards (12), 7 charts, user/content/financial management | Admin |
| 21 | RBAC Rules | Granular permissions; enforced on **frontend AND backend** | RBAC |
| 22 | Database | 25+ schemas listed; ObjectId refs, indexes, timestamps, validation, compound indexes | DB |
| 23 | API Architecture | RESTful; example endpoints given per module | API |
| 24 | File Uploads | Cloudinary; type/size/MIME validation — never trust extension alone | Uploads |
| 25 | Security | bcrypt, JWT, httpOnly cookies, Helmet, CORS, rate limiting, input validation, query sanitization, XSS protection, secure uploads, RBAC middleware, payment signature + webhook verification, env vars | Security |
| 26 | UI/UX | LinkedIn/university-portal aesthetic: light bg, blue/green primary, cards, rounded corners, subtle shadows, responsive, accessible contrast | UI |
| 27–28 | Navigation | Desktop sidebar (13 items, role-filtered); mobile bottom nav + hamburger | Layout |
| 29 | Additional Features | Mentorship, alumni directory, referrals, achievements, career roadmaps, placement prep, event certificates (QR-verifiable), reputation, verification badges | Extras |
| 30 | Analytics | Student / Alumni / Admin analytics | Analytics |
| 31 | Email System | Transactional emails with reusable templates (11 types listed) | Email |
| 32 | Folder Structure | client/ + server/ layout given | Structure |
| 33 | Error Handling | Consistent envelope `{success, message, data|error}` | API |
| 34 | Loading States | Skeletons, spinners, empty/error states everywhere | UI |
| 35 | Search & Pagination | Server-side pagination/search/filter/sort for large collections | API |
| 36 | Indexing | Indexes on email, role, department, graduationYear, company, skills, dates, createdAt; use populate/select/lean | DB |
| 37 | Seed Data | 1 admin, 5 faculty, 15 alumni, 30 students + content; demo credentials in README | Seed |
| 38 | Impersonation | **No** unrestricted impersonation; secure audit-logged support view with reason + timestamp + admin authz | Admin |
| 39 | Audit Logs | Track 10+ action types; admin viewable | Audit |
| 40 | Reports | Export 9 report types → CSV / Excel / PDF | Reports |
| 41 | Privacy | Visibility per field (phone, email, location, company, social links) with public/connections/private | Privacy |
| 42 | User Flows | Full happy-path flows per role (see §8.5) | Flows |
| 43 | Functional Requirements | No fake buttons — everything must persist/execute | Global |
| 44 | Testing | Auth, authorization, registration, event registration, attendance, scholarship application, donation verification, job posting, chat, validation, responsive UI | Tests |
| 45 | Env Variables | `.env.example` with 16+ vars; never commit secrets | Config |
| 46 | README | Full project README (overview, features, stack, architecture, install, env, services setup, run, seed, demo accounts, API docs, deployment, troubleshooting) | Docs |
| 47 | Dev Requirements | Modular: controllers, services, middleware, models, validators, hooks, slices, protected routes, clean naming | Code |
| 48 | Final UI Pages | ~45 pages across Public/Common/Student/Alumni/Faculty/Admin | Pages |
| 49 | Landing Page | Hero **"Connect. Learn. Give Back. Grow Together."**, subheading, 9 sections, CTAs, statistics | Landing |
| 50 | Product Recommendation | College ecosystem: Students ↔ Alumni ↔ Faculty via 8 pillars | Vision |
| 51 | Dev Approach | 7 build phases (setup → auth/profiles/dashboard → directory/chat → events/attendance → scholarships/donations → jobs/resources/feed → admin → security/testing/deploy) | Process |
| 52 | Critical Instruction | Every UI feature ships with model + API + controller + validation + authz + frontend integration + loading/error/notify/persistence | Process |

---

## 3. Architecture Decisions (where the spec says "or")

| Decision Point | Choice | Rationale |
|---|---|---|
| State/data fetching | **Redux Toolkit + RTK Query** | Cache invalidation (tags) fits 30+ entities; auto refetch after mutations; fewer hand-rolled effects |
| Validation | **Zod** (shared schemas) via `@hookform/resolvers` | Type-safe, composable, used on both RHF forms and Express validators |
| Toasts | **Sonner** | Lightweight, modern, tree-shakeable |
| Module system | **ESM (`"type": "module"`)** both client & server | Modern Node, spec-compliant |
| JWT strategy | Access token (short-lived, 15 min, in-memory) + refresh token (7 days, **httpOnly cookie**, rotation + revocation via server-side store) | Satisfies "httpOnly cookies where appropriate" + refresh token requirement |
| Admin approval | Students: auto-verified after email verification. **Faculty & Alumni: pending admin approval** (`isApproved`) | Matches "admin approval for selected registrations" + "Pending registrations" admin card; faculties/alumni represent official affiliation |
| QR attendance | Event holds a **rotating QR secret** (hashed) + expiry; QR payload = `{eventId, token, exp}` signed; check-in endpoint validates + records | Unique per event, expiration, duplicate prevention (unique event+user) |
| Payments | **Razorpay test mode**: order → checkout → verify (HMAC) → webhook (signature) → receipt | Per spec §12, §25; card data never touches our server |
| Email | **Nodemailer** + SMTP; reusable template renderer (plain HTML templates, no heavy engine). Dev fallback: console/ethereal transport when SMTP unset (documented) | Runnable locally without a mail account; production uses real SMTP |
| File storage | **Cloudinary** (upload via Multer memory → Cloudinary SDK). Dev fallback: local `uploads/` when Cloudinary keys absent (documented) | "Fully functional" locally without third-party keys; production on Cloudinary |
| Video conferencing | **External meeting links** (Google Meet / Zoom) as configured by organizer — per spec §8 | Spec explicitly says don't build video conferencing |
| Admin support view | **Audit-logged read-only profile view** with reason + timestamp + admin authz — no impersonation | Spec §38 |
| Charts | **Recharts** | Per spec |

---

## 4. High-Level System Architecture

```text
┌─────────────────────────────── Browser ───────────────────────────────┐
│  React SPA (Vite, Tailwind, RTK Query, RHF+Zod, Recharts, Lucide)      │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────────┐ ┌──────────────┐  │
│  │ Router       │ │ Redux store  │ │ Socket.IO     │ │ RHF Forms    │  │
│  │ (role-guards)│ │ slices + RTKQ│ │ client        │ │ (Zod schema) │  │
│  └──────┬───────┘ └──────┬───────┘ └──────┬────────┘ └──────┬───────┘  │
└─────────┼────────────────┼────────────────┼─────────────────┼──────────┘
          │ axios (auth    │ REST (JSON)    │ WS (events,     │
          │  interceptor)  │                │  presence, chat)│
┌─────────┴────────────────┴────────────────┴─────────────────┴──────────┐
│                         Express API Server                             │
│  Routes → Validators (Zod) → Controllers → Services → Models (Mongoose)│
│  Middleware: auth(JWT) · RBAC · rate-limit · helmet · cors · sanitize   │
│  Error handler (centralized) · Audit logger · Email service             │
│  Socket.IO server (same process, JWT handshake)                         │
└──────┬───────────────┬──────────────┬──────────────┬───────────────────┘
       │               │              │              │
┌──────┴──────┐ ┌──────┴───────┐ ┌────┴───────┐ ┌────┴──────────┐
│ MongoDB     │ │ Cloudinary   │ │ Razorpay   │ │ SMTP (email)  │
│ Atlas/      │ │ images/docs  │ │ orders,    │ │ Nodemailer    │
│ local       │ │ (Multer →)   │ │ webhooks   │ │ templates     │
└─────────────┘ └──────────────┘ └────────────┘ └───────────────┘
Deployment: client → Vercel/Netlify · server → Render/Railway/AWS · DB → Atlas
```

---

## 5. Folder Structure (per spec §32, expanded)

```text
root/
├── package.json                  # npm workspaces + root scripts (dev via concurrently)
├── .env.example                  # all env vars (spec §45)
├── .gitignore  /  .prettierrc  /  .eslintrc
├── README.md                     # full project docs (spec §46)
├── DEVELOPMENT_ROADMAP.md        # this document
│
├── server/
│   ├── package.json
│   ├── server.js                 # entry: http server + socket.io bootstrap
│   ├── app.js                    # express app (middleware, routes, error handler)
│   ├── config/
│   │   ├── env.js                # dotenv + validation of required vars
│   │   ├── db.js                 # mongoose connection
│   │   ├── cloudinary.js
│   │   ├── razorpay.js
│   │   ├── mailer.js             # nodemailer transport (SMTP / dev fallback)
│   │   └── constants.js          # enums: roles, statuses, categories, limits
│   ├── models/                   # 30+ mongoose schemas (§6)
│   ├── routes/                   # one router file per module (§9)
│   ├── controllers/              # thin HTTP layer → services
│   ├── services/                 # business logic: auth, email, payment, qr,
│   │   │                         #   notification, audit, report, socket-notify
│   ├── middleware/
│   │   ├── auth.js               # JWT verify → req.user
│   │   ├── rbac.js               # requireRole / requirePermission
│   │   ├── validate.js           # Zod schema validator
│   │   ├── errorHandler.js       # centralized errors + envelope
│   │   ├── notFound.js
│   │   ├── rateLimiter.js        # per-route limits (auth stricter)
│   │   ├── upload.js             # multer memory + MIME/size validation
│   │   └── sanitize.js           # mongo-sanitize + XSS
│   ├── sockets/
│   │   ├── index.js              # io setup, JWT handshake auth
│   │   ├── presence.js           # online/offline
│   │   ├── chat.js               # messages, typing, read receipts
│   │   └── notifications.js      # push to online users
│   ├── validators/               # Zod schemas per module (auth, user, event…)
│   ├── utils/                    # ApiError, ApiResponse, asyncHandler, jwt,
│   │   │                         #   tokenStore, qr, pagination, csv/xlsx/pdf
│   ├── emails/                   # reusable email templates (spec §31)
│   ├── seed/                     # seed script (§7.2)
│   ├── tests/                    # Vitest + Supertest integration tests
│   └── uploads/                  # dev fallback for file storage (gitignored)
│
└── client/
    ├── package.json
    ├── vite.config.js            # proxy /api + /socket.io → server
    ├── index.html
    └── src/
        ├── main.jsx  /  App.jsx
        ├── assets/               # fonts, logo, static images
        ├── styles/               # tailwind base + theme tokens + global css
        ├── routes/               # route config + RoleRoute/ProtectedRoute guards
        ├── layouts/              # PublicLayout, AppLayout (sidebar), AdminLayout,
        │                         #   MobileNav (bottom bar)
        ├── components/
        │   ├── ui/               # reusable primitives (§12.1)
        │   └── feature/          # per-module components (§12.2)
        ├── pages/                # one folder per page (§11)
        ├── hooks/                # useSocket, useOnlineStatus, useDebounce,
        │                         #   usePagination, useDocumentTitle…
        ├── services/             # RTK Query api slices (auth, users, events…)
        ├── store/                # store.js, rootReducer
        ├── slices/               # authSlice, notificationSlice, uiSlice
        ├── utils/                # formatters, validators, constants, cn()
        └── socket/               # socket client singleton + event wiring
```

---

## 6. Database Schema (Mongoose — all models, key fields, indexes)

**Conventions:** `timestamps: true` on all; `ObjectId` refs; enum validation; compound indexes where queried together; text indexes for search; `select: false` on secrets (passwordHash, tokens).

| # | Model | Key Fields | Indexes |
|---|---|---|---|
| 1 | **User** | name, email, passwordHash(sel:false), role[student/faculty/alumni/admin], avatar{url,publicId}, phone, isVerified, isApproved, isActive, verificationToken(sel:false)+expiry, resetToken(sel:false)+expiry, lastLoginAt, refreshTokenVersion, badges[], reputationScore, privacy{phone,email,location,company,socialLinks: public/connections/private}, emailPrefs{}, blockedUsers[] | email (unique), role, isActive+isVerified, createdAt |
| 2 | **StudentProfile** | user(1:1), rollNumber, department, course, year, graduationYear, batch, about, location, skills[], education[], experience[], achievements[], projects[], certifications[] | user (unique), department+graduationYear, skills (multikey) |
| 3 | **FacultyProfile** | user(1:1), employeeId, department, designation, subjects[], about, location | user (unique), department |
| 4 | **AlumniProfile** | user(1:1), graduationYear, department, degree, currentCompany, designation, industry, location, skills[], linkedinUrl, githubUrl, portfolioUrl, about, experience[], achievements[], mentorshipAreas[], availableForMentorship | user (unique), department+graduationYear, company, industry, skills, location |
| 5 | **Connection** | requester→User, recipient→User, status[pending/accepted/rejected/removed], respondedAt | {requester,recipient} unique, recipient+status |
| 6 | **Conversation** | participants[→User], type[direct/group], name?, lastMessage→Message, lastMessageAt | participants (multikey), lastMessageAt |
| 7 | **Message** | conversation→Conversation, sender→User, kind[text/image/file], content, attachment{url,publicId,name,mimeType,size}, isRead, readBy[], deletedFor[], editedAt | conversation+createdAt, sender |
| 8 | **Event** | title, description, organizer→User, date, startTime, endTime, venue, mode[online/offline], meetingLink, maxParticipants, registrationDeadline, image{url,publicId}, department, category(11 enum), status[draft/published/completed/cancelled], registrationsCount, qr{secretHash,expiresAt} | date, department+category, status+date, organizer |
| 9 | **EventRegistration** | event→Event, user→User, status[registered/cancelled/attended], attendedAt | {event,user} unique, event+status |
| 10 | **Attendance** | event→Event, user→User, registrationStatus, status[registered/present/absent/late], checkInTime, checkOutTime, method[qr/manual], markedBy→User, note | {event,user} unique, event+status, user |
| 11 | **Meeting** | title, organizer→User, date, startTime, endTime, type[oneOnOne/group], description, location, meetingLink, status[scheduled/pending/accepted/rejected/completed/cancelled] | organizer+status, date |
| 12 | **MeetingParticipant** | meeting→Meeting, user→User, status[invited/accepted/rejected], respondedAt | {meeting,user} unique |
| 13 | **Scholarship** | name, description, eligibility, minimumRequirements, maxApplicants, amount, deadline, requiredDocuments[], sponsor→User, category, status[draft/active/paused/completed], targetAmount, raisedAmount, applicantsCount | deadline+status, sponsor, status |
| 14 | **ScholarshipApplication** | scholarship→Scholarship, student→User, rollNumber, department, familyIncome, academicPerformance, reason, documents[{url,publicId,name,type}], status[applied/under_review/shortlisted/approved/rejected/funded/completed], reviewComments[{by,text,at}], reviewedBy, reviewedAt, approvedAmount | {scholarship,student} unique, student+status, status |
| 15 | **Donation** | donor→User, scholarship→Scholarship?, amount, currency, orderId, paymentId, signature, status[created/paid/failed/refunded], receiptNumber, receiptUrl, message, anonymous | donor+createdAt, scholarship+status, status |
| 16 | **Payment** | user, purpose[donation], referenceId, amount, currency, gateway[razorpay], orderId, paymentId, signature, status, failureReason, refundId, webhookEvents[] | orderId (unique), paymentId, status |
| 17 | **Job** (opportunities) | title, company, type[job/internship/freelance/hackathon/competition/training], description, location, workMode[remote/hybrid/onsite], salary, experience, skills[], eligibility, deadline, applicationLink, applyThroughPlatform, postedBy→User, status[pending/approved/rejected/closed], isFeatured, views, applicants[] | type+status, company, skills, deadline, postedBy, status |
| 18 | **Resource** | title, description, category[GATE/Semester/Placement/Development/Other], subCategory, subject, semester, fileType[pdf/doc/ppt/video/external/notes], file{url,publicId,name,size}, externalUrl, uploadedBy→User, status[pending/approved/rejected/removed], downloads, avgRating, ratingCount, bookmarks, tags[] | category+subCategory, status, uploadedBy, title(text), tags |
| 19 | **ResourceRating** | resource→Resource, user→User, rating(1–5) | {resource,user} unique |
| 20 | **Post** | author→User, type(9 enum), content, images[], documents[], links[], tags[], status[published/removed/reported], counts{likes,comments,shares,saves}, isPinned | author+createdAt, type, tags, createdAt |
| 21 | **Comment** | post→Post, author→User, content, parent→Comment?, likesCount | post+createdAt |
| 22 | **Like** | user→User, targetType[post/comment], targetId | {user,targetType,targetId} unique |
| 23 | **Notification** | recipient→User, type(13 enum), title, body, data{}, isRead, readAt | recipient+isRead+createdAt |
| 24 | **Announcement** | title, body, category, author→User, audience[all/student/faculty/alumni], pinned, expiresAt, status[draft/published/archived] | audience+createdAt, pinned |
| 25 | **Report** | reporter→User, targetType[user/post/event/job/resource/message], targetId, reason, details, status[pending/reviewed/resolved/dismissed], reviewedBy, resolvedAt | status+createdAt, targetType+targetId |
| 26 | **SavedItem** | user→User, itemType[job/resource/post/event], itemId | {user,itemType,itemId} unique |
| 27 | **AuditLog** | actor→User, action(13 enum), targetType, targetId, details, ipAddress, userAgent, reason?, createdAt | actor+createdAt, action, createdAt |
| 28 | **Mentorship** | mentor→User, student→User, area, message, goals[], status[requested/accepted/completed/rejected/cancelled] | {mentor,student,area} unique, student+status |
| 29 | **MentorshipSession** | mentorship→Mentorship, meeting→Meeting?, notes, scheduledAt, status | mentorship |
| 30 | **Referral** | alumnus→User, job→Job, student→User, note, status[requested/approved/given/rejected] | {alumnus,job,student} unique |
| 31 | **Certificate** | event→Event, user→User, certificateId(unique), url, publicId, qrCode, issuedBy→User, issuedAt | {event,user} unique, user |
| 32 | **CareerRoadmap** | title, role, description, steps[{title,description,duration,resources[]}], createdBy | role |
| 33 | **RefreshToken** | user→User, tokenHash(sel:false), expiresAt, revokedAt, replacedBy, ip, userAgent | tokenHash unique, user |
| 34 | **Block** | blocker→User, blocked→User, createdAt | {blocker,blocked} unique |

**Shared sub-schemas** (avoid duplication): `Education`, `Experience`, `Achievement`, `Project`, `Certification`, `SocialLinks`, `Attachment`, `AuditDetails`.

**Query optimization:** `populate` only needed refs, `.select()` field projection, `.lean()` for read-heavy lists, server-side pagination everywhere (§35–36).

### 6.1 Demo seed data (spec §37)
- 1 admin, 5 faculty, 15 alumni, 30 students — with realistic Indian university data (departments: CSE, ECE, ME, CE, EE; batches 2018–2026)
- Events, jobs, internships, resources (GATE/placement/semester notes), scholarships, sample posts, some connections/messages
- Demo credentials documented in README (e.g., `admin@campus.edu / Admin@123`, plus one account per role)
- Idempotent seed: `npm run seed` (safe to re-run)

---

## 7. User Roles & RBAC Matrix

**Permission levels:** role capability sets per spec §2 + §21. Enforced in **backend middleware** (`requireRole`, `requirePermission`) and mirrored on frontend (route guards + conditional UI — never as the only defense).

| Capability | Student | Faculty | Alumni | Admin |
|---|:-:|:-:|:-:|:-:|
| Manage own profile / privacy / posts / applications / messages | ✅ | ✅ | ✅ | ✅ |
| Directory: browse people, view public profiles | ✅ | ✅ | ✅ | ✅ |
| Connections (send/accept/reject/cancel/remove) | ✅ | ✅ | ✅ | ✅ |
| 1:1 chat + block/report | ✅ | ✅ | ✅ | ✅ |
| Register for events, view own attendance | ✅ | ✅ | ✅ | ✅ |
| Apply for scholarships + track status | ✅ | — | — | — |
| Access study resources (view/download/rate/bookmark) | ✅ | ✅ | ✅ | ✅ |
| View jobs/internships; save/share/apply/report | ✅ | ✅ | ✅ | ✅ |
| View announcements | ✅ | ✅ | ✅ | ✅ |
| Schedule meetings (1:1 & group) | ✅ | ✅ | ✅ | ✅ |
| **Create events** | ❌ (only via permission) | ✅ | ✅ (alumni events) | ✅ |
| **Manage attendance** (QR gen, manual mark, edit, export) | ❌ | ✅ | ✅ (own events) | ✅ |
| **Publish announcements** | ❌ | ✅ | ❌ | ✅ |
| **Post jobs/internships/opportunities** | ❌ (if permitted by admin) | ✅ | ✅ | ✅ |
| **Create scholarship campaigns** | ❌ | ✅ | ✅ | ✅ |
| **Donate / fund scholarships** | ❌ | ✅ | ✅ | ✅ |
| **Review scholarship applications** | ❌ | ✅ | ✅ | ✅ |
| **Upload study resources** | ❌ | ✅ | ✅ | ✅ |
| **Mentorship** (offer) / request | offer ❌ / request ✅ | ✅ | ✅ | ✅ |
| **Referrals** (offer / request) | request ✅ | — | offer ✅ | — |
| Upload content to community feed | ✅ | ✅ | ✅ | ✅ |
| Issue event certificates | ❌ | ✅ (own events) | ✅ (own events) | ✅ |
| User management / role changes / verify / disable | ❌ | ❌ | ❌ | ✅ |
| Content moderation (posts, jobs, resources, reports) | ❌ | ❌ | ❌ | ✅ |
| Financial management (donations, refunds, receipts) | ❌ | ❌ | ❌ | ✅ |
| Analytics & reports & audit logs | own only | own + dept | own | full |
| System settings | ❌ | ❌ | ❌ | ✅ |

**Registration approval flow:** student → auto-approved after email verify; faculty/alumni → created `isApproved:false`, login blocked with "pending approval" message until admin approves (admin sees Pending Registrations card).

---

## 8. Feature Inventory & Module Map

### 8.1 Core modules (all must ship)
Auth · Profiles+Privacy · Dashboard · People & Connections · Chat · Meetings · Events · Attendance (QR) · Scholarships · Donations (Razorpay) · Jobs & Internships · Study Resources · Community Feed · Announcements · Notifications (in-app+email) · Global Search · Admin (users/content/finance) · Audit Logs · Reports/Exports · Analytics · Email templates · Seed data

### 8.2 Additional features (spec §29 — all implemented, later phases)
Mentorship (offer/request/sessions) · Alumni directory (advanced filters) · Referral system · Achievements section · Career roadmaps (9 roles) · Placement prep content · Event certificates (QR-verified, certificate ID) · Reputation system (non-gamified) · Verification badges (6 badge types)

### 8.3 Dashboard widgets (spec §5)
Welcome · Upcoming events · Upcoming meetings · Recent announcements · New jobs · Internships · Scholarship campaigns · Study resources · Recent posts · Recommended alumni/students · Notifications · Quick actions (role-filtered: Create Event, Schedule Meeting, Find Alumni, Find Students, Post Opportunity, Apply Scholarship, Donate, Upload Resource, Start Chat)

### 8.4 Notifications (13 types, spec §18)
message · connection_request · connection_accepted · meeting_invitation · meeting_reminder · event_registration · event_reminder · scholarship_deadline · scholarship_status · donation_success · new_job · new_resource · announcement → each maps to in-app Notification record + (where applicable) email.

### 8.5 Complete user flows (spec §42) — implemented as acceptance tests
- **Student:** register → verify email → login → complete profile → dashboard → find alumni → connect → chat → schedule mentorship meeting → register event → QR check-in → attendance → apply scholarship (docs) → reviewed → approved/funded
- **Alumni:** register → verify → admin approves → profile → find students → mentor → create scholarship → donate via Razorpay → funding dashboard updates → receipt
- **Faculty:** login → create event → students register → generate QR → attendance recorded → upload resource → post internship → view participants
- **Admin:** login → approve users → manage roles → monitor events/scholarships/donations → moderate posts → analytics → export reports → audit logs

---

## 9. REST API Endpoint Catalog

**Envelope:** `{ success, message, data }` / error `{ success:false, message, error }` (spec §33). All mutation endpoints validate with Zod. Auth via `Authorization: Bearer <access>`; refresh via httpOnly cookie.

### Auth (`/api/auth`)
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| POST | /register | public | role-based payload (student/faculty/alumni; admin seeded only) |
| POST | /verify-email | public | token → verified + notification + welcome email |
| POST | /resend-verification | public | |
| POST | /login | public | sets httpOnly refresh cookie, returns access + user |
| POST | /refresh | cookie | rotates refresh token, revokes old |
| POST | /logout | auth | revokes refresh, clears cookie, audit log |
| POST | /forgot-password | public | email w/ reset link (rate-limited) |
| POST | /reset-password | public | token + new password |
| GET | /me | auth | current user + role profile |
| PATCH | /change-password | auth | |

### Users & Profiles (`/api/users`)
GET `/` (admin/authenticated, filters+paginate) · GET `/:id` (public profile honoring privacy) · PATCH `/me` · PATCH `/me/avatar` (upload) · PATCH `/me/privacy` · GET `/me/role-profile` · PATCH `/me/role-profile` · PATCH `/:id` (admin: role, verify, approve, activate/deactivate, badges) · DELETE `/:id` (admin, soft-delete + audit) · GET `/:id/connection-status` (auth) · POST `/:id/support-view` (admin: audit-logged read-only access, reason required)

### Connections (`/api/connections`)
GET `/` (mine, with status filter) · GET `/requests` · POST `/request` {recipientId} · PUT `/:id/accept` · PUT `/:id/reject` · DELETE `/:id` (cancel or remove; audit) · GET `/suggestions` (recommended people, spec §5)

### Chat (`/api/conversations`, `/api/messages`)
GET `/api/conversations` (last message, unread counts) · POST `/api/conversations` (direct) · GET `/api/conversations/:id/messages` (paginated) · POST `/api/conversations/:id/messages` (text; file via upload first) · PATCH `/api/messages/:id/read` · DELETE `/api/messages/:id` (delete-for-self) · GET `/api/messages/search` · POST `/api/conversations/:id/block` · DELETE `/api/conversations/:id/block`

### Events (`/api/events`)
GET `/` (filters: category, department, mode, date range, upcoming/past; paginate) · GET `/:id` (details + my registration) · POST `/` (faculty/alumni/admin) · PUT `/:id` (organizer/admin) · DELETE `/:id` (organizer/admin) · POST `/:id/register` · DELETE `/:id/register` · GET `/:id/participants` (organizer) · GET `/organizer/mine` (organizer dashboard data)

### Attendance (`/api/attendance`)
POST `/event/:eventId/qr-token` (organizer: generate/rotate QR w/ expiry) · POST `/check-in` {qrToken} (validates signature+expiry+duplicate; records checkIn) · POST `/event/:eventId/check-out` · GET `/event/:eventId` (organizer list) · GET `/event/:eventId/summary` (totals + %) · PUT `/:id` (organizer edit: status/times) · POST `/event/:eventId/manual` (mark present/absent/late) · GET `/user/:userId` (student's own history) · GET `/event/:eventId/export?format=csv\|xlsx\|pdf`

### Meetings (`/api/meetings`)
GET `/` (mine, filter by status) · GET `/:id` · POST `/` (participants + invite notifications) · PUT `/:id` (update/reschedule/link) · PATCH `/:id/status` (accept/reject/cancel/complete) · DELETE `/:id` (organizer) · POST `/:id/remind`

### Scholarships (`/api/scholarships`)
GET `/` (filters: category, status, deadline) · GET `/:id` (incl. funding progress) · POST `/` (alumni/faculty/admin) · PUT `/:id` (sponsor/admin) · POST `/:id/apply` (multipart: income cert, academic records, docs) · GET `/api/scholarship-applications` (student: mine; reviewer: all + filters) · GET `/api/scholarship-applications/:id` · PUT `/api/scholarship-applications/:id/status` (reviewer workflow + comment + email + notification) · POST `/api/scholarship-applications/:id/comment`

### Donations (`/api/donations`)
POST `/create-order` {scholarshipId?, amount, message, anonymous} → Razorpay order (test mode) · POST `/verify` {orderId, paymentId, signature} → HMAC verify → Payment paid → Donation created → raisedAmount updated → receipt email + notification · POST `/webhook` (raw body + X-Razorpay-Signature verify; captures/failed/refunded) · GET `/mine` · GET `/admin` (admin: all, filters) · GET `/:id/receipt` (PDF download) · GET `/stats` (target/raised/remaining/donors/students supported)

### Jobs & Opportunities (`/api/jobs`)
GET `/` (type/workMode/location/company/skills/experience/deadline filters, paginate) · GET `/:id` (views++ ) · POST `/` (authorized roles) · PUT `/:id` (owner/admin) · DELETE `/:id` · POST `/:id/save` · DELETE `/:id/save` · POST `/:id/apply` (platform apply → applicant record + notify poster) · POST `/:id/report` · PUT `/:id/moderate` (admin approve/reject, notification + email)

### Resources (`/api/resources`)
GET `/` (category/subCategory/subject/semester filters, sort by rating/downloads/date) · GET `/:id` · POST `/` (upload file or external link; pending→admin approval) · PUT `/:id` (owner) · DELETE `/:id` (owner/admin + audit) · POST `/:id/rate` (1–5, re-compute avg) · POST `/:id/bookmark` · DELETE `/:id/bookmark` · POST `/:id/download` (increments + returns URL) · POST `/:id/report` · PUT `/:id/moderate` (admin)

### Community (`/api/posts`, `/api/comments`)
GET `/api/posts` (feed: all/following, type filter, paginate) · GET `/api/posts/:id` · POST `/api/posts` (text/images/docs/links/tags) · PUT `/api/posts/:id` (author) · DELETE `/api/posts/:id` (author/admin) · POST `/api/posts/:id/like` · DELETE `/api/posts/:id/like` · GET `/api/posts/:id/comments` · POST `/api/posts/:id/comments` (replies supported) · DELETE `/api/comments/:id` · POST `/api/posts/:id/save` · POST `/api/posts/:id/report` · PUT `/api/posts/:id/moderate` (admin)

### Announcements (`/api/announcements`)
GET `/` (audience-aware) · POST `/` (faculty/admin) · PUT `/:id` · DELETE `/:id` · PATCH `/:id/pin` · (publish → auto notifications)

### Notifications (`/api/notifications`)
GET `/` (paginated) · GET `/unread-count` · PATCH `/:id/read` · PATCH `/read-all` · DELETE `/:id` · DELETE `/` (clear all)

### Search (`/api/search`)
GET `/?q=&type=people|events|meetings|jobs|resources|scholarships|posts&filters…` (server-side, per-type schemas)

### Mentorship & Referrals (`/api/mentorships`, `/api/referrals`)
GET `/api/mentors` (alumni offering, filter by area) · POST `/api/mentorships` (request) · GET `/api/mentorships` (as mentor/student) · PUT `/api/mentorships/:id/status` · POST `/api/mentorships/:id/sessions` · POST `/api/referrals` (alumnus offer on job) · GET `/api/referrals` · PUT `/api/referrals/:id/status` (student request / alumnus grant)

### Certificates (`/api/certificates`)
POST `/event/:eventId/issue` (organizer/admin: generate certificate + QR) · GET `/mine` · GET `/verify/:certificateId` (public QR verification)

### Admin (`/api/admin`)
GET `/stats` (12 KPI cards) · GET `/analytics` (7 chart datasets) · GET `/users` (all roles, filters, paginate) · GET `/audit-logs` (filters + paginate) · GET `/reports` (available list) · GET `/reports/:type?format=csv|xlsx|pdf` (9 report types) · GET/PUT `/settings` (system settings, resource categories) · PUT `/users/:id/badges`

### Uploads (`/api/upload`)
POST `/` (auth; multer memory; `use` param: avatar | event | scholarship | resource | post | chat; whitelist MIME by use; size cap 5MB images / 25MB docs) → Cloudinary (dev fallback: local) → `{url, publicId, name, mimeType, size}`

### Analytics (`/api/analytics`)
GET `/me` (role-scoped: student — events, attendance %, applications, saved, connections, mentorship; alumni — mentorship, donations, events organized, opportunities, students helped; faculty — events, attendance, resources, students)

---

## 10. Socket.IO Event Catalog (real-time)

Handshake authenticated with JWT; presence map in memory; online users get live notification pushes.

| Direction | Event | Payload / Notes |
|---|---|---|
| C→S | `presence:subscribe` | list of user ids to watch |
| S→C | `user:online` / `user:offline` | presence broadcast |
| C→S | `conversation:join` / `conversation:leave` | room = conversation id |
| C→S | `message:send` | {conversationId, content, kind, attachment?} → persisted in DB → `message:new` to room |
| S→C | `message:new` | full message + `message:delivered` to sender |
| C→S | `message:read` | {messageIds, conversationId} → marks read, broadcasts `message:read` |
| C→S | `typing:start` / `typing:stop` | broadcast to conversation room |
| S→C | `notification:new` | real-time in-app notification |
| S→C | `attendance:qr-scanned` | live update to organizer's event room |
| S→C | `conversation:created` | for direct message initiation |
| C→S | `user:blocked` | server enforces block rules on messaging |

---

## 11. Frontend Pages & Route Map (spec §48)

Route guards: `PublicOnly`, `Protected`, `RoleRoute(roles)`, plus admin sub-routes. Layouts: Public / App (sidebar) / Admin. Mobile: bottom nav with 5 primary items + hamburger drawer.

| # | Page | Path | Roles |
|---|---|---|---|
| 1 | Landing | `/` | public |
| 2 | About | `/about` | public |
| 3 | Login | `/login` | public-only |
| 4 | Register (role tabs) | `/register` | public-only |
| 5 | Forgot Password | `/forgot-password` | public-only |
| 6 | Reset Password | `/reset-password` | public-only |
| 7 | Verify Email | `/verify-email` | public-only |
| 8 | Dashboard (role-aware) | `/dashboard` | all |
| 9 | Profile view/edit | `/profile`, `/profile/:id` | all |
| 10 | People Directory | `/people` (tabs: Students/Alumni/Faculty + filters) | all |
| 11 | Connection Requests | `/connections/requests` | all |
| 12 | Messages (chat) | `/messages`, `/messages/:conversationId` | all |
| 13 | Notifications | `/notifications` | all |
| 14 | Events | `/events`, `/events/:id` | all |
| 15 | My Events / Organizer | `/events/mine` | organizer-capable |
| 16 | Attendance (list, QR scan, manage, export) | `/attendance`, `/attendance/event/:eventId` | all (manage=org/faculty/admin) |
| 17 | Meetings | `/meetings`, `/meetings/:id` | all |
| 18 | Scholarships | `/scholarships`, `/scholarships/:id` | all (apply=student) |
| 19 | My Scholarship Applications | `/scholarships/applications` | student |
| 20 | Review Applications | `/scholarships/review` | faculty/alumni/admin |
| 21 | Donations / Funding | `/donations`, `/donations/:scholarshipId`, `/donations/receipts` | all (donate=alumni/faculty/admin) |
| 22 | Jobs & Internships | `/opportunities`, `/opportunities/:id`, `/opportunities/mine` | all |
| 23 | Study Resources | `/resources`, `/resources/:id`, `/resources/bookmarks` | all |
| 24 | Community Feed | `/community` | all |
| 25 | Announcements | `/announcements` | all |
| 26 | Global Search | `/search` | all |
| 27 | Mentorship | `/mentorship`, `/mentorship/requests` | all |
| 28 | Certificates | `/certificates` | all |
| 29 | Career Roadmaps | `/roadmaps`, `/roadmaps/:id` | all |
| 30 | Placement Prep | `/placement` | all |
| 31 | Admin Dashboard | `/admin` | admin |
| 32 | Admin Users | `/admin/users` (tabs: students/faculty/alumni/pending) | admin |
| 33 | Admin Content | `/admin/content` (posts/jobs/resources/events moderation) | admin |
| 34 | Admin Scholarships & Donations | `/admin/finance` | admin |
| 35 | Admin Reports | `/admin/reports` | admin |
| 36 | Admin Audit Logs | `/admin/audit-logs` | admin |
| 37 | Admin Settings | `/admin/settings` | admin |
| 38 | 404 / Forbidden | `*`, `/403` | public |

**Sidebar (spec §27, role-filtered):** Dashboard, Community, People, Messages, Meetings, Events, Attendance, Scholarships, Jobs & Internships, Study Resources, Announcements, Notifications, Profile.

---

## 12. Component Inventory

### 12.1 UI primitives (`components/ui`)
Button, IconButton, Input, Textarea, Select, Checkbox, Radio, Switch, Badge, Avatar (with initials fallback), Card, Modal, Drawer, DropdownMenu, Tabs, Tooltip, Skeleton, Spinner, EmptyState, ErrorState, Pagination, SearchInput, Tag/Chip, FileDropzone, Stepper, ProgressBar, StatCard, ToastProvider (Sonner), ConfirmDialog, CopyButton, RatingStars, FilterBar, DatePicker (native-enhanced), QRCodeView (canvas render), CertificateView, MarkdownText (lightweight).

### 12.2 Feature components (`components/feature`)
`auth/` RegisterForm (role tabs), LoginForm, ForgotForm, ResetForm, EmailVerificationBanner
`layout/` PublicNavbar, Footer, AppSidebar, AdminSidebar, MobileBottomNav, MobileDrawer, NotificationBell, UserMenu, Breadcrumbs
`dashboard/` WelcomeCard, QuickActions, DashboardWidgets (UpcomingEvents, UpcomingMeetings, RecentAnnouncements, NewOpportunities, ScholarshipCampaigns, RecentResources, RecentPosts, RecommendedPeople), RoleDashboardSwitch
`people/` PeopleFilters, UserCard, ConnectionButton (state machine), ConnectionRequestsList, MutualConnections
`chat/` ConversationList, ConversationSearch, ChatWindow, MessageBubble, MessageInput (attachment), TypingIndicator, OnlineDot, ChatHeader, MessageActions
`events/` EventCard, EventFilters, EventFormModal, EventDetails, RegisterButton, ParticipantList, OrganizerEventTable
`attendance/` QrGenerator (organizer), QrScanner (modal, camera), AttendanceTable, AttendanceSummary, ExportButtons, ManualMarkModal
`meetings/` MeetingCard, MeetingFormModal, MeetingInviteStatus, MeetingStatusBadge
`scholarships/` ScholarshipCard, ScholarshipFilters, ApplyForm (multi-doc), ApplicationStatusBadge, ApplicationReviewCard, ReviewComments, FundingProgress
`donations/` DonationModal (Razorpay checkout), DonationReceiptCard, FundingDashboard, DonationHistory
`opportunities/` JobCard, JobFilters, JobFormModal, ApplyModal, SaveButton, ShareButton
`resources/` ResourceCard, ResourceFilters, CategoryTree, ResourceUploadForm, RatingControls, BookmarkButton
`community/` PostCard, PostComposer, CommentSection, LikeButton, ShareMenu, ReportModal, PostTypeBadge
`notifications/` NotificationItem, NotificationList, MarkAllRead
`mentorship/` MentorCard, MentorshipRequestModal, MentorshipSessionCard
`certificates/` CertificateCard, VerifyModal
`admin/` AdminStatsCards, ChartCard (Recharts), UsersTable, UserEditModal, ModerateActionBar, ReportsTable, AuditLogTable, SettingsForm
`common/` GlobalSearchBar, ErrorBoundary, PrivateRoute wrapper, RoleBadge, VerifiedBadge

---

## 13. State Management Design

- **RTK Query slices** (one per module, `services/`): authApi, usersApi, connectionsApi, conversationsApi, eventsApi, attendanceApi, meetingsApi, scholarshipsApi, donationsApi, jobsApi, resourcesApi, postsApi, notificationsApi, announcementsApi, adminApi, searchApi, mentorshipApi, uploadApi — each with typed tag constants (`'User'`, `'Event'`, `'Notification'`…) for automatic cache invalidation after mutations.
- **Redux slices:** `authSlice` (user, accessToken, status, hydration via `/auth/me`), `notificationSlice` (unread count, real-time upsert), `uiSlice` (sidebar state, modals, theme).
- **Socket integration:** singleton socket client in `socket/`; a custom hook `useSocketEvents` dispatches `message:new` → `conversationsApi.updateQueryData`, `notification:new` → notificationSlice, presence → chat UI.
- **Server-side data:** pagination + filters via query args; RTK Query caches pages by cache key.

---

## 14. Authentication & Authorization Flow

```
Register (role form, Zod)
  → POST /auth/register → bcrypt(12) hash → create User (+role profile)
  → generate verification token → send verification email (link)
  → role-specific: student auto-approved; faculty/alumni → isApproved=false
Verify email (click link)
  → POST /auth/verify-email → isVerified=true → welcome email → redirect /login
Login
  → POST /auth/login → verify email+isApproved+isActive → password check
  → access token (15m, signed, role claim) returned in body (kept in memory)
  → refresh token (7d, random, hashed, stored in RefreshToken doc) in httpOnly+Secure+SameSite=Lax cookie
  → lastLoginAt updated · AuditLog: login · in-app notification
Every request → Authorization: Bearer <access>
  → middleware auth: verify JWT → load user (isActive check) → req.user
  → middleware rbac: requireRole([...]) / requirePermission('events:create')
Access expired → axios interceptor → POST /auth/refresh (cookie)
  → rotate: revoke old, issue new pair, single-flight retry queue → replay original request
Logout → POST /auth/logout → revoke refresh (server) + clear cookie + AuditLog: logout
Forgot/Reset → token (single-use, expiry) → email → reset → revoke all refresh tokens
Account state machine: isActive=false blocks login + sockets · role change re-signs JWT · refreshTokenVersion++ on password change/reset to revoke all sessions
```

**Frontend guards:** `ProtectedRoute` (token + `/auth/me` hydration), `RoleRoute` per role set, redirect to `/403` or `/login`; nav items filtered by role via constants.

---

## 15. File Upload Flow

```
Client: FileDropzone → validate (ext + MIME + size per use-case) → preview
  → POST /api/upload (multipart, use=avatar|event|scholarship|resource|post|chat)
Server: multer memoryStorage + fileFilter (MIME whitelist per use) + limits
  → MIME sniff/whitelist (never trust extension alone) → max sizes (img 5MB, docs 25MB)
  → Cloudinary.upload_stream (folder per use, image transforms for avatars/events)
  → DEV fallback: save to server/uploads/ when Cloudinary keys absent (documented)
  → returns {url, publicId, name, mimeType, size}
Client: store returned attachment meta in the domain mutation (e.g., post images[], resource file)
Server: resource file → admin moderation (pending) · chat attachments → message kind=file
Safety: no HTML/SVG allowed · randomized filenames · per-user quota guard
```

---

## 16. Payment Flow (Razorpay — test mode)

```
1. Donor clicks Donate on scholarship funding page
   → POST /api/donations/create-order {scholarshipId, amount(INR), message, anonymous}
   → Server: validate scholarship active + deadline → razorpay.orders.create()
   → Save Payment{status:'created', orderId} + Donation{status:'created'} → return {orderId, keyId, amount}
2. Client loads Razorpay checkout (test mode) → donor pays (card data never touches our server)
3. Success → POST /api/donations/verify {orderId, paymentId, signature}
   → Server: HMAC_SHA256(order_id|payment_id, key_secret) compare → Payment paid →
     Donation paid (receiptNumber generated) → scholarship.raisedAmount += amount ·
     donation_success notification to donor + sponsor · receipt email (PDF generated server-side)
4. Webhook → POST /api/donations/webhook (raw body, X-Razorpay-Signature verified w/ webhook secret)
   → handle payment.captured / payment.failed / refund.processed → sync statuses, audit log
5. Failure → status failed (UI retry) · Refund (where applicable) → status refunded · audit
6. Funding dashboard: target vs raised vs remaining vs donor count vs students supported (Recharts)
No card data stored anywhere. All keys in env (test mode keys documented in README).
```

---

## 17. Notifications & Email Flows

- **Trigger service:** one `notify(userId, type, title, body, data)` service — writes Notification doc + pushes via Socket.IO if online + optionally enqueues email. Used by every module (connections, meetings, events, scholarships, donations, jobs, resources, announcements, admin actions).
- **Email templates** (reusable HTML, `emails/`): welcome, verification, password-reset, meeting-invitation, meeting-reminder, event-registration, event-reminder, scholarship-application, scholarship-status, donation-receipt, new-opportunity, announcement. Sent via Nodemailer (dev: console transport).
- **Scheduled reminders:** lightweight in-process scheduler (node-cron) checks upcoming events/meetings/scholarship deadlines → reminder emails + notifications (documented; production can swap for a queue).

---

## 18. Search & Pagination Strategy

- Server-side everywhere: `?page=&limit=&sort=&search=&filters…`; capped `limit` (default 10–20); returns `{items, total, page, totalPages}`.
- Text search: `$text` indexes on User(name), Resource(title), Job(title,company), Post(content) + regex fallback; people filters via profile fields (department, batch, graduationYear, company, industry, skills, location, designation).
- Global search endpoint aggregates per type with type-specific projection.
- DB: `select` projections, `lean()` on lists, paginated `populate` only required refs; compound indexes per §6.

---

## 19. Security Controls (spec §25 — mapped)

| Control | Implementation |
|---|---|
| Password hashing | bcrypt, cost 12 |
| JWT | HS256, short-lived access; refresh rotation + revocation + hashed-at-rest |
| Cookies | httpOnly, Secure, SameSite=Lax for refresh |
| Helmet | security headers |
| CORS | allowlist from env (`CLIENT_URL`) |
| Rate limiting | express-rate-limit: strict on auth/forgot/reset/upload; standard on APIs |
| Input validation | Zod on every route; no trust in raw body |
| Query sanitization | express-mongo-sanitize (no `$where`/`$gt` injection) |
| XSS | sanitize rich text (client render escapes by default; server strips HTML in content fields) |
| Secure uploads | MIME whitelist + size caps + no SVG/HTML + randomized names (spec §24) |
| Authz | `requireRole`/`requirePermission` middleware on every protected route + ownership checks (organizer/author/sponsor) |
| Payment security | order/verify HMAC + webhook signature verification; secrets in env only |
| Secrets | `.env` only, `.env.example` committed, `.gitignore` protects `.env` |
| Admin actions | audit-logged (actor, action, target, reason, IP, UA, timestamp) |
| Notifications privacy | sensitive docs only visible to owner + reviewers |

---

## 20. Testing Strategy (spec §44)

- **Server (Vitest + Supertest + mongodb-memory-server):** auth (register/verify/login/refresh/logout/forgot/reset), authorization (role denial matrix), user registration (role fields), event registration, attendance (QR check-in happy/expired/duplicate), scholarship application, donation verify (valid/invalid signature), job posting, chat message persistence, Zod validation rejections.
- **Client (Vitest + React Testing Library):** core components (LoginForm, RegisterForm, ConnectionButton, PostCard, filters), route guard behavior, responsive layout smoke tests.
- **Manual QA checklist** per page (responsive breakpoints 360/768/1024/1440) + end-to-end flow walkthroughs (§8.5) documented in README.

---

## 21. Deployment Plan

| Target | Service | Config |
|---|---|---|
| Frontend | **Vercel** (or Netlify) | build `npm run build`, SPA rewrite for React Router, env: `VITE_API_URL`, `VITE_SOCKET_URL` |
| Backend | **Render** (or Railway/AWS) | Node 20+, start `npm start`, env group with all vars, persistent disk if local-upload fallback used |
| Database | **MongoDB Atlas** | cluster + network access (Render IPs/0.0.0.0 with auth), indexes via `npm run db:indexes` or autoIndex dev only |
| Files | **Cloudinary** | cloud name, API key/secret |
| Payments | **Razorpay** | test mode keys initially; webhook URL → `/api/donations/webhook` |
| Email | SMTP (SendGrid/Resend/Brevo) | host/port/user/password |
| Process | | single Express process serving REST + Socket.IO; `trust proxy` + rate-limit config; health endpoint `/api/health`; PM2/systemd on VPS option |
| CI/CD | | optional GitHub Actions: lint → test → build → deploy |

Root scripts: `npm run dev` (concurrently client+server), `npm run dev:server`, `npm run dev:client`, `npm run build`, `npm start`, `npm run seed`, `npm test`.

---

## 22. Development Roadmap (approval gates)

**Process:** each gate = stop → user approval → next. Every page ships with full-stack slice (model if new + API + controller + validation + authz + UI + RTK Query + loading/error/empty states + toasts + accessibility + responsive). No TODOs/placeholders ever.

### Phase 1 — Project Initialization *(gate)*
1. Root workspace: `package.json` (workspaces + concurrently), `.gitignore`, `.prettierrc`, ESLint config
2. `server/` scaffold: Express + ESM, `app.js`/`server.js` skeleton, `config/env.js`, health endpoint
3. `client/` scaffold: Vite + React + Tailwind + router + store skeleton
4. Install all dependencies (both sides) · `.env.example` (spec §45) · smoke run `npm run dev`
**→ Approve to continue**

### Phase 2 — Backend Foundation *(gate)*
5. `config/`: db.js (Mongo), cloudinary.js, razorpay.js, mailer.js, constants.js
6. **All 34 models** (§6) with validation, indexes, timestamps
7. Middleware: errorHandler, notFound, auth, rbac, validate, rateLimiter, upload, sanitize
8. utils: ApiError/ApiResponse/asyncHandler, jwt service, tokenStore, audit logger, pagination, QR utils, csv/xlsx/pdf exporters
9. **Auth module complete**: controllers + services + routes + validators (register/verify/login/refresh/logout/forgot/reset/me/change-password) + email templates + AuditLog hooks
10. Seed script (v1: admin + 5 faculty + 15 alumni + 30 students + demo credentials)
**→ Approve to continue**

### Phase 3 — Frontend Foundation *(gate)*
11. Vite config (proxy), Tailwind theme tokens (blue/green, light, rounded, shadows), global styles, fonts
12. Router config + ProtectedRoute/RoleRoute guards + 404/403
13. Layouts: PublicLayout, AppLayout (sidebar), AdminLayout, MobileBottomNav
14. Store: authSlice, uiSlice, RTK Query baseQuery with interceptors + refresh queue, socket client singleton + wiring
15. UI kit primitives (§12.1) + EmptyState/ErrorState/Skeleton + toast setup
**→ Approve to continue**

### Phase 4+ — Pages (one at a time, each gated)
| # | Page/Module | Full-stack slice |
|---|---|---|
| 1 | Landing + About | public pages, stats, sections (§49) |
| 2 | Login | auth API wiring, validation, session persistence |
| 3 | Register (role tabs) | role-based forms + verification + pending-approval state |
| 4 | Forgot / Reset / Verify Email | token flows, emails |
| 5 | **Dashboard** | role-aware widgets + quick actions (spec §5) |
| 6 | **Profile** | view/edit, role profile, avatar upload, privacy settings (§4, §41) |
| 7 | **People Directory + Connections** | filters, cards, request lifecycle, suggestions |
| 8 | **Messages (Chat)** | Socket.IO real-time, typing, read receipts, attachments, block |
| 9 | **Notifications** | list, mark read/all, real-time push, unread badge |
| 10 | **Events** | list/filters/details/register/organizer dashboard |
| 11 | **Attendance + QR** | QR generate/scan/expiry, manual mark, summary, export |
| 12 | **Meetings** | schedule/invite/respond/reschedule/cancel/reminders |
| 13 | **Scholarships** | campaigns, apply (docs), student dashboard |
| 14 | **Donations** | Razorpay order/verify, receipts, funding dashboard, webhook |
| 15 | **Jobs & Internships** | board, filters, save/share/apply/report, moderation |
| 16 | **Study Resources** | categories, upload, rate, bookmark, download, moderation |
| 17 | **Community Feed** | posts/comments/likes/save/report/share |
| 18 | **Announcements** | publish (faculty/admin), audience, auto-notify |
| 19 | **Global Search** | cross-entity search + filters |
| 20 | **Mentorship + Referrals** | offer/request/sessions; referral flow |
| 21 | **Certificates + Badges + Reputation** | issue/verify QR certs; badge display; reputation scoring |
| 22 | **Roadmaps + Placement Prep** | content module on Resources infra |
| 23 | **Admin Dashboard + Users** | KPI cards, charts, user management, approvals |
| 24 | **Admin Content + Finance** | moderation queue, donations/scholarships mgmt |
| 25 | **Reports + Audit Logs + Settings** | 9 exports, audit viewer, system settings |
| 26 | **Analytics (role-scoped)** | student/alumni/faculty analytics pages |

### Phase 5 — Hardening & Release *(gate)*
27. Seed completion (content: events, jobs, resources, scholarships, posts) · README (spec §46) · full API docs
28. Tests: auth/authz/registration/event/attendance/scholarship/donation/job/chat/validation (§44)
29. Security pass, performance (indexes, projections, code splitting), a11y pass, responsive QA
30. Deployment configs (Vercel/Render/Atlas) + troubleshooting doc
**→ Final approval → ship**

---

## 23. Definition of Done (per page)

- [ ] MongoDB model(s) + indexes (if new) with validation
- [ ] REST endpoints: controller + service + Zod validator + authz middleware
- [ ] Consistent envelope responses + centralized error handling
- [ ] RTK Query slice with tag invalidation; no manual fetch boilerplate
- [ ] Responsive UI (360px → 1440px), accessible (labels, focus, contrast, ARIA)
- [ ] Loading skeletons, empty states, error states, success toasts
- [ ] Real persistence verified (no fake buttons)
- [ ] Audit logging where required · notifications/emails triggered where required
- [ ] No TODOs/placeholders/console noise · code reviewed against spec
- [ ] Updated seed data where applicable

---

## 24. Assumptions, Risks & Open Items

**Assumptions**
1. Single college/university instance (no multi-tenant orgs).
2. Razorpay **test mode** — merchant keys required for real checkout; UI degrades gracefully with a clear message if keys are absent in dev.
3. SMTP optional in dev (console transport); required for production email features.
4. Cloudinary optional in dev (local upload fallback); required in production.
5. Certificates and receipts generated server-side as PDF (pdfkit) with QR (qrcode package).
6. Meeting/event video uses external links (Meet/Zoom) — no built-in video conferencing (spec §8).

**Risks**
- Scope is very large (~30 modules) → mitigated by strict page-by-page gates and reusable foundations.
- Third-party key availability for local demo → dev fallbacks documented above.
- Socket.IO scaling on free Render tier → single-instance deployment documented; sticky sessions note for multi-instance.

**Open items (will confirm with you if needed before the relevant phase):**
- None blocking. Choices in §3 are decisions I've made per the spec; happy to adjust (e.g., Yup instead of Zod, Axios-only instead of RTK Query, Toastify instead of Sonner).
