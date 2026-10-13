# Authentication and EmailJS

## Intended flows

### Signup and email verification
1. Browser validates basic form fields.
2. `POST /api/auth/register` creates a pending registration and sends a six-digit verification code.
3. EmailJS sends to the address supplied by the user.
4. `POST /api/auth/verify` validates the code, creates the user record and returns a JWT.
5. The browser stores the access token in session storage and redirects to the dashboard.

### Resend verification
`POST /api/auth/resend` should rotate the code, enforce a cooldown/rate limit and return an error if delivery fails.

### Login
`POST /api/auth/login` should verify a password hash against a persistent user record and issue a short-lived token. Never authenticate against localStorage users or a fixed/demo password.

### Password reset
`POST /api/auth/forgot` should return a generic response that does not reveal whether an email exists. If the user exists, create a hashed, expiring, single-use token and send the reset URL. `POST /api/auth/reset` validates and consumes the token and updates the password hash.

## EmailJS configuration

Backend environment variables:
- `EMAILJS_SERVICE_ID`
- `EMAILJS_PUBLIC_KEY`
- `EMAILJS_PRIVATE_KEY`
- `EMAILJS_VERIFICATION_TEMPLATE_ID`
- `EMAILJS_RESET_TEMPLATE_ID`
- `FRONTEND_URL`

Template variables expected by code:
- Verification: `to_email`, `code`
- Password reset: `to_email`, `reset_url`

Do not assume these variable names match the live EmailJS templates; open each template in EmailJS and confirm the exact recipient field, variable names, email service connection, sender verification and template ID. Send a test message to an inbox you control.

**Required account setting for this backend:** the live Vercel logs show EmailJS refusing server-side calls because API access from non-browser environments is disabled. In EmailJS, open **Account → Security** and enable the setting that allows API requests from non-browser environments, then redeploy/retry and test delivery. This is an EmailJS account-level security control; changing Vercel routing or environment variables cannot override it. If you do not want to enable it, switch the backend to a transactional email provider with server-side API credentials instead. Never expose the private key in frontend code.

## Known failure causes and checks

- Old UI used localStorage/demo code rather than the backend; this was changed in the current code path.
- EmailJS failure previously could be hidden behind a success response; email service now throws explicit provider errors and has a timeout.
- Wrong template ID or mismatched template variables causes failed delivery or an email with blank content.
- Missing backend secrets causes explicit configuration failure.
- Incorrect `FRONTEND_URL` produces reset links that point to the wrong site.
- Incorrect Vercel function routing or API base path makes requests fail before EmailJS is reached.
- Supabase schema or service-role configuration errors can prevent pending registrations and users from persisting.
- Provider-side sender/domain restrictions, quota, account review or template status cannot be fixed in repository code.

## Security requirements

- Verification codes must be generated securely, stored hashed, expire, and have limited attempts.
- Reset tokens must be random, stored hashed, expire, and be single-use.
- Do not log codes, passwords, reset tokens, JWTs, or full secrets.
- Use generic password-reset responses to prevent email enumeration.
- Rate-limit registration, resend, login and reset by IP and account/email.
- Revoke previous sessions after password reset/change.
- Production authentication must fail closed if JWT secret or persistent database configuration is missing.
- Use HTTPS, restrictive CORS, request body limits and safe error messages.

## Release gate

Do not mark email fixed until the live deployed environment passes all of these:
1. Register a fresh test address and receive a code.
2. Verify the code once successfully; verify reuse/expired/wrong codes are rejected.
3. Confirm the user row exists in Supabase and survives a redeploy.
4. Log in with the right password and reject a wrong password.
5. Request a password reset, receive the email, open the link and set a new password.
6. Confirm the old password fails and old JWTs are rejected.
7. Confirm unknown email reset request returns the same public response.
8. Confirm delivery failures are visible in server logs without exposing secrets.
