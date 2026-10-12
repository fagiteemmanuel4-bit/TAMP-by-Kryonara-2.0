# TAMP by Kryonara: backend handoff

The front end is complete as a prototype. It stores everything in the browser (localStorage). A backend developer replaces that storage with the API below. Settings are in `config.js`, editable course content in `content.js`.

## 1. Files
- `index.html`, public pages (`*.html`), legal pages: static, no storage except the contact, employer, vendor and story forms.
- `signup.html`, `verify.html`, `login.html` + `auth.js`: account flow.
- `dashboard.html` + `dashboard.js`: the student app (hash routes: overview, courses, browse, learn, read, assign, exam, certs, cert, profile, settings, payments, inbox, badges, calendar, help, bookmarks, community).
- `site.js`: menu, theme, public forms, certificate verify, forgot/reset/delete account, vendor dashboard demo.
- `protect.js`: copy protection, theme, confetti. `style.css`: all styles.

## 2. Where browser storage is used (replace with API calls)
| Key | Holds | Replace with |
|---|---|---|
| `tamp_users` | accounts (name, email, phone, country, last 4 of NIN, password hash) | `/auth/*`, `/me` |
| `tamp_pending` | sign-up awaiting verification | server-side pending registration |
| `tamp_session` | logged-in user | secure httpOnly session cookie or token |
| `tamp_dash_<email>` | enrollments, progress, notes, bookmarks, notifications, payments, tickets, certificates, streak, preferences | the endpoints in section 3 |
| `tamp_posts` | community posts | `/posts` |
| `tamp_inbox` | contact, employer, vendor, story forms | `/forms/:type` |
| `tamp_vendor` | vendor keys and sales | `/vendor/*` |
Cosmetic keys (`tamp_theme`, `tamp_fs`, `ck`) can stay in the browser.

## 3. Endpoints needed (REST, JSON, prefix `/api/v1`)
**Auth and account**
- `POST /auth/register` {name,email,phone,country,nin,password,acceptedTerms} then `POST /auth/verify` {emailCode,phoneCode} and `POST /auth/resend`
- `POST /auth/login`, `POST /auth/logout`, `POST /auth/forgot`, `POST /auth/reset`
- `GET /me`, `PATCH /me`, `POST /me/change-password`, `POST /me/change-email`, `POST /me/change-phone` (each re-verifies), `GET /me/export`, `DELETE /me`
**Catalog and enrollment**
- `GET /courses`, `GET /courses/:id`, `GET /cohorts`
- `POST /payments/initiate`, `POST /payments/webhook` (payment gateway), `GET /payments`
- `POST /enrollments` {cohortId, keyOrPaymentRef}, `GET /enrollments`
**Learning**
- `GET /enrollments/:id/curriculum` (levels, topic status, what is unlocked today)
- `GET /topics/:n` (only if unlocked), `POST /topics/:n/heartbeat` (reading time), `POST /topics/:n/complete`
- `PUT /topics/:n/notes`, `PUT /topics/:n/bookmark`, `POST /topics/:n/quiz`
**Assessment**
- `GET /assignments/:level`, `POST /assignments/:level/submit` (multipart file upload, 5 MB)
- `POST /exams/:course/start` (server picks questions and starts the timer), `POST /exams/:attemptId/submit`
**Other**
- `GET /certificates`, `GET /certificates/:id`, public `GET /verify/:certificateId`
- `GET/PATCH/DELETE /notifications`
- `GET/POST /posts`, `POST /posts/:id/replies`
- `GET/POST /tickets`, `POST /forms/:type` (contact, employer, vendor, story)
- `GET /vendor/keys`, `POST /vendor/keys/:id/sold`

## 4. Rules the server must enforce (the browser cannot)
1. One topic per calendar day, in order, using server time (Africa/Lagos). Locked topics must not be returned by the API.
2. Level locking: a level opens only after the previous level's assignment is submitted. Closed levels cannot be reopened.
3. Reading time (50 min per topic) is tracked server-side via heartbeats that pause when the tab is hidden.
4. Exam: questions chosen and timed on the server, answers and scoring never sent to the browser, pass mark from settings, one attempt per day.
5. Certificates issued only after every assignment, the exam and the final project review pass. Each has a unique ID and can be revoked.
6. Enrollment keys: single use, tied to a course, redeemed atomically.

## 5. Security checklist
- Hash passwords on the server (argon2 or bcrypt). The browser currently hashes with SHA-256 for demo only.
- Verify email and phone with real one-time codes (expire in 10 minutes, rate limited). Remove the demo code 123456.
- Verify the NIN through an approved provider. Store only a hash and the last 4 digits.
- HTTPS everywhere, httpOnly cookies, CSRF protection, rate limits, lockout after repeated failures.
- Validate and virus-scan uploads. Store files in private object storage.
- Escape all user content (the front end does, keep doing it on output).
- Nigeria Data Protection Act: consent records, export and delete endpoints, breach process.

## 6. Demo-only items to remove before launch
- Set `demo:false` in `config.js`: hides "Simulate cohort start", "Skip to tomorrow", "Skip timer", "Issue my certificate" and "Failed payment".
- Remove the demo notes and code 123456 from `verify.html`, `auth.js`, settings and certificate verification (`TAMP-DEMO`).
- Remove client-side acceptance of any key shaped like `TAMP-ABCD-1234`.
- Topic notes live in the `NOTES` object in `dashboard.js` (topic 1 is a sample). Move all topic content to the API or CMS, with YouTube IDs.

## 7. Third-party services to choose
Email and SMS provider, NIN verification provider, payment gateway (for example Paystack), object storage for uploads and certificate PDFs, hosting, error monitoring, backups.

## 8. Password reset (must match the front end)
`POST /auth/forgot` always answers the same message (do not reveal whether the email exists), creates a random single-use token (30 minutes), emails the link, and rate-limits by IP and email. `POST /auth/reset` {token, password} validates the token, sets the new password hash, marks the token used, **revokes all sessions**, and emails a "your password was changed" notice. `POST /me/change-password` needs the current password. The 123456 codes and the on-screen "Demo" reset link must be removed.

## 9. Course packages (AI-written courses)
Courses are JSON packages (`tamp.course.v1`, see the admin project's `ai/course-schema.json`). Serve `GET /courses`, `GET /courses/:id/package` (unlocked topics only; no exam answers), and grade exams server-side. See `AI_INSTRUCTOR_GUIDE.md` in the admin project.
