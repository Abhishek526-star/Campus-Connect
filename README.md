<div align="center">

# 🎓 Campus Connect

### Connect. Learn. Give Back. Grow Together.

**A full-stack MERN community platform connecting students, faculty, alumni, and administrators in one digital ecosystem.**

<p>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.IO-Realtime-010101?logo=socket.io&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

<p>
  <img src="https://img.shields.io/badge/Tests-40-success" alt="40 Tests" />
  <img src="https://img.shields.io/badge/Modules-30%2B-blue" alt="30+ Modules" />
  <img src="https://img.shields.io/badge/Pages-40%2B-orange" alt="40+ Pages" />
  <img src="https://img.shields.io/badge/Database%20Collections-34-purple" alt="34 Collections" />
</p>

</div>

---

## 📖 Table of Contents

- [🎯 Overview](#-overview)
- [💡 Problem Statement](#-problem-statement)
- [🚀 Solution](#-solution)
- [👥 User Roles](#-user-roles)
- [✨ Features](#-features)
- [🖼️ Screenshots](#️-screenshots)
- [🧱 Tech Stack](#-tech-stack)
- [🏗️ System Architecture](#️-system-architecture)
- [🔄 Core Workflows](#-core-workflows)
- [📁 Project Structure](#-project-structure)
- [⚙️ Installation](#️-installation)
- [🔐 Environment Variables](#-environment-variables)
- [🗄️ Database Setup](#️-database-setup)
- [🌱 Database Seeding](#-database-seeding)
- [📚 API Documentation](#-api-documentation)
- [🧪 Testing](#-testing)
- [☁️ Deployment](#️-deployment)
- [🛠️ Troubleshooting](#️-troubleshooting)
- [🔒 Security](#-security)
- [🛣️ Future Enhancements](#️-future-enhancements)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👨‍💻 Author](#-author)

---

# 🎯 Overview

**Campus Connect** is a production-oriented MERN-based alumni–student community platform that brings the major activities of a college ecosystem into one centralized application.

The platform connects:

- 🎓 Students
- 👨‍🏫 Faculty
- 🧑‍💼 Alumni
- 🛡️ Administrators

It provides a unified environment for:

- Networking
- Mentorship
- Scholarships
- Donations
- Events
- QR-based attendance
- Jobs and internships
- Study resources
- Community discussions
- Meetings
- Real-time communication
- Career preparation
- Placement preparation

The project was built page-by-page from a detailed specification and includes a dedicated development roadmap and API documentation.

---

# 💡 Problem Statement

College communities often use separate platforms for:

- Alumni networking
- Student mentorship
- Scholarship applications
- Event registration
- Attendance
- Job and internship opportunities
- Study resources
- Announcements
- Communication

This creates fragmented information, duplicated workflows, and poor interaction between students, alumni, faculty, and administrators.

### Campus Connect solves this by providing a single platform where these workflows are connected.

---

# 🚀 Solution

Campus Connect provides a centralized digital campus community with:

```text
                    CAMPUS CONNECT
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
     Students          Alumni            Faculty
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                    Administrator
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   Networking        Scholarships       Careers
        │                 │                 │
   Mentorship        Donations         Placements
        │                 │                 │
    Events          Community          Resources
        │                 │                 │
        └────────── Real-Time Chat ────────┘
```

---

# 👥 User Roles

## 🎓 Student

Students can:

- Create and manage profiles
- Connect with alumni, faculty, and other students
- Send and receive messages
- Attend events
- Apply for scholarships
- Explore jobs and internships
- Access study resources
- Participate in community discussions
- Join mentorship programs
- Follow career roadmaps
- Prepare for placements

## 🧑‍💼 Alumni

Alumni can:

- Build professional profiles
- Connect with students and other alumni
- Provide mentorship
- Share opportunities
- Participate in meetings
- Create or support scholarship campaigns
- Donate to students
- Share community posts
- Provide referrals

## 👨‍🏫 Faculty

Faculty can:

- Maintain professional profiles
- Connect with students and alumni
- Participate in meetings
- Share resources
- Participate in community activities
- Publish or interact with announcements

## 🛡️ Administrator

Administrators can:

- Manage users
- Approve faculty/alumni registrations
- Moderate content
- Manage events
- Manage scholarships
- Monitor donations
- Manage opportunities
- Manage resources
- View analytics
- Generate reports
- Review audit logs
- Configure system settings

---

# ✨ Features

## 🔐 Authentication & RBAC

- JWT access tokens
- Rotating HTTP-only refresh tokens
- Email verification
- Password reset
- Google authentication
- Admin approval workflow
- Role-Based Access Control
- Frontend + backend authorization

---

## 👤 Profiles & Privacy

Role-specific profiles support:

- Education
- Experience
- Achievements
- Projects
- Certifications
- Social links
- Profile avatars

### Privacy Levels

Each profile field can have different visibility:

```text
Public
   ↓
Connections
   ↓
Private
```

Privacy rules are enforced server-side.

---

## 🤝 Networking & Connections

- Searchable user directory
- Advanced filtering
- Connection requests
- Accept / reject requests
- Cancel requests
- Remove connections
- Connection suggestions

---

## 💬 Real-Time Messaging

Built using **Socket.IO**.

Features include:

- One-to-one messaging
- Online/offline presence
- Typing indicators
- Read receipts
- Attachments
- Delete-for-self
- Block users
- Report users

---

## 📅 Meetings

Users can schedule:

- One-to-one meetings
- Group meetings

Supported meeting links:

- Google Meet
- Zoom

Additional features:

- Invitations
- Accept / reject
- Rescheduling
- Reminders

---

## 🎫 Events & QR Attendance

The event system provides:

- Event creation
- Event registration
- Capacity limits
- Registration deadlines
- QR-based attendance
- Expiring QR tokens
- Camera scanning
- Duplicate prevention
- Manual attendance marking
- CSV export
- Excel export
- PDF export

---

## 🎓 Scholarships

Scholarship functionality includes:

- Scholarship campaigns
- Student applications
- Document submission
- Application review workflow
- Application state management
- Funding dashboards
- Donation integration

---

## 💳 Donations & Payments

Razorpay is integrated for donation payments.

Includes:

- Test-mode payments
- HMAC signature verification
- Payment webhooks
- Payment status tracking
- Refund event handling
- PDF receipts

---

## 💼 Jobs & Internships

Opportunity management includes:

- Job listings
- Internship listings
- Search
- Filters
- Save opportunities
- Share opportunities
- Platform applications
- External applications
- Reporting
- Admin moderation

---

## 📚 Study Resources

Resources are organized for:

- GATE
- Semester
- Placements
- Development

Users can:

- Rate resources
- Bookmark resources
- Download resources

Administrators can approve resources before publication.

---

## 📰 Community

A social-style community system supports:

- Posts
- Likes
- Comments
- Shares
- Saves
- Reports
- Rich content composer

---

## 📢 Announcements

Administrators can publish targeted announcements with automatic notifications.

---

## 🔔 Notifications

The system supports **25 notification types**.

Notifications can be delivered through:

- In-app real-time notifications
- Email

Users can:

- Mark notifications as read
- Mark all as read
- View notification badges

---

## 🔎 Global Search

Global search aggregates results across multiple platform entities with type-based filtering.

---

## 🧑‍🏫 Mentorship & Referrals

- Mentor directory
- Mentorship opportunities
- Referral offers
- Participation certificates
- QR-verifiable certificates

---

## 🛣️ Career & Placement Preparation

The platform includes:

- 9 seeded career roadmaps
- Placement preparation hub
- Career-focused resources

---

## 📊 Admin Analytics

The administration suite provides:

- KPI dashboard
- 6 charts
- User management
- Content moderation
- Finance monitoring
- 9 exportable reports
- Audit logs
- System settings

---

# 🖼️ Screenshots

> Add your actual screenshots inside `docs/screenshots/`.

Recommended screenshots:

```text
docs/
└── screenshots/
    ├── landing-page.png
    ├── login.png
    ├── student-dashboard.png
    ├── alumni-profile.png
    ├── community.png
    ├── chat.png
    ├── events.png
    ├── qr-attendance.png
    ├── scholarships.png
    ├── jobs.png
    ├── resources.png
    └── admin-dashboard.png
```

Example:

```md
## 🖥️ Dashboard

![Student Dashboard](docs/screenshots/student-dashboard.png)
```

### ⭐ Recommended Screenshots for Your GitHub Repository

If this is primarily a portfolio project, prioritize:

1. Landing page
2. Student dashboard
3. Alumni profile
4. Community page
5. Real-time chat
6. Events + QR attendance
7. Scholarship page
8. Admin dashboard

---

# 🧱 Tech Stack

## Frontend

| Technology | Purpose |
|---|---|
| React 19 | UI development |
| Vite 8 | Build tooling |
| Tailwind CSS 4 | Styling |
| React Router 8 | Routing |
| Redux Toolkit | Global state |
| RTK Query | API state management |
| React Hook Form | Forms |
| Zod | Validation |
| Recharts | Data visualization |
| Lucide | Icons |
| Socket.IO Client | Real-time communication |
| Sonner | Notifications |
| html5-qrcode | QR scanning |

## Backend

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express 5 | REST API |
| MongoDB | Database |
| Mongoose 9 | ODM |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Socket.IO | Real-time communication |
| Multer | File uploads |
| Cloudinary | File storage |
| Razorpay | Payments |
| Nodemailer | Email |
| Helmet | Security headers |
| CORS | Cross-origin security |
| express-rate-limit | Rate limiting |
| compression | Response compression |

## Testing

- Vitest
- Supertest
- 40 automated tests

## Deployment

- Vercel / Netlify → Frontend
- Render / Railway / AWS → Backend
- MongoDB Atlas → Database
- Cloudinary → File storage

The project's current stack and deployment targets are documented in the source README.

---

# 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────┐
│                    CLIENT                           │
│                                                     │
│ React + Vite + Tailwind                             │
│ Redux Toolkit + RTK Query                           │
│ React Router + Socket.IO Client                     │
└───────────────────────┬─────────────────────────────┘
                        │
                REST API / WebSocket
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                    SERVER                           │
│                                                     │
│ Express.js                                          │
│                                                     │
│ Routes                                              │
│    ↓                                                │
│ Zod Validation                                      │
│    ↓                                                │
│ Controllers                                         │
│    ↓                                                │
│ Services                                            │
│    ↓                                                │
│ Mongoose Models                                     │
└───────────────────────┬─────────────────────────────┘
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
   ┌─────────┐    ┌───────────┐    ┌──────────┐
   │ MongoDB │    │ Cloudinary│    │ Razorpay │
   │         │    │           │    │          │
   │ Database│    │ File Store│    │ Payments │
   └─────────┘    └───────────┘    └──────────┘
                        │
                        ▼
                   ┌──────────┐
                   │   SMTP   │
                   │  Gmail   │
                   └──────────┘
```

---

# 🔄 Core Workflows

## 🎓 Scholarship Workflow

```text
Alumni/Admin
     │
     ▼
Create Scholarship Campaign
     │
     ▼
Student Applies
     │
     ▼
Upload Documents
     │
     ▼
Application Review
     │
     ├── Rejected
     │
     └── Approved
             │
             ▼
       Scholarship Award
```

---

## 🎫 Event Attendance Workflow

```text
Admin
 │
 ▼
Create Event
 │
 ▼
Student Registers
 │
 ▼
Generate QR Token
 │
 ▼
Student Scans QR
 │
 ▼
Validate Token
 │
 ├── Invalid / Expired → Reject
 │
 └── Valid → Mark Attendance
                    │
                    ▼
              Attendance Report
```

---

## 💳 Donation Workflow

```text
Donor
 │
 ▼
Select Scholarship
 │
 ▼
Create Razorpay Order
 │
 ▼
Complete Payment
 │
 ▼
Verify Signature
 │
 ▼
Process Webhook
 │
 ▼
Update Donation
 │
 ▼
Generate Receipt
```

---

## 🤝 Connection Workflow

```text
User A
  │
  ▼
Send Connection Request
  │
  ▼
User B
  │
  ├── Accept ──────► Connected
  │
  └── Reject ──────► Request Closed
```

---

# 📁 Project Structure

```text
campus-connect/
│
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   ├── tests/
│   ├── seed/
│   └── package.json
│
├── docs/
│   ├── API.md
│   └── screenshots/
│
├── DEVELOPMENT_ROADMAP.md
├── .env.example
├── vercel.json
├── render.yaml
└── package.json
```

The current project structure contains separate React client and Express server applications, API documentation, deployment configuration, and a development roadmap.

---

# ⚙️ Installation

## Prerequisites

Make sure the following are installed:

- Node.js
- npm
- MongoDB or MongoDB Atlas
- Git

Optional services:

- Cloudinary
- Razorpay
- Google OAuth
- Gmail SMTP

---

## 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd campus-connect
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

```bash
cp .env.example server/.env
```

Update:

```text
server/.env
```

with your credentials.

## 4. Start the Application

```bash
npm run dev
```

### Local URLs

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:5000` |
| Health Check | `http://localhost:5000/api/health` |

These development commands and ports correspond to the current project configuration.

---

# 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run client and server concurrently |
| `npm run dev:server` | Run backend only |
| `npm run dev:client` | Run frontend only |
| `npm run build` | Build frontend |
| `npm run start` | Start production API |
| `npm run seed` | Seed database |
| `npm run seed -- --force` | Reset and seed database |
| `npm run test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |

---

# 🔐 Environment Variables

Create:

```text
server/.env
```

## Application

```env
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## MongoDB

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

## Google OAuth

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

The required environment-variable groups are based on the project's existing configuration.

> 🔒 **Never commit real API keys, passwords, JWT secrets, or `.env` files to Git.**

---

# 🗄️ Database Setup

## Local MongoDB

```env
MONGO_URI=mongodb://127.0.0.1:27017/campus_connect
```

## MongoDB Atlas

1. Create an Atlas cluster.
2. Create a database user.
3. Configure Network Access.
4. Add your IP address.
5. Copy the connection string.
6. Add it to `MONGO_URI`.

---

# 🌱 Database Seeding

Seed the development database:

```bash
npm run seed
```

Force reset and reseed:

```bash
npm run seed -- --force
```

The existing seed configuration provides:

```text
1 Admin
5 Faculty
15 Alumni
30 Students
7 Events
2 Meetings
4 Scholarship Campaigns
6 Paid Donations
5 Opportunities
6 Resources
6 Community Posts
4 Announcements
7 Connections
1 Demo Conversation
9 Career Roadmaps
```

---

# 📚 API Documentation

Detailed API documentation is available at:

```text
docs/API.md
```

It contains:

- Endpoints
- HTTP methods
- Request payloads
- Response formats
- Authentication requirements
- Access levels

---

# 🧪 Testing

Run the test suite:

```bash
npm run test
```

Current test coverage includes **40 tests across 8 suites**.

### Tested Areas

- Authentication
- Registration
- Email verification
- Login
- Refresh-token rotation
- Logout
- Password reset
- RBAC
- Event registration
- QR attendance
- Scholarship applications
- Scholarship review workflow
- Donation signature verification
- Payment webhooks
- Job posting
- Job moderation
- Chat
- Blocking
- API validation

---

# ☁️ Deployment

## Frontend — Vercel

Recommended configuration:

```text
Root Directory: client
Build Command: npm run build
Output Directory: dist
```

The repository already includes `vercel.json`.

---

## Backend — Render

```text
Build Command:
npm install --workspace server

Start Command:
npm run start
```

Health check:

```text
/api/health
```

Configure all production environment variables in the Render dashboard.

---

## Database — MongoDB Atlas

Use your Atlas connection string:

```env
MONGO_URI=
```

---

## File Storage — Cloudinary

Configure:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

# 🔒 Security

Campus Connect implements multiple application-security controls, including:

- JWT authentication
- HTTP-only refresh tokens
- Role-Based Access Control
- Server-side authorization
- Zod request validation
- Password hashing with bcryptjs
- Helmet security headers
- CORS configuration
- Rate limiting
- Input sanitization
- Payment signature verification
- Razorpay webhook verification
- Privacy enforcement
- User blocking/reporting

> Production deployments should use strong, unique secrets and should never expose private credentials in source control.

---

# 🛠️ Troubleshooting

| Issue | Solution |
|---|---|
| `MONGO_URI is not set` | Create `server/.env` |
| Login shows pending approval | Approve faculty/alumni account from Admin |
| Razorpay error | Configure test-mode Razorpay credentials |
| Emails not arriving | Configure Gmail SMTP |
| Files stored locally | Configure Cloudinary |
| Port already in use | Stop the process using ports `5173` / `5000` |
| Tests cannot connect | Start MongoDB on port `27017` |

### Linux / macOS

```bash
fuser -k 5173/tcp
fuser -k 5000/tcp
```

---

# 🛣️ Future Enhancements

Potential future improvements for Campus Connect include:

- 📱 Progressive Web App / mobile application
- 🤖 AI-powered mentor recommendations
- 🤖 AI-based career roadmap recommendations
- 🔍 Advanced semantic search
- 📊 More advanced analytics
- 📧 Notification preference management
- 🏢 Company/recruiter portal
- 🎥 Integrated video meetings
- 🏆 Gamification and community badges
- 📈 Advanced alumni engagement analytics
- 🌐 Multi-college / multi-institution support

> These are proposed future enhancements and are **not currently represented as implemented features**.

---

# 📊 Project Metrics

| Metric | Current Status |
|---|---:|
| Database Collections | **34** |
| Application Modules | **30+** |
| Pages | **40+** |
| Automated Tests | **40** |
| Notification Types | **25** |
| Career Roadmaps | **9** |
| Admin Reports | **9** |
| Admin Dashboard Charts | **6** |

---

# 🏆 Project Highlights

### Why this project stands out

**1. Full-stack architecture**

```text
React
  ↓
RTK Query
  ↓
Express REST API
  ↓
Mongoose
  ↓
MongoDB
```

**2. Real-time functionality**

Socket.IO enables:

- Messaging
- Presence
- Typing indicators
- Read receipts
- Notifications

**3. Secure authentication**

- JWT access tokens
- Rotating refresh tokens
- HTTP-only cookies
- RBAC
- Email verification

**4. Payment integration**

Razorpay integration includes:

- Order creation
- Payment verification
- HMAC validation
- Webhooks
- Receipts

**5. Production-oriented deployment**

The project includes deployment configurations for:

- Vercel
- Render
- MongoDB Atlas
- Cloudinary

**6. Automated testing**

40 tests cover major business-critical workflows.

---

# 🤝 Contributing

Contributions are welcome.

### Development Workflow

```bash
# Create a branch
git checkout -b feature/your-feature

# Make your changes

# Run tests
npm run test

# Run lint
npm run lint

# Commit
git commit -m "feat: add your feature"

# Push
git push origin feature/your-feature
```

Then open a Pull Request.

For a public repository, adding a dedicated `CONTRIBUTING.md` is preferable as the contribution process grows; GitHub recommends repository-level contribution guidance alongside the README.

---

# 📄 License

This project is currently **not assigned a license in the provided project documentation**.

If you intend to publish Campus Connect as open-source software, add an appropriate `LICENSE` file and update this section. GitHub notes that without a license, default copyright rules apply, so users generally do not receive permission to reproduce, distribute, or create derivatives of the code.

---

# 👨‍💻 Author

### Abhishek Kumar

**B.Tech — Computer Science Engineering**

Interested in:

- Full-Stack Development
- MERN Stack
- Backend Engineering
- Cloud & Deployment
- Generative AI
- Data Structures & Algorithms

---

# ⭐ Support the Project

If you find **Campus Connect** useful or interesting:

- ⭐ Star the repository
- 🍴 Fork the repository
- 🐛 Report bugs
- 💡 Suggest features
- 🤝 Contribute improvements

---

<div align="center">

### 🎓 Campus Connect

**Connect. Learn. Give Back. Grow Together.**

Built with ❤️ using the MERN Stack.

</div>
