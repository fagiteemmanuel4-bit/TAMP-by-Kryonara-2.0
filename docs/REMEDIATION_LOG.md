# TAMP Remediation Log

This log distinguishes code changes from real-world verification. A Git commit is not proof that a feature works in production.

## Changes made in the repository during the hardening pass

- Added a same-origin Vercel catch-all API entrypoint and configured the frontend API base as `/api`.
- Exported the Express app for serverless hosting.
- Updated EmailJS service to support separate verification/reset template IDs, explicit provider errors and a timeout.
- Added initial Supabase auth schema for users, pending verification and password-reset records; added session versioning.
- Added a session-version check to reject JWTs after password changes/resets.
- Added backend account deletion endpoint requiring the current password.
- Changed the student dashboard entry to validate its backend session before loading.
- Disabled fake vendor key generation, local certificate verification claims and local demo admin sign-in.
- Disabled disconnected demo forms so they no longer claim messages were sent.
- Updated privacy wording to remove inaccurate claims about NIN collection.
- Added CI workflow and split architecture, auth/email, deployment, release-risk and QA documentation.
- Revoked public execution on the existing Supabase `rls_auto_enable()` helper.

## Changes applied directly to connected Supabase

- Created the initial TAMP auth tables and indexes.
- Enabled RLS and revoked direct table access for `anon` and `authenticated` on auth tables.
- Revoked public execution of `public.rls_auto_enable()`.

These database actions must be reconciled with the checked-in migrations and verified against the intended project before production.

## Not verified yet

- A successful CI run.
- A live Vercel build and API route smoke test.
- Signup and email verification from a fresh inbox.
- Login, forgot password, reset password, and old-token revocation on the deployed site.
- Supabase service-role key configured on the correct production Vercel project.
- EmailJS service, sender, templates, quota and deliverability.
- Supabase advisors, least-privilege grants and database backup/restore.
- End-to-end product behavior for cohorts, payments, assignments, grades, certificates and admin.

## Required next actions

1. Confirm the correct Vercel project/domain and check deployment/function logs.
2. Configure the missing production secrets using the Vercel dashboard or authorized integration.
3. Verify EmailJS template IDs and variable names.
4. Run the test plan in staging and fix failures.
5. Reconcile SQL migrations and database state.
6. Build real persistent domain schemas/APIs before enabling payment or student operations.
