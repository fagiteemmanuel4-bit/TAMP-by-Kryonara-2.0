# TAMP Architecture and Stack

**Status:** architecture inventory, based on repository source; not a live production certification.

## Product goal

TAMP by Kryonara is intended to deliver cohort-based career training, initially Data Analysis. A production system must make enrollment, lessons, assignments, grades, payments, certificates and admin actions authoritative on the server—not merely in a browser.

## Current repository map

| Path | Responsibility | Current confidence |
|---|---|---|
| `src/` | React/Vite shell and UI modules | Present; not the main source of student learning behavior |
| `public/site/` | Student/marketing/account HTML, CSS and vanilla JS | Active legacy UI; several flows have been disabled or redirected to the API |
| `public/admin/` | Admin UI prototype | Admin sign-in disabled because seeded/local data is not production-safe |
| `backend/server.js` | Express routes, auth, account operations | Partial backend; learning/admin domain is incomplete |
| `backend/src/services/email.js` | EmailJS REST delivery | Code supports verification and reset templates; live configuration not confirmed |
| `backend/supabase/migrations/` | Database schema migrations | Initial auth tables exist; business schema remains incomplete |
| `api/[...slug].js` | Vercel catch-all entrypoint for Express | Added; actual deployed routing still requires smoke tests |
| `vercel.json` | Vercel function and rewrite config | Must be verified against deployed build behavior |
| `.github/workflows/ci.yml` | CI build and syntax checks | Added; successful run status must be confirmed |

## Stack actually present

- Frontend shell: React 19, Vite 8, React Router 7.
- Current student/admin interfaces: static HTML/CSS and vanilla JavaScript.
- API: Node.js, Express 4.
- Database/auth records: Supabase Postgres via `@supabase/supabase-js`.
- Password hashing: bcryptjs.
- API tokens: jsonwebtoken/JWT.
- Email delivery: EmailJS REST API.
- Hosting target: Vercel frontend with a same-origin serverless API.
- Payment provider: no fully verified payment processing flow in the current backend.
- Learning records: persistent lesson progress, assignment submission, grades, cohort enrollment and certificate issuance are not yet implemented as a complete authoritative data model.

## Current request flow

1. The browser loads a page under `public/site/`.
2. `public/site/config.js` supplies `TAMP_CONFIG.apiBase` (currently `/api`).
3. `public/site/auth.js` posts auth requests to `/api/auth/*`.
4. Vercel's `api/[...slug].js` imports the Express app from `backend/server.js`.
5. Express validates requests and reads/writes Supabase tables using server-side configuration.
6. EmailJS sends verification/reset messages using credentials held only by the backend.
7. JWT access tokens are kept in browser session storage; the localStorage session object is only a UI hint and must not be treated as proof of authentication.

## Architectural problems to resolve

- Two frontend approaches coexist: React shell and legacy static pages. Establish one clear product entrypoint and remove duplicate/unused flows after mapping all links.
- Admin UI and student dashboard have legacy client-side state. Every privileged action and durable learning record needs server authorization and persistent storage.
- Business entities are incomplete: cohorts, enrollments, payment attempts/webhooks, course keys, modules/lessons, assignment submissions, grade release, certificate issuance/verification, support requests and audit events need explicit schemas and API contracts.
- A single large `server.js` makes auth, admin and future learning logic hard to test. Split routes, middleware, domain services and repositories once current auth behavior is verified.
- Add automated route/integration tests, a test database, structured logs, error IDs and alerting.
- Define data retention/deletion and certificate/payment audit requirements before collecting more student data.

## Target architecture (recommended)

- Frontend: one chosen application shell; shared typed API client; no privileged business logic in browser code.
- API: route modules grouped by domain; schema validation; centralized error handling; rate limiting; request IDs; security headers.
- Database: versioned migrations, least-privilege access, explicit foreign keys/indexes, RLS reviewed against server-only service-role access.
- Domains: auth, users, cohorts, courses, enrollments, payments, keys, learning progress, assignments, grades, certificates, notifications, support, admin audit.
- External providers: payment webhooks verified server-side; EmailJS or another mail provider with delivery monitoring.
- Operations: CI gates, staging environment, smoke tests, backups/restore drill, uptime/error monitoring and rollback instructions.
