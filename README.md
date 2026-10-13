# TAMP by Kryonara

TAMP is a cohort-based career-training product. This repository contains the public site prototype, the React/Vite shell, an Express API, and the initial persistent authentication schema.

## Repository map

- `public/site/` — public marketing, account, and student UI (legacy static HTML/CSS/JavaScript).
- `public/admin/` — admin UI prototype. Sign-in is intentionally disabled until the admin interface uses authenticated, persistent backend operations.
- `src/` — React/Vite shell that currently frames the static site.
- `backend/server.js` — Express API, auth and account endpoints.
- `backend/src/services/email.js` — EmailJS verification and password-reset delivery.
- `backend/supabase/migrations/` — versioned database schema.
- `.github/workflows/ci.yml` — frontend build and JavaScript syntax checks.
- `PROJECT_AUDIT.md` — risk assessment and remediation status.

## Stack

React 19, Vite 8, React Router 7, static HTML/CSS/vanilla JS for the current student/admin UI, Node.js + Express 4, Supabase/Postgres, bcryptjs, JWT, and EmailJS. The static student UI remains a legacy prototype; course progress, assignments, payments, keys, certificates and most admin actions are not yet fully server-backed.

## Local development

Frontend:

```bash
npm ci
npm run dev
```

Backend:

```bash
cd backend
npm ci
cp .env.example .env
npm run dev
```

Use Node.js 22 or newer. Never commit real environment values.

## Database setup

The authentication schema migration has been applied to the connected `TAMP by Kryonara` Supabase project and is also versioned at `backend/supabase/migrations/202610130001_auth_schema.sql`. The public-execution grant on the existing `rls_auto_enable()` helper was also revoked and is documented in `202610130002_revoke_public_rls_helper.sql`. It creates private tables for users, pending email verifications and password resets. The backend uses the service-role key only on the server; never place that key in browser code.

To grant the first administrator, first create and verify the account through the normal signup flow, then promote the intended account from the Supabase SQL editor after confirming its email:

```sql
update public.tamp_users
set role = 'super', updated_at = now()
where email = lower('your-admin-email@example.com');
```

Replace the example address with the actual administrator account. Do not promote a public or shared mailbox.

## Required backend environment

Set these on the Vercel project `tamp` (production) or a separate backend host:

- `NODE_ENV=production`
- `JWT_SECRET` — long random secret, never the example value
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` — still must be copied from Supabase Project Settings → API Keys into Vercel as a sensitive value
- `EMAILJS_SERVICE_ID`
- `EMAILJS_PUBLIC_KEY`
- `EMAILJS_PRIVATE_KEY`
- `EMAILJS_VERIFICATION_TEMPLATE_ID`
- `EMAILJS_RESET_TEMPLATE_ID`
- `FRONTEND_URL` — frontend origin, e.g. `https://your-site.example`
- `ALLOWED_ORIGINS` — comma-separated exact frontend origins

EmailJS verification template variables: `to_email`, `code`. Password reset template variables: `to_email`, `reset_url`. Confirm both templates actually deliver to the supplied recipient.

## Deployment notes

The frontend's live API URL is configured in `public/site/config.js` via `window.TAMP_CONFIG.apiBase`, ending in `/api`. It is intentionally blank until a real backend deployment URL is known. Signup, login, password recovery and account deletion will not work until the database migration, backend environment and API URL are configured.

The main Vercel project now has a same-origin catch-all API function at `/api/*`; its install command installs both the frontend and backend lockfiles. The frontend points to `/api`. The production API still requires the real Supabase service-role key and EmailJS credentials. The connected Vercel integration cannot create a separate backend project from this repository because GitHub reports insufficient write/admin permission, so the same-origin function is used instead.

## Current safe limitations

- Enrollment is deliberately rejected until payment or course-key validation exists.
- Student dashboard progress is not yet stored in the database.
- Certificate lookup does not claim local/demo certificates are valid.
- Vendor key generation and payouts are disabled until backed by the real transaction system.
- Admin sign-in is disabled because the visible dashboard still uses local seeded data.
- Account deletion currently removes the backend account and authentication records; any future learning/payment/certificate tables must also be included in the deletion/retention workflow.

## Quality checks

GitHub Actions runs a Vite production build, browser/backend JavaScript syntax checks, and backend API smoke tests on pushes and pull requests to `master`.
