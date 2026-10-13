# TAMP by Kryonara — Architecture, Security and Business-Risk Audit

**Audit date:** 13 October 2026  
**Scope:** Repository source and configuration at the current `master` branch. This is a static code review, not a penetration test or a live production test. I cannot inspect Vercel environment variables, Supabase table policies, EmailJS dashboard/template settings, payment-provider status, or production logs from repository source alone.

## Executive assessment

**Current release readiness: not production-ready.** The project has a substantial student-site/admin prototype and a newly added Express/Supabase/EmailJS backend, but these pieces are not yet one coherent production application. The highest risk is that the interface can appear to work while authentication, learning records, payments, and admin operations are still demo/local-storage behaviours.

The immediate EmailJS failure had two code-level causes:
1. The live static sign-up/login pages used localStorage and a hard-coded demo verification code instead of calling the backend.
2. The backend swallowed EmailJS delivery errors and still returned a successful “code sent” response.

Changes made in the hardening pass:
- Sign-up, email verification, resend-code, login, password recovery and account deletion are wired to the same-origin API.
- EmailJS supports separate verification and password-reset templates, reports failures, and times out after 10 seconds.
- Verification codes are cryptographically random, stored hashed, expire after 10 minutes and have a five-attempt cap. Password reset tokens are cryptographically random, stored hashed, single-use and expire after 30 minutes.
- Authentication records, pending registrations and password reset tokens use Supabase tables; production auth fails closed when the database/JWT configuration is missing.
- JWTs expire after two hours; changing a password increments the session version so older tokens are rejected.
- Admin demo sign-in and fake vendor/certificate-verification claims are disabled. The student dashboard no longer fabricates enrollments, payment receipts, certificates, phone/email verification or support-ticket success; legacy demo payment/enrollment/certificate records are ignored. Enrollment is rejected until payment/key validation exists.
- Password changes now use the backend and invalidate older sessions; account deletion confirms the current password and removes authentication records.
- A Vercel catch-all API function is deployed at `/api/*`; the frontend uses `/api`. Production JWT secret and Supabase URL are configured, but the Supabase service-role key and EmailJS credentials still need to be supplied.
- The authentication schema and a Supabase security grant revocation have been applied to the connected `TAMP by Kryonara` project. GitHub Actions now checks the Vite build and JavaScript syntax.

## Current structure, architecture and stack

### Repository structure

- `src/`: React/Vite entry shell and a second set of React UI modules.
- `public/site/`: the actual student-facing product today — static HTML, CSS and large vanilla-JavaScript files for signup, dashboard, learning, marketing and policy pages.
- `public/admin/`: a separate static admin prototype with its own UI, seed data and localStorage database.
- `backend/`: Express API, Supabase client and EmailJS service.
- `api/[...slug].js` and `vercel.json`: same-origin Vercel serverless API route; the Express app is exported for serverless execution.
- `PROJECT_AUDIT.md`: this audit and remediation record.

### Technology stack actually present

| Layer | Current implementation | Assessment |
|---|---|---|
| Frontend shell | React 19, Vite 8, React Router 7 | Works primarily as an iframe router for the legacy site; the newer React modules are not the real product flow. |
| Student UI | Static HTML/CSS + vanilla JavaScript | Feature-rich prototype, but important state and rules remain client-side. |
| Admin UI | Static HTML/CSS + vanilla JavaScript | Demo/localStorage state, not production operations software. |
| API | Node.js + Express 4 | Has basic auth, dashboard and admin routes; deployment model and persistent state need work. |
| Database | Supabase JS client | Used for a user table only in current backend logic; no checked-in migrations or complete learning/business schema. |
| Password/JWT | bcryptjs + jsonwebtoken | Password hashing exists; authorization, secret management and session design need hardening. |
| Email | EmailJS REST API | Provider integration is now explicit, but requires backend secrets, correct template variables and a live test. |
| Hosting | Vercel frontend and same-origin API function | The API route is deployed. Authentication is not operational until the private Supabase service-role key and EmailJS credentials are configured. |
| Payments | No verified payment-gateway implementation in the backend | Payment and enrollment records are still prototype behaviour. |
| Testing/CI | Frontend build/lint scripts; no backend test script or visible API test suite | Changes can reach deployment without proving critical journeys. |

### Intended business flow versus implemented flow

The documented intended product is: discover a cohort → register → verify email → pay or redeem a course key → study sequential daily lessons → submit assignments and assessments → receive a reviewed certificate → verify the certificate publicly. Admins should manage cohorts, submissions, payments, certificates and support.

The implementation is currently split: the UI describes much of that flow, but signup was local-only, course progress and certificates are browser data, payment is not verified server-side, the admin panel uses seed/localStorage data, and the backend does not yet enforce the complete learning/business lifecycle. Treat these as separate deliverables, not as features already production-complete.

## Findings by severity

### Critical — fix before accepting real students or payments

