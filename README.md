# 🎓 Campus Connect

> **Connect. Learn. Give Back. Grow Together.**

A production-ready, full-stack **MERN alumni–student community platform** designed to connect **students, faculty, alumni, and administrators** in one unified digital ecosystem.

Campus Connect provides networking, mentorship, scholarships, events, QR-based attendance, jobs & internships, study resources, community interaction, and real-time communication.

---

## 📌 Table of Contents

- [✨ Features](#-features)
- [🧱 Tech Stack](#-tech-stack)
- [🏗️ Architecture](#️-architecture)
- [🚀 Getting Started](#-getting-started)
- [🔐 Environment Variables](#-environment-variables)
- [🌱 Database Seeding](#-database-seeding)
- [👤 Demo Accounts](#-demo-accounts)
- [📚 API Documentation](#-api-documentation)
- [🧪 Testing](#-testing)
- [☁️ Deployment](#️-deployment)
- [🛠️ Troubleshooting](#️-troubleshooting)
- [📦 Project Structure](#-project-structure)
- [✅ Project Status](#-project-status)

---

## ✨ Features

### 🔐 Authentication & Authorization

- JWT-based authentication
- Rotating HTTP-only refresh tokens
- Email verification
- Password reset
- Admin approval for faculty and alumni registrations
- Role-Based Access Control (RBAC)
- Frontend and backend authorization

### 👤 Profiles & Privacy

- Role-specific user profiles
- Education and experience
- Achievements and projects
- Certifications and social links
- Avatar uploads
- Field-level privacy controls:
  - Public
  - Connections
  - Private
- Server-side privacy enforcement

### 🤝 People & Connections

- Searchable user directory
- Advanced filters
- Connection requests
- Accept / reject / cancel connections
- Remove connections
- Connection suggestions

### 💬 Real-Time Chat

- One-to-one messaging using Socket.IO
- Online/offline presence
- Typing indicators
- Read receipts
- File attachments
- Delete-for-self
- Block users
- Report users

### 📅 Meetings

- One-to-one and group meetings
- Google Meet / Zoom links
- Meeting invitations
- Accept / reject invitations
- Rescheduling
- Meeting reminders

### 🎫 Events & QR Attendance

- Create and manage events
- Registration system
- Capacity and registration deadline protection
- Expiring rotating QR tokens
- Camera-based QR scanning
- Duplicate attendance prevention
- Manual attendance marking
- CSV / Excel / PDF attendance exports

### 🎓 Scholarships & Donations

- Scholarship campaigns
- Student scholarship applications
- Document uploads
- Application review workflow
- Transparent funding dashboards
- Razorpay test-mode payments
- HMAC signature verification
- Payment webhooks
- PDF donation receipts

### 💼 Jobs & Internships

- Job and internship opportunity board
- Search and filtering
- Save opportunities
- Share opportunities
- Apply through the platform or externally
- Report opportunities
- Admin moderation

### 📚 Study Resources

Dedicated resource library for:

- GATE preparation
- Semester studies
- Placement preparation
- Development resources

Additional features:

- Ratings
- Bookmarks
- Downloads
- Admin approval

### 📰 Community & Announcements

- Community posts
- Likes
- Comments
- Shares
- Saves
- Reports
- Rich-text composer
- Targeted announcements
- Automatic notifications

### 🔔 Notifications

- 25 notification types
- Real-time in-app notifications
- Email notifications
- Mark as read
- Mark all as read
- Notification badges

### 🔎 Global Search

Search across multiple platform entities with type-based filtering.

### 🧑‍🏫 Mentorship & Referrals

- Mentor directory
- Mentorship opportunities
- Referral offers
- QR-verifiable participation certificates

### 🚀 Career & Placement

- 9 predefined career roadmaps
- Placement preparation hub
- Career-focused resources

### 🛡️ Admin Dashboard

Admin features include:

- KPI dashboard
- 6 analytical charts
- User management
- Content moderation
- Finance management
- 9 exportable reports
- Audit logs
- System settings

### 📊 Additional

- Role-specific analytics
- 40 automated tests

---

# 🧱 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, React Router 8, Redux Toolkit, RTK Query, React Hook Form, Zod, Recharts, Lucide, Socket.IO Client, Sonner, html5-qrcode |
| **Backend** | Node.js, Express 5, MongoDB, Mongoose 9, JWT, bcryptjs, Socket.IO, Multer, Cloudinary, Razorpay, Nodemailer, Helmet, CORS, express-rate-limit, compression |
| **Testing** | Vitest, Supertest |
| **Deployment** | Vercel / Netlify, Render / Railway / AWS, MongoDB Atlas, Cloudinary |

---

# 🏗️ Architecture

```text
                    ┌─────────────────────────────┐
                    │       React SPA              │
                    │ RTK Query + Socket.IO Client │
                    └──────────────┬──────────────┘
                                   │
                       REST /api + WebSocket
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │       Express API            │
                    │                             │
                    │ Routes                      │
                    │ Validators (Zod)            │
                    │ Controllers                 │
                    │ Services                    │
                    │ Models                      │
                    └──────────────┬──────────────┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             │                     │                     │
             ▼                     ▼                     ▼
       ┌────────────┐       ┌────────────┐       ┌────────────┐
       │  MongoDB   │       │ Cloudinary │       │  Razorpay  │
       │ 34 Collections│    │   Files    │       │ Payments   │
       └────────────┘       └────────────┘       └────────────┘
                                   │
                                   ▼
                              SMTP / Email
```

### Backend Middleware

The backend includes:

- Authentication
- RBAC
- Request validation
- Rate limiting
- Sanitization
- File uploads
- Centralized error handling

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone <your-repository-url>
cd campus-connect
```

## 2. Install Dependencies

Install dependencies for both the client and server:

```bash
npm install
```

## 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example server/.env
```

Then update the values inside:

```text
server/.env
```

## 4. Start the Development Servers

```bash
npm run dev
```

The application will run at:

| Service | URL |
|---|---|
| 🌐 Frontend | http://localhost:5173 |
| ⚙️ API | http://localhost:5000 |
| ❤️ API Health Check | http://localhost:5000/api/health |

---

# 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start frontend and backend concurrently |
| `npm run dev:server` | Start only the backend |
| `npm run dev:client` | Start only the frontend |
| `npm run build` | Build the frontend for production |
| `npm run start` | Start the API server in production |
| `npm run seed` | Seed the database |
| `npm run seed -- --force` | Reset and re-seed the database |
| `npm run test` | Run automated tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Format the project using Prettier |

---

# 🔐 Environment Variables

Create:

```text
server/.env
```

using:

```text
.env.example
```

## Application

```env
PORT=
CLIENT_URL=
NODE_ENV=
```

## Database

```env
MONGO_URI=
```

## Authentication

```env
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN=
```

## Google Authentication

```env
GOOGLE_CLIENT_ID=
VITE_GOOGLE_CLIENT_ID=
```

## Cloudinary

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Razorpay

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

## Gmail SMTP

```env
SMTP_USER=
SMTP_PASSWORD=
```

> ⚠️ **Never commit `.env` files or real credentials to GitHub.**

---

# 🗄️ MongoDB Setup

## Local MongoDB

Install MongoDB locally and use:

```env
MONGO_URI=mongodb://127.0.0.1:27017/campus_connect
```

## MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Configure Network Access.
4. Add your development IP address.
5. For Render deployment, configure the appropriate network access.
6. Copy the Atlas connection string into `MONGO_URI`.

---

# ☁️ Cloudinary Setup

Cloudinary is used for file and image uploads.

1. Create a Cloudinary account.
2. Open the Cloudinary dashboard.
3. Copy:
   - Cloud Name
   - API Key
   - API Secret
4. Add them to `server/.env`.

Without Cloudinary credentials, development uploads fall back to:

```text
server/uploads/
```

---

# 💳 Razorpay Setup

Campus Connect uses Razorpay for donation payments.

## Test Mode

1. Create a Razorpay account.
2. Open **Dashboard → Settings → API Keys**.
3. Enable **Test Mode**.
4. Generate API keys.
5. Add them to `server/.env`.

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

## Webhook Configuration

For production, configure:

```text
POST /api/donations/webhook
```

Recommended events:

```text
payment.captured
payment.failed
refund.processed
```

Add the webhook secret:

```env
RAZORPAY_WEBHOOK_SECRET=
```

### Test Card

```text
Card: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any CVV
```

---

# 🔑 Google Sign-In Setup

1. Open Google Cloud Console.
2. Go to **APIs & Services → Credentials**.
3. Create an **OAuth Client ID**.
4. Select **Web Application**.
5. Add authorized JavaScript origins:

```text
http://localhost:5173
```

6. Add your production frontend origin.
7. Add the client ID to both:

```text
server/.env
client/.env
```

Example:

```env
GOOGLE_CLIENT_ID=
VITE_GOOGLE_CLIENT_ID=
```

Restart both servers after making the changes.

---

# 📧 Gmail SMTP Setup

Campus Connect uses Gmail SMTP for transactional emails.

## Requirements

Enable:

- Google 2-Step Verification
- Gmail App Password

Then configure:

```env
SMTP_USER=yourname@gmail.com
SMTP_PASSWORD=your-16-char-app-password
```

Emails include:

- Email verification
- Welcome emails
- Password reset
- Donation receipts
- Other transactional notifications

In development, if SMTP credentials are not configured, email links are logged to the server console.

---

# 🌱 Database Seeding

Run:

```bash
npm run seed
```

To reset and seed the database:

```bash
npm run seed -- --force
```

The seed process creates:

- 1 Admin
- 5 Faculty
- 15 Alumni
- 30 Students
- 7 Events
- 2 Meetings
- 4 Scholarship Campaigns
- 6 Paid Donations
- 5 Opportunities
- 6 Resources
- 6 Community Posts
- 4 Announcements
- 7 Connections
- 1 Demo Conversation
- 9 Career Roadmaps

---

# 👤 Demo Accounts

| Role | Email | Password |
|---|---|---|
| 🔴 Admin | `admin@campus.edu` | `Admin@123` |
| 🟣 Faculty | `faculty1@campus.edu` | `Faculty@123` |
| 🟢 Alumni | `alumni1@campus.edu` | `Alumni@123` |
| 🔵 Student | `student1@campus.edu` | `Student@123` |

> ⚠️ These credentials are for local/demo environments only. Change or remove them before production deployment.

---

# 📚 API Documentation

The complete API documentation is available at:

```text
docs/API.md
```

It contains:

- Endpoint catalog
- Request payloads
- Response formats
- Authentication requirements
- Role/access information

---

# 🧪 Testing

Run the automated test suite:

```bash
npm run test
```

The project currently contains **40 automated tests across 8 suites**.

Tests cover:

- Authentication
- Registration
- Email verification
- Login
- Refresh token rotation
- Logout
- Forgot/reset password
- RBAC authorization
- Event registration
- QR attendance
- Scholarship applications
- Scholarship review workflow
- Donation signature verification
- Payment webhooks
- Job posting
- Job moderation
- Chat messaging
- User blocking
- API validation

> Local MongoDB is required for the test suite.

---

# ☁️ Deployment

## Frontend → Vercel

1. Import the repository into Vercel.
2. Set the root directory to:

```text
client
```

3. Build command:

```bash
npm run build
```

4. Output directory:

```text
dist
```

5. Configure the required environment variables.
6. Ensure API and Socket.IO requests are correctly rewritten/proxied.

The project includes:

```text
vercel.json
```

---

## Backend → Render

The backend can be deployed using Render.

### Configuration

**Build Command**

```bash
npm install --workspace server
```

**Start Command**

```bash
npm run start
```

**Health Check**

```text
/api/health
```

Configure:

- MongoDB Atlas
- JWT secrets
- Cloudinary
- Razorpay
- Gmail SMTP
- `CLIENT_URL`

The project includes:

```text
render.yaml
```

for deployment configuration.

---

## Database → MongoDB Atlas

Use the MongoDB Atlas connection string as:

```env
MONGO_URI=
```

Database indexes are defined in the Mongoose models.

---

# 🛠️ Troubleshooting

| Problem | Solution |
|---|---|
| API won't start: `MONGO_URI is not set` | Create `server/.env` using `.env.example` |
| Login shows `pending admin approval` | Faculty/alumni registrations require admin approval |
| Razorpay setup error | Add Razorpay test-mode credentials and restart the server |
| Emails are not arriving | Configure Gmail SMTP credentials |
| Files are saved locally | Configure Cloudinary credentials for production |
| Port already in use | Stop the process using ports `5173` or `5000` |
| Tests cannot connect to MongoDB | Ensure MongoDB is running on port `27017` |

### Free Ports — Linux/macOS

```bash
fuser -k 5173/tcp
fuser -k 5000/tcp
```

---

# 📦 Project Structure

```text
campus-connect/
│
├── client/
│   └── React SPA
│       ├── Vite
│       ├── Tailwind CSS
│       ├── Redux Toolkit
│       ├── RTK Query
│       └── Socket.IO Client
│
├── server/
│   ├── Express API
│   ├── REST APIs
│   ├── Socket.IO
│   ├── Services
│   ├── Models
│   ├── Middleware
│   ├── Tests
│   └── Seed Scripts
│
├── docs/
│   └── API.md
│
├── DEVELOPMENT_ROADMAP.md
├── vercel.json
├── render.yaml
└── package.json
```

---

# 📈 Project Status

| Phase | Status |
|---|---|
| Phase 1 — Scaffolding & Tooling | ✅ Complete |
| Phase 2 — Backend Foundation | ✅ Complete |
| Phase 3 — Frontend Foundation | ✅ Complete |
| Phase 4 — Pages & Modules | ✅ Complete |
| Phase 5 — Testing & Deployment Hardening | ✅ Complete |

### Current Implementation

- **34 database models**
- **30+ modules**
- **40+ pages**
- **40 automated tests**
- API documentation
- Deployment configurations
- Authentication & RBAC
- Real-time communication
- Payment integration
- QR attendance
- Scholarship system
- Job/internship portal
- Community platform
- Admin dashboard

---

# 🏆 Project Highlights

Campus Connect combines multiple campus-community workflows into a single platform:

```text
Students ───────┐
                │
Faculty ────────┤
                ├──────► Campus Connect ◄────── Alumni
                │
Administrators ─┘
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
   Networking        Mentorship       Scholarships
       │                 │                 │
    Events          Jobs/Internships   Donations
       │                 │                 │
    Community       Study Resources     Placement
       │                 │                 │
       └──────────── Real-Time Chat ───────┘
```

---

## 📖 Documentation

For detailed project architecture and development history, see:

- `DEVELOPMENT_ROADMAP.md`
- `docs/API.md`

---

## ⭐ Project

**Campus Connect**

> **Connect. Learn. Give Back. Grow Together.**
