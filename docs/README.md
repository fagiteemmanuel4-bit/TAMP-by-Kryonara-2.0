# TAMP Engineering Documentation

This folder splits the TAMP audit into focused documents so each area can be reviewed and fixed independently.

## Reading order

1. [Architecture and stack](ARCHITECTURE.md) — what exists today and how requests flow.
2. [Authentication and EmailJS](AUTH_EMAILJS.md) — signup, verification, login, password reset and known failure points.
3. [Deployment runbook](DEPLOYMENT_RUNBOOK.md) — Vercel, Supabase, EmailJS environment and rollout checks.
4. [Release risks](RELEASE_RISKS.md) — prioritized product, security, business and operational blockers.
5. [QA and test plan](TEST_PLAN.md) — tests that must pass before calling the site production-ready.
6. [Remediation log](REMEDIATION_LOG.md) — what has been changed, what is only prepared, and what remains unverified.

The existing root [PROJECT_AUDIT.md](../PROJECT_AUDIT.md) is the consolidated audit snapshot. Keep it as the overview; use the focused documents for implementation work.

## Important scope boundary

Repository review and code changes do not prove that the live site works. A successful release requires a production signup/login/reset test, verified database persistence, correct Vercel deployment, valid EmailJS templates, and monitoring of real logs. Do not paste secret keys into issues, chat, or committed files.
