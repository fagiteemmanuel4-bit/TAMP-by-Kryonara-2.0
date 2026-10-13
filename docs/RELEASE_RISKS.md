# TAMP Release Risks and Business Failure Modes

**Current recommendation: do not accept real payments or rely on this system for official learning records until the P0/P1 items below are verified and closed.**

## P0 — blocks safe launch

1. **Authentication must be tested live.** Code wiring alone does not prove signup, verification, login or reset works on the deployed site.
2. **Vercel serverless dependency packaging is unverified.** The catch-all imports Express from `backend/server.js`, but root dependency installation and backend dependencies are separate. A build can pass while the serverless function fails at runtime.
3. **Production secrets are incomplete.** Confirm the actual production Vercel project has JWT secret, Supabase service-role key, EmailJS credentials/template IDs, correct origin and frontend URL.
4. **No complete business database.** Cohorts, enrollments, payments, course keys, lessons, assignments, grades and certificates are not represented as a complete authoritative backend.
5. **Admin panel is disabled.** This is safer than fake admin login but means there is no usable production operations console.
6. **Payment verification is absent.** Never mark an enrollment paid from a redirect or browser form; verify signed provider webhooks server-side and make processing idempotent.
7. **Certificate authority is absent.** Certificate verification must query a server-side issued-certificate registry and display only issued/revoked records.
8. **No demonstrated test run.** CI workflow was added, but its run status and functional integration results must be inspected.

## P1 — blocks a reliable business operation

- Data-analysis curriculum, cohort schedule, assignment/quiz workflow and grading need a server-owned model.
- No tested support/ticket delivery; disabled forms must clearly say messages are not sent.
- Email deliverability, bounce handling, retry policy and abuse controls need operational monitoring.
- Need privacy notice and terms aligned with actual data collection and retention.
- Need a student deletion/export process that accounts for future learning/payment/certificate records and legal retention.
- Need admin RBAC, audit logs and a break-glass recovery path.
- Need rate limiting that works across serverless instances; in-memory limits alone are not durable.
- Need backups, restore test, monitoring, error tracking and incident response.
- Need responsive/mobile accessibility and browser/device testing.
- Need an explicit staging environment separate from production.
- Need clear refund, cancellation, support, certificate and assessment policies before collecting money.

## P2 — maintainability and growth risks

- Large `public/site/dashboard.js`, `public/admin/admin.js` and `backend/server.js` files are hard to test and change safely.
- React shell and legacy HTML app overlap; route ownership and source of truth are unclear.
- No complete API contract/schema validation suite.
- No systematic dependency vulnerability/licence review.
- SEO, metadata, analytics, accessibility and performance need a measured pass.
- No documented incident metrics or business funnel metrics (signup conversion, verification rate, cohort completion, refunds, support response time).

## Recommended release sequence

1. Prove deployment and auth/email in staging.
2. Establish database migrations, integration tests and operational monitoring.
3. Implement and test course/cohort/enrollment records.
4. Integrate payment provider with signed webhooks, reconciliation and refund workflow.
5. Implement secure admin API and UI.
6. Implement lessons, assignments, grading and grade release.
7. Implement certificate issuance and public verification.
8. Complete privacy/terms, accessibility, mobile QA and launch checklist.
9. Soft launch with a small cohort; reconcile payments and enrollment manually until the full workflow is proven.
