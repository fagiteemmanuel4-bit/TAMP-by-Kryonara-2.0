# TAMP by Kryonara — Architecture, Security and Business-Risk Audit

**Audit date:** 13 October 2026  
**Scope:** Repository source and configuration at the current `master` branch. This is a static code review, not a penetration test or a live production test. I cannot inspect Vercel environment variables, Supabase table policies, EmailJS dashboard/template settings, payment-provider status, or production logs from repository source alone.

## Executive assessment

**Current release readiness: not production-ready.** The project has a substantial student-site/admin prototype and a newly added Express/Supabase/EmailJS backend, but these pieces are not yet one coherent production application. The highest risk is that the interface can appear to work while authentication, learning records, payments, and admin operations are still demo/local-storage behaviours.

The immediate EmailJS failure had two code-level causes:
1. The live static sign-up/login pages used localStorage and a hard-coded demo verification code instead of calling the backend.
2. The backend swallowed EmailJS delivery errors and still returned a successful “code sent” response.

Changes made during this pass:
- EmailJS now fails clearly when required environment values are missing, has a 10-second timeout, and returns provider errors to the backend.
- Registration no longer reports success when EmailJS delivery fails.
- Email verification codes expire after 10 minutes and incorrect attempts are capped at five.
- Sign-up, email verification, and login pages now call the backend API and the fake phone-code requirement/demo code have been removed.
- The backend URL is intentionally a required deployment setting in `public/site/config.js`. It is blank right now because the actual deployed API URL is not available in the repository. **Live authentication cannot work until the backend is deployed, its environment variables are configured, and that URL is entered.**

## Findings by severity

### Critical — fix before accepting real students or payments

#### 1. Frontend/backend are not yet deployed as one connected system
- The React entry point in `src/App.jsx` mostly renders the older HTML application inside an iframe.
- The newer React modules under `src/modules/site` and `src/modules/admin` contain placeholder/demo content and are not the actual routed product.
- The static student pages previously handled signup/login through localStorage. They now call the backend, but `public/site/config.js` needs the real backend URL ending in `/api`.
- Root `vercel.json` only configures SPA rewrites; it does not deploy the Express service in `backend/server.js` as a working API.
- Result: frontend and backend can be deployed independently and silently point at the wrong place. Maintain one documented API base URL and verify it in the production build.

#### 2. Admin privilege escalation
- `POST /api/admin/auth/login` accepts any account with a valid email/password and issues a token with role `admin`; it does not first require that the stored account is an administrator.
- `GET /api/admin/overview` and `GET /api/admin/students` use `requireAuth` but do not enforce an admin role.
- The `/ADMIN19841812` route is not a security boundary; a hard-to-guess URL is not authentication.
- Result: a normal student may be able to obtain admin access or call admin endpoints. Implement server-side role checks on every admin route, deny by default, and add admin MFA before launch.

#### 3. Learning, payment and enrollment decisions are client-side or simulated
- `POST /api/enrollments` returns an active enrollment without validating a paid transaction or a single-use course key.
- Student progress, assignments, payments, notes, certificates, and much of the admin state are stored in localStorage.
- The public certificate verification flow checks local browser storage and contains a demo certificate ID; it is not a trustworthy public verification service.
- Course locking, timers, quiz flow and certificate issuance must be enforced by the server, not only JavaScript.
- Result: users can lose data, alter local records, bypass access rules, or be shown fabricated payment/enrollment/certificate states.

#### 4. Persistent storage and serverless compatibility are unresolved
- Verification codes, pending registrations, reset tokens, and fallback users are held in process memory in `backend/server.js`.
- A restart, redeploy, or serverless instance change can lose pending registrations or make reset links unusable. A serverless deployment is particularly unsuitable for this stateful design.
- Supabase failures fall back to in-memory storage, which can make the application appear to accept records that will disappear later.
- Result: registration/login can become intermittent and real student records can be lost. Persist pending registrations, one-time codes, reset tokens, enrollments and audit events in Supabase/Postgres; fail closed on database errors in production.

### High — fix before launch

