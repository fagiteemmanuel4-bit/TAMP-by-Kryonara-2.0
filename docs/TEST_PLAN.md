# TAMP QA and Release Test Plan

## 1. CI checks

The GitHub Actions workflow should pass:
- Frontend dependency install and Vite production build.
- Syntax checks for the student/admin browser scripts and Vercel API entrypoint.
- Backend dependency install and syntax checks.
- Backend automated tests (`npm test`) once route/service tests are added.

A green syntax/build workflow is necessary but insufficient for production.

## 2. Authentication integration tests

Use a dedicated staging Supabase project and test inbox; never use a real student's data.

| Test | Expected result |
|---|---|
| Valid signup | Pending registration created; email delivered; no user session before verification |
| Invalid email/name/password | 400 validation error; no email sent |
| Duplicate registered email | Safe error without creating duplicate user |
| Wrong verification code | Rejected; attempts capped |
| Expired code | Rejected |
| Correct code | User persisted; token issued; one-time pending record consumed |
| Resend | Old code invalidated; new code sent; rate limit enforced |
| Correct login | Token issued |
| Wrong password | Generic authentication error |
| Unknown email login | Same generic error shape as wrong password |
| Forgot password for existing/unknown address | Same public response shape |
| Valid reset token | Password updated, token consumed, session version incremented |
| Reused/expired reset token | Rejected |
| Old token after reset | Rejected |
| Delete account | Requires current password; removes auth data; token becomes unusable |

## 3. API security tests

- Missing/invalid/expired JWT returns 401.
- Student JWT cannot call admin routes.
- Browser roles cannot read or modify auth tables directly.
- Unexpected origin is rejected by CORS in production.
- Malformed JSON, oversized body and invalid field types are safely rejected.
- Rate limits persist or are enforced by an external gateway across serverless instances.
- No secrets, passwords, codes, reset tokens or JWTs appear in logs.
- Health endpoint does not reveal secret values or sensitive configuration details.

## 4. Product integrity tests

- Enrollment cannot become active without verified payment/key validation.
- Payment success is based on signed webhook/provider verification, not query parameters.
- Duplicate webhook delivery does not duplicate enrollment.
- Assignment deadlines and quiz windows are enforced server-side.
- Grade release time is enforced server-side.
- Certificate lookup returns only records from the official registry.
- Admin actions require role authorization and create audit events.
- Support forms report success only when the message was actually stored/delivered.
- User data remains after redeploy/restart and is scoped to the correct account.

## 5. Browser/device tests

- Android small-screen signup/login/verification/reset.
- Keyboard-only form navigation and visible focus.
- Accessible labels and error announcements.
- Password visibility toggle.
- Network outage, slow request, expired session and server 5xx states.
- Refresh/deep link behavior for public, student and admin routes.
- No blank screen on failed API requests; errors explain next steps.
- Browser console has no uncaught errors or mixed-content requests.

## 6. Go/no-go criteria

Do not launch paid cohorts until P0 risks in `RELEASE_RISKS.md` are closed, CI is green, staging auth is tested end-to-end, backup restore has been tested, and payment/enrollment reconciliation has been rehearsed.
