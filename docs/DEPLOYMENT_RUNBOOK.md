# Deployment Runbook

## Important

This runbook is a checklist, not proof that the current deployment is correct. Confirm the Vercel project connected to `fagiteemmanuel4-bit/TAMP-by-Kryonara-2.0` and the `master` branch before changing production settings.

## Frontend/API

The intended configuration is a Vercel project rooted at the repository root:
- Build: `npm ci && npm run build` (install may need backend dependencies installed separately depending on the chosen Vercel build setup).
- API entrypoint: `api/[...slug].js`.
- API base in `public/site/config.js`: `/api`.
- Ensure Vercel function tracing includes the `backend/` dependency tree and dependencies from `backend/package.json`. If root install/build does not install backend packages, use a deliberate monorepo install strategy or move the API into a proper workspace; do not assume imports resolve.
- Check Vercel build output and function logs after each deployment.

## Required backend production environment

Set on the actual Vercel project that serves the API:
- `NODE_ENV=production`
- `JWT_SECRET`: unique random secret (never the example value)
- `SUPABASE_URL`: project URL
- `SUPABASE_SERVICE_ROLE_KEY`: server-only secret; never put it in browser JS or a `VITE_*` variable
- `EMAILJS_SERVICE_ID`
- `EMAILJS_PUBLIC_KEY`
- `EMAILJS_PRIVATE_KEY`
- `EMAILJS_VERIFICATION_TEMPLATE_ID`
- `EMAILJS_RESET_TEMPLATE_ID`
- `FRONTEND_URL`: exact public site origin
- `ALLOWED_ORIGINS`: exact origin(s), comma-separated only if multiple are needed

Use Vercel's encrypted/sensitive variable type for secrets. Set production, preview and development values separately where required. Do not commit real values.

## Supabase

1. Confirm the intended project ref before applying SQL.
2. Apply the versioned migration in `backend/supabase/migrations/`.
3. Verify tables exist: `tamp_users`, `tamp_pending_registrations`, `tamp_password_resets`.
4. Confirm RLS is enabled and browser roles have no direct table access.
5. Confirm backend requests using service-role credentials work; do not use the anon key for privileged writes.
6. Review the Supabase security and performance advisors.
7. Configure backups and test restore before accepting real student/payment records.

## EmailJS

1. Confirm service connection is active.
2. Confirm verification and reset templates are published and use the expected variables.
3. Confirm sender identity/domain settings.
4. Send provider test emails.
5. Check quota/rate limits and delivery logs.
6. Run signup and password-reset flows against the deployed app.

## Deployment smoke tests

- `GET /api/health` returns healthy service metadata without leaking secrets.
- Registration rejects invalid fields and duplicate emails.
- Email delivery failure returns an error rather than a false success.
- Successful verification persists the user in Supabase.
- Login and reset work end-to-end.
- Unauthenticated calls to `/api/me` and protected routes are rejected.
- Enrollment responds as unavailable until real payment/key validation exists.
- Admin routes reject student tokens and cannot use browser-seeded records.
- Check browser console, Vercel function logs and Supabase logs.
- Confirm mobile layout and navigation after the production build.

## Rollback

1. Identify the last known-good Vercel deployment.
2. Roll back deployment if a release breaks core routes.
3. Do not roll back database schema changes blindly; use a forward fix or a tested reversible migration.
4. Record the incident, affected deployment ID, symptoms and recovery action.