#### 5. EmailJS delivery depends on provider configuration and template variables
- Backend requires `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, and `EMAILJS_PRIVATE_KEY`.
- The EmailJS template must send to the `to_email` variable and render the `code` variable. A wrong service/template ID, disabled service, unapproved recipient, or mismatched template variable will still cause provider rejection.
- The API URL must be configured in `public/site/config.js`; EmailJS secrets belong only in backend environment variables, never in browser JavaScript.
- The current code review cannot confirm the actual EmailJS dashboard settings or production secrets. After configuring them, test a real signup to an inbox and check backend logs for provider errors.

#### 6. Password-reset flow is not connected end-to-end
- The public forgot/reset flow in `public/site/site.js` still creates localStorage tokens and explicitly labels the reset link as a demo; it does not call the backend EmailJS reset endpoint.
- The backend builds a reset URL using `/reset-password?token=...`, while the static page is `/site/reset-password.html?t=...`; those URL formats do not match.
- Backend reset tokens are in memory and the reset handler does not revoke existing sessions.
- Result: password recovery can claim to work without delivering an email or changing the actual backend password. Connect the UI to the API, unify the reset URL, persist hashed/single-use tokens, and revoke sessions after a reset.

#### 7. Weak production security controls
- Backend CORS currently allows any origin (`origin: true`).
- JWT signing has a fallback secret (`dev-secret-change-me`) if `JWT_SECRET` is missing.
- There is no server-side rate limiter for login, registration, verification, or reset endpoints.
- Verification codes and generated identifiers use `Math.random`, not a cryptographically secure random generator.
- There are no visible automated security tests, API tests, or dependency audit gates.
- Before launch: require a strong production secret at startup, allowlist exact origins, use cryptographic randomness, add rate limiting/lockout, set security headers, and add automated tests and dependency scanning.

#### 8. No database migration or access-policy files are included
- Source references a Supabase `users` table and writes profile/password fields, but this repository tree has no versioned schema migration or documented production RLS policy.
- Result: deployments can drift between projects, schema errors can be masked by the in-memory fallback, and access rules cannot be reviewed or reproduced reliably.
- Add migrations for every table, indexes/unique constraints, RLS policies, and a documented least-privilege service-role strategy. Never expose the service-role key to the frontend.

#### 9. Privacy risk around NIN and student records
- Signup collects a full 11-digit NIN, even though the code only stores its last four digits after verification. No real NIN verification provider is implemented.
- Collecting national identity data creates a high-impact breach and trust risk. Do not collect it until there is a clear lawful purpose, approved verification flow, retention schedule, access controls and user-facing explanation.
- Account export/deletion and other privacy-policy commitments are described in handoff documentation but are not fully implemented as backend endpoints.

#### 10. Admin app is still a prototype
- `public/admin/config.js` has `demo: true` and `demoPassword: 'admin123'`.
- `public/admin/seed.js`, `admin.js`, and `bridge.js` use seeded records and localStorage as the data source.
- Admin overview metrics are hard-coded in backend routes, and admin changes are not reliably connected to the student backend/database.
- Do not expose this admin UI to real operational data until authentication, RBAC, audit logging, persistent records and all financial/destructive actions are server-enforced.

### Medium — product reliability and business risks

#### 11. Conflicting course catalogues and hard-coded cohort dates
- Backend advertises Data Analysis and AI Foundations.
- Student dashboard code has Data Analysis, Virtual Assistance and Digital Marketing with hard-coded prices and dates.
- Admin seed data contains yet another catalogue and sample cohorts.
- Admin-published courses are not the source of truth for what students see.
- Result: marketing pages, checkout, admin and student screens can contradict each other. Store courses, cohorts, dates, prices and availability in one database-backed catalogue.

#### 12. No real payment gateway or reconciliation
- The repository documents a future payment gateway, but the backend does not verify payment webhooks or reconcile transaction references before enrollment.
- Demo payment records and key redemption are not proof of payment.
- Result: revenue leakage, duplicate payments, disputes and accidental free enrollment. Add provider webhooks with signature verification, idempotency, transaction reconciliation, refund handling and immutable payment audit events before charging students.

#### 13. Course quality and certificate credibility are not yet proven operationally
- Course content and video IDs include placeholders/sample material; several admin course/topic records are drafts.
- The brand promises career skills and certificates, but no evidence of employer acceptance, placement outcomes, external assessment validation or accreditation is supplied by the code.
- Result: refunds, poor word of mouth and reputational damage if the advertised learning outcomes exceed the delivered curriculum. Publish precise outcomes, workload, assessment rubrics, certificate limitations and honest employment claims; pilot with a small cohort and measure completion and learner outcomes.

#### 14. Support, monitoring and operational recovery are incomplete
- There is no demonstrated production alerting, uptime monitoring, error aggregation, scheduled database backup/restore test, or support-response process.
- No reliable operational evidence is available from source for email delivery rate, signup conversion, course completion, payment failure, refunds or certificate disputes.
- Result: failures may remain invisible until students complain. Add error monitoring, backup/restore drills, operational dashboards, a support inbox tied to the backend and clear response targets.

#### 15. UX and accessibility choices can hurt trust
- `public/site/protect.js` blocks copy, cut, context menus and several keyboard shortcuts. This is not meaningful security and can interfere with password managers, accessibility, study notes and normal browser use.
- Demo placeholders, local-only state and inconsistent navigation can make a professional service feel unreliable.
- Remove intrusive copy protection; protect paid content with server authorization and focus on accessibility, responsive testing and clear error messages.

#### 16. SEO and maintainability are weakened by the split architecture
- The deployed React shell uses iframes to show static HTML pages, while a second React UI is present but unused.
- Duplicate logic and multiple sources of truth increase the chance that a fix is applied to the wrong layer.
- Consolidate the product around one routing approach and one shared API client. Keep public marketing pages indexable with proper canonical URLs, metadata and sitemap, and test actual production crawl output.

## Recommended remediation order

1. **Complete EmailJS deployment:** deploy backend to a persistent Node host, configure Supabase and all EmailJS/JWT variables, set the API URL in `public/site/config.js`, then test real signup → email code → verification → login.
2. **Close the admin security gap:** enforce stored admin roles on every admin endpoint; remove demo admin credentials and seeded-data access from production.
3. **Make persistence real:** add migrations and database-backed pending registrations, verification codes, reset tokens, courses, cohorts, enrollments and student progress; stop silently falling back to memory in production.
4. **Connect all auth paths:** backend login/signup/verification are now wired in the student auth pages, but forgot-password/reset, logout/session expiry and the dashboard's data layer still need to use the same backend.
5. **Implement payment and enrollment verification:** real gateway webhook, idempotency, single-use keys, atomic enrollment, refunds and reconciliation.
6. **Move learning rules server-side:** daily unlocks, reading checkpoints, quizzes, assignments, grades and certificate issuance/verification.
7. **Build a release gate:** automated API/UI tests, dependency audit, backup restore test, accessibility/mobile checks, staging environment and a written launch checklist.
8. **Run a controlled pilot:** one course and one cohort first; measure signup completion, email delivery, payment conversion, lesson completion, assessment quality, refund rate and learner satisfaction before scaling ads.

## Evidence links

- [Backend authentication and API routes](backend/server.js)
- [EmailJS service](backend/src/services/email.js)
- [Supabase client setup](backend/src/config/supabase.js)
- [Student authentication UI](public/site/auth.js)
- [Student dashboard prototype](public/site/dashboard.js)
- [Student site configuration](public/site/config.js)
- [Admin configuration](public/admin/config.js)
- [Admin local data model](public/admin/seed.js)
- [Student backend handoff / security checklist](public/site/BACKEND_HANDOFF.md)
- [Admin backend handoff / RBAC checklist](public/admin/ADMIN_HANDOFF.md)

## Verification status

The source changes above were committed, but **a live end-to-end email test has not been performed** because the production backend URL, EmailJS credentials/template settings, and deployment logs are not present in the repository. Do not treat the EmailJS task as production-verified until the deployment configuration is completed and a real inbox test succeeds.
