# Campus Connect — API Reference

Base URL: `/api` · Envelope: `{ success, message, data, meta? }` · Errors: `{ success: false, message, error: { code, details? } }`

Auth: `Authorization: Bearer <accessToken>` (except public endpoints). Refresh token lives in an httpOnly cookie (`cc_refresh`, path `/api/auth`).

---

## Auth (`/api/auth`)
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/register` | public | Role-based registration (student/faculty/alumni). Faculty & alumni → `requiresApproval: true` |
| POST | `/verify-email` | public | `{ token }` — single-use verification token from the email link |
| POST | `/resend-verification` | public | `{ email }` — generic response (no enumeration) |
| POST | `/login` | public | `{ email, password }` → user + accessToken; sets refresh cookie |
| POST | `/google` | public | `{ credential }` — Google ID token (Sign in with Google). New Gmail users get a verified, auto-approved student account; existing accounts are matched by email/googleId and their role gates still apply |
| POST | `/logout` | cookie | Revokes the refresh token, clears the cookie |
| POST | `/forgot-password` | public | `{ email }` — always the same generic response |
| POST | `/reset-password` | public | `{ token, password }` — single-use, revokes all sessions |
| GET | `/me` | auth | Current user + role profile |
| PATCH | `/change-password` | auth | `{ currentPassword, newPassword }` |

## Users & Profiles (`/api/users`)
| GET `/me` · PATCH `/me` (name/phone) · PATCH `/me/role-profile` · PATCH `/me/privacy` · PATCH `/me/avatar` (multipart `?use=avatar`) · GET `/:id` (privacy-filtered public view)

## People & Connections
- `GET /api/people` — directory: `role, search, department, graduationYear, company, industry, location, designation, skills, sort, page, limit`
- `GET /api/connections` · `GET /api/connections/requests` · `GET /api/connections/requests/outgoing` · `GET /api/connections/suggestions`
- `POST /api/connections/request` `{ recipientId }` · `PUT /api/connections/:id/accept|reject` · `DELETE /api/connections/:id` (cancel) · `DELETE /api/connections/:id/remove`

## Chat (`/api/…`)
- `GET /conversations` · `GET /conversations/search?q=` · `POST /conversations/direct` `{ userId }`
- `GET /messages/:conversationId?page=&limit=` · `POST /messages` `{ conversationId, content?, kind?, attachment? }`
- `PATCH /messages/:conversationId/read` · `DELETE /messages/:id` (delete for self)
- `POST /conversations/block` · `DELETE /conversations/block` · `POST /conversations/report`
- **Socket.IO** (same origin, `auth.token`): `conversation:join/leave` · `message:send` (ack) · `message:read` · `typing:start/stop` · `presence:get` · events `message:new`, `messages:read`, `typing:*`, `user:online/offline`, `notification:new`

## Events (`/api/events`)
| GET `/` (search, category, department, mode, period=upcoming\|past, sort, page) · GET `/:id` · GET `/mine` · GET `/:id/participants` (organizer/admin) · POST `/` (faculty/alumni/admin) · PUT `/:id` · DELETE `/:id` · POST `/:id/register` · DELETE `/:id/register`

## Attendance (`/api/attendance`)
| POST `/check-in` `{ qrToken }` (rotating signed token) · POST `/event/:id/qr-token` `{ durationMinutes }` (organizer) · POST `/event/:id/check-out` · GET `/event/:id` · GET `/event/:id/summary` · POST `/event/:id/manual` (organizer) · PUT `/:id?eventId=` (organizer edit) · GET `/user/:userId` · GET `/event/:id/export?format=csv\|xlsx\|pdf`

## Meetings (`/api/meetings`)
| GET `/` (status filter) · GET `/:id` · POST `/` (with `participantIds[]`) · PUT `/:id` (reschedule resets invitations) · PATCH `/:id/respond` `{ status: accepted\|rejected }` · PATCH `/:id/status` (organizer) · POST `/:id/remind` · DELETE `/:id`

## Scholarships (`/api/scholarships`)
| GET `/` (status, category, search) · GET `/:id` (funding progress + myApplication) · POST `/` (alumni/faculty/admin) · PUT `/:id` · POST `/:id/apply` (documents[]) · GET `/applications/mine` · GET `/applications/review` (sponsor/admin) · GET `/applications/:id` · PUT `/applications/:id/review` (state machine) · POST `/applications/:id/comment`

## Donations (`/api/donations`)
| POST `/create-order` (Razorpay order; requires keys) · POST `/verify` (HMAC signature) · POST `/webhook` (raw body + `X-Razorpay-Signature`) · GET `/mine` · GET `/admin` (admin) · GET `/stats` · GET `/:id/receipt` (PDF)

## Jobs & Internships (`/api/jobs`)
| GET `/` (type, workMode, location, company, skills, deadline, includeAll, postedByMe) · GET `/:id` (views++) · POST `/` · PUT `/:id` · DELETE `/:id` · POST `/save` · DELETE `/save` · GET `/saved` · POST `/apply` · POST `/report` · PUT `/:id/moderate` (admin)

## Resources (`/api/resources`)
| GET `/` (category, subCategory, subject, semester, search, sort, includePending) · GET `/:id` · POST `/` (file or external, pending) · PUT `/:id` · DELETE `/:id` · POST `/:id/rate` · POST `/bookmark` · DELETE `/bookmark` · GET `/bookmarks` · POST `/:id/download` · POST `/:id/report` · PUT `/:id/moderate` (admin)

## Community (`/api/posts`)
| GET `/` (type, authorId, search, sort) · GET `/:id` · POST `/` · PUT `/:id` · DELETE `/:id` · POST `/:id/like` · DELETE `/:id/like` · GET `/:id/comments` · POST `/:id/comments` (parentId for replies) · DELETE `/comments/:id` · POST `/:id/save` · DELETE `/:id/save` · POST `/:id/share` · POST `/:id/report` · PUT `/:id/moderate` (admin)

## Announcements (`/api/announcements`)
| GET `/` (audience-aware) · POST `/` (faculty/admin; auto-notifies audience) · PUT `/:id` · DELETE `/:id` · PATCH `/:id/pin`

## Notifications (`/api/notifications`)
| GET `/` (type, isRead, page) · GET `/unread-count` · PATCH `/:id/read` · PATCH `/read-all` · DELETE `/:id` · DELETE `/`

## Search, Mentorship, Certificates, Roadmaps
- `GET /api/search?q=&types=&limit=` — people, events, meetings, jobs, resources, scholarships, posts
- `GET /api/mentors?area=` · `POST /api/mentorships` · `GET /api/mentorships` · `PATCH /api/mentorships/:id/status` · `POST /api/mentorships/:id/sessions`
- `GET /api/referrals/offers` · `POST /api/referrals` · `GET /api/referrals` · `POST /api/referrals/:id/request` · `PATCH /api/referrals/:id/grant`
- `POST /api/certificates/event/:id/issue` (organizer/admin) · `GET /api/certificates/mine` · `GET /api/certificates/verify?certificateId=` (**public**)
- `GET /api/roadmaps` · `GET /api/roadmaps/:role` · `PUT /api/roadmaps/:role` (admin)
- `GET /api/analytics/me` — role-scoped personal analytics

## Admin (`/api/admin`, `/api/operations`) — admin only
- `GET /admin/stats` · `GET /admin/analytics` · `GET /admin/users` · `PUT /admin/users/:id` · `DELETE /admin/users/:id` · `GET /admin/moderation` · `GET /admin/reports` · `PUT /admin/reports/:id`
- `GET /operations/reports/types` · `GET /operations/reports/:type?format=csv\|xlsx\|pdf` · `GET /operations/audit-logs` · `GET /operations/audit-logs/actions` · `GET /operations/settings` · `PUT /operations/settings`

## Uploads (`/api/upload`)
`POST /api/upload?use=avatar|event|scholarship|resource|post|chat` (multipart `file`) — MIME whitelist + per-use size caps (images 5 MB, documents 25 MB). Returns `{ url, publicId, name, mimeType, size }`.

## Member reports (`/api/reports`) — admin / faculty / alumni
`GET /reports/member/:id` — individual member report PDF with full profile details + photo (circle-cropped when available). Students get `403 REPORT_FORBIDDEN`.

## Health
`GET /api/health` — liveness probe.
