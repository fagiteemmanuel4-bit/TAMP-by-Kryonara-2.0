# TAMP Admin: backend handoff

A separate project from the student site. It is a front-end prototype: data lives in the browser (`seed.js` + localStorage). A backend developer replaces that with the API below. Both projects must share one database.

## 1. Files
`index.html` (login + app shell), `admin.js` (all logic; sections are described by the `R` config object), `admin.css`, `seed.js` (demo data shape = data model), `bridge.js` (demo link to the student site, replace with API calls), `config.js` (`demo`, `apiBase`), `RESEARCH.md`.

## 2. Sections and roles
| Section | super | reviewer | finance | support | content |
|---|---|---|---|---|---|
| Overview | yes | yes | yes | yes | yes |
| Students | yes | yes | | yes | |
| Admins and roles, Settings, Audit log | yes | | | | |
| Courses, Cohorts, Topics, Assignments, Exam questions, Content pages | yes | | | | yes |
| Submissions, Certificates, Verification log | yes | yes | | | |
| Payments, Enrollment keys, Vendors, Reports | yes | | yes | | |
| Support inbox, Email templates, Sent emails | yes | | | yes | |
| Announcements | yes | | | yes | yes |
Roles are enforced in the browser only for display. **The server must check the role on every request.**

## 3. Endpoints (prefix `/api/admin/v1`)
Every list supports `?q=&status=&sort=&dir=&page=&perPage=` and `GET .../export.csv`.
- Auth: `POST /auth/login` (+MFA), `POST /auth/logout`, `GET /me`
- Students: `GET /students`, `GET/PATCH /students/:id`, `POST /students/:id/suspend`, `POST /students/:id/reactivate`, `POST /students/:id/reset-password`
- Admins: `GET/POST /admins`, `PATCH/DELETE /admins/:id`
- Courses, cohorts, topics, assignments: `GET/POST /X`, `GET/PATCH/DELETE /X/:id`; `POST /courses/:id/publish`
- Exam questions: `GET/POST /exam-questions`, `PATCH/DELETE /exam-questions/:id`. Answers are server-side only.
- Submissions: `GET /submissions`, `GET /submissions/:id` (with files), `POST /submissions/:id/approve`, `POST /submissions/:id/return` {feedback}. Approving a final project issues a certificate in the same transaction.
- Certificates: `GET /certificates`, `POST /certificates` (manual issue), `POST /certificates/:id/revoke` {reason}, `POST /certificates/:id/restore`
- Verification log: `GET /verifications` (written by the public verify endpoint)
- Payments: `GET /payments`, `POST /payments/:id/refund` {reason} (calls the payment gateway)
- Keys: `GET /keys`, `POST /keys/generate` {courseId,count,vendorId}, `POST /keys/:id/void`
- Vendors: `GET/POST /vendors`, `PATCH /vendors/:id`
- Support: `GET /tickets`, `POST /tickets/:id/reply`, `POST /tickets/:id/close`
- Announcements: `GET/POST /announcements`, `PATCH /announcements/:id`, `POST /announcements/:id/send`
- Templates: `GET /email-templates`, `PATCH /email-templates/:id`
- Pages: `GET /pages`, `PATCH /pages/:id`
- Audit: `GET /audit` (read-only). Settings: `GET/PATCH /settings`
- Student detail: `GET /students/:id/profile` (progress, submissions, payments, tickets, certificates, emails)
- Submission viewer: `GET /submissions/:id` returns answers, link and file download URL
- Email: `GET /emails` (sent log), `POST /emails` {to,templateId?,subject,body} sends through the email provider; `to` may be a student, `all-students` or `vendors`
- Overview: `GET /overview` (counts, revenue, attention items, enrollments per month)

## 4. Data model
See the arrays in `seed.js`; each table maps to one database table with `id`, created/updated timestamps. Extra fields to add: student `ninLast4`, submission `files[]` and `reviewerId`, payment `gatewayRef`, certificate `revokedReason`, ticket `replies[]`.

## 5. Rules the server must enforce
1. Role-based access control on every endpoint (deny by default).
2. Destructive or financial actions (delete, refund, revoke, role change, settings) require confirmation in the UI and a reason where shown, and always write an audit entry.
3. Approving a final project issues exactly one certificate with a unique unguessable-enough ID; revoked certificates show invalid on the public verify page.
4. A refund must call the gateway and only mark refunded on success. Block refunds outside `refundDays`.
5. Keys are single use; generating and voiding are atomic.
6. Settings (`passMark`, `examMinutes`, `readingMinutes`) are read by the student site, not copied.
7. Admins cannot delete themselves or the last active super admin.

## 6. Audit log (OWASP-aligned)
Log: sign-in success and failure, sign-out, every create/edit/delete, role and settings changes, approvals, refunds, revocations, exports, access-denied events and validation failures. Record who, when, action, target and detail. Do **not** log passwords, tokens, session IDs or full personal data. Make entries append-only with integrity protection (hash chain or write-once storage), and alert on failures of logging.

## 7. Security checklist
Server-side password hashing (argon2/bcrypt), mandatory MFA for admins (setting exists), httpOnly secure cookies, CSRF protection, rate limiting and lockout, optional IP allowlist, short sessions with idle timeout, HTTPS only, escape all output (done in front end), CSV export must neutralise formula characters (done: leading = + - @ are prefixed), private storage for submission files, least-privilege database users, backups.

## 8. Demo-only items to remove
`config.js` `demo:true` (shows demo accounts and Reset demo data), the demo password `admin123`, localStorage persistence, seeded data, `Math.random` IDs and keys (generate on the server).

## 9. Next steps
Bulk actions, saved filters, file preview in the submission viewer, a custom role editor, two-person approval for large refunds. See REVIEW.md for the student-site link and what is still missing.