#### 1. Split UI architecture remains a maintainability risk; API routing is now connected
- The React entry point in `src/App.jsx` mostly frames the legacy HTML application inside an iframe; the newer React modules are not the real routed product.
- The root Vercel project now deploys `api/[...slug].js`, which forwards requests to the Express app. Student pages use same-origin `/api`; local Vite development proxies `/api` to port 5000.
- The deployment is build-ready, but runtime authentication remains gated by missing Supabase service-role and EmailJS credentials.
- Consolidate to one routing approach later; do not undertake a visual rewrite until the real data model and API contract are stable.

#### 2. Admin privilege escalation — backend guard added; admin UI safely disabled
- Admin login requires a stored `admin` or `super` role, and existing admin overview/student endpoints re-check the stored role.
- The local seeded admin dashboard and the `admin123` demo credential have been disabled so local sample records cannot be mistaken for production data.
- Remaining work: build a real backend-backed admin UI, provision the first super-admin through a controlled process, add MFA and test every admin endpoint with student and admin tokens.
- The `/ADMIN19841812` route is not a security boundary by itself.

#### 3. Learning, payments and certificates are not production-complete
- The enrollment API now returns HTTP 501 rather than falsely activating a student; real payment/key validation and single-use redemption still need to be built.
- Student progress, assignments, notes, grades and certificates remain largely browser-local.
- Certificate verification no longer accepts the demo ID or localStorage records; it clearly states that the official registry is not connected.
- Vendor key generation and sales UI is disabled until a real key inventory, payment and payout backend exists.
- Build server-enforced course access, progress, assessment grading, assignment storage and certificate issuance before enrolling paying students.

#### 4. Authentication persistence is schema-backed; the production credential is still missing
- Users, pending registrations, and password reset tokens now use the `tamp_users`, `tamp_pending_registrations`, and `tamp_password_resets` Supabase tables.
- The connected `TAMP by Kryonara` Supabase project has these tables with RLS enabled and no browser-role policies; the backend must use the private service-role key.
- In-memory fallback is development-only. Production auth endpoints fail closed when the Supabase service-role key or JWT configuration is missing.
- Learning records, payments, keys and certificates still need their own persistent schema.

### High — fix before launch

#### 5. EmailJS still needs credentials and a real inbox test
- Backend supports `EMAILJS_SERVICE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY`, `EMAILJS_VERIFICATION_TEMPLATE_ID`, and `EMAILJS_RESET_TEMPLATE_ID` (with a shared-template fallback).
- Verification template variables are `to_email` and `code`; reset template variables are `to_email` and `reset_url`.
- The Vercel environment variable records exist but the connected values are not configured/available to the application yet. Do not place private keys in frontend files.
- A live email has not been confirmed; send a real test after the service/template credentials are added.

#### 6. Password recovery is now connected; end-to-end email verification remains outstanding
- Forgot/reset pages call the backend and use the correct `/site/reset-password.html?t=...` route.
- Reset tokens are stored hashed, expire after 30 minutes, are consumed once, and password changes invalidate prior JWTs through a session version.
- Email delivery and the actual link still require working EmailJS credentials and a real inbox test.

#### 7. Weak production security controls — some guardrails added
- This pass changed CORS to use the `ALLOWED_ORIGINS` allowlist and made production startup fail if the allowlist or `JWT_SECRET` is missing. Set both values in the backend host before deploying; `ALLOWED_ORIGINS` must include the exact frontend origin.
- There is still no server-side rate limiter for login, registration, verification, or reset endpoints.
- Verification codes and generated identifiers still use `Math.random`, not a cryptographically secure random generator.
- There are no visible automated security tests, API tests, or dependency audit gates.
- Before launch: use cryptographic randomness, add rate limiting/lockout, set security headers, and add automated tests and dependency scanning.

#### 8. Authentication migrations and RLS are present; the wider product schema is still missing
- Versioned migrations now define the three authentication tables, session versioning and terms acceptance. These migrations were applied to the connected `TAMP by Kryonara` Supabase project.
- RLS is enabled and browser roles have no direct access policies; the service-role key must remain server-only.
- A separate migration revoked public execution of an existing `SECURITY DEFINER` RLS helper.
- The course/cohort/enrollment/payment/assessment/submission/certificate/support schema is still to be designed and migrated.

#### 9. Privacy and account lifecycle
- The sign-up form no longer collects NIN; privacy/data-protection copy has been aligned with the current form.
- Account deletion now authenticates the current password and removes the account, pending registration and password-reset records.
- Remaining: add data export, retention/deletion rules for future learning/payment/certificate tables, a real privacy contact address and legal review of the Nigeria Data Protection Act obligations.

#### 10. Admin app remains a prototype, and demo sign-in is disabled
- `public/admin/config.js` no longer contains the `admin123` password; the admin login handler refuses demo sign-in.
- `public/admin/seed.js`, `admin.js`, and `bridge.js` still contain seeded records and localStorage data, so the UI is intentionally disabled rather than presented as a working control center.
- The backend has role checks for its current admin endpoints, but does not yet implement all admin actions or connect all operations to persistent tables.
- Build a real backend-backed admin interface with audited roles, MFA, persistent records and server-enforced financial/destructive actions before reopening it.

### Medium — product reliability and business risks

#### 11. Conflicting course catalogues and hard-coded cohort dates
- Backend now lists only Data Analysis, but other pages and admin seed data still contain additional courses.
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
